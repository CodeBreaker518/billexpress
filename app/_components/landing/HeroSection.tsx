"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FlipWords } from "@bill/_components/landing/FlipWords";

export default function HeroSection() {
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
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Control de <FlipWords className="text-blue-600 dark:text-blue-400" words={["gastos", "ingresos", "finanzas", "presupuesto", "ahorro"]} />
            </span>
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
          <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6" variants={itemVariants}>
            <Link
              href="/auth/register"
              className="group relative w-full sm:w-auto px-8 py-4 overflow-hidden rounded-full bg-blue-600 text-white text-lg font-medium shadow-md transition-all duration-300 hover:shadow-xl transform hover:scale-[1.03]">
              <div className="absolute top-0 right-full w-full h-full bg-white opacity-20 transform translate-x-0 group-hover:translate-x-full transition-transform duration-700"></div>
              Comenzar gratis
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto relative px-8 py-4 overflow-hidden rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white text-lg font-medium shadow-md transition-all duration-300 border border-gray-200 dark:border-gray-700 transform hover:scale-[1.03]">
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
  );
}
