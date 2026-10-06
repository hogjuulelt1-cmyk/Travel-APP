import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getMessages, isLocale, localePath } from "@/lib/i18n";
import { signUpAction } from "@/server/actions";
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
  return { title: `${m.auth.signupHeading} · ${m.app.name}` };
}

const input =
  "rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-50";
const chip =
  "cursor-pointer rounded-full border border-zinc-300 px-4 py-2 text-sm has-checked:border-zinc-900 has-checked:bg-zinc-900 has-checked:text-white dark:border-zinc-700 dark:has-checked:border-zinc-50 dark:has-checked:bg-zinc-50 dark:has-checked:text-zinc-900";

export default async function SignupPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { next, error } = await searchParams;
  const m = getMessages(locale);
  if (await getUser()) redirect(localePath(locale, "/my"));
  const errMsg = error ? (m.auth.errors as Record<string, string>)[error] : null;
  const years = Array.from({ length: 2008 - 1980 + 1 }, (_, i) => 2008 - i);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-4 py-10">
      <SiteHeader locale={locale} path="/signup" />
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{m.auth.signupHeading}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{m.auth.signupLead}</p>
      </section>

      <form action={signUpAction} className="flex flex-col gap-5">
        <input type="hidden" name="locale" value={locale} />
        {next && <input type="hidden" name="next" value={next} />}

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">{m.auth.name}</span>
          <input
            id="signup-name"
            name="name"
            required
            maxLength={40}
            autoComplete="nickname"
            placeholder={m.auth.namePlaceholder}
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">{m.auth.email}</span>
          <input
            id="signup-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">
            {m.auth.password}{" "}
            <span className="font-normal text-zinc-500 dark:text-zinc-400">
              · {m.auth.passwordHint}
            </span>
          </span>
          <input
            id="signup-password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={input}
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">{m.auth.gender}</legend>
          <div className="flex flex-wrap gap-2">
            {(["f", "m", "other"] as const).map((g, i) => (
              <label key={g} className={chip}>
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

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">{m.auth.birthYear}</span>
          <select id="signup-birth" name="birthYear" defaultValue="1998" className={input}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">{m.auth.intro}</span>
          <input
            id="signup-intro"
            name="intro"
            maxLength={120}
            placeholder={m.auth.introPlaceholder}
            className={input}
          />
        </label>

        <label className="flex items-start gap-3 text-sm">
          <input
            id="signup-agree"
            type="checkbox"
            name="agree"
            className="mt-1 size-5 accent-zinc-900 dark:accent-zinc-50"
          />
          <span>
            {m.auth.agree}{" "}
            <Link href={localePath(locale, "/about")} className="underline underline-offset-4">
              {m.nav.about}
            </Link>
          </span>
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
          {m.auth.create}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-300">
        {m.auth.haveAccount}{" "}
        <Link
          href={localePath(locale, "/login") + (next ? `?next=${encodeURIComponent(next)}` : "")}
          className="font-semibold underline underline-offset-4"
        >
          {m.auth.login}
        </Link>
      </p>
      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">{m.auth.demoNote}</p>
    </main>
  );
}
