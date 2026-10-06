"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localePath, type Locale } from "@/lib/i18n";

type Tab = { key: string; href: string; label: string; icon: React.ReactNode };

const icon = (d: string) => (
  <svg
    viewBox="0 0 24 24"
    className="size-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

const ICONS = {
  home: icon("M3 11.5 12 4l9 7.5M5 10v10h5v-6h4v6h5V10"),
  packages: icon("M4 7h16v13H4zM4 7l2-3h12l2 3M9 11h6"),
  match: icon("M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM4 21a8 8 0 0 1 16 0"),
  my: icon("M4 5h16v14H4zM4 9h16M8 3v4M16 3v4"),
  me: icon("M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0"),
};

export function BottomNav({
  locale,
  labels,
}: {
  locale: Locale;
  labels: { home: string; packages: string; match: string; my: string; me: string };
}) {
  const pathname = usePathname();
  const tabs: Tab[] = [
    { key: "home", href: localePath(locale), label: labels.home, icon: ICONS.home },
    {
      key: "packages",
      href: localePath(locale, "/packages"),
      label: labels.packages,
      icon: ICONS.packages,
    },
    { key: "match", href: localePath(locale, "/match"), label: labels.match, icon: ICONS.match },
    { key: "my", href: localePath(locale, "/my"), label: labels.my, icon: ICONS.my },
    { key: "me", href: localePath(locale, "/me"), label: labels.me, icon: ICONS.me },
  ];
  const isActive = (t: Tab) => {
    if (t.key === "home") return pathname === t.href;
    if (t.key === "packages")
      return pathname.startsWith(t.href) || pathname.includes("/departures/");
    return pathname.startsWith(t.href);
  };

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/90 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90"
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {tabs.map((t) => {
          const active = isActive(t);
          return (
            <li key={t.key} className="flex-1">
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={
                  "flex flex-col items-center gap-0.5 px-1 py-2 text-[11px] font-medium " +
                  (active
                    ? "text-zinc-900 dark:text-zinc-50"
                    : "text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300")
                }
              >
                {t.icon}
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
