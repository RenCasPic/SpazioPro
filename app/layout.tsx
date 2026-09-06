import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpazioPro — Visualize. Estimate. Build.",
  description:
    "Turn a photo of a room into a design proposal and a professional estimate — built for US remodeling and construction.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
