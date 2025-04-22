"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@bill/_store/useAuthStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { Button } from "@bill/_components/ui/button";
import { Input } from "@bill/_components/ui/input";
import { Label } from "@bill/_components/ui/label";
import { Separator } from "@bill/_components/ui/separator";
import { useToast } from "@bill/_components/ui/use-toast";
import { Shield, AlertTriangle, Lock } from "lucide-react";
import { changeUserPassword, deleteUserAccount, reauthenticateUser } from "@bill/_firebase/authService";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@bill/_components/ui/dialog";

export default function SecuritySettings() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Account deletion states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Check if user is using email/password provider
  const isEmailProvider = user?.providerData?.length > 0 && user?.providerData[0]?.providerId === "password";

  // Handle password change
  const handlePasswordChange = async () => {
    if (!user) return;
    
    // Reset states
    setPasswordError("");
    setPasswordSuccess("");
    
    // Validations
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

    try {
      const result = await changeUserPassword(user, currentPassword, newPassword);

      if (result.success) {
        setPasswordSuccess("Contraseña actualizada correctamente");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        toast({
          title: "Contraseña actualizada",
          description: "Tu contraseña ha sido cambiada exitosamente",
        });
      } else {
        setPasswordError(result.error || "Error al cambiar la contraseña");
      }
    } catch (err: any) {
      setPasswordError(err.message || "Ocurrió un error inesperado");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!user) return;

    // Reset state
    setDeleteError("");

    // Verify confirmation text
    if (deleteConfirmation !== "ELIMINAR") {
      setDeleteError("Debes escribir ELIMINAR para confirmar");
      return;
    }

    // Start deleting process
    setDeletingAccount(true);

    try {
      // Send password only for email/password users
      const password = isEmailProvider ? deletePassword : undefined;
      
      // Validate password is provided for email users
      if (isEmailProvider && !password) {
        setDeleteError("Debes ingresar tu contraseña para eliminar la cuenta");
        setDeletingAccount(false);
        return;
      }

      // Delete the account
      const result = await deleteUserAccount(user, password);

      if (result.success) {
        toast({
          title: "Cuenta eliminada",
          description: "Tu cuenta y todos tus datos han sido eliminados permanentemente",
          duration: 5000,
        });

        // Redirect to login page
        router.push("/auth/login");
      } else {
        setDeleteError('error' in result ? result.error : "Error al eliminar la cuenta");
      }
    } catch (err: any) {
      setDeleteError(err.message || "Ocurrió un error inesperado");
    } finally {
      setDeletingAccount(false);
      setDeleteDialogOpen(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-h-[80vh]  scrollbar scrollbar-thumb-rounded scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-700 dark:scrollbar-track-gray-900">
      {isEmailProvider && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Cambiar Contraseña
            </CardTitle>
            <CardDescription>
              Actualiza tu contraseña para mantener tu cuenta segura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {passwordError && (
              <div className="p-3 bg-red-100 text-red-800 rounded-md text-sm flex items-center gap-2 dark:bg-red-900/20 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
                <span>{passwordError}</span>
              </div>
            )}
            
            {passwordSuccess && (
              <div className="p-3 bg-green-100 text-green-800 rounded-md text-sm dark:bg-green-900/20 dark:text-green-400">
                {passwordSuccess}
              </div>
            )}

            <div>
              <Label htmlFor="currentPassword">Contraseña actual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2"
              />
            </div>
            
            <Button 
              onClick={handlePasswordChange} 
              disabled={passwordLoading}
              className="mt-2"
            >
              {passwordLoading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></span>}
              Cambiar contraseña
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-500 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Eliminar Cuenta
          </CardTitle>
          <CardDescription>
            Eliminar tu cuenta es una acción permanente que no se puede deshacer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">
            Al eliminar tu cuenta, se borrarán permanentemente todos tus datos, incluidos perfiles, cuentas financieras, transacciones, recordatorios y preferencias.
          </p>
          
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                Eliminar mi cuenta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>¿Estás seguro de que quieres eliminar tu cuenta?</DialogTitle>
                <DialogDescription>
                  Esta acción no se puede deshacer. Todos tus datos serán eliminados permanentemente.
                </DialogDescription>
              </DialogHeader>
              
              {deleteError && (
                <div className="p-3 bg-red-100 text-red-800 rounded-md text-sm flex items-center gap-2 dark:bg-red-900/20 dark:text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{deleteError}</span>
                </div>
              )}
              
              {isEmailProvider && (
                <div className="space-y-2">
                  <Label htmlFor="deletePassword">Tu contraseña</Label>
                  <Input
                    id="deletePassword"
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Ingresa tu contraseña para confirmar"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="deleteConfirmation">
                  Escribe <span className="font-bold">ELIMINAR</span> para confirmar
                </Label>
                <Input
                  id="deleteConfirmation"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="ELIMINAR"
                />
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={deletingAccount}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                >
                  {deletingAccount && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></span>}
                  Eliminar permanentemente
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
} 