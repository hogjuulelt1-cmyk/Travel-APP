import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { t } from "@/lib/format";
import { getMessages, isLocale, localePath } from "@/lib/i18n";
import { QUESTION_KEYS, type QuestionKey } from "@/lib/matching";
import { deleteAccountAction, signOutAction, updateProfileAction } from "@/server/actions";
import { getAccount, getProfile, listBookings } from "@/server/session";

type Props = Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ saved?: string; edit?: string }>;
}>;

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = getMessages(locale);
  return { title: `${m.me.heading} · ${m.app.name}` };
}

const input =
  "rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";
const chip =
  "cursor-pointer rounded-full border border-zinc-300 px-4 py-2 text-sm has-checked:border-zinc-900 has-checked:bg-zinc-900 has-checked:text-white dark:border-zinc-700 dark:has-checked:border-zinc-50 dark:has-checked:bg-zinc-50 dark:has-checked:text-zinc-900";
const btn =
  "rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900";
const btnGhost =
  "rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold dark:border-zinc-700";

export default async function MePage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { saved, edit } = await searchParams;
  const m = getMessages(locale);
  const account = await getAccount();
  if (!account)
    redirect(
      localePath(locale, "/login") + `?next=${encodeURIComponent(localePath(locale, "/me"))}`,
    );
  const profile = await getProfile();
  const bookings = (await listBookings()).filter((b) => b.status !== "pending_deposit");
  const providerName =
    account.provider === "kakao"
      ? m.auth.providerKakao
      : account.provider === "naver"
        ? m.auth.providerNaver
        : m.auth.providerEmail;
  const genderLabel = { f: m.auth.genderF, m: m.auth.genderM, other: m.auth.genderO }[
    account.gender
  ];
  const optionLabel = (k: QuestionKey, v: string) =>
    (m.match.a[k] as Record<string, string>)[v] ?? v;
  const years = Array.from({ length: 2008 - 1980 + 1 }, (_, i) => 2008 - i);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-4 py-10">
      <SiteHeader locale={locale} path="/me" />
      <h1 className="text-2xl font-bold">{m.me.heading}</h1>

      {saved && (
        <p
          role="status"
          className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
        >
          {m.me.saved}
        </p>
      )}

      <section className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-lg font-bold text-white dark:bg-zinc-50 dark:text-zinc-900">
            {account.name.slice(0, 1)}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="text-lg font-semibold">{account.name}</span>
            <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              {account.email} · {t(m.me.signedInWith, { provider: providerName })}
            </span>
          </div>
        </div>

        {edit ? (
          <form action={updateProfileAction} className="flex flex-col gap-4">
            <input type="hidden" name="locale" value={locale} />
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">{m.auth.name}</span>
              <input
                id="me-name"
                name="name"
                defaultValue={account.name}
                maxLength={40}
                className={input}
              />
            </label>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">{m.auth.gender}</legend>
              <div className="flex flex-wrap gap-2">
                {(["f", "m", "other"] as const).map((g) => (
                  <label key={g} className={chip}>
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      defaultChecked={account.gender === g}
                      className="sr-only"
                    />
                    {g === "f" ? m.auth.genderF : g === "m" ? m.auth.genderM : m.auth.genderO}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">{m.auth.birthYear}</span>
              <select
                id="me-birth"
                name="birthYear"
                defaultValue={account.birthYear ?? 1998}
                className={input}
              >
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
                id="me-intro"
                name="intro"
                defaultValue={account.intro ?? ""}
                maxLength={120}
                className={input}
              />
            </label>
            <div className="flex gap-2">
              <button type="submit" className={btn}>
                {m.me.save}
              </button>
              <Link href={localePath(locale, "/me")} className={btnGhost}>
                {m.pay.cancel}
              </Link>
            </div>
          </form>
        ) : (
          <>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-zinc-500 dark:text-zinc-400">{m.auth.gender}</dt>
              <dd>{genderLabel}</dd>
              <dt className="text-zinc-500 dark:text-zinc-400">{m.auth.birthYear}</dt>
              <dd>{account.birthYear ?? "–"}</dd>
              <dt className="text-zinc-500 dark:text-zinc-400">{m.auth.intro}</dt>
              <dd>{account.intro ?? "–"}</dd>
            </dl>
            <Link href={localePath(locale, "/me") + "?edit=1"} className={btnGhost + " w-fit"}>
              {m.me.edit}
            </Link>
          </>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-base font-semibold">{m.me.travelStyle}</h2>
        {profile ? (
          <div className="flex flex-wrap gap-1.5 text-xs">
            {profile.mbti && (
              <span className="rounded-full bg-zinc-900 px-2.5 py-1 font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
                {profile.mbti}
              </span>
            )}
            {QUESTION_KEYS.map((k) => (
              <span key={k} className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
                {optionLabel(k, profile[k])}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{m.me.noStyle}</p>
        )}
        <Link
          href={localePath(locale, "/match") + (profile ? "?edit=1" : "")}
          className={btnGhost + " w-fit"}
        >
          {profile ? m.me.editStyle : m.me.setStyle}
        </Link>
      </section>

      <section className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex flex-col">
          <h2 className="text-base font-semibold">{m.me.trips}</h2>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {t(m.me.tripsCount, { n: bookings.length })}
          </span>
        </div>
        <Link href={localePath(locale, "/my")} className={btnGhost}>
          {m.nav.my} →
        </Link>
      </section>

      <section className="flex flex-col gap-3">
        <Link href={localePath(locale, "/about")} className="text-sm underline underline-offset-4">
          {m.nav.about}
        </Link>
        <div className="flex flex-wrap gap-2">
          <form action={signOutAction}>
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" className={btnGhost}>
              {m.me.logout}
            </button>
          </form>
          <form action={deleteAccountAction}>
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              className="rounded-full px-4 py-2 text-sm text-rose-700 dark:text-rose-300"
            >
              {m.me.deleteAccount}
            </button>
          </form>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{m.me.deleteConfirm}</p>
      </section>
    </main>
  );
}
