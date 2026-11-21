import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  axes: ["SOFT", "opsz"],
});
const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Tenfold — The weekly ten.",
    template: "%s · Tenfold",
  },
  description: "The weekly ten. An EOS Level-10 meeting workspace.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${fraunces.variable} ${jbMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased relative">
        {/* Global grain */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[1] grain opacity-[0.03] mix-blend-overlay"
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
