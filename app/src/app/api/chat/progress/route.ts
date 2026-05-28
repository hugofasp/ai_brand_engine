import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { InterviewConversation } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/chat/progress?requestId=<uuid>
 *
 * Lightweight readback the chat client polls after a streamed turn
 * completes — it returns the sidebar's two inputs (filledFields and
 * completedPhases) freshly read from Supabase. We don't need to
 * round-trip the full conversation through the chat stream's `done`
 * event for this.
 */
export async function GET(request: NextRequest) {
  const requestId = request.nextUrl.searchParams.get("requestId");
  if (!requestId) {
    return new Response(JSON.stringify({ error: "Missing requestId." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("interview_answers")
    .select("interview_conversation, completed_phases")
    .eq("request_id", requestId)
    .maybeSingle();
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  const conv = (data?.interview_conversation as
    | InterviewConversation
    | undefined) ?? {};
  return new Response(
    JSON.stringify({
      filledFields: conv.completed_fields ?? [],
      completedPhases: (data?.completed_phases as number[]) ?? [],
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    },
  );
}
