import type { DictKey } from "@/lib/i18n/dictionaries";

export interface NavItem {
  href: string;
  labelKey: DictKey;
  icon: (active: boolean) => React.ReactNode;
}

function iconProps(active: boolean) {
  return {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: active ? "var(--color-gold)" : "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/home",
    labelKey: "nav_home",
    icon: (active) => (
      <svg {...iconProps(active)}>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10v9a1 1 0 0 0 1 1H10v-5.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V20h3.5a1 1 0 0 0 1-1v-9" />
      </svg>
    ),
  },
  {
    href: "/calendar",
    labelKey: "nav_calendar",
    icon: (active) => (
      <svg {...iconProps(active)}>
        <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
        <path d="M3.5 9.5h17" />
        <path d="M8 3v4M16 3v4" />
        <path d="M7.5 13.5h2M11 13.5h2M14.5 13.5h2M7.5 17h2M11 17h2" />
      </svg>
    ),
  },
  {
    href: "/learn",
    labelKey: "nav_learn",
    icon: (active) => (
      <svg {...iconProps(active)}>
        <path d="M4 5.5c2.5-1.3 5.5-1.3 8 0v13c-2.5-1.3-5.5-1.3-8 0v-13Z" />
        <path d="M20 5.5c-2.5-1.3-5.5-1.3-8 0v13c2.5-1.3 5.5-1.3 8 0v-13Z" />
      </svg>
    ),
  },
  {
    href: "/stats",
    labelKey: "nav_stats",
    icon: (active) => (
      <svg {...iconProps(active)}>
        <path d="M4 20V10M12 20V4M20 20v-7" />
        <path d="M2.5 20h19" />
      </svg>
    ),
  },
  {
    href: "/settings",
    labelKey: "nav_settings",
    icon: (active) => (
      <svg {...iconProps(active)}>
        <circle cx="12" cy="12" r="3.2" />
        <path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2.06 2.06 0 1 1-2.92 2.92l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V19.6a2.06 2.06 0 1 1-4.12 0v-.1a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2.06 2.06 0 1 1-2.92-2.92l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H4.4a2.06 2.06 0 1 1 0-4.12h.1A1.7 1.7 0 0 0 6.06 6.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2.06 2.06 0 1 1 2.92-2.92l.06.06a1.7 1.7 0 0 0 1.87.34H10.6a1.7 1.7 0 0 0 1.03-1.56V4.4a2.06 2.06 0 1 1 4.12 0v.1a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2.06 2.06 0 1 1 2.92 2.92l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.56 1.03h.1a2.06 2.06 0 1 1 0 4.12h-.1a1.7 1.7 0 0 0-1.56 1.03Z" />
      </svg>
    ),
  },
];
