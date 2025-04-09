import Link from "next/link";

export default function PricingSection() {
  const features = ["Cuentas ilimitadas", "Gráficos avanzados", "Sincronización en la nube", "Soporte de la comunidad", "Múltiples dispositivos", "Actualizaciones regulares"];

  return (
    <section id="pricing" className="py-20 bg-white dark:bg-gray-800 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-gray-200/50 dark:bg-grid-gray-800/20 opacity-30"></div>
      <div className="absolute left-1/4 bottom-0 w-1/2 h-1/2 bg-gradient-to-t from-blue-400/10 to-purple-400/10 blur-2xl rounded-full"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm font-medium mb-4">100% Gratuito</div>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Disfruta de todas las funciones{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400">sin costo alguno</span>
          </h2>
          <p className="text-xl text-center text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10">
            Estamos comprometidos a ofrecer una herramienta de calidad para todos sin costos ocultos ni funciones premium.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-1 rounded-xl shadow-xl transform hover:scale-[1.01] transition-all duration-300">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-lg relative overflow-hidden">
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-blue-100 dark:bg-blue-900/20 rounded-full"></div>
              <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-purple-100 dark:bg-purple-900/20 rounded-full"></div>

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold">BillExpress</h3>
                  <span className="bg-gradient-to-r from-green-400 to-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">PARA TODOS</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Todas las funcionalidades sin restricciones</p>

                <div className="flex items-end gap-2 mb-8">
                  <span className="text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">$0</span>
                  <span className="text-lg text-gray-500 dark:text-gray-400 mb-1">para siempre</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/auth/register"
                  className="group relative overflow-hidden block w-full text-center py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium text-lg transition-all duration-500 transform hover:scale-[1.02] shadow-lg">
                  <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                  Comenzar ahora
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
