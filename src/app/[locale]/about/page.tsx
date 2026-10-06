import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getMessages, isLocale } from "@/lib/i18n";

type Props = Readonly<{ params: Promise<{ locale: string }> }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = getMessages(locale);
  return { title: `${m.about.heading} · ${m.app.name}` };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = getMessages(locale);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-4 py-10">
      <SiteHeader locale={locale} path="/about" />
      <h1 className="text-2xl font-bold">{m.about.heading}</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">{m.about.how}</h2>
        <ol className="flex flex-col gap-3">
          {m.about.steps.map(([title, body], i) => (
            <li
              key={title}
              className="flex gap-4 rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
                {i + 1}
              </span>
              <div className="flex flex-col gap-0.5">
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">{m.about.refund}</h2>
        <dl className="flex flex-col divide-y divide-zinc-200 rounded-2xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {m.about.refundRows.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5 px-4 py-3 text-sm">
              <dt className="font-semibold">{k}</dt>
              <dd className="text-zinc-600 dark:text-zinc-300">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{m.about.refundNote}</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">{m.about.faq}</h2>
        <div className="flex flex-col gap-2">
          {m.about.faqs.map(([q, a]) => (
            <details
              key={q}
              className="group rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden">
                {q}
              </summary>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
