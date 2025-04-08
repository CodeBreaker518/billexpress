"use client";

import { useState, useCallback, useEffect } from "react";
import { PlusCircle, Pencil, Trash2, ChevronsUpDown, ArrowRightLeft, RefreshCw } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@bill/_components/ui/popover";
import { DrawerDialog } from "@bill/_components/ui/drawer-dialog";
import { Button } from "@bill/_components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@bill/_components/ui/command";
import { Input } from "@bill/_components/ui/input";
import { Label } from "@bill/_components/ui/label";
import { DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@bill/_components/ui/dialog";
import { Alert, AlertDescription } from "@bill/_components/ui/alert";
import { useToast } from "@bill/_components/ui/use-toast";
import { useAccountStore } from "@bill/_store/useAccountStore";
import { Account, addAccount, updateAccount, deleteAccount, transferBetweenAccounts } from "@bill/_firebase/accountService";

interface AccountManagerProps {
  userId: string;
  onReloadAccounts: () => Promise<void>;
  isLoading?: boolean;
}

export default function AccountManager({ userId, onReloadAccounts, isLoading }: AccountManagerProps) {
  const { accounts, activeAccountId, setActiveAccountId } = useAccountStore();
  const { toast } = useToast();

  // Efecto para actualizar las cuentas cuando cambian
  useEffect(() => {
    console.log("AccountManager: Cuentas cargadas:", accounts);
    if (accounts.length > 0 && !activeAccountId) {
      // Si hay cuentas pero no hay cuenta activa, activar la primera
      const defaultAccount = accounts.find((acc) => acc.isDefault) || accounts[0];
      setActiveAccountId(defaultAccount.id);
      console.log("Activando cuenta por defecto:", defaultAccount.name);
    }
  }, [accounts, activeAccountId, setActiveAccountId]);

  // Estados para diálogos
  const [isAccountFormOpen, setIsAccountFormOpen] = useState(false);
  const [isTransferFormOpen, setIsTransferFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<{
    id: string;
    name: string;
    hasOrphanedRecords: boolean;
    orphanedCount: number;
    orphanedIncomesCount: number;
    orphanedExpensesCount: number;
  } | null>(null);

  // Estados para formularios
  const [accountName, setAccountName] = useState("");
  const [accountColor, setAccountColor] = useState("#10b981");
  const [fromAccountId, setFromAccountId] = useState<string>("");
  const [toAccountId, setToAccountId] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<number>(0);

  // Estado para mostrar progreso
  const [recalculatingBalances, setRecalculatingBalances] = useState(false);

  // Colores predefinidos para cuentas
  const predefinedColors = [
    "#10b981", // Verde esmeralda
    "#3b82f6", // Azul
    "#f97316", // Naranja
    "#ef4444", // Rojo
    "#8b5cf6", // Violeta
    "#ec4899", // Rosa
    "#f59e0b", // Ámbar
    "#6366f1", // Índigo
    "#06b6d4", // Cian
    "#14b8a6", // Verde azulado
  ];

  // Formatear valor de moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  // Obtener la cuenta activa
  const activeAccount = accounts.find((account) => account.id === activeAccountId);

  // Seleccionar una cuenta
  const handleSelectAccount = useCallback(
    (accountId: string) => {
      setActiveAccountId(accountId);
      setAccountDropdownOpen(false);

      // Actualizar el fromAccountId para transferencias
      setFromAccountId(accountId);
    },
    [setActiveAccountId]
  );

  // Abrir formulario para nueva cuenta
  const handleNewAccount = useCallback(() => {
    setAccountName("");
    setAccountColor("#10b981");
    setEditingAccount(null);
    setIsAccountFormOpen(true);
  }, []);

  // Abrir formulario para editar cuenta
  const handleEditAccount = useCallback((account: Account) => {
    setAccountName(account.name);
    setAccountColor(account.color);
    setEditingAccount(account);
    setIsAccountFormOpen(true);
  }, []);

  // Confirmar eliminación de cuenta
  const handleConfirmDelete = useCallback(
    async (accountId: string) => {
      const account = accounts.find((acc) => acc.id === accountId);

      if (account?.isDefault) {
        toast({
          title: "No se puede eliminar",
          description: "No puedes eliminar la cuenta predeterminada",
          variant: "destructive",
        });
        return;
      }

      try {
        // Consultar si hay ingresos o gastos asociados a esta cuenta
        const { countOrphanedFinances } = await import("@bill/_firebase/financeService");

        const { orphanedCount, orphanedIncomesCount, orphanedExpensesCount } = await countOrphanedFinances(accountId);

        const hasOrphanedRecords = orphanedCount > 0;

        // Guardar esta información para mostrarla en el modal de confirmación
        setAccountToDelete({
          id: accountId,
          name: account?.name || "Cuenta",
          hasOrphanedRecords,
          orphanedCount,
          orphanedIncomesCount,
          orphanedExpensesCount,
        });

        setDeleteConfirmOpen(true);
      } catch (error) {
        console.error("Error al verificar registros asociados:", error);
        // Si hay un error, mostrar advertencia genérica
        setAccountToDelete({
          id: accountId,
          name: account?.name || "Cuenta",
          hasOrphanedRecords: true,
          orphanedCount: 0,
          orphanedIncomesCount: 0,
          orphanedExpensesCount: 0,
        });
        setDeleteConfirmOpen(true);
      }
    },
    [accounts, toast]
  );

  // Eliminar cuenta
  const handleDeleteAccount = useCallback(async () => {
    if (!accountToDelete?.id) return;

    try {
      const { deleteFinancesByAccountId } = await import("@bill/_firebase/financeService");

      // Eliminar todas las transacciones asociadas a la cuenta
      const { deletedIncomesCount, deletedExpensesCount } = await deleteFinancesByAccountId(accountToDelete.id);
      const totalDeleted = deletedIncomesCount + deletedExpensesCount;

      // Eliminar la cuenta
      await deleteAccount(accountToDelete.id);
      await onReloadAccounts();

      // Mensaje específico según si se eliminaron transacciones
      if (totalDeleted > 0) {
        toast({
          title: "Cuenta eliminada",
          description: `La cuenta ha sido eliminada junto con ${totalDeleted} transacciones asociadas (${deletedIncomesCount} ingresos y ${deletedExpensesCount} gastos).`,
          variant: "warning",
        });
      } else {
        toast({
          title: "Cuenta eliminada",
          description: "La cuenta ha sido eliminada correctamente.",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar la cuenta",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setAccountToDelete(null);
    }
  }, [accountToDelete, onReloadAccounts, toast]);

  // Guardar cuenta (nueva o editada)
  const handleSaveAccount = useCallback(async () => {
    if (!accountName) {
      toast({
        title: "Error",
        description: "El nombre de la cuenta es requerido",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingAccount) {
        // Actualizar cuenta existente
        await updateAccount({
          ...editingAccount,
          name: accountName,
          color: accountColor,
        });
      } else {
        // Crear nueva cuenta
        console.log("⚠️ Creando nueva cuenta con nombre:", accountName);
        const newAccount = await addAccount({
          name: accountName,
          color: accountColor,
          balance: 0,
          userId,
          isDefault: false,
        });

        // Actualizar el estado global inmediatamente sin esperar a la recarga
        const { accounts, setAccounts, setActiveAccountId } = useAccountStore.getState();
        const updatedAccounts = [...accounts, newAccount];
        console.log("✅ Cuenta creada:", newAccount);
        console.log("Añadiendo cuenta inmediatamente al estado:", newAccount);
        setAccounts(updatedAccounts);

        // Establecer la nueva cuenta como activa
        setActiveAccountId(newAccount.id);
      }

      // Recargar todas las cuentas para asegurar sincronización
      await onReloadAccounts();
      setIsAccountFormOpen(false);

      toast({
        title: editingAccount ? "Cuenta actualizada" : "Cuenta creada",
        description: editingAccount ? "La cuenta ha sido actualizada correctamente" : "La cuenta ha sido creada correctamente",
      });
    } catch (error) {
      console.error("❌ Error al guardar cuenta:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar la cuenta",
        variant: "destructive",
      });
    }
  }, [accountName, accountColor, editingAccount, userId, onReloadAccounts, toast]);

  // Abrir formulario de transferencia
  const handleOpenTransfer = useCallback(() => {
    setFromAccountId(activeAccountId || "");
    setToAccountId("");
    setTransferAmount(0);
    setIsTransferFormOpen(true);
  }, [activeAccountId]);

  // Validar transferencia
  const isTransferValid = () => {
    return fromAccountId && toAccountId && transferAmount > 0 && fromAccountId !== toAccountId;
  };

  // Realizar transferencia entre cuentas
  const handleTransfer = useCallback(async () => {
    if (!isTransferValid()) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos correctamente",
        variant: "destructive",
      });
      return;
    }

    try {
      await transferBetweenAccounts(fromAccountId, toAccountId, transferAmount, userId);

      await onReloadAccounts();
      setIsTransferFormOpen(false);

      toast({
        title: "Transferencia exitosa",
        description: `Se han transferido ${formatCurrency(transferAmount)} correctamente`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo realizar la transferencia",
        variant: "destructive",
      });
    }
  }, [fromAccountId, toAccountId, transferAmount, userId, onReloadAccounts, toast, formatCurrency]);

  // Función para recargar las cuentas con notificación
  const handleReloadAccounts = async () => {
    try {
      setRecalculatingBalances(true);

      // Importar la función de cálculo de saldos en tiempo real
      const { getAllAccountsBalances } = await import("@bill/_firebase/accountService");

      // Recargar las cuentas primero
      await onReloadAccounts();

      // Obtener las cuentas actualizadas del estado
      const currentAccounts = useAccountStore.getState().accounts;

      // Calcular los saldos reales de todas las cuentas
      const realBalances = await getAllAccountsBalances(currentAccounts, userId);

      // Verificar si hay discrepancias para informar al usuario
      let accountsWithDiscrepancies = 0;

      // Actualizar el estado con los saldos reales
      const updatedAccounts = currentAccounts.map((account) => {
        const realBalance = realBalances.get(account.id) || 0;

        // Si el saldo es diferente, contar la discrepancia
        if (Math.abs((account.balance || 0) - realBalance) > 0.001) {
          accountsWithDiscrepancies++;
        }

        // Retornar la cuenta con el saldo real
        return {
          ...account,
          balance: realBalance,
        };
      });

      // Actualizar el estado global con los saldos reales
      useAccountStore.getState().setAccounts(updatedAccounts);

      // Mostrar mensaje con detalles de la actualización
      if (accountsWithDiscrepancies > 0) {
        toast({
          title: "Saldos actualizados",
          description: `Se han recalculado los saldos de ${accountsWithDiscrepancies} cuentas basados en las transacciones reales.`,
          variant: "success",
        });
      } else {
        toast({
          title: "Saldos verificados",
          description: `Todos los saldos están correctos y reflejan las transacciones exactamente.`,
          variant: "success",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudieron actualizar los saldos",
        variant: "destructive",
      });
      console.error("Error al recalcular y actualizar cuentas:", err);
    } finally {
      setRecalculatingBalances(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="account-manager">
      {/* Selector de cuenta activa */}
      <Popover open={accountDropdownOpen} onOpenChange={setAccountDropdownOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={accountDropdownOpen} className="w-full justify-between" disabled={accounts.length === 0}>
            <div className="flex items-center gap-2 truncate">
              {activeAccount ? (
                <>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeAccount.color }}></div>
                  <span className="truncate">{activeAccount.name}</span>
                </>
              ) : (
                <span className="text-muted-foreground">Selecciona una cuenta</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 min-w-[200px]">
          <Command>
            <CommandInput placeholder="Buscar cuenta..." className="h-9" />
            <CommandList>
              <CommandEmpty>No se encontraron cuentas.</CommandEmpty>
              <CommandGroup>
                {accounts.map((account) => (
                  <CommandItem key={account.id} value={account.id} onSelect={() => handleSelectAccount(account.id)} className="flex items-center gap-2 cursor-pointer">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }}></div>
                    <span>{account.name}</span>
                    {account.isDefault && <span className="text-xs text-muted-foreground ml-auto">(Default)</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={handleNewAccount} data-testid="add-account-button">
          <PlusCircle className="h-4 w-4 mr-1" />
          Añadir
        </Button>
        {activeAccount && (
          <>
            <Button size="sm" variant="outline" onClick={() => handleEditAccount(activeAccount)} data-testid="edit-account-button">
              <Pencil className="h-4 w-4 mr-1" />
              Editar
            </Button>
            {!activeAccount.isDefault && (
              <Button size="sm" variant="outline" onClick={() => handleConfirmDelete(activeAccount.id)} className="text-destructive" data-testid="delete-account-button">
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleOpenTransfer} data-testid="transfer-account-button">
              <ArrowRightLeft className="h-4 w-4 mr-1" />
              Transferir
            </Button>
          </>
        )}
        {accounts.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setRecalculatingBalances(true);
              onReloadAccounts()
                .then(() => {
                  setRecalculatingBalances(false);
                  toast({
                    title: "Saldos actualizados",
                    description: "Los saldos de las cuentas han sido recalculados.",
                  });
                })
                .catch((error) => {
                  setRecalculatingBalances(false);
                  toast({
                    title: "Error",
                    description: "No se pudieron actualizar los saldos.",
                    variant: "destructive",
                  });
                });
            }}
            className="ml-auto"
            data-testid="recalculate-account-button">
            <RefreshCw className="h-4 w-4 mr-1" />
            Recalcular
          </Button>
        )}
      </div>

      {/* Saldo actual */}
      {activeAccount && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo disponible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(activeAccount.balance)}</div>
          </CardContent>
        </Card>
      )}

      {/* Modal para creación/edición de cuenta */}
      <DrawerDialog
        open={isAccountFormOpen}
        onOpenChange={(open) => {
          if (!open) setIsAccountFormOpen(false);
        }}
        title={editingAccount ? "Editar cuenta" : "Nueva cuenta"}>
        <DialogHeader>
          <DialogTitle>{editingAccount ? "Editar cuenta" : "Nueva cuenta"}</DialogTitle>
          <DialogDescription>{editingAccount ? "Modifica los detalles de la cuenta" : "Crea una nueva cuenta para organizar tus finanzas"}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la cuenta</Label>
            <Input id="name" placeholder="Ej. Efectivo, Tarjeta, etc." value={accountName} onChange={(e) => setAccountName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex flex-wrap items-center gap-3">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${accountColor === color ? "border-primary ring-2 ring-primary/20" : "border-gray-200"}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setAccountColor(color)}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: accountColor }} />
              <span className="text-sm">Color seleccionado</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsAccountFormOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSaveAccount}>
            Guardar
          </Button>
        </DialogFooter>
      </DrawerDialog>

      {/* Modal para transferencia entre cuentas */}
      <DrawerDialog
        open={isTransferFormOpen}
        onOpenChange={(open) => {
          if (!open) setIsTransferFormOpen(false);
        }}
        title="Transferir entre cuentas">
        <DialogHeader>
          <DialogTitle>Transferir entre cuentas</DialogTitle>
          <DialogDescription>Mueve dinero entre tus cuentas</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fromAccount">Desde</Label>
            <select
              id="fromAccount"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}>
              <option value="" disabled>
                Seleccionar cuenta origen
              </option>
              {accounts.map((account) => (
                <option key={`from-${account.id}`} value={account.id}>
                  {account.name} ({formatCurrency(account.balance)})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="toAccount">Hacia</Label>
            <select
              id="toAccount"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}>
              <option value="" disabled>
                Seleccionar cuenta destino
              </option>
              {accounts
                .filter((account) => account.id !== fromAccountId)
                .map((account) => (
                  <option key={`to-${account.id}`} value={account.id}>
                    {account.name} ({formatCurrency(account.balance)})
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              step="0.01"
              min="0.01"
              value={transferAmount || ""}
              onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsTransferFormOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleTransfer} disabled={!isTransferValid()}>
            Transferir
          </Button>
        </DialogFooter>
      </DrawerDialog>

      {/* Modal de confirmación para eliminar cuenta */}
      <DrawerDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirmOpen(false);
            setAccountToDelete(null);
          }
        }}
        title="Eliminar cuenta">
        <DialogHeader>
          <DialogTitle>¿Estás seguro?</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente la cuenta &ldquo;{accountToDelete?.name}&rdquo; y todas las transacciones asociadas.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="mt-4">
          <AlertDescription>
            {accountToDelete?.hasOrphanedRecords ? (
              <>
                <p className="font-medium mb-1">¡Atención! Se eliminarán también:</p>
                <ul className="list-disc list-inside pl-2 space-y-1">
                  {accountToDelete.orphanedIncomesCount > 0 && <li>{accountToDelete.orphanedIncomesCount} ingreso(s)</li>}
                  {accountToDelete.orphanedExpensesCount > 0 && <li>{accountToDelete.orphanedExpensesCount} gasto(s)</li>}
                </ul>
                <p className="mt-2">Todas estas transacciones serán eliminadas permanentemente junto con la cuenta.</p>
              </>
            ) : (
              "Si la cuenta tiene saldo, asegúrate de transferirlo a otra cuenta antes de eliminarla."
            )}
          </AlertDescription>
        </Alert>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDeleteAccount}>
            Eliminar
          </Button>
        </DialogFooter>
      </DrawerDialog>
    </div>
  );
}
