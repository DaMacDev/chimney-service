"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { useScrolled } from "@/lib/use-scrolled";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", key: "home" },
  { href: "/services", key: "services" },
  { href: "/gallery", key: "gallery" },
  { href: "/before-after", key: "beforeAfter" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export function NavBar() {
  const t = useTranslations("Nav");
  const scrolled = useScrolled(24);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-border-subtle bg-background/80 border-b backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" aria-label={t("brand")} onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <ul className="border-border-subtle bg-surface/80 hidden items-center gap-1 rounded-full border px-1.5 py-1 shadow-sm backdrop-blur-md lg:flex">
          {LINKS.map(({ href, key }) => (
            <li key={key}>
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "block rounded-full px-3.5 py-1.5 text-sm transition-colors",
                  isActive(href)
                    ? "bg-accent font-semibold text-white shadow-sm"
                    : "text-foreground/75 hover:text-accent hover:bg-foreground/5 font-medium",
                )}
              >
                {t(key)}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <Link
            href="/contact"
            className="bg-accent-strong hidden rounded-full px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_-8px_var(--accent)] transition-all hover:brightness-110 md:inline-flex"
          >
            {t("quote")}
          </Link>
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? t("closeMenu") : t("openMenu")}
            onClick={() => setOpen((value) => !value)}
            className="text-foreground lg:hidden"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-border-subtle bg-background/95 border-t backdrop-blur-xl lg:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col px-6 py-4">
            {LINKS.map(({ href, key }) => (
              <li key={key}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={cn(
                    "block py-3 text-base font-medium",
                    isActive(href) ? "text-accent" : "text-foreground/80 hover:text-accent",
                  )}
                >
                  {t(key)}
                </Link>
              </li>
            ))}
            <li className="flex items-center justify-between pt-4">
              <LanguageSwitcher />
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className="bg-accent-strong rounded-full px-4 py-2 text-sm font-semibold text-white"
              >
                {t("quote")}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
