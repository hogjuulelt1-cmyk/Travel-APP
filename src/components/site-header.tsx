import Link from "next/link";
import { getMessages, localePath, locales, type Locale } from "@/lib/i18n";

/** Top bar: brand + language. Navigation lives in the bottom tab bar. */
export function SiteHeader({ locale, path = "/" }: { locale: Locale; path?: string }) {
  const m = getMessages(locale);
  const pill =
    "rounded-full px-3 py-1 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50";
  const pillActive =
    "rounded-full bg-zinc-900 px-3 py-1 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900";

  return (
    <header className="flex items-center justify-between gap-4">
      <Link
        href={localePath(locale)}
        className="flex items-center gap-2 text-base font-bold text-zinc-900 dark:text-zinc-50"
      >
        {m.app.name}
        <span className="rounded-full border border-amber-400 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
          {m.nav.demo}
        </span>
      </Link>
      <nav aria-label={m.nav.language} className="flex gap-1">
        {locales.map((l) => (
          <Link
            key={l}
            href={localePath(l, path)}
            hrefLang={l}
            aria-current={l === locale ? "page" : undefined}
            className={l === locale ? pillActive : pill}
          >
            {m.nav.locales[l]}
          </Link>
        ))}
      </nav>
    </header>
  );
}
