import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { getMessages, isLocale, locales } from "@/lib/i18n";
import "../globals.css";

type Props = Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = getMessages(locale);
  return {
    title: m.app.name,
    description: m.app.description,
    alternates: { languages: { ko: "/", en: "/en" } },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = getMessages(locale);
  return (
    <html lang={locale}>
      <body className="min-h-dvh bg-white pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-50">
        {children}
        <BottomNav
          locale={locale}
          labels={{
            home: m.nav.home,
            packages: m.nav.packages,
            match: m.nav.match,
            my: m.nav.my,
            me: m.nav.me,
          }}
        />
      </body>
    </html>
  );
}
