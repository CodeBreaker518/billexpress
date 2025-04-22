"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useAuthStore } from "@bill/_store/useAuthStore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { Button } from "@bill/_components/ui/button";
import { Input } from "@bill/_components/ui/input";
import { Label } from "@bill/_components/ui/label";
import { Badge } from "@bill/_components/ui/badge";
import { Separator } from "@bill/_components/ui/separator";
import { useToast } from "@bill/_components/ui/use-toast";
import { User, Mail, Camera, Save, AlertCircle, CheckCircle2, Upload, Trash2 } from "lucide-react";
import { uploadProfileImage, updateUserProfile, sendVerificationEmail } from "@bill/_firebase/authService";

export default function UserProfileForm() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [previewURL, setPreviewURL] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [verificationEmailSent, setVerificationEmailSent] = useState<boolean | null>(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Cargar información del usuario
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPhotoURL(user.photoURL || "");
    }
  }, [user]);

  // Manejar cambio de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB en bytes
        toast({
          title: "Error",
          description: "El archivo es demasiado grande. Máximo 2MB permitido.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      // Crear URL para vista previa
      const objectUrl = URL.createObjectURL(file);
      setPreviewURL(objectUrl);

      return () => URL.revokeObjectURL(objectUrl);
    }
  };

  // Abrir el selector de archivos
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Eliminar foto de perfil
  const handleRemoveImage = () => {
    setPreviewURL("");
    setSelectedFile(null);
    setPhotoURL("");
  };

  // Enviar email de verificación
  const handleSendVerificationEmail = async () => {
    if (!user) return;
    
    setLoading(true);
    setVerificationEmailSent(false);
    
    try {
      const result = await sendVerificationEmail(user);
      if (result.success) {
        setVerificationEmailSent(true);
        toast({
          title: "Email enviado",
          description: "Se ha enviado un correo de verificación a tu dirección de email.",
        });
      } else {
        throw new Error(result.error || "Error al enviar email");
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar el email de verificación. Inténtalo de nuevo más tarde.",
        variant: "destructive",
      });
      setVerificationEmailSent(null);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar perfil
  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setError("");
    setSuccess("");
    setLoading(true);
    
    try {
      // Si hay un archivo seleccionado, subir primero
      let newPhotoURL = photoURL;
      
      if (selectedFile) {
        setUploading(true);
        const uploadResult = await uploadProfileImage(user, selectedFile);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Error al subir imagen");
        }
        newPhotoURL = uploadResult.url || ""; // Ensure it's always a string
        setUploading(false);
      }
      
      // Actualizar perfil con la nueva URL de foto si hay cambios
      if (displayName !== user.displayName || newPhotoURL !== user.photoURL) {
        const updateResult = await updateUserProfile(user, {
          displayName: displayName,
          photoURL: newPhotoURL
        });
        
        if (!updateResult.success) {
          throw new Error(updateResult.error || "Error al actualizar perfil");
        }
        
        setSuccess("Perfil actualizado con éxito");
        setPhotoURL(newPhotoURL);
        setPreviewURL("");
        setSelectedFile(null);
        
        toast({
          title: "Perfil actualizado",
          description: "Tu información ha sido actualizada correctamente.",
        });
      } else {
        setSuccess("No hay cambios para guardar");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      setError(error.message || "No se pudo actualizar el perfil. Inténtalo de nuevo más tarde.");
      
      toast({
        title: "Error",
        description: "Ocurrió un error al actualizar tu perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md flex items-center gap-2 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-md flex items-center gap-2 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna 1: Foto de perfil */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Foto de Perfil</CardTitle>
            <CardDescription>Actualiza tu imagen de perfil</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            {/* Mostrar la imagen de vista previa, la foto actual o un avatar predeterminado */}
            {previewURL ? (
              <div className="relative w-32 h-32">
                <Image src={previewURL} alt="Vista previa" fill className="rounded-full object-cover border-2 border-gray-200 dark:border-gray-700" />
              </div>
            ) : photoURL ? (
              <div className="relative w-32 h-32">
                <Image
                  src={photoURL}
                  alt="Foto de perfil"
                  fill
                  className="rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                  onError={(e) => {
                    e.currentTarget.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";
                  }}
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                <User className="w-16 h-16" />
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-center">
              <Button size="sm" onClick={handleUploadClick} className="flex items-center gap-1">
                <Camera className="h-4 w-4" />
                {photoURL ? "Cambiar foto" : "Subir foto"}
              </Button>

              {photoURL && (
                <Button size="sm" variant="outline" onClick={handleRemoveImage} className="text-red-600 flex items-center gap-1">
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              )}

              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>

            <p className="text-xs text-muted-foreground mt-2 text-center">JPG, PNG. Máximo 2MB</p>
          </CardContent>
        </Card>

        {/* Columna 2: Información personal */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>Actualiza tu información de perfil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
                <div className="flex-1 p-3 bg-muted rounded-md text-sm overflow-x-auto">{user.email}</div>
                {user.emailVerified ? (
                  <Badge className="bg-green-100 text-green-800 flex items-center gap-1 whitespace-nowrap dark:bg-green-900 dark:text-green-300">
                    <CheckCircle2 className="h-3 w-3" />
                    Verificado
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSendVerificationEmail}
                    disabled={loading && verificationEmailSent === false}
                    className="text-blue-600 whitespace-nowrap">
                    {loading && verificationEmailSent === false && <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-white"></span>}
                    <Mail className="mr-1 h-3 w-3" />
                    Verificar email
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input 
                id="name"
                placeholder="Tu nombre" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)} 
                className="w-full mt-2" 
              />
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium">Último inicio de sesión</h4>
                <p className="text-sm text-muted-foreground">{user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : "Desconocido"}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium">Cuenta creada el</h4>
                <p className="text-sm text-muted-foreground">{user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleString() : "Desconocido"}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium">Método de inicio de sesión</h4>
                <p className="text-sm text-muted-foreground">
                  {user.providerData.length > 0 ? user.providerData[0].providerId.replace(".com", "").replace("password", "Email y contraseña") : "Desconocido"}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleUpdateProfile} disabled={loading || uploading} className="flex items-center gap-2">
              {(loading || uploading) && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></span>}
              <Save className="h-4 w-4" />
              {uploading ? "Subiendo..." : "Guardar cambios"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 