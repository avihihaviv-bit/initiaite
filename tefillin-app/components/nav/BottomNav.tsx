"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { NAV_ITEMS } from "./navConfig";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 sm:hidden border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur safe-bottom"
      aria-label="Main navigation"
    >
      <ul className="flex items-stretch justify-between px-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={clsx(
                  "flex flex-col items-center justify-center gap-1 py-2.5 min-h-14 transition-colors",
                  active ? "text-[var(--color-gold)]" : "text-[var(--color-text-muted)]"
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.icon(!!active)}
                <span className="text-[11px] font-medium">{t(item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
