import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Revoo — A quieter way to run your business",
    template: "%s — Revoo",
  },
  description:
    "A considered workspace for independent salons, barbershops, and beauty studios.",
};

export const viewport: Viewport = {
  themeColor: "#f4f5f0",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
