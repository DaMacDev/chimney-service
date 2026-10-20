"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonVariant } from "@vodkadav/ui";

/** Form submit via the shared Button; busy while the form's request is in flight. */
export function SubmitButton({
  children,
  variant = "primary",
}: {
  children: string;
  variant?: ButtonVariant;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} loading={pending}>
      {children}
    </Button>
  );
}
