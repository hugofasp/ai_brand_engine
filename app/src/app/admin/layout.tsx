import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "Admin · %s" },
  robots: { index: false, follow: false },
};

/** Pages own their auth check via `requireAdmin()` from
 * @/lib/admin/auth-guard so the layout stays simple and never
 * accidentally renders the chrome on the login screen. */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}
