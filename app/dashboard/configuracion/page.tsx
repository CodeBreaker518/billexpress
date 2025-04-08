'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@bill/_store/useAuthStore';
import { updateUserProfile, sendVerificationEmail, uploadProfileImage } from '@bill/_firebase/authService';
import { 
  User,
  Mail,
  Camera,
  Save,
  AlertCircle,
  CheckCircle2,
  Upload,
  Trash2,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from "@bill/_components/ui/use-toast";

// Importaciones de componentes shadcn/ui
import { Button } from "@bill/_components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@bill/_components/ui/card";
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@bill/_components/ui/tab-group";
import { List, ListItem } from "@bill/_components/ui/list";
import { Text, Title } from "@bill/_components/ui/typography";
import { Separator } from "@bill/_components/ui/separator";
import { Flex } from "@bill/_components/ui/flex";
import { Grid } from "@bill/_components/ui/grid";
import { Badge } from "@bill/_components/ui/badge";
import { Input } from "@bill/_components/ui/input";

export default function PerfilPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
      
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
      if (!file.type.startsWith('image/')) {
        setError('El archivo seleccionado no es una imagen');
        return;
      }
      
      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('La imagen no debe superar los 2MB');
        return;
      }
      
      setSelectedFile(file);
      setPreviewURL(URL.createObjectURL(file));
      setError('');
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
    setPhotoURL('');
  };
  
  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      let finalPhotoURL = photoURL;
      
      // Si hay un archivo seleccionado, subirlo
      if (selectedFile) {
        setUploading(true);
        const uploadResult = await uploadProfileImage(user, selectedFile);
        setUploading(false);
        
        if (!uploadResult.success) {
          setError(uploadResult.error || 'Error al subir la imagen');
          setLoading(false);
          return;
        }
        
        // Usar la URL de la imagen subida
        finalPhotoURL = uploadResult.url as string;
      } else if (previewURL === null && photoURL === '') {
        // Si se eliminó la imagen
        finalPhotoURL = '';
      }
      
      // Actualizar el perfil
      const result = await updateUserProfile(user, {
        displayName: displayName || undefined,
        photoURL: finalPhotoURL || undefined
      });
      
      if (result.success) {
        setSuccess('Perfil actualizado correctamente');
        
        // Si se subió una imagen, actualizar el estado
        if (selectedFile) {
          setPhotoURL(finalPhotoURL);
        }
        
        // Recargar la página para reflejar los cambios inmediatamente
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setError(result.error || 'Error al actualizar perfil');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendVerificationEmail = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    setVerificationEmailSent(false);
    
    try {
      const result = await sendVerificationEmail(user);
      
      if (result.success) {
        setVerificationEmailSent(true);
      } else {
        setError(result.error || 'Error al enviar email de verificación');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };
  
  if (!user) {
    return <Text>Cargando...</Text>;
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Mi Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Administra tu información personal y preferencias de la aplicación
        </p>
      </div>
      
      {error && (
        <Card className="mb-4 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="text-red-500 dark:text-red-400" />
              <Text className="text-red-600 dark:text-red-400">{error}</Text>
            </div>
          </CardContent>
        </Card>
      )}
      
      {success && (
        <Card className="mb-4 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="text-green-500 dark:text-green-400" />
              <Text className="text-green-600 dark:text-green-400">{success}</Text>
            </div>
          </CardContent>
        </Card>
      )}
      
      {verificationEmailSent && (
        <Card className="mb-4 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mail className="text-blue-500 dark:text-blue-400" />
              <Text className="text-blue-600 dark:text-blue-400">
                Email de verificación enviado. Por favor, revisa tu bandeja de entrada.
              </Text>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <Title className="text-xl mb-4">Información de la cuenta</Title>
            
            <div className="mb-6">
              <Text className="mb-2 font-medium">Correo electrónico</Text>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-sm overflow-x-auto">
                  {user.email}
                </div>
                {user.emailVerified ? (
                  <Badge className="bg-green-100 text-green-800 flex items-center gap-1 whitespace-nowrap">
                    <CheckCircle2 className="h-3 w-3" />
                    Verificado
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSendVerificationEmail}
                    disabled={loading && verificationEmailSent === false}
                    className="text-blue-600 whitespace-nowrap"
                  >
                    {loading && verificationEmailSent === false && (
                      <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-white"></span>
                    )}
                    <Mail className="mr-1 h-3 w-3" />
                    Verificar email
                  </Button>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <Text className="mb-2 font-medium">Nombre</Text>
              <Input
                placeholder="Tu nombre"
                value={displayName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="mb-6">
              <Text className="mb-2 font-medium">Foto de perfil</Text>
              
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={handleUploadClick}>
                  {previewURL ? (
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-4">
                      <Image
                        src={previewURL}
                        alt="Vista previa"
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                  ) : photoURL ? (
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-4">
                      <Image
                        src={photoURL}
                        alt="Foto de perfil actual"
                        fill
                        className="rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                  ) : (
                    <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mb-2" />
                  )}
                  <Text className="text-sm text-center">{selectedFile ? selectedFile.name : photoURL ? 'Haz clic para cambiar tu foto' : 'Haz clic para subir una imagen'}</Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    JPG, PNG. Máximo 2MB
                  </Text>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                
                <div className="flex flex-wrap justify-center gap-2">
                  {(previewURL || photoURL) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleUploadClick}
                      className="text-gray-600"
                    >
                      <Upload className="mr-1 h-3 w-3" />
                      Cambiar
                    </Button>
                  )}
                  
                  {(previewURL || photoURL) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRemoveImage}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={handleUpdateProfile}
                disabled={loading || uploading}
                className="flex items-center gap-2"
              >
                {(loading || uploading) && (
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></span>
                )}
                <Save className="h-4 w-4" />
                {uploading ? 'Subiendo...' : 'Guardar'}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 sm:p-6">
            <Title className="text-xl mb-4">Vista previa del perfil</Title>
            <div className="flex flex-col items-center justify-center p-4">
              {/* Mostrar la imagen de vista previa, la foto actual o un avatar predeterminado */}
              {previewURL ? (
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-4">
                  <Image
                    src={previewURL}
                    alt="Vista previa"
                    fill
                    className="rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                  />
                </div>
              ) : photoURL ? (
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-4">
                  <Image
                    src={photoURL}
                    alt="Foto de perfil"
                    fill
                    className="rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'%3E%3C/path%3E%3Ccircle cx='12' cy='7' r='4'%3E%3C/circle%3E%3C/svg%3E";
                    }}
                  />
                </div>
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center mb-4">
                  <User className="w-12 h-12 sm:w-16 sm:h-16" />
                </div>
              )}
              <Text className="text-base sm:text-lg font-medium text-center">{displayName || 'Sin nombre'}</Text>
              <Text className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center break-all">{user.email}</Text>
              
              {user.emailVerified ? (
                <Badge className="mt-2 bg-green-100 text-green-800 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Email verificado
                </Badge>
              ) : (
                <Badge className="mt-2 bg-amber-100 text-amber-800 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Email no verificado
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 sm:p-6">
            <Title className="text-xl mb-4">Información de seguridad</Title>
            <div className="space-y-4">
              <div>
                <Text className="font-medium">Último inicio de sesión</Text>
                <Text className="text-xs sm:text-sm text-gray-500">
                  {user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'Desconocido'}
                </Text>
              </div>
              
              <div>
                <Text className="font-medium">Cuenta creada el</Text>
                <Text className="text-xs sm:text-sm text-gray-500">
                  {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleString() : 'Desconocido'}
                </Text>
              </div>
              
              <div>
                <Text className="font-medium">Método de inicio de sesión</Text>
                <Text className="text-xs sm:text-sm text-gray-500">
                  {user.providerData.length > 0 
                    ? user.providerData[0].providerId.replace('.com', '').replace('password', 'Email y contraseña') 
                    : 'Desconocido'}
                </Text>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 