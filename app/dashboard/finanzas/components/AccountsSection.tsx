"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { Badge } from "@bill/_components/ui/badge";
import { useAuthStore } from "@bill/_store/useAuthStore";
import AccountManager from "@bill/_components/AccountManager";
import { getUserAccounts } from "@bill/_firebase/accountService";
import { Info, Wallet } from "lucide-react";
import { useAccountStore } from "@bill/_store/useAccountStore";
import { Text } from "@bill/_components/ui/typography";

export default function AccountsSection() {
  const { user } = useAuthStore();
  const { accounts } = useAccountStore();

  // Función para recargar cuentas
  const reloadAccounts = async () => {
    if (user?.uid) {
      await getUserAccounts(user.uid);
    }
  };

  return (
    <Card className="">
      <CardHeader className="px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">Mis Cuentas</CardTitle>
          </div>
          <Badge 
            variant="secondary" 
            className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors px-3 py-1 rounded-full font-medium select-none"
          >
            {accounts.length} {accounts.length === 1 ? 'cuenta' : 'cuentas'}
          </Badge>
        </div>
        <CardDescription className="text-sm text-muted-foreground mt-1">
          Gestiona tus cuentas bancarias y tarjetas
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {accounts.length > 0 ? (
          <AccountManager userId={user?.uid || ""} onReloadAccounts={reloadAccounts} />
        ) : (
          <div className="flex flex-col items-center justify-center h-40 py-6 text-center">
            <Wallet className="w-12 h-12 text-muted-foreground mb-2 opacity-50" />
            <Text className="text-sm text-muted-foreground">No tienes cuentas registradas</Text>
            <Text className="text-xs text-muted-foreground mt-1">Agrega tu primera cuenta para comenzar</Text>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
