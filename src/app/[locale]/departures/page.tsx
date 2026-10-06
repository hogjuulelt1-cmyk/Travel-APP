import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DepartureList } from "@/components/departure-list";
import { SiteHeader } from "@/components/site-header";
import { getMessages, isLocale, localePath } from "@/lib/i18n";
import { listAllDepartures, listPackages } from "@/server/catalog";

type Props = Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ pkg?: string }>;
}>;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = getMessages(locale);
  return { title: `${m.departuresPage.heading} · ${m.app.name}` };
}

export default async function DeparturesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { pkg } = await searchParams;
  const m = getMessages(locale);
  const packages = await listPackages(locale);
  const all = await listAllDepartures();
  const departures = pkg ? all.filter((d) => d.packageSlug === pkg) : all;
  const titleOf = (slug: string) => packages.find((p) => p.slug === slug)?.title ?? slug;

  const chip = (active: boolean) =>
    "rounded-full px-3 py-1 text-xs font-medium " +
    (active
      ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
      : "border border-zinc-300 dark:border-zinc-700");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-10">
      <SiteHeader locale={locale} path="/departures" />
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{m.departuresPage.heading}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{m.departuresPage.lead}</p>
      </section>
      <nav className="flex flex-wrap gap-2" aria-label={m.nav.packages}>
        <Link href={localePath(locale, "/departures")} className={chip(!pkg)}>
          {m.departuresPage.filterAll}
        </Link>
        {packages.map((p) => (
          <Link
            key={p.slug}
            href={localePath(locale, "/departures") + `?pkg=${p.slug}`}
            className={chip(pkg === p.slug)}
          >
            {p.title}
          </Link>
        ))}
      </nav>
      <DepartureList departures={departures} locale={locale} titleOf={pkg ? undefined : titleOf} />
    </main>
  );
}
