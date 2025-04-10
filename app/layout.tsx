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
  title: "BillExpress - Control de gastos simplificado",
  description: "Administra tus finanzas personales de manera sencilla",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BillExpress",
  },
  icons: {
    icon: "/favicon.ico",
    apple: [{ url: "/logo.png", sizes: "192x192", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="BillExpress" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BillExpress" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${poppinsFont.className} antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
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
