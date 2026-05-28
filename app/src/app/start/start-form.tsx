"use client";

import { useActionState } from "react";
import { startRequest, type StartRequestState } from "@/app/actions/requests";
import {
  Input,
  Label,
  Select,
  FieldError,
} from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: StartRequestState = { ok: false, fieldErrors: {} };

export function StartForm() {
  const [state, formAction, pending] = useActionState(startRequest, initialState);
  const fieldErrors = state && "fieldErrors" in state ? state.fieldErrors : {};
  const formError =
    state && "formError" in state ? state.formError : undefined;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <div>
        <Label htmlFor="company_name" required>
          Company / brand name
        </Label>
        <Input
          id="company_name"
          name="company_name"
          maxLength={120}
          placeholder="Your company name"
          aria-invalid={Boolean(fieldErrors.company_name) || undefined}
          aria-describedby={
            fieldErrors.company_name ? "company_name-error" : undefined
          }
          required
        />
        {fieldErrors.company_name ? (
          <div id="company_name-error">
            <FieldError>{fieldErrors.company_name}</FieldError>
          </div>
        ) : null}
      </div>

      <div>
        <Label htmlFor="contact_name" required>
          Your name
        </Label>
        <Input
          id="contact_name"
          name="contact_name"
          maxLength={100}
          placeholder="First and last name"
          aria-invalid={Boolean(fieldErrors.contact_name) || undefined}
          aria-describedby={
            fieldErrors.contact_name ? "contact_name-error" : undefined
          }
          required
        />
        {fieldErrors.contact_name ? (
          <div id="contact_name-error">
            <FieldError>{fieldErrors.contact_name}</FieldError>
          </div>
        ) : null}
      </div>

      <div>
        <Label htmlFor="contact_email" required>
          Work email
        </Label>
        <Input
          id="contact_email"
          name="contact_email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          aria-invalid={Boolean(fieldErrors.contact_email) || undefined}
          aria-describedby={
            fieldErrors.contact_email
              ? "contact_email-error"
              : "contact_email-hint"
          }
          required
        />
        {fieldErrors.contact_email ? (
          <div id="contact_email-error">
            <FieldError>{fieldErrors.contact_email}</FieldError>
          </div>
        ) : (
          <p
            id="contact_email-hint"
            className="mt-2 text-[12px] text-text-muted"
          >
            Use your company domain. Gmail, Hotmail, Outlook, Yahoo and other
            personal providers are not accepted.
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="contact_role">Your role (optional)</Label>
        <Select id="contact_role" name="contact_role" defaultValue="">
          <option value="">Select…</option>
          <option value="Founder">Founder</option>
          <option value="Marketing">Marketing</option>
          <option value="Brand">Brand</option>
          <option value="Operations">Operations</option>
          <option value="Other">Other</option>
        </Select>
      </div>

      <p className="text-[14px] text-text-muted">
        By continuing you agree to receive emails about your request. We don&apos;t
        market to you.
      </p>

      {formError ? (
        <p role="alert" className="text-[14px] text-text-primary">
          {formError}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Saving…" : "Continue →"}
      </Button>
    </form>
  );
}
