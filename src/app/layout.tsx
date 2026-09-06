import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const serif = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "SpazioPro — Diseña tu espacio y calcula el presupuesto",
  description:
    "Transforma cualquier espacio a partir de una fotografía: diseña opciones, calcula materiales y obtén un presupuesto profesional.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${serif.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
