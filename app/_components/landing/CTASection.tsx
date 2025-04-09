import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-20 bg-blue-600 dark:bg-blue-800">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">Comienza a controlar tus finanzas hoy mismo</h2>
        <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">Únete a miles de personas que ya han transformado su relación con el dinero gracias a BillExpress.</p>
        <Link
          href="/auth/register"
          className="inline-block rounded-full border border-solid border-white bg-white hover:bg-blue-50 text-blue-600 font-medium text-lg py-3 px-8 transition-colors">
          Registrarse gratis
        </Link>
      </div>
    </section>
  );
}
