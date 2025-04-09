"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@bill/_store/useAuthStore";
import { updateUserProfile, sendVerificationEmail, uploadProfileImage, deleteUserAccount, reauthenticateUser } from "@bill/_firebase/authService";
import { User as UserIcon, Mail, Camera, Save, AlertCircle, CheckCircle2, Upload, Trash2, Moon, Sun, Monitor, LogOut, Info, Shield, AlertTriangle } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "@bill/_components/ui/use-toast";

// Importaciones de componentes shadcn/ui
import { Button } from "@bill/_components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@bill/_components/ui/card";
import { Text, Title } from "@bill/_components/ui/typography";
import { Separator } from "@bill/_components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@bill/_components/ui/dialog";
import { Input } from "@bill/_components/ui/input";
import { Badge } from "@bill/_components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@bill/_components/ui/tabs";
import { signOut } from "firebase/auth";
import { auth } from "@bill/_firebase/config";
import { ProfilePageSkeleton } from "@bill/_components/ui/skeletons";
import { useAccountStore } from "@bill/_store/useAccountStore";

export default function PerfilPage() {
  const { user } = useAuthStore();
  const { loading: accountsLoading } = useAccountStore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPhotoURL(user.photoURL || "");

      // Si el usuario ya tiene una foto de perfil establecida en Firebase,
      // mostrarla como vista previa (no es un archivo local)
      if (user.photoURL) {
        setPreviewURL(null);
      }
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validar que sea una imagen
      if (!file.type.startsWith("image/")) {
        setError("El archivo seleccionado no es una imagen");
        return;
      }

      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("La imagen no debe superar los 2MB");
        return;
      }

      setSelectedFile(file);
      setPreviewURL(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (previewURL) {
      URL.revokeObjectURL(previewURL);
    }
    setPreviewURL(null);
    setPhotoURL("");
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let finalPhotoURL = photoURL;

      // Si hay un archivo seleccionado, subirlo
      if (selectedFile) {
        setUploading(true);
        const uploadResult = await uploadProfileImage(user, selectedFile);
        setUploading(false);

        if (!uploadResult.success) {
          setError(uploadResult.error || "Error al subir la imagen");
          setLoading(false);
          return;
        }

        // Usar la URL de la imagen subida
        finalPhotoURL = uploadResult.url as string;
      } else if (previewURL === null && photoURL === "") {
        // Si se eliminó la imagen
        finalPhotoURL = "";
      }

      // Actualizar el perfil
      const result = await updateUserProfile(user, {
        displayName: displayName || undefined,
        photoURL: finalPhotoURL || undefined,
      });

      if (result.success) {
        setSuccess("Perfil actualizado correctamente");

        // Si se subió una imagen, actualizar el estado
        if (selectedFile) {
          setPhotoURL(finalPhotoURL);
        }

        // Recargar la página para reflejar los cambios inmediatamente
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setError(result.error || "Error al actualizar perfil");
      }
    } catch (err) {
      setError("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    if (!user) return;

    setLoading(true);
    setError("");
    setVerificationEmailSent(false);

    try {
      const result = await sendVerificationEmail(user);

      if (result.success) {
        setVerificationEmailSent(true);
        toast({
          title: "Email enviado",
          description: "Se ha enviado un correo de verificación a tu dirección de email.",
          duration: 5000,
        });
      } else {
        setError(result.error || "Error al enviar email de verificación");
      }
    } catch (err) {
      setError("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setDeletingAccount(true);
    setError("");

    try {
      // Solo reautenticar para proveedores de email y contraseña
      if (user.providerData[0].providerId === "password" && deletePassword) {
        const reauth = await reauthenticateUser(user, deletePassword);
        if (!reauth.success) {
          setError(reauth.error || "Contraseña incorrecta");
          setDeletingAccount(false);
          return;
        }
      }

      // Eliminar todos los datos del usuario
      const result = await deleteUserAccount(user, deletePassword);

      if (result.success) {
        toast({
          title: "Cuenta eliminada",
          description: "Tu cuenta y todos tus datos han sido eliminados permanentemente.",
          duration: 5000,
        });

        // Redirigir al inicio de sesión
        router.push("/auth/login");
      } else {
        setError(result.error || "Error al eliminar la cuenta");
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado");
    } finally {
      setDeletingAccount(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/auth/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  if (loading || accountsLoading) {
    return <ProfilePageSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isEmailProvider = user.providerData.length > 0 && user.providerData[0].providerId === "password";

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Mi Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">Administra tu información personal y preferencias</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna 1: Foto de perfil y vista previa */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Foto de Perfil</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {/* Mostrar la imagen de vista previa, la foto actual o un avatar predeterminado */}
              {previewURL ? (
                <div className="relative w-32 h-32 mb-6">
                  <Image src={previewURL} alt="Vista previa" fill className="rounded-full object-cover border-2 border-gray-200 dark:border-gray-700" />
                </div>
              ) : photoURL ? (
                <div className="relative w-32 h-32 mb-6">
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
                <div className="w-32 h-32 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center mb-6">
                  <UserIcon className="w-16 h-16" />
                </div>
              )}

              <Text className="text-lg font-medium text-center mb-4">{displayName || "Sin nombre"}</Text>

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

              <Text className="text-xs text-gray-500 mt-4 text-center">JPG, PNG. Máximo 2MB</Text>
            </CardContent>

            <CardFooter className="flex justify-center">
              <Button variant="outline" onClick={handleLogout} className="w-full mt-2 flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </Button>
            </CardFooter>
          </Card>

          {/* Tarjeta de tema */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Tema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <Button variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")} className="flex-1 mr-2">
                  <Sun className="h-4 w-4 mr-2" />
                  Claro
                </Button>

                <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")} className="flex-1">
                  <Moon className="h-4 w-4 mr-2" />
                  Oscuro
                </Button>

                <Button variant={theme === "system" ? "default" : "outline"} onClick={() => setTheme("system")} className="flex-1 ml-2">
                  <Monitor className="h-4 w-4 mr-2" />
                  Sistema
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna 2: Información y configuración */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="info">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="info" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Información
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Seguridad
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Información Personal</CardTitle>
                  <CardDescription>Actualiza tu información de perfil</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div>
                    <Text className="mb-2 font-medium">Email</Text>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-sm overflow-x-auto">{user.email}</div>
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
                    <Text className="mb-2 font-medium">Nombre</Text>
                    <Input placeholder="Tu nombre" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full" />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div>
                      <Text className="font-medium">Último inicio de sesión</Text>
                      <Text className="text-sm text-gray-500">{user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : "Desconocido"}</Text>
                    </div>

                    <div>
                      <Text className="font-medium">Cuenta creada el</Text>
                      <Text className="text-sm text-gray-500">{user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleString() : "Desconocido"}</Text>
                    </div>

                    <div>
                      <Text className="font-medium">Método de inicio de sesión</Text>
                      <Text className="text-sm text-gray-500">
                        {user.providerData.length > 0 ? user.providerData[0].providerId.replace(".com", "").replace("password", "Email y contraseña") : "Desconocido"}
                      </Text>
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
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Seguridad de la cuenta</CardTitle>
                  <CardDescription>Gestiona la seguridad de tu cuenta</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Verificación de email */}
                  <div>
                    <Text className="font-medium mb-2">Estado de la cuenta</Text>
                    {user.emailVerified ? (
                      <div className="flex items-center text-green-600 gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        <Text>Tu cuenta está verificada y activa</Text>
                      </div>
                    ) : (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4" />
                          <Text className="font-medium">Tu cuenta no está verificada</Text>
                        </div>
                        <Text className="text-sm mb-3">Para acceder a todas las funciones, verifica tu correo electrónico.</Text>
                        <Button size="sm" onClick={handleSendVerificationEmail} disabled={loading}>
                          {loading && <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-white"></span>}
                          <Mail className="mr-1 h-3 w-3" />
                          Enviar email de verificación
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Eliminar cuenta */}
                  <div>
                    <Text className="font-medium text-red-600 mb-2">Zona de peligro</Text>
                    <Text className="text-sm text-gray-500 mb-4">Eliminar tu cuenta es una acción permanente. Todos tus datos serán borrados y no podrán ser recuperados.</Text>

                    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          Eliminar mi cuenta
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>¿Estás seguro de que quieres eliminar tu cuenta?</DialogTitle>
                          <DialogDescription>
                            Esta acción no se puede deshacer. Se eliminarán permanentemente todos tus datos, incluyendo:
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                              <li>Todas tus cuentas financieras</li>
                              <li>Todos tus ingresos y gastos registrados</li>
                              <li>Toda tu información de perfil</li>
                              <li>Cualquier dato pendiente por sincronizar</li>
                            </ul>
                          </DialogDescription>
                        </DialogHeader>

                        {isEmailProvider && (
                          <div className="py-4">
                            <Text className="text-sm font-medium mb-2">Confirma tu contraseña para continuar:</Text>
                            <Input type="password" placeholder="Ingresa tu contraseña" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} />
                          </div>
                        )}

                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button variant="destructive" onClick={handleDeleteAccount} disabled={(isEmailProvider && !deletePassword) || deletingAccount}>
                            {deletingAccount ? (
                              <>
                                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></span>
                                Eliminando...
                              </>
                            ) : (
                              "Confirmar eliminación"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
