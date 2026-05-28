import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import {
  streamBrandPackGeneration,
  type GenerationEvent,
} from "@/lib/generation/generate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Pack generation calls Claude 5+ times. ~30-90s typical. */
export const maxDuration = 300;

/**
 * POST /api/admin/generate
 *
 * Body: { requestId }
 *
 * Streams GenerationEvent JSON as SSE so the admin sees each file
 * appear live with its mode (template vs claude) and per-file token
 * usage. On `final` the client refreshes the page so the generated-
 * files panel re-renders with the new rows.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return new Response(JSON.stringify({ error: "Not authenticated." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Rate limit: pack generation runs Claude across ~12 files; each call
  // is the most expensive thing the platform does. 6 / minute / IP caps
  // any accidental admin-side spam (button-mashing on the iterate panel
  // while a previous run is still flushing).
  const rl = (await import("@/lib/rate-limit")).enforceRateLimit(
    request,
    "admin-generate",
  );
  if (rl) return rl;

  const body = (await request.json().catch(() => null)) as
    | { requestId?: string; feedback?: string }
    | null;
  if (!body?.requestId) {
    return new Response(JSON.stringify({ error: "Missing requestId." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const requestId = body.requestId;
  const feedback = body.feedback?.trim() || undefined;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: GenerationEvent) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          );
        } catch {
          // client disconnected
        }
      };
      const heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: keep-alive\n\n`));
        } catch {
          // already closed
        }
      }, 15_000);

      try {
        await streamBrandPackGeneration(requestId, send, { feedback });
        revalidatePath(`/admin/${requestId}`);
        revalidatePath("/admin");
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        closed = true;
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
