import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./(dashboard)/globals.css";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "DutyCycle Dashboard",
  description: "Starter dashboard scaffold with Next.js 14"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en" className={cn("h-full", inter.variable)} suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans text-foreground antialiased", inter.className)}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <header className="border-b bg-card/40">
              <div className="container flex h-16 items-center justify-between">
                <span className="text-lg font-semibold">DutyCycle</span>
                <span className="text-sm text-muted-foreground">Modern operations dashboard</span>
              </div>
            </header>
            <main className="container flex-1 py-8">{children}</main>
            <footer className="border-t bg-card/40">
              <div className="container py-4 text-sm text-muted-foreground">
                Built with Next.js 14, Tailwind CSS, and shadcn/ui primitives.
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
