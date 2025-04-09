"use client";

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@bill/_components/ui/accordion";

export default function FAQSection() {
  const faqItems = [
    {
      question: "¿Qué hace diferente a BillExpress?",
      answer:
        "BillExpress ha sido diseñado con un enfoque en simplicidad y eficiencia. A diferencia de otras aplicaciones, ofrecemos una interfaz intuitiva, sincronización en la nube y todas las funciones gratis para siempre.",
    },
    {
      question: "¿Cómo garantizan la seguridad de mis datos?",
      answer:
        "Tu información está protegida mediante encriptación de datos, autenticación segura y reglas de acceso estrictas. Utilizamos tecnologías de clase mundial para almacenamiento, y nunca compartimos tus datos financieros con terceros.",
    },
    {
      question: "¿Necesito conexión a internet para usar BillExpress?",
      answer:
        "Sí, BillExpress requiere conexión a internet para funcionar. Esto permite que tus datos estén siempre actualizados y disponibles en todos tus dispositivos, aprovechando al máximo las capacidades de la nube.",
    },
    {
      question: "¿Realmente es gratis para siempre?",
      answer:
        "Absolutamente. Nos comprometemos a mantener BillExpress completamente gratuito sin restricciones ni funciones premium ocultas. Creemos que el control financiero debe ser accesible para todos sin barreras económicas.",
    },
    {
      question: "¿Puedo exportar mis datos financieros?",
      answer:
        "Sí, puedes exportar tus datos en formatos estándar como CSV o PDF para análisis adicionales, compartir con asesores financieros o mantener registros personales fuera de la aplicación.",
    },
    {
      question: "¿En qué dispositivos puedo usar BillExpress?",
      answer:
        "BillExpress está disponible como aplicación web que funciona en cualquier navegador moderno. Puedes acceder desde tu ordenador, tablet o smartphone, manteniendo tus datos sincronizados entre todos tus dispositivos.",
    },
  ];

  return (
    <section id="faq" className="py-24 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
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

          <div className="w-full max-w-5xl">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem
                  key={`item-${index + 1}`}
                  value={`item-${index + 1}`}
                  className="bg-white dark:bg-gray-800 rounded-xl mb-4 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
                  <AccordionTrigger className="text-xl font-semibold px-6 py-4 text-gray-900 dark:text-white">{item.question}</AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-gray-600 dark:text-gray-300">{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
