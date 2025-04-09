import Link from "next/link";
import BillExpressLogo from "../BillExpressLogo";

export default function Footer() {
  return (
    <footer className="py-8 sm:py-12 bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
          <div>
            <div className="flex items-center mb-4">
              <BillExpressLogo responsive={true} usePrimaryColor={true} />
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Control de gastos simplificado para todos.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Producto</h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-sm sm:text-base text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                  Funcionalidades
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-sm sm:text-base text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                  Precios
                </a>
              </li>
              <li>
                <a href="#faq" className="text-sm sm:text-base text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Empresa</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/contacto" className="text-sm sm:text-base text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacidad" className="text-sm sm:text-base text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="text-sm sm:text-base text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                  Términos
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 sm:pt-8">
          <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} BillExpress. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
