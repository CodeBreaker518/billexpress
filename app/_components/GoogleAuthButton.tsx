'use client';

import { FcGoogle } from 'react-icons/fc';
import { Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface GoogleAuthButtonProps {
  onClick: () => void;
  loading?: boolean;
  label?: string;
}

export default function GoogleAuthButton({ 
  onClick, 
  loading = false, 
  label = 'Continuar con Google' 
}: GoogleAuthButtonProps) {
  return (
    <Button
      variant="outline"
      className="w-full relative py-6"
      disabled={loading}
      onClick={onClick}
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Conectando...
        </>
      ) : (
        <>
          <div className="absolute left-4">
            <FcGoogle className="h-5 w-5" />
          </div>
          {label}
        </>
      )}
    </Button>
  );
} 