"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuthStore } from "@bill/_store/useAuthStore";
import { motion } from "framer-motion";

export default function Home() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Si el usuario ya está autenticado, redirigir al dashboard
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Variantes para animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Encabezado */}
      <header className="fixed w-full bg-white/75 dark:bg-gray-900/75 backdrop-blur-xl z-50 shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Image src="/favicon.ico" alt="BillExpress Logo" width={32} height={32} className="dark:invert" />
            <span className="font-bold text-xl">BillExpress</span>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#features" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
              Funcionalidades
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors">
              Precios
            </a>
          </nav>
          <div className="flex space-x-3">
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

      {/* Hero Section */}
      <section className="relative min-h-screen pt-32 pb-28 px-4 overflow-hidden flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 z-0"></div>

        {/* Formas de fondo */}
        <div className="absolute top-20 left-0 w-72 h-72 bg-purple-300 dark:bg-purple-900/20 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-0 w-72 h-72 bg-yellow-300 dark:bg-yellow-900/20 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-pink-300 dark:bg-pink-900/20 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

        <motion.div className="container mx-auto text-center relative z-10 pt-10" initial="hidden" animate="visible" variants={containerVariants}>
          <motion.div className="relative flex flex-col items-center" variants={itemVariants}>
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-40 h-1.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
            <motion.h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold mb-8 relative" variants={itemVariants}>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Control de gastos</span>
              <br />
              <span className="relative">
                simplificado
                <div className="absolute bottom-0 left-0 w-full h-3 bg-yellow-300 dark:bg-yellow-500 opacity-40 -z-10 transform skew-x-12"></div>
              </span>
            </motion.h1>
            <motion.p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-12" variants={itemVariants}>
              Administra tus finanzas personales sin complicaciones.
              <span className="font-semibold text-blue-600 dark:text-blue-400"> 100% gratuito, para siempre.</span>
            </motion.p>
            <motion.div className="flex flex-col sm:flex-row gap-5 justify-center" variants={itemVariants}>
              <Link
                href="/auth/register"
                className="group relative px-8 py-4 overflow-hidden rounded-full bg-blue-600 text-white text-lg font-medium shadow-md transition-all duration-300 hover:shadow-xl transform hover:scale-[1.03]">
                <div className="absolute top-0 right-full w-full h-full bg-white opacity-20 transform translate-x-0 group-hover:translate-x-full transition-transform duration-700"></div>
                Comenzar gratis
              </Link>
              <a
                href="#features"
                className="relative px-8 py-4 overflow-hidden rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-lg font-medium shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700 transform hover:scale-[1.03]">
                <div className="absolute top-0 right-full w-full h-full bg-gray-100 dark:bg-gray-700 opacity-50 transform translate-x-0 group-hover:translate-x-full transition-transform duration-700"></div>
                Ver funcionalidades
              </a>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Indicador de scroll */}
        <motion.div
          className="absolute inset-x-0 mx-auto w-max bottom-8 z-20 flex flex-col items-center text-gray-400"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 1 }}>
          <span className="text-sm mb-2">Descubre más</span>
          <div className="w-6 h-10 border-2 border-gray-400 dark:border-gray-600 rounded-full flex justify-center">
            <motion.div
              className="w-1.5 h-3 bg-gray-400 dark:bg-gray-600 rounded-full mt-2"
              animate={{
                y: [0, 15, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
              }}
            />
          </div>
        </motion.div>
      </section>

      {/* Feature Section */}
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

          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-800 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="mt-4 flex flex-col space-y-2">
                <h3 className="text-xl font-semibold">Control de gastos</h3>
                <p className="text-gray-500 dark:text-gray-400">Registra y categoriza tus gastos diarios para entender mejor tus hábitos financieros.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-800 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="mt-4 flex flex-col space-y-2">
                <h3 className="text-xl font-semibold">Seguimiento de ingresos</h3>
                <p className="text-gray-500 dark:text-gray-400">Mantén un registro completo de tus fuentes de ingresos y visualiza tu progreso.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 dark:border-gray-800 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300"></div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <div className="mt-4 flex flex-col space-y-2">
                <h3 className="text-xl font-semibold">Análisis financiero</h3>
                <p className="text-gray-500 dark:text-gray-400">Obtén informes detallados y gráficos que te muestran cómo se comportan tus finanzas a lo largo del tiempo.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
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
                    <div className="flex items-center">
                      <div className="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span>Cuentas ilimitadas</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span>Gráficos avanzados</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span>Sincronización en la nube</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span>Soporte de la comunidad</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span>Múltiples dispositivos</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <span>Actualizaciones regulares</span>
                    </div>
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

      {/* FAQ Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-gray-200/50 dark:bg-grid-gray-800/20 opacity-30"></div>
        <div className="absolute right-0 top-0 w-1/3 h-1/3 bg-gradient-to-bl from-blue-400/10 to-purple-400/10 blur-2xl rounded-full"></div>
        <div className="absolute left-0 bottom-0 w-1/3 h-1/3 bg-gradient-to-tr from-green-400/10 to-blue-400/10 blur-2xl rounded-full"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center mb-16">
            <div className="inline-block px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-medium mb-4">
              Preguntas Frecuentes
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Todo lo que necesitas <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">saber</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl text-center mb-12">
              Respondemos las dudas más comunes sobre BillExpress para ayudarte a comenzar tu camino hacia una mejor salud financiera.
            </p>

            <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl">
              {/* Pregunta 1 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">¿Qué hace diferente a BillExpress?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  BillExpress ha sido diseñado con un enfoque en simplicidad y eficiencia. A diferencia de otras aplicaciones, ofrecemos una interfaz intuitiva, funcionamiento sin
                  conexión, sincronización automática y todas las funciones gratis para siempre.
                </p>
              </div>

              {/* Pregunta 2 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">¿Cómo garantizan la seguridad de mis datos?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Tu información está protegida mediante encriptación de datos, autenticación segura y reglas de acceso estrictas. Utilizamos tecnologías de clase mundial para
                  almacenamiento, y nunca compartimos tus datos financieros con terceros.
                </p>
              </div>

              {/* Pregunta 3 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">¿Puedo usar BillExpress sin conexión a internet?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  ¡Sí! BillExpress funciona sin conexión, permitiéndote registrar transacciones en cualquier momento. Cuando recuperes la conexión, tus datos se sincronizarán
                  automáticamente con la nube para mantener todo actualizado en todos tus dispositivos.
                </p>
              </div>

              {/* Pregunta 4 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">¿Realmente es gratis para siempre?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Absolutamente. Nos comprometemos a mantener BillExpress completamente gratuito sin restricciones ni funciones premium ocultas. Creemos que el control financiero
                  debe ser accesible para todos sin barreras económicas.
                </p>
              </div>

              {/* Pregunta 5 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">¿Puedo exportar mis datos financieros?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Sí, puedes exportar tus datos en formatos estándar como CSV o PDF para análisis adicionales, compartir con asesores financieros o mantener registros personales
                  fuera de la aplicación.
                </p>
              </div>

              {/* Pregunta 6 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">¿En qué dispositivos puedo usar BillExpress?</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  BillExpress está disponible como aplicación web que funciona en cualquier navegador moderno. Puedes acceder desde tu ordenador, tablet o smartphone, manteniendo
                  tus datos sincronizados entre todos tus dispositivos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
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

      {/* Footer */}
      <footer className="py-12 bg-gray-100 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Image src="/favicon.ico" alt="BillExpress Logo" width={24} height={24} className="dark:invert" />
                <span className="font-bold text-lg">BillExpress</span>
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
                  <a href="#" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                    Actualizaciones
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                    Sobre nosotros
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                    Contacto
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                    Privacidad
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                    Términos
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <p className="text-center text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} BillExpress. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
