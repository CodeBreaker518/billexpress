export default function FeaturesSection() {
  // Definición de las características actualizadas
  const features = [
    {
      title: "Control de gastos",
      description: "Registra y categoriza tus gastos diarios para entender mejor tus hábitos financieros.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      gradientFrom: "from-blue-500",
      gradientTo: "to-blue-600",
      hoverGradientFrom: "from-blue-500/20",
      hoverGradientTo: "to-purple-500/20",
    },
    {
      title: "Seguimiento de ingresos",
      description: "Mantén un registro completo de tus fuentes de ingresos y visualiza tu progreso financiero.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      gradientFrom: "from-green-500",
      gradientTo: "to-emerald-600",
      hoverGradientFrom: "from-green-500/20",
      hoverGradientTo: "to-emerald-500/20",
    },
    {
      title: "Análisis financiero",
      description: "Obtén informes detallados y gráficos que te muestran cómo se comportan tus finanzas a lo largo del tiempo.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      ),
      gradientFrom: "from-purple-500",
      gradientTo: "to-indigo-600",
      hoverGradientFrom: "from-purple-500/20",
      hoverGradientTo: "to-indigo-500/20",
    },
    {
      title: "Gestión de múltiples cuentas",
      description: "Administra diferentes cuentas bancarias, tarjetas y efectivo desde una sola interfaz intuitiva.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      gradientFrom: "from-amber-500",
      gradientTo: "to-orange-600",
      hoverGradientFrom: "from-amber-500/20",
      hoverGradientTo: "to-orange-500/20",
    },
    {
      title: "Sincronización en la nube",
      description: "Tus datos financieros siempre seguros y actualizados en la nube, accesibles desde cualquier dispositivo.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4m4 4v-4m0 4h12M4 8c0-2.2 1.8-4 4-4s4 1.8 4 4m-4 4h12" />
        </svg>
      ),
      gradientFrom: "from-sky-500",
      gradientTo: "to-blue-600",
      hoverGradientFrom: "from-sky-500/20",
      hoverGradientTo: "to-blue-500/20",
    },
    {
      title: "Visualización por categorías",
      description: "Comprende tus patrones de gasto e ingreso con visualizaciones claras organizadas por categorías personalizables.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      ),
      gradientFrom: "from-pink-500",
      gradientTo: "to-rose-600",
      hoverGradientFrom: "from-pink-500/20",
      hoverGradientTo: "to-rose-500/20",
    },
  ];

  return (
    <section id="features" className="py-24 bg-white dark:bg-gray-800 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-gray-200/50 dark:bg-grid-gray-800/20"></div>
      <div className="absolute right-0 bottom-0 w-1/3 h-1/3 bg-gradient-to-tl from-blue-400/20 to-purple-400/20 blur-2xl rounded-full"></div>
      <div className="absolute left-0 top-0 w-1/3 h-1/3 bg-gradient-to-br from-blue-400/20 to-green-400/20 blur-2xl rounded-full"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col items-center mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-4">Funcionalidades</div>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Todo lo que necesitas para{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">controlar tus finanzas</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl text-center">
            BillExpress incluye todas las herramientas esenciales para ayudarte a gestionar tus gastos de manera efectiva.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-800 relative group">
              <div
                className={`absolute inset-0 bg-gradient-to-r ${feature.hoverGradientFrom} ${feature.hoverGradientTo} opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300`}></div>
              <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradientFrom} ${feature.gradientTo} rounded-2xl flex items-center justify-center mb-6 relative`}>
                {feature.icon}
              </div>
              <div className="mt-4 flex flex-col space-y-2">
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-gray-500 dark:text-gray-400">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
