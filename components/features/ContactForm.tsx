"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { validateContact, isValid, type ContactErrors, type ContactInput } from "@/lib/contact";
import { siteConfig, web3formsKey } from "@/data/site";

type Status = "idle" | "sending" | "success" | "error";

const EMPTY: ContactInput = { name: "", email: "", phone: "", company: "", message: "" };

/**
 * Contact form that submits to Web3Forms (no backend needed). When no access
 * key is configured it degrades gracefully to a pre-filled mailto: link so the
 * form still works before the key is added.
 */
export function ContactForm({ accessKey = web3formsKey }: { accessKey?: string }) {
  const t = useTranslations("Contact");
  const [values, setValues] = useState<ContactInput>(EMPTY);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [botField, setBotField] = useState("");

  function update(field: keyof ContactInput) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((current) => ({ ...current, [field]: event.target.value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (botField) return; // honeypot tripped — silently ignore
    const found = validateContact(values);
    setErrors(found);
    if (!isValid(found)) return;

    if (!accessKey) {
      const body = `${values.message}\n\n— ${values.name}${values.company ? ` (${values.company})` : ""}\n${values.email}${values.phone ? ` · ${values.phone}` : ""}`;
      window.location.href = `mailto:${siteConfig.email}?subject=${encodeURIComponent(
        `Website enquiry — ${values.name}`,
      )}&body=${encodeURIComponent(body)}`;
      setStatus("success");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `Website enquiry — ${values.name}`,
          from_name: siteConfig.name,
          name: values.name,
          email: values.email,
          phone: values.phone,
          company: values.company,
          message: values.message,
        }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="border-border-subtle bg-surface flex flex-col items-center gap-2 rounded-2xl border p-8 text-center"
      >
        <CheckCircle2 className="text-accent size-9" aria-hidden />
        <p className="text-foreground font-display text-lg font-bold">{t("successTitle")}</p>
        <p className="text-muted">{t("successBody")}</p>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t("nameLabel")}
          value={values.name}
          onChange={update("name")}
          error={errors.name && t(errors.name)}
          autoComplete="name"
        />
        <Input
          type="email"
          label={t("emailLabel")}
          value={values.email}
          onChange={update("email")}
          error={errors.email && t(errors.email)}
          autoComplete="email"
        />
        <Input
          type="tel"
          label={t("phoneLabel")}
          value={values.phone ?? ""}
          onChange={update("phone")}
          autoComplete="tel"
        />
        <Input
          label={t("companyLabel")}
          value={values.company ?? ""}
          onChange={update("company")}
          autoComplete="organization"
        />
      </div>
      <Input
        multiline
        label={t("messageLabel")}
        value={values.message}
        onChange={update("message")}
        error={errors.message && t(errors.message)}
      />

      {/* Honeypot: hidden from users, catches naive bots. */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={botField}
        onChange={(e) => setBotField(e.target.value)}
        className="hidden"
      />

      {status === "error" && (
        <p role="alert" className="text-sm text-red-600">
          {t("errorBody")}
        </p>
      )}

      <Button type="submit" size="lg" disabled={status === "sending"} className="w-full">
        {status === "sending" ? t("sending") : t("send")}
      </Button>
      <p className="text-muted text-xs">{t("privacyNote")}</p>
    </form>
  );
}
