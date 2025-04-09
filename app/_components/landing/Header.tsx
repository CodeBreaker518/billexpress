"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthStore } from "@bill/_store/useAuthStore";
import BillExpressLogo from "../BillExpressLogo";
import ThemeToggle from "../ThemeToggle";

export default function Header() {
  const { user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <header className="fixed w-full bg-white/75 dark:bg-gray-900/75 backdrop-blur-xl z-50 shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <BillExpressLogo width={200} height={60} usePrimaryColor={true} />
        </div>
        <nav className="hidden md:flex space-x-6">
          <a href="#features" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
            Funcionalidades
          </a>
          <a href="#pricing" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
            Precios
          </a>
          <a href="#faq" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
            FAQ
          </a>
        </nav>
        <div className="flex items-center space-x-3">
          <ThemeToggle variant="landing" />
          {isClient && !user ? (
            <>
              <Link
                href="/auth/login"
                className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium px-4 py-2">
                Iniciar sesión
              </Link>
              <Link
                href="/auth/register"
                className="rounded-full transition-colors flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2">
                Registrarse
              </Link>
            </>
          ) : (
            <Link href="/dashboard" className="rounded-full transition-colors flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2">
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
