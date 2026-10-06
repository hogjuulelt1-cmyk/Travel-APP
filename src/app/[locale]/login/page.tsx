import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getMessages, isLocale, localePath } from "@/lib/i18n";
import { signInAction } from "@/server/actions";
import { getUser } from "@/server/session";

type Props = Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
}>;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = getMessages(locale);
  return { title: `${m.auth.loginHeading} · ${m.app.name}` };
}

const input =
  "rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-50";
const providerBtn =
  "flex w-full items-center justify-center rounded-full px-5 py-3 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-2";

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { next, error } = await searchParams;
  const m = getMessages(locale);
  if (await getUser()) redirect(next && next.startsWith("/") ? next : localePath(locale, "/my"));

  const q = next ? `?next=${encodeURIComponent(next)}` : "";
  const errMsg = error ? (m.auth.errors as Record<string, string>)[error] : null;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-4 py-10">
      <SiteHeader locale={locale} path="/login" />
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{m.auth.loginHeading}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{m.auth.loginLead}</p>
        {next && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            {m.auth.loginRequired}
          </p>
        )}
      </section>

      <form action={signInAction} className="flex flex-col gap-4">
        <input type="hidden" name="locale" value={locale} />
        {next && <input type="hidden" name="next" value={next} />}
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">{m.auth.email}</span>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">{m.auth.password}</span>
          <input
            id="login-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={input}
          />
        </label>
        {errMsg && (
          <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
            {errMsg}
          </p>
        )}
        <button
          type="submit"
          className="rounded-full bg-zinc-900 px-5 py-3 text-base font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900"
        >
          {m.auth.login}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        {m.auth.or}
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href={localePath(locale, "/login/kakao") + q}
          className={`${providerBtn} bg-[#FEE500] text-[#191919]`}
        >
          {m.auth.kakao}
        </Link>
        <Link
          href={localePath(locale, "/login/naver") + q}
          className={`${providerBtn} bg-[#03C75A] text-white`}
        >
          {m.auth.naver}
        </Link>
      </div>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-300">
        {m.auth.noAccount}{" "}
        <Link
          href={localePath(locale, "/signup") + q}
          className="font-semibold underline underline-offset-4"
        >
          {m.auth.signup}
        </Link>
      </p>
      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">{m.auth.demoNote}</p>
    </main>
  );
}
