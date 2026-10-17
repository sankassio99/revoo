import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/features/i18n/language-provider";
import { getRequestLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/messages";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return {
    title: {
      default: translate(locale, "Revoo — A quieter way to run your business"),
      template: "%s — Revoo",
    },
    description: translate(locale, "A considered workspace for independent salons, barbershops, and beauty studios."),
  };
}

export const viewport: Viewport = {
  themeColor: "#f4f5f0",
  colorScheme: "light",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale} className={cn("font-sans", geist.variable)}>
      <body>
        <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
