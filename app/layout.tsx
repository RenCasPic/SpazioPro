import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Estimate It — From plans to price.",
  description:
    "Professional construction estimating and takeoff software. Build accurate estimates from plans, models and site data — for remodelers, general contractors, estimators, architects and designers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
