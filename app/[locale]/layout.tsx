import { notFound } from "next/navigation";
import { Inter, Fraunces } from "next/font/google";
import { LOCALES, isLocale } from "@/lib/i18n/config";
import { I18nProvider } from "@/components/localization/i18n-provider";
import { Providers } from "@/components/providers";

const sans = Inter({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
const serif = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale} className={`${sans.variable} ${serif.variable} h-full`}>
      <body className="min-h-full">
        <I18nProvider locale={locale}>
          <Providers>{children}</Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
