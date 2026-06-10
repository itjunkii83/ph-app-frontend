import type { Metadata } from "next";
import { Archivo, Fraunces } from "next/font/google";
import { AuthGate } from "@/components/auth/auth-gate";
import { AuthProvider } from "@/components/auth/auth-provider";
import { DevLauncher } from "@/components/dev/dev-launcher";
import { GrainOverlay } from "@/components/grain-overlay";
import { FirstRunRedirect } from "@/components/onboarding/first-run-redirect";
import { StoreProvider } from "@/lib/data/store-provider";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Daily Harbor",
  description:
    "Pause Harbor turns inspiration into habit, one cinematic morning at a time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${fraunces.variable} ${archivo.variable} h-full`}
    >
      <body className="min-h-full bg-ink font-body text-paper antialiased">
        <GrainOverlay />
        <AuthProvider>
          <AuthGate>
            <StoreProvider>
              <FirstRunRedirect />
              {children}
              {process.env.NODE_ENV === "development" && <DevLauncher />}
            </StoreProvider>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
