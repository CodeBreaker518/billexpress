import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Términos y Condiciones</h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h2 className="text-xl font-semibold mb-4">1. Aceptación de los Términos</h2>
            <p className="mb-6">
              Al acceder y utilizar BillExpress, aceptas estar sujeto a estos Términos y Condiciones, todas las leyes y regulaciones aplicables. Si no estás de acuerdo con alguno
              de estos términos, tienes prohibido usar o acceder a esta aplicación.
            </p>

            <h2 className="text-xl font-semibold mb-4">2. Uso de la Aplicación</h2>
            <p className="mb-4">
              BillExpress es una aplicación de gestión financiera personal que te permite llevar un registro de tus ingresos, gastos y cuentas. La aplicación está diseñada para uso
              personal.
            </p>
            <p className="mb-6">
              Al utilizar nuestra aplicación, te comprometes a proporcionar información precisa y actualizada según sea necesario para el uso del servicio. Eres responsable de
              mantener la confidencialidad de tu cuenta y contraseña.
            </p>

            <h2 className="text-xl font-semibold mb-4">3. Propiedad Intelectual</h2>
            <p className="mb-6">
              La aplicación BillExpress y todo su contenido, características y funcionalidad son propiedad de BillExpress y están protegidos por leyes internacionales de derechos
              de autor, marcas registradas, patentes, secretos comerciales y otros derechos de propiedad intelectual o derechos de propiedad.
            </p>

            <h2 className="text-xl font-semibold mb-4">4. Restricciones de Uso</h2>
            <p className="mb-6">
              No está permitido:
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Utilizar la aplicación para cualquier propósito ilegal o no autorizado.</li>
                <li>Modificar, adaptar o piratear la aplicación para intentar descubrir el código fuente.</li>
                <li>Intentar acceder a datos que no estén destinados a ti o iniciar sesión en un servidor donde no estés autorizado.</li>
                <li>Transmitir virus, gusanos o cualquier código de naturaleza destructiva.</li>
                <li>Utilizar la aplicación de manera que pueda dañar, deshabilitar, sobrecargar o deteriorar el servicio.</li>
              </ul>
            </p>

            <h2 className="text-xl font-semibold mb-4">5. Limitación de Responsabilidad</h2>
            <p className="mb-6">
              BillExpress proporciona la aplicación &quot;tal cual&quot; y &quot;según disponibilidad&quot; sin garantías de ningún tipo. No garantizamos que la aplicación sea
              ininterrumpida, oportuna, segura o libre de errores.
            </p>
            <p className="mb-6">
              No seremos responsables por cualquier pérdida o daño, directo o indirecto, que resulte del uso o la incapacidad de usar la aplicación, incluida la pérdida de datos o
              ganancias.
            </p>

            <h2 className="text-xl font-semibold mb-4">6. Cambios en los Términos</h2>
            <p className="mb-6">
              Nos reservamos el derecho de modificar estos términos en cualquier momento. Publicaremos los términos modificados en esta página y actualizaremos la fecha de
              &quot;última actualización&quot;. Es tu responsabilidad revisar estos términos periódicamente para estar al tanto de las modificaciones.
            </p>

            <h2 className="text-xl font-semibold mb-4">7. Legislación Aplicable</h2>
            <p className="mb-6">Estos términos se regirán e interpretarán de acuerdo con las leyes locales, sin tener en cuenta sus conflictos de disposiciones legales.</p>

            <h2 className="text-xl font-semibold mb-4">8. Contacto</h2>
            <p className="mb-6">
              Si tienes alguna pregunta sobre estos Términos y Condiciones, por favor contáctanos en{" "}
              <Link href="/contacto" className="text-blue-600 dark:text-blue-400 hover:underline">
                nuestra página de contacto
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
