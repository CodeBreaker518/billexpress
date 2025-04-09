"use client";

import { FcGoogle } from "react-icons/fc";
import { Button } from "./ui/button";
import { Skeleton } from "@bill/_components/ui/skeleton";

interface GoogleAuthButtonProps {
  onClick: () => void;
  loading?: boolean;
  label?: string;
}

export default function GoogleAuthButton({ onClick, loading = false, label = "Continuar con Google" }: GoogleAuthButtonProps) {
  return (
    <Button variant="outline" className="w-full relative py-6" disabled={loading} onClick={onClick}>
      <div className="absolute left-4">
        <FcGoogle className="h-5 w-5" />
      </div>
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
          <span>Conectando</span>
        </div>
      ) : (
        label
      )}
    </Button>
  );
}
