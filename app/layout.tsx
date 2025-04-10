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
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: "BillExpress - Control de gastos simplificado",
  description: "Administra tus finanzas personales de manera sencilla",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BillExpress",
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any', rel: 'icon' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/icons/apple-icon-180.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', url: '/logo.png', sizes: '32x32', type: 'image/png' }, 
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head />
      <body className={`${poppinsFont.className} antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden`}>
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
