'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@bill/_store/useAuthStore';
import { updateUserProfile, sendVerificationEmail, uploadProfileImage } from '@bill/_firebase/authService';
import { 
  Card, 
  Title, 
  Text, 
  TextInput, 
  Button,
  Divider,
  Badge,
  Grid
} from '@tremor/react';
import { 
  User,
  Mail,
  Camera,
  Save,
  AlertCircle,
  CheckCircle2,
  Upload,
  Trash2
} from 'lucide-react';

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
      <Title className="mb-4">Mi Perfil</Title>
      
      {error && (
        <Card className="mb-4 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
          <div className="flex items-center space-x-2">
            <AlertCircle className="text-red-500 dark:text-red-400" />
            <Text className="text-red-600 dark:text-red-400">{error}</Text>
          </div>
        </Card>
      )}
      
      {success && (
        <Card className="mb-4 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="text-green-500 dark:text-green-400" />
            <Text className="text-green-600 dark:text-green-400">{success}</Text>
          </div>
        </Card>
      )}
      
      {verificationEmailSent && (
        <Card className="mb-4 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <div className="flex items-center space-x-2">
            <Mail className="text-blue-500 dark:text-blue-400" />
            <Text className="text-blue-600 dark:text-blue-400">
              Email de verificación enviado. Por favor, revisa tu bandeja de entrada.
            </Text>
          </div>
        </Card>
      )}
      
      <Grid numItemsMd={2} className="gap-6">
        <Card>
          <Title className="mb-4">Información de la cuenta</Title>
          
          <div className="mb-6">
            <Text className="mb-2 font-medium">Correo electrónico</Text>
            <div className="flex items-center space-x-3">
              <div className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                {user.email}
              </div>
              {user.emailVerified ? (
                <Badge color="green" size="sm" icon={CheckCircle2}>
                  Verificado
                </Badge>
              ) : (
                <Button
                  size="xs"
                  variant="secondary"
                  color="blue"
                  icon={Mail}
                  loading={loading && verificationEmailSent === false}
                  onClick={handleSendVerificationEmail}
                >
                  Verificar email
                </Button>
              )}
            </div>
          </div>
          
          <div className="mb-6">
            <Text className="mb-2 font-medium">Nombre</Text>
            <TextInput
              placeholder="Tu nombre"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              icon={User}
            />
          </div>
          
          <div className="mb-6">
            <Text className="mb-2 font-medium">Foto de perfil</Text>
            
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={handleUploadClick}>
                {previewURL ? (
                  <div className="relative w-32 h-32 mb-4">
                    <Image
                      src={previewURL}
                      alt="Vista previa"
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                ) : photoURL ? (
                  <div className="relative w-32 h-32 mb-4">
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
                  <Camera className="w-12 h-12 text-gray-400 mb-2" />
                )}
                <Text>{selectedFile ? selectedFile.name : photoURL ? 'Haz clic para cambiar tu foto' : 'Haz clic para subir una imagen'}</Text>
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
              
              <div className="flex justify-center space-x-2">
                {(previewURL || photoURL) && (
                  <Button
                    size="xs"
                    variant="secondary"
                    color="gray"
                    onClick={handleUploadClick}
                    icon={Upload}
                  >
                    Cambiar imagen
                  </Button>
                )}
                
                {(previewURL || photoURL) && (
                  <Button
                    size="xs"
                    variant="secondary"
                    color="red"
                    onClick={handleRemoveImage}
                    icon={Trash2}
                  >
                    Eliminar imagen
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              icon={Save}
              loading={loading || uploading}
              onClick={handleUpdateProfile}
            >
              {uploading ? 'Subiendo imagen...' : 'Guardar cambios'}
            </Button>
          </div>
        </Card>
        
        <div>
          <Card>
            <Title className="mb-4">Vista previa del perfil</Title>
            <div className="flex flex-col items-center justify-center p-6">
              {/* Mostrar la imagen de vista previa, la foto actual o un avatar predeterminado */}
              {previewURL ? (
                <div className="relative w-32 h-32 mb-4">
                  <Image
                    src={previewURL}
                    alt="Vista previa"
                    fill
                    className="rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                  />
                </div>
              ) : photoURL ? (
                <div className="relative w-32 h-32 mb-4">
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
                <div className="w-32 h-32 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center mb-4">
                  <User size={64} />
                </div>
              )}
              <Text className="text-lg font-medium">{displayName || 'Sin nombre'}</Text>
              <Text className="text-gray-500 dark:text-gray-400">{user.email}</Text>
              
              {user.emailVerified ? (
                <Badge color="green" size="sm" icon={CheckCircle2} className="mt-2">
                  Email verificado
                </Badge>
              ) : (
                <Badge color="amber" size="sm" icon={AlertCircle} className="mt-2">
                  Email no verificado
                </Badge>
              )}
            </div>
          </Card>
          
          <Card className="mt-6">
            <Title className="mb-4">Información de seguridad</Title>
            <div className="space-y-4">
              <div>
                <Text className="font-medium">Último inicio de sesión</Text>
                <Text className="text-gray-500">
                  {user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'Desconocido'}
                </Text>
              </div>
              
              <div>
                <Text className="font-medium">Cuenta creada el</Text>
                <Text className="text-gray-500">
                  {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleString() : 'Desconocido'}
                </Text>
              </div>
              
              <div>
                <Text className="font-medium">Método de inicio de sesión</Text>
                <Text className="text-gray-500">
                  {user.providerData.length > 0 
                    ? user.providerData[0].providerId.replace('.com', '').replace('password', 'Email y contraseña') 
                    : 'Desconocido'}
                </Text>
              </div>
            </div>
          </Card>
        </div>
      </Grid>
    </div>
  );
} 