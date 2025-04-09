import Link from "next/link";
import BillExpressLogo from "../BillExpressLogo";

export default function Footer() {
  return (
    <footer className="py-12 bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <BillExpressLogo width={180} height={50} usePrimaryColor={true} />
            </div>
            <p className="text-gray-600 dark:text-gray-400">Control de gastos simplificado para todos.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Producto</h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                  Funcionalidades
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                  Precios
                </a>
              </li>
              <li>
                <a href="#faq" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Empresa</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/contacto" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacidad" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                  Términos
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <p className="text-center text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} BillExpress. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
