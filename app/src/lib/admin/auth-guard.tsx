import "server-only";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { logoutAdmin } from "@/app/admin/actions";

/** Server-side gate. Call from any /admin/* page before rendering.
 * Redirects to /admin/login when not authenticated. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

/** Top bar shown on every authenticated admin page. */
export function AdminTopBar({
  trail,
}: {
  trail?: Array<{ label: string; href?: string }>;
}) {
  return (
    <header
      className="border-b bg-bg-secondary"
      style={{ borderColor: "var(--color-border-subtle)" }}
    >
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-3 text-[14px]">
        <nav className="flex items-center gap-2 text-text-muted">
          <Link
            href="/admin"
            className="font-medium text-text-primary hover:opacity-80"
          >
            Admin
          </Link>
          {trail?.map((t, i) => (
            <span key={i} className="flex items-center gap-2">
              <span aria-hidden="true">/</span>
              {t.href ? (
                <Link href={t.href} className="text-text-primary hover:opacity-80">
                  {t.label}
                </Link>
              ) : (
                <span className="text-text-secondary">{t.label}</span>
              )}
            </span>
          ))}
        </nav>
        <form action={logoutAdmin}>
          <button
            type="submit"
            className="text-text-muted underline underline-offset-4 hover:text-[color:var(--color-accent-purple)]"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
