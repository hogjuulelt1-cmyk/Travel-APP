/**
 * Demo session + demo bookings, stored in cookies.
 *
 * This is the mock layer for the Vercel preview: no database, no real auth,
 * no real Toss. Everything a user does lives in their own cookies. The
 * function signatures mirror what the Prisma-backed versions will expose so
 * pages do not change when the real backend lands.
 */
import "server-only";
import { cookies } from "next/headers";

export type Provider = "kakao" | "naver" | "email";

export type DemoAccount = {
  id: string;
  name: string;
  provider: Provider;
  email: string;
  /** sha256 hex of the password; only for provider "email" (demo only). */
  passwordHash?: string;
  gender: "f" | "m" | "other";
  birthYear?: number;
  intro?: string;
  createdAt: string;
};

/** The signed-in identity. Kept small; profile fields live on the account. */
export type DemoUser = Pick<DemoAccount, "id" | "name" | "provider" | "email">;

export type BookingStatus = "pending_deposit" | "seat_held" | "paid_in_full";
export type PaymentMethod = "card" | "tosspay" | "kakaopay" | "naverpay";

export type DemoBooking = {
  id: string;
  departureId: string;
  status: BookingStatus;
  totalKrw: number;
  depositKrw: number;
  remainderKrw: number;
  /** YYYY-MM-DD in Asia/Seoul */
  remainderDue: string;
  /** YYYY-MM-DD in Asia/Seoul */
  bookedOn: string;
  depositMethod?: PaymentMethod;
  remainderMethod?: PaymentMethod;
  /** 0 = lump sum, 2..6 = card installment months chosen at Toss */
  remainderInstallmentMonths?: number;
};

const USER_COOKIE = "demo_user";
const ACCOUNTS_COOKIE = "demo_accounts";
const BOOKINGS_COOKIE = "demo_bookings";
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

function parse<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function getUser(): Promise<DemoUser | null> {
  const jar = await cookies();
  return parse<DemoUser | null>(jar.get(USER_COOKIE)?.value, null);
}

export async function setUser(user: DemoUser | null): Promise<void> {
  const jar = await cookies();
  if (user) jar.set(USER_COOKIE, JSON.stringify(user), COOKIE_OPTS);
  else jar.delete(USER_COOKIE);
}

export async function listBookings(): Promise<DemoBooking[]> {
  const jar = await cookies();
  return parse<DemoBooking[]>(jar.get(BOOKINGS_COOKIE)?.value, []);
}

export async function saveBookings(bookings: DemoBooking[]): Promise<void> {
  const jar = await cookies();
  jar.set(BOOKINGS_COOKIE, JSON.stringify(bookings), COOKIE_OPTS);
}

export async function getBooking(id: string): Promise<DemoBooking | null> {
  return (await listBookings()).find((b) => b.id === id) ?? null;
}

export async function findBookingForDeparture(departureId: string): Promise<DemoBooking | null> {
  return (await listBookings()).find((b) => b.departureId === departureId) ?? null;
}

export function todayInSeoul(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

// ---- travel profile (matching) ----
import type { TravelProfile } from "@/lib/matching";

const PROFILE_COOKIE = "demo_profile";

export async function getProfile(): Promise<TravelProfile | null> {
  const jar = await cookies();
  return parse<TravelProfile | null>(jar.get(PROFILE_COOKIE)?.value, null);
}

export async function setProfile(profile: TravelProfile | null): Promise<void> {
  const jar = await cookies();
  if (profile) jar.set(PROFILE_COOKIE, JSON.stringify(profile), COOKIE_OPTS);
  else jar.delete(PROFILE_COOKIE);
}

// ---- demo accounts (sign up / log in) ----

export async function listAccounts(): Promise<DemoAccount[]> {
  const jar = await cookies();
  return parse<DemoAccount[]>(jar.get(ACCOUNTS_COOKIE)?.value, []);
}

export async function saveAccounts(accounts: DemoAccount[]): Promise<void> {
  const jar = await cookies();
  // Cookies are ~4KB; the demo keeps the last few accounts only.
  jar.set(ACCOUNTS_COOKIE, JSON.stringify(accounts.slice(-5)), COOKIE_OPTS);
}

export async function findAccountByEmail(email: string): Promise<DemoAccount | null> {
  const e = email.trim().toLowerCase();
  return (await listAccounts()).find((a) => a.email === e) ?? null;
}

export async function getAccount(): Promise<DemoAccount | null> {
  const user = await getUser();
  if (!user) return null;
  return (await listAccounts()).find((a) => a.id === user.id) ?? null;
}

export function toUser(a: DemoAccount): DemoUser {
  return { id: a.id, name: a.name, provider: a.provider, email: a.email };
}
