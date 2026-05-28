import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminAuthenticated, isAdminConfigured } from "@/lib/admin/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin · Login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  // If already authenticated, jump straight to the dashboard.
  if (await isAdminAuthenticated()) {
    redirect("/admin");
  }

  const configured = isAdminConfigured();

  return (
    <section className="mx-auto max-w-[420px] px-6 py-24">
      <p
        className="text-center text-[12px] uppercase text-text-secondary"
        style={{ letterSpacing: "0.02em" }}
      >
        <span style={{ color: "var(--color-accent-purple)" }}>&gt;</span>{" "}
        brand
        <span style={{ color: "var(--color-accent-purple)" }}>.soul</span> OS
      </p>
      <h1
        className="mt-3 text-center font-serif text-[28px] leading-[1.2]"
        style={{ letterSpacing: "-0.01em" }}
      >
        Admin
      </h1>

      {!configured ? (
        <div
          className="mt-8 rounded-md border bg-bg-secondary p-4 text-[14px] text-text-secondary"
          style={{ borderColor: "var(--color-border-subtle)" }}
        >
          <p className="font-medium text-text-primary">Not configured</p>
          <p className="mt-1">
            Set <code className="text-text-primary">AIBE_ADMIN_PASSWORD</code>{" "}
            in <code className="text-text-primary">.env.local</code>, then
            restart the dev server.
          </p>
        </div>
      ) : (
        <LoginForm />
      )}
    </section>
  );
}
