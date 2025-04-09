"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { useAuthStore } from "@bill/_store/useAuthStore";
import AccountManager from "@bill/_components/AccountManager";
import { getUserAccounts } from "@bill/_firebase/accountService";

export default function AccountsSection() {
  const { user } = useAuthStore();

  // Función para recargar cuentas
  const reloadAccounts = async () => {
    if (user?.uid) {
      await getUserAccounts(user.uid);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg">Cuentas</CardTitle>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <AccountManager userId={user?.uid || ""} onReloadAccounts={reloadAccounts} />
      </CardContent>
    </Card>
  );
}
