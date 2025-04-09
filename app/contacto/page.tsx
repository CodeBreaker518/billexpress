"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@bill/_components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { Input } from "@bill/_components/ui/input";
import { Label } from "@bill/_components/ui/label";
import { Textarea } from "@bill/_components/ui/textarea";
import { useToast } from "@bill/_components/ui/use-toast";

export default function ContactPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulando envío de formulario (en producción, conectaríamos con un backend real)
    setTimeout(() => {
      toast({
        title: "Mensaje enviado",
        description: "Gracias por contactarnos. Te responderemos lo antes posible.",
        variant: "success",
      });
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Link>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Contacto</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Estamos aquí para ayudarte. Envíanos un mensaje y te responderemos lo antes posible.</p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-primary">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Email</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">info@billexpress.com</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-primary">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Teléfono</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">+1 (555) 123-4567</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-primary">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Dirección</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Av. Tecnológica 123, Ciudad Digital</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden h-48 md:h-64">
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Mapa de ubicación</p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Envíanos un mensaje</CardTitle>
              <CardDescription>Completa el formulario a continuación y nos pondremos en contacto contigo pronto.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">Nombre</Label>
                    <Input id="first-name" name="name" value={formData.name} onChange={handleChange} placeholder="Tu nombre" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Apellido</Label>
                    <Input id="last-name" placeholder="Tu apellido" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="tu@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Asunto</Label>
                  <Input id="subject" name="subject" value={formData.subject} onChange={handleChange} placeholder="¿En qué podemos ayudarte?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Mensaje</Label>
                  <Textarea id="message" name="message" value={formData.message} onChange={handleChange} placeholder="Escribe tu mensaje aquí..." className="min-h-[120px]" />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      Enviando...
                      <span className="ml-2 inline-block animate-spin">⋮</span>
                    </>
                  ) : (
                    <>Enviar mensaje</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
