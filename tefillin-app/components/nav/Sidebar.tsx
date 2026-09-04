"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { NAV_ITEMS } from "./navConfig";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useAppStore } from "@/lib/store";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const profile = useAppStore((s) => s.profile);

  return (
    <aside className="hidden sm:flex flex-col w-64 shrink-0 h-dvh sticky top-0 border-e border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-6">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-navy)] flex items-center justify-center text-lg">
          🕍
        </div>
        <div>
          <div className="font-bold text-lg leading-tight">TEFILLIN</div>
          {profile.name && (
            <div className="text-xs text-[var(--color-text-muted)]">
              {profile.name}
            </div>
          )}
        </div>
      </div>
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname?.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-[var(--color-surface-2)] text-[var(--color-gold)]"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.icon(!!active)}
                {t(item.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
