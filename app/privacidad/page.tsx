import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 shadow">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Política de Privacidad</h1>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Última actualización: {new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <div className="prose prose-gray dark:prose-invert max-w-none">
            <h2 className="text-xl font-semibold mb-4">1. Introducción</h2>
            <p className="mb-6">
              En BillExpress, respetamos tu privacidad y nos comprometemos a proteger tus datos personales. Esta Política de Privacidad explica cómo recopilamos, utilizamos,
              divulgamos y protegemos tu información cuando utilizas nuestra aplicación de gestión financiera.
            </p>

            <h2 className="text-xl font-semibold mb-4">2. Información que recopilamos</h2>
            <p className="mb-4">Para proporcionarte nuestro servicio, podemos recopilar la siguiente información:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>
                <strong>Información de la cuenta:</strong> Nombre, dirección de correo electrónico y contraseña cuando te registras.
              </li>
              <li>
                <strong>Información financiera:</strong> Datos sobre tus ingresos, gastos, cuentas y transacciones que ingresas voluntariamente en la aplicación.
              </li>
              <li>
                <strong>Datos de uso:</strong> Información sobre cómo interactúas con nuestra aplicación, incluyendo registros de acceso, páginas visitadas y acciones realizadas.
              </li>
              <li>
                <strong>Información del dispositivo:</strong> Datos técnicos como tipo de dispositivo, sistema operativo, navegador y configuración de idioma.
              </li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">3. Cómo utilizamos tu información</h2>
            <p className="mb-4">Utilizamos la información recopilada para:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Proporcionar, mantener y mejorar nuestra aplicación.</li>
              <li>Procesar y gestionar tus transacciones financieras dentro de la aplicación.</li>
              <li>Personalizar tu experiencia y ofrecerte contenido relevante.</li>
              <li>Comunicarnos contigo, responder a tus consultas y enviar notificaciones relacionadas con el servicio.</li>
              <li>Analizar tendencias de uso para mejorar la funcionalidad y diseño de la aplicación.</li>
              <li>Detectar, prevenir y solucionar problemas técnicos o de seguridad.</li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">4. Compartición de información</h2>
            <p className="mb-6">No vendemos ni alquilamos tu información personal a terceros. Podemos compartir tu información en las siguientes circunstancias:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>
                <strong>Proveedores de servicios:</strong> Con terceros que nos ayudan a proporcionar, mantener y mejorar nuestros servicios (como proveedores de alojamiento y
                almacenamiento en la nube).
              </li>
              <li>
                <strong>Cumplimiento legal:</strong> Cuando sea necesario para cumplir con una obligación legal, proteger nuestros derechos o la seguridad de nuestros usuarios.
              </li>
              <li>
                <strong>Con tu consentimiento:</strong> En cualquier otro caso, solicitaremos tu consentimiento explícito antes de compartir tu información.
              </li>
            </ul>

            <h2 className="text-xl font-semibold mb-4">5. Seguridad de los datos</h2>
            <p className="mb-6">
              Implementamos medidas técnicas y organizativas adecuadas para proteger tu información contra pérdida, uso indebido, acceso no autorizado, divulgación o alteración.
              Estas medidas incluyen encriptación de datos, acceso restringido a la información y revisiones periódicas de seguridad.
            </p>

            <h2 className="text-xl font-semibold mb-4">6. Retención de datos</h2>
            <p className="mb-6">
              Conservamos tu información personal solo durante el tiempo necesario para los fines establecidos en esta Política de Privacidad, a menos que se requiera o permita un
              período de retención más largo por ley.
            </p>

            <h2 className="text-xl font-semibold mb-4">7. Tus derechos</h2>
            <p className="mb-4">Dependiendo de tu ubicación, puedes tener los siguientes derechos respecto a tus datos personales:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Acceder y obtener una copia de tu información personal.</li>
              <li>Rectificar datos inexactos o incompletos.</li>
              <li>Solicitar la eliminación de tus datos personales.</li>
              <li>Oponerte o restringir el procesamiento de tus datos.</li>
              <li>Retirar tu consentimiento en cualquier momento.</li>
              <li>Presentar una queja ante una autoridad de protección de datos.</li>
            </ul>
            <p className="mb-6">
              Para ejercer estos derechos, contacta con nosotros a través de nuestra{" "}
              <Link href="/contacto" className="text-blue-600 dark:text-blue-400 hover:underline">
                página de contacto
              </Link>
              .
            </p>

            <h2 className="text-xl font-semibold mb-4">8. Menores</h2>
            <p className="mb-6">
              Nuestra aplicación no está dirigida a menores de 16 años. No recopilamos intencionadamente información personal de menores. Si eres padre/madre o tutor y crees que tu
              hijo nos ha proporcionado información personal, contáctanos para que podamos tomar las medidas necesarias.
            </p>

            <h2 className="text-xl font-semibold mb-4">9. Cambios en esta política</h2>
            <p className="mb-6">
              Podemos actualizar nuestra Política de Privacidad periódicamente. Te notificaremos cualquier cambio significativo mediante un aviso en la aplicación o por correo
              electrónico. Te recomendamos revisar esta política regularmente para mantenerte informado sobre cómo protegemos tu información.
            </p>

            <h2 className="text-xl font-semibold mb-4">10. Contacto</h2>
            <p className="mb-6">
              Si tienes preguntas sobre esta Política de Privacidad o sobre cómo tratamos tus datos, no dudes en contactarnos a través de nuestra{" "}
              <Link href="/contacto" className="text-blue-600 dark:text-blue-400 hover:underline">
                página de contacto
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
