"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { defaultLocale, isLocale, localePath, type Locale } from "@/lib/i18n";
import { remainderDueDate } from "@/lib/installments";
import { assertKrw } from "@/lib/money";
import { OPTIONS, isValidMbti, type QuestionKey, type TravelProfile } from "@/lib/matching";
import { getDeparture, isJoinable } from "@/server/catalog";
import {
  findAccountByEmail,
  findBookingForDeparture,
  getBooking,
  getUser,
  listAccounts,
  listBookings,
  newId,
  saveAccounts,
  saveBookings,
  setProfile,
  setUser,
  todayInSeoul,
  toUser,
  type DemoAccount,
  type DemoBooking,
  type PaymentMethod,
  type Provider,
} from "@/server/session";

function localeOf(form: FormData): Locale {
  const l = String(form.get("locale") ?? defaultLocale);
  return isLocale(l) ? l : defaultLocale;
}

/** Only allow redirects inside the app. */
function safeNext(form: FormData, fallback: string): string {
  const next = String(form.get("next") ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

function nextParam(form: FormData): string {
  const next = String(form.get("next") ?? "");
  return next ? `&next=${encodeURIComponent(next)}` : "";
}

function hashPassword(pw: string): string {
  return createHash("sha256").update(`monggle:${pw}`).digest("hex");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Email + password login (demo: accounts live in a cookie). */
export async function signInAction(form: FormData): Promise<void> {
  const locale = localeOf(form);
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") ?? "");
  const back = (err: string): never =>
    redirect(localePath(locale, "/login") + `?error=${err}${nextParam(form)}`);
  if (!EMAIL_RE.test(email)) return back("email");
  const account = await findAccountByEmail(email);
  if (!account) return back("notFound");
  if (account.provider !== "email" || account.passwordHash !== hashPassword(password)) {
    return back("invalid");
  }
  await setUser(toUser(account));
  redirect(safeNext(form, localePath(locale, "/my")));
}

/** Sign up with email + password + profile. */
export async function signUpAction(form: FormData): Promise<void> {
  const locale = localeOf(form);
  const back = (err: string): never =>
    redirect(localePath(locale, "/signup") + `?error=${err}${nextParam(form)}`);
  const name = String(form.get("name") ?? "")
    .trim()
    .slice(0, 40);
  const email = String(form.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!name) back("name");
  if (!EMAIL_RE.test(email)) back("email");
  if (password.length < 8) back("password");
  if (form.get("agree") !== "on") back("agree");
  if (await findAccountByEmail(email)) back("exists");
  const account = buildAccount(form, {
    name,
    email,
    provider: "email",
    passwordHash: hashPassword(password),
  });
  await saveAccounts([...(await listAccounts()), account]);
  await setUser(toUser(account));
  redirect(safeNext(form, localePath(locale, "/match")));
}

/**
 * Mock OAuth return: the consent page posts a name; we find or create the
 * account for that provider. The real flow is Auth.js with Kakao/Naver.
 */
export async function oauthMockAction(form: FormData): Promise<void> {
  const locale = localeOf(form);
  const provider: Provider = form.get("provider") === "naver" ? "naver" : "kakao";
  const name = String(form.get("name") ?? "")
    .trim()
    .slice(0, 40);
  if (!name) redirect(localePath(locale, `/login/${provider}`) + `?error=name${nextParam(form)}`);
  const email = `${name.toLowerCase().replace(/\s+/g, "")}@${provider}.demo`;
  const accounts = await listAccounts();
  let account = accounts.find((a) => a.provider === provider && a.email === email);
  const isNew = !account;
  if (!account) {
    account = buildAccount(form, { name, email, provider });
    await saveAccounts([...accounts, account]);
  }
  await setUser(toUser(account));
  redirect(safeNext(form, localePath(locale, isNew ? "/match" : "/my")));
}

function buildAccount(
  form: FormData,
  base: Pick<DemoAccount, "name" | "email" | "provider"> & { passwordHash?: string },
): DemoAccount {
  const g = String(form.get("gender") ?? "");
  const by = Number(form.get("birthYear"));
  return {
    id: newId("u"),
    ...base,
    gender: g === "m" ? "m" : g === "other" ? "other" : "f",
    birthYear: Number.isInteger(by) && by >= 1950 && by <= 2012 ? by : undefined,
    intro:
      String(form.get("intro") ?? "")
        .trim()
        .slice(0, 120) || undefined,
    createdAt: todayInSeoul(),
  };
}

export async function updateProfileAction(form: FormData): Promise<void> {
  const locale = localeOf(form);
  const user = await getUser();
  if (!user) redirect(localePath(locale, "/login"));
  const accounts = await listAccounts();
  const i = accounts.findIndex((a) => a.id === user.id);
  if (i < 0) redirect(localePath(locale, "/login"));
  const name =
    String(form.get("name") ?? "")
      .trim()
      .slice(0, 40) || accounts[i].name;
  const g = String(form.get("gender") ?? accounts[i].gender);
  const by = Number(form.get("birthYear"));
  accounts[i] = {
    ...accounts[i],
    name,
    gender: g === "m" ? "m" : g === "other" ? "other" : "f",
    birthYear: Number.isInteger(by) && by >= 1950 && by <= 2012 ? by : accounts[i].birthYear,
    intro:
      String(form.get("intro") ?? "")
        .trim()
        .slice(0, 120) || undefined,
  };
  await saveAccounts(accounts);
  await setUser(toUser(accounts[i]));
  redirect(localePath(locale, "/me") + "?saved=1");
}

export async function deleteAccountAction(form: FormData): Promise<void> {
  const locale = localeOf(form);
  const user = await getUser();
  if (user) {
    await saveAccounts((await listAccounts()).filter((a) => a.id !== user.id));
    await saveBookings([]);
    await setProfile(null);
    await setUser(null);
  }
  redirect(localePath(locale, "/") + "?deleted=1");
}

export async function signOutAction(form: FormData): Promise<void> {
  const locale = localeOf(form);
  await setUser(null);
  redirect(localePath(locale, "/"));
}

/** Create a pending booking for a departure and send the user to the mock Toss checkout. */
export async function startBookingAction(form: FormData): Promise<void> {
  const locale = localeOf(form);
  const departureId = String(form.get("departureId") ?? "");
  const user = await getUser();
  if (!user) {
    redirect(
      localePath(locale, "/login") +
        `?next=${encodeURIComponent(localePath(locale, `/departures/${departureId}/join`))}`,
    );
  }
  const dep = await getDeparture(departureId);
  if (!dep || !isJoinable(dep)) redirect(localePath(locale, `/departures/${departureId}/join`));

  const existing = await findBookingForDeparture(departureId);
  if (existing) {
    redirect(
      existing.status === "pending_deposit"
        ? localePath(locale, `/pay/${existing.id}`) + "?type=deposit"
        : localePath(locale, "/my"),
    );
  }

  const bookedOn = todayInSeoul();
  const { dueDate, payWithDeposit } = remainderDueDate(bookedOn, dep.startDate);
  const remainderKrw = assertKrw(dep.priceKrw - dep.depositKrw);
  const booking: DemoBooking = {
    id: newId("bk"),
    departureId,
    status: "pending_deposit",
    totalKrw: dep.priceKrw,
    depositKrw: dep.depositKrw,
    remainderKrw,
    remainderDue: dueDate,
    bookedOn,
  };
  await saveBookings([...(await listBookings()), booking]);
  redirect(
    localePath(locale, `/pay/${booking.id}`) + `?type=${payWithDeposit ? "full" : "deposit"}`,
  );
}

const METHODS: PaymentMethod[] = ["card", "tosspay", "kakaopay", "naverpay"];

/**
 * Mock Toss "confirm": in the real app this is the server-side
 * POST /v1/payments/confirm after the widget redirects back, followed by the
 * webhook. Here it just flips the booking status.
 */
export async function confirmMockPaymentAction(form: FormData): Promise<void> {
  const locale = localeOf(form);
  const bookingId = String(form.get("bookingId") ?? "");
  const type = String(form.get("type") ?? "deposit");
  const methodRaw = String(form.get("method") ?? "card");
  const method = (METHODS as string[]).includes(methodRaw) ? (methodRaw as PaymentMethod) : "card";
  const months = Math.max(0, Math.min(12, Number(form.get("months") ?? 0) || 0));

  const bookings = await listBookings();
  const i = bookings.findIndex((b) => b.id === bookingId);
  if (i < 0) redirect(localePath(locale, "/my"));
  const b = bookings[i];

  if (type === "remainder") {
    if (b.status !== "seat_held") redirect(localePath(locale, "/my"));
    bookings[i] = {
      ...b,
      status: "paid_in_full",
      remainderMethod: method,
      remainderInstallmentMonths: method === "card" ? months : 0,
    };
  } else {
    if (b.status !== "pending_deposit") redirect(localePath(locale, "/my"));
    const full = type === "full" || b.remainderKrw === 0;
    bookings[i] = {
      ...b,
      status: full ? "paid_in_full" : "seat_held",
      depositMethod: method,
      ...(full ? { remainderMethod: method, remainderInstallmentMonths: months } : {}),
    };
  }
  await saveBookings(bookings);
  redirect(localePath(locale, "/my") + `?paid=${bookingId}`);
}

export async function cancelPendingAction(form: FormData): Promise<void> {
  const locale = localeOf(form);
  const bookingId = String(form.get("bookingId") ?? "");
  const b = await getBooking(bookingId);
  if (b && b.status === "pending_deposit") {
    await saveBookings((await listBookings()).filter((x) => x.id !== bookingId));
  }
  redirect(localePath(locale, b ? `/departures/${b.departureId}/join` : "/my"));
}

export async function saveProfileAction(form: FormData): Promise<void> {
  const locale = localeOf(form);
  const pickOpt = <K extends QuestionKey>(k: K): TravelProfile[K] => {
    const v = String(form.get(k) ?? "");
    return ((OPTIONS[k] as readonly string[]).includes(v) ? v : OPTIONS[k][0]) as TravelProfile[K];
  };
  const mbtiRaw = String(form.get("mbti") ?? "")
    .trim()
    .toUpperCase();
  const genderRaw = String(form.get("gender") ?? "f");
  const profile: TravelProfile = {
    mbti: isValidMbti(mbtiRaw) ? mbtiRaw : "",
    pace: pickOpt("pace"),
    food: pickOpt("food"),
    drink: pickOpt("drink"),
    wake: pickOpt("wake"),
    photo: pickOpt("photo"),
    budget: pickOpt("budget"),
    mix: pickOpt("mix"),
    gender: genderRaw === "m" ? "m" : genderRaw === "other" ? "other" : "f",
  };
  await setProfile(profile);
  redirect(localePath(locale, "/match") + "?saved=1");
}

export async function clearProfileAction(form: FormData): Promise<void> {
  const locale = localeOf(form);
  await setProfile(null);
  redirect(localePath(locale, "/match"));
}
