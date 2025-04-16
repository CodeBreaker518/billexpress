import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import ThemeProvider from "@bill/_components/ThemeProvider";
import FirebaseAuthProvider from "@bill/_components/FirebaseAuthProvider";
import { Toaster } from "@bill/_components/ui/toaster";
import AuthRedirect from "@bill/_components/AuthRedirect";

const poppinsFont = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#3b82f6",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://billexpress.vercel.app"),
  title: "BillExpress - Control de Gastos, Finanzas Personales y Presupuesto",
  description: "App de finanzas personales para controlar gastos, ingresos y presupuesto. Gestiona múltiples cuentas, visualiza estadísticas y organiza tus finanzas con facilidad. 100% gratuita y segura.",
  keywords: "finanzas personales, control de gastos, app finanzas, presupuesto personal, administración dinero, gestión financiera, ahorro personal, seguimiento gastos, app gratuita finanzas",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://billexpress.vercel.app",
    title: "BillExpress - Control de Gastos y Finanzas Personales",
    description: "Controla tus gastos, ingresos y presupuesto con esta aplicación de finanzas personales gratuita. Gestiona múltiples cuentas, visualiza estadísticas y organiza tu dinero.",
    siteName: "BillExpress",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Logo de BillExpress"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "BillExpress - App de Control de Finanzas Personales",
    description: "Aplicación gratuita para gestionar tus finanzas personales, control de gastos y presupuesto.",
    images: ["/logo.png"]
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL || "https://billexpress.vercel.app"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BillExpress",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any", rel: "icon" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/icons/apple-icon-180.png", sizes: "180x180", type: "image/png" }],
    other: [{ rel: "icon", url: "/logo.png", sizes: "32x32", type: "image/png" }],
  },
  category: "Finance",
  verification: {
    other: {
      "facebook-domain-verification": ["domainverification"],
    }
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head />
      <body className={`${poppinsFont.className} antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-y-auto`}>
        <ThemeProvider>
          <FirebaseAuthProvider>
            <AuthRedirect>{children}</AuthRedirect>
          </FirebaseAuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
