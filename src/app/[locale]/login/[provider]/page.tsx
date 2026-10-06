import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { t } from "@/lib/format";
import { getMessages, isLocale, localePath } from "@/lib/i18n";
import { oauthMockAction } from "@/server/actions";
import { getUser } from "@/server/session";

type Props = Readonly<{
  params: Promise<{ locale: string; provider: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
}>;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getMessages(locale).auth.loginHeading };
}

/** Mock OAuth consent screen for Kakao / Naver. */
export default async function OAuthMockPage({ params, searchParams }: Props) {
  const { locale, provider } = await params;
  if (!isLocale(locale)) notFound();
  if (provider !== "kakao" && provider !== "naver") notFound();
  const { next, error } = await searchParams;
  const m = getMessages(locale);
  if (await getUser()) redirect(next && next.startsWith("/") ? next : localePath(locale, "/my"));

  const providerName = provider === "kakao" ? m.auth.providerKakao : m.auth.providerNaver;
  const brand =
    provider === "kakao"
      ? { bg: "bg-[#FEE500]", fg: "text-[#191919]", ring: "border-[#FEE500]" }
      : { bg: "bg-[#03C75A]", fg: "text-white", ring: "border-[#03C75A]" };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-4 py-10">
      <SiteHeader locale={locale} path={`/login/${provider}`} />
      <section className={`flex flex-col gap-2 rounded-2xl border-2 ${brand.ring} p-4`}>
        <span className={`w-fit rounded-full ${brand.bg} ${brand.fg} px-3 py-1 text-xs font-bold`}>
          {providerName}
        </span>
        <h1 className="text-2xl font-bold">{t(m.auth.oauthHeading, { provider: providerName })}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {t(m.auth.oauthLead, { provider: providerName })}
        </p>
      </section>

      <form action={oauthMockAction} className="flex flex-col gap-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="provider" value={provider} />
        {next && <input type="hidden" name="next" value={next} />}
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">{m.auth.name}</span>
          <input
            id="oauth-name"
            name="name"
            required
            maxLength={40}
            autoComplete="nickname"
            placeholder={m.auth.namePlaceholder}
            className="rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          {error === "name" && (
            <span role="alert" className="text-rose-700 dark:text-rose-300">
              {m.auth.errors.name}
            </span>
          )}
        </label>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">{m.auth.gender}</legend>
          <div className="flex flex-wrap gap-2">
            {(["f", "m", "other"] as const).map((g, i) => (
              <label
                key={g}
                className="cursor-pointer rounded-full border border-zinc-300 px-4 py-2 text-sm has-checked:border-zinc-900 has-checked:bg-zinc-900 has-checked:text-white dark:border-zinc-700 dark:has-checked:border-zinc-50 dark:has-checked:bg-zinc-50 dark:has-checked:text-zinc-900"
              >
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  defaultChecked={i === 0}
                  className="sr-only"
                />
                {g === "f" ? m.auth.genderF : g === "m" ? m.auth.genderM : m.auth.genderO}
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="submit"
          className={`flex w-full items-center justify-center rounded-full px-5 py-3 text-base font-semibold ${brand.bg} ${brand.fg}`}
        >
          {m.auth.oauthContinue}
        </button>
      </form>
      <Link
        href={localePath(locale, "/login") + (next ? `?next=${encodeURIComponent(next)}` : "")}
        className="text-center text-sm text-zinc-500 underline underline-offset-4 dark:text-zinc-400"
      >
        ← {m.auth.loginHeading}
      </Link>
    </main>
  );
}
