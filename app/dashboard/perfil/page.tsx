"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@bill/_store/useAuthStore";
import { updateUserProfile, sendVerificationEmail, uploadProfileImage, deleteUserAccount, reauthenticateUser, changeUserPassword } from "@bill/_firebase/authService";
import { User as UserIcon, Mail, Camera, Save, AlertCircle, CheckCircle2, Upload, Trash2, Moon, Sun, Monitor, LogOut, Info, Shield, AlertTriangle, User, Settings } from "lucide-react";
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
import UserProfileForm from "@bill/_components/profile/UserProfileForm";
import UserPreferences from "@bill/_components/profile/UserPreferences";
import { Avatar, AvatarFallback, AvatarImage } from "@bill/_components/ui/avatar";
import ProfileTabs from "@bill/_components/profile/ProfileTabs";

export default function PerfilPage() {
  const { user, logout } = useAuthStore();
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
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const { theme, setTheme } = useTheme();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [isClient, setIsClient] = useState(false);

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

  useEffect(() => {
    setIsClient(true);
  }, []);

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

    // Verificar que el usuario haya escrito "ELIMINAR"
    if (deleteConfirmation !== "ELIMINAR") {
      setError("Debes escribir ELIMINAR (en mayúsculas) para confirmar");
      return;
    }

    setDeletingAccount(true);
    setError("");

    try {
      // Enviar la contraseña solo para usuarios de correo/contraseña
      const isEmailProvider = user.providerData.length > 0 && user.providerData[0].providerId === "password";
      
      // Si es usuario de email/password, verificar que ingresó contraseña
      if (isEmailProvider && !deletePassword) {
        setError("Debes ingresar tu contraseña para eliminar la cuenta");
        setDeletingAccount(false);
        return;
      }

      // Eliminar todos los datos del usuario
      const result = await deleteUserAccount(user, isEmailProvider ? deletePassword : undefined);

      if (result.success) {
        toast({
          title: "Cuenta eliminada",
          description: "Tu cuenta y todos tus datos han sido eliminados permanentemente.",
          duration: 5000,
        });

        // Redirigir al inicio de sesión
        router.push("/auth/login");
      } else {
        // La propiedad error puede no existir, así que la manejamos condicionalmente
        setError('error' in result ? result.error : "Error al eliminar la cuenta");
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

  const handlePasswordChange = async () => {
    if (!user) return;

    // Validaciones
    if (!currentPassword) {
      setPasswordError("Debes ingresar tu contraseña actual");
      return;
    }

    if (!newPassword) {
      setPasswordError("Debes ingresar una nueva contraseña");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }

    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      const result = await changeUserPassword(user, currentPassword, newPassword);

      if (result.success) {
        setPasswordSuccess("Contraseña actualizada correctamente");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(result.error || "Error al cambiar la contraseña");
      }
    } catch (err: any) {
      setPasswordError(err.message || "Ocurrió un error inesperado");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading || accountsLoading) {
    return <ProfilePageSkeleton />;
  }

  if (!isClient) return null;

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isEmailProvider = user.providerData.length > 0 && user.providerData[0].providerId === "password";

  // Obtener iniciales del nombre de usuario para el avatar
  const getUserInitials = () => {
    if (!user.displayName) return "U";
    return user.displayName
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="container mx-auto py-6 space-y-6 sm:pb-0">
      {/* Header con información básica */}
      <div className="flex flex-col md:flex-row gap-4 items-center p-4 bg-card border rounded-lg mb-6">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.photoURL || ""} alt={user.displayName || "Usuario"} />
          <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1 text-center md:text-left">
          <h2 className="text-2xl font-bold">{user.displayName || "Usuario"}</h2>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
                        <Button
                          variant="outline"
          onClick={() => logout()}
          className="w-full md:w-auto"
        >
          Cerrar sesión
                          </Button>
      </div>

      {/* Tabs para diferentes secciones */}
      <ProfileTabs />
    </div>
  );
}
