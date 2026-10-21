"use client";

import { useState } from "react";
import { Button, type ButtonVariant } from "@vodkadav/ui";

/**
 * A native form (works without JS) whose shared Button shows busy and blocks a
 * second submit while the browser navigates.
 */
export function SubmitForm({
  action,
  method,
  label,
  variant = "primary",
}: {
  action: string;
  method: "get" | "post";
  label: string;
  variant?: ButtonVariant;
}) {
  const [pending, setPending] = useState(false);
  return (
    <form
      action={action}
      method={method}
      onSubmit={(event) => {
        if (pending) event.preventDefault();
        setPending(true);
      }}
    >
      <Button type="submit" variant={variant} loading={pending}>
        {label}
      </Button>
    </form>
  );
}
