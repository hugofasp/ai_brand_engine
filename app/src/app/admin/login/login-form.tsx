"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { loginAdmin } from "../actions";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await loginAdmin(formData);
      // On success, the server action redirects — we only see this
      // branch on failure.
      if (result && "ok" in result && result.ok === false) {
        setError(result.error);
      }
    });
  }

  return (
    <form action={onSubmit} className="mt-8 space-y-4">
      <Input
        name="password"
        type="password"
        placeholder="Password"
        autoFocus
        autoComplete="current-password"
        required
      />
      {error ? (
        <p role="alert" className="text-[14px] text-text-primary">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
