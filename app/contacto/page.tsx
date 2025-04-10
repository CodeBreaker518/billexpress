"use client";

import Link from "next/link";
import { ArrowLeft, Github, Linkedin, Mail, HelpCircle, Code } from "lucide-react";
import { Button } from "@bill/_components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@bill/_components/ui/card";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16 px-4">
      <div className="container mx-auto max-w-4xl h-full">
        <Link href="/" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">Soporte BillExpress</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            ¿Tienes dudas sobre el uso de la aplicación? Estoy aquí para ayudarte.
          </p>
        </div>

        <Card className="overflow-hidden border-0 shadow-lg mb-8">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Contacto para soporte
            </CardTitle>
            <CardDescription>
              Todas las dudas y sugerencias sobre BillExpress son bienvenidas
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8 pb-6">
            <div className="flex flex-col items-center text-center">
              <div className="bg-primary/10 p-5 rounded-full mb-4">
                <Mail className="h-10 w-10 text-primary" />
              </div>
              
              <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Envíame un correo electrónico</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-lg">
                Si tienes alguna pregunta sobre cómo usar BillExpress, sugerencias de mejora o reportes de errores, 
                no dudes en contactarme directamente.
              </p>
              
              <a 
                href="mailto:diegoperezperez518@gmail.com" 
                className="text-xl font-medium text-blue-600 dark:text-blue-400 hover:underline mb-6"
              >
                diegoperezperez518@gmail.com
              </a>
              
              <Button asChild size="lg" className="px-8">
                <a href="mailto:diegoperezperez518@gmail.com">
                  <Mail className="mr-2 h-5 w-5" />
                  Contactar soporte
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="overflow-hidden border-0 shadow-md">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Sobre BillExpress
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                BillExpress es una aplicación para gestionar finanzas personales desarrollada como proyecto personal.
                Creada con el objetivo de ofrecer una herramienta gratuita pero completa para el control de gastos e ingresos.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="text-base font-medium mb-2 text-blue-700 dark:text-blue-300">¿Quieres colaborar?</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
                  El frontend de BillExpress es de código abierto y acepto colaboraciones. Si tienes ideas para mejorar la 
                  aplicación o quieres contribuir, no dudes en contactarme.
                </p>
                <Button asChild variant="outline" size="sm" className="border-blue-300 dark:border-blue-700">
                  <a href="https://github.com/CodeBreaker518" target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    Ver en GitHub
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-0 shadow-md">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Desarrollador
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                BillExpress fue desarrollada por Diego Perez, un desarrollador web full stack especializado en React.
              </p>
              
              <div className="flex items-center gap-4 mb-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Github className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">GitHub</h3>
                  <a 
                    href="https://github.com/CodeBreaker518" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    @CodeBreaker518
                  </a>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Linkedin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">LinkedIn</h3>
                  <a 
                    href="https://www.linkedin.com/in/diego-perez-perez-779395246/" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Diego Perez Perez
                  </a>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 dark:bg-gray-800/50">
              <a 
                href="https://codebreaker518.netlify.app/" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline w-full text-center"
              >
                Ver portfolio completo
              </a>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
