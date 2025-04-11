'use client';

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@bill/_components/ui/button";
import { Suspense } from "react";
import BrandLoader from "@bill/_components/ui/BrandLoader";

// Componente principal, no usa hooks de cliente
function NotFoundContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Página no encontrada</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
        La página que estás buscando no existe o ha sido movida.
      </p>
      <Button asChild>
        <Link href="/dashboard" className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al inicio
        </Link>
      </Button>
    </div>
  );
}

// Componente envuelto en Suspense para asegurar compatibilidad
export default function NotFound() {
  return (
    <Suspense fallback={<BrandLoader />}>
      <NotFoundContent />
    </Suspense>
  );
} 