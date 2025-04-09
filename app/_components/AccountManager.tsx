"use client";

import { useState, useCallback, useEffect } from "react";
import { PlusCircle, Pencil, Trash2, ChevronsUpDown, ArrowRightLeft, RefreshCcw } from "lucide-react";
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
import { Account, addAccount, updateAccount, deleteAccount, transferBetweenAccounts, getUserAccounts } from "@bill/_firebase/accountService";

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
    if (accounts.length > 0 && !activeAccountId) {
      // Si hay cuentas pero no hay cuenta activa, activar la primera
      const defaultAccount = accounts.find((acc) => acc.isDefault) || accounts[0];
      setActiveAccountId(defaultAccount.id);
    }
  }, [accounts, activeAccountId, setActiveAccountId]);

  // Efecto para forzar la actualización de los saldos mostrados
  useEffect(() => {
    // Esta función se ejecutará cuando cambie isLoading de true a false
    // indicando que el proceso de carga/actualización ha terminado
    if (isLoading === false) {
    }
  }, [isLoading, accounts]);

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
  const [isResetBalanceOpen, setIsResetBalanceOpen] = useState(false);

  // Estados para formularios
  const [accountName, setAccountName] = useState("");
  const [accountColor, setAccountColor] = useState("#10b981");
  const [fromAccountId, setFromAccountId] = useState<string>("");
  const [toAccountId, setToAccountId] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<number>(0);

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
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  }, []);

  // Obtener la cuenta activa
  const activeAccount = accounts.find((account) => account.id === activeAccountId);

  // Función mejorada para recargar cuentas sin sobrescribir datos de transferencias
  const reloadAccountsWithRecalculation = useCallback(async () => {
    try {
      if (userId) {
        // Paso 1: Obtener las cuentas más recientes directamente desde Firebase
        // SIN recalcular los saldos
        const freshAccounts = await getUserAccounts(userId);

        // Verificar que no haya cuentas duplicadas por ID
        const uniqueAccounts = Array.from(new Map(freshAccounts.map((account) => [account.id, account]))).map((entry) => entry[1]);

        // Si se encontraron duplicados, registrar un mensaje de advertencia
        if (uniqueAccounts.length < freshAccounts.length) {
          console.warn("Se detectaron y eliminaron cuentas duplicadas", {
            original: freshAccounts.length,
            unique: uniqueAccounts.length,
          });
        }

        // Actualizar el estado global con estas cuentas recién obtenidas (sin duplicados)
        useAccountStore.getState().setAccounts(uniqueAccounts);
      }

      // Paso final: Avisar al componente padre que se ha completado la recarga
      await onReloadAccounts();
    } catch (error) {
      throw error; // Re-lanzar el error para manejo en niveles superiores
    }
  }, [userId, onReloadAccounts]);

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
        console.error("Error al verificar registros asociados a la cuenta:", error);
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

      // Recargar cuentas con recálculo automático de saldos
      await reloadAccountsWithRecalculation();

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
          variant: "success",
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
  }, [accountToDelete, reloadAccountsWithRecalculation, toast]);

  // Guardar cuenta (nueva o editada)
  const handleSaveAccount = useCallback(async () => {
    if (!accountName) {
      toast({
        title: "Error",
        description: "El nombre de la cuenta es requerido",
        variant: "warning",
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
        await addAccount({
          name: accountName,
          color: accountColor,
          balance: 0,
          userId,
          isDefault: false,
        });

        // Ya no actualizamos manualmente el estado para evitar duplicados
        // Dejamos que la recarga de datos lo haga correctamente
      }

      // Recargar todas las cuentas con recálculo para asegurar sincronización
      await reloadAccountsWithRecalculation();

      // Establecer la nueva cuenta como activa (si corresponde)
      if (!editingAccount) {
        // Buscar la cuenta recién creada por su nombre (ya que aún no tenemos su ID)
        const { accounts, setActiveAccountId } = useAccountStore.getState();
        const newAccount = accounts.find((acc) => acc.name === accountName && !acc.isDefault);
        if (newAccount) {
          setActiveAccountId(newAccount.id);
        }
      }

      setIsAccountFormOpen(false);

      toast({
        title: editingAccount ? "Cuenta actualizada" : "Cuenta creada",
        description: editingAccount ? "La cuenta ha sido actualizada correctamente" : "La cuenta ha sido creada correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar la cuenta",
        variant: "destructive",
      });
    }
  }, [accountName, accountColor, editingAccount, userId, reloadAccountsWithRecalculation, toast]);

  // Abrir formulario de transferencia
  const handleOpenTransfer = useCallback(() => {
    setFromAccountId(activeAccountId || "");
    setToAccountId("");
    setTransferAmount(0);
    setIsTransferFormOpen(true);
  }, [activeAccountId]);

  // Validar transferencia
  const isTransferValid = useCallback(() => {
    return fromAccountId && toAccountId && transferAmount > 0 && fromAccountId !== toAccountId;
  }, [fromAccountId, toAccountId, transferAmount]);

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
      // Mostrar notificación de procesamiento
      toast({
        title: "Procesando transferencia",
        description: "Estamos realizando la transferencia entre tus cuentas...",
        variant: "default",
      });

      // Paso 1: Realizar la transferencia entre cuentas
      await transferBetweenAccounts(fromAccountId, toAccountId, transferAmount, userId);

      // Paso 2: Cerrar el modal de transferencia
      setIsTransferFormOpen(false);

      // Paso 3: Pequeño retraso para asegurar que Firebase ha completado la transacción
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Paso 4: Utilizar nuestra función mejorada de recarga de cuentas
      // que ya maneja la eliminación de duplicados
      await reloadAccountsWithRecalculation();

      // Mostrar mensaje de éxito
      toast({
        title: "Transferencia exitosa",
        description: `Se han transferido ${formatCurrency(transferAmount)} correctamente`,
        variant: "success",
      });
    } catch (error) {
      // Mostrar mensaje de error específico
      toast({
        title: "Error en la transferencia",
        description: error instanceof Error ? error.message : "No se pudo realizar la transferencia, inténtalo de nuevo",
        variant: "destructive",
      });

      // Intentar recargar las cuentas para tener información actualizada
      try {
        // Usar nuestra función mejorada en caso de error también
        await reloadAccountsWithRecalculation();
      } catch (reloadError) {
        console.error("Error al recargar datos después de un fallo en la transferencia:", reloadError);
      }
    }
  }, [fromAccountId, toAccountId, transferAmount, userId, reloadAccountsWithRecalculation, toast, formatCurrency, isTransferValid]);

  // Función para reiniciar el saldo de la cuenta Efectivo
  const handleResetDefaultAccountBalance = useCallback(async () => {
    try {
      // Buscar la cuenta predeterminada (Efectivo)
      const defaultAccount = accounts.find((acc) => acc.isDefault);

      if (!defaultAccount) {
        toast({
          title: "Error",
          description: "No se encontró la cuenta predeterminada",
          variant: "destructive",
        });
        return;
      }

      // Reiniciar el saldo a cero directamente en Firebase
      const { doc, updateDoc, serverTimestamp } = await import("firebase/firestore");
      const { db } = await import("@bill/_firebase/config");
      const accountRef = doc(db, "accounts", defaultAccount.id);
      await updateDoc(accountRef, {
        balance: 0,
        updatedAt: serverTimestamp(),
      });

      // Actualizar el estado local
      useAccountStore.getState().updateAccount({
        ...defaultAccount,
        balance: 0,
      });

      // Notificar al usuario
      toast({
        title: "Saldo reiniciado",
        description: "El saldo de la cuenta Efectivo ha sido reiniciado a cero",
        variant: "default",
      });

      // Cerrar el diálogo y recargar datos
      setIsResetBalanceOpen(false);
      await onReloadAccounts();
    } catch (error) {
      console.error("Error al reiniciar saldo:", error);
      toast({
        title: "Error",
        description: "No se pudo reiniciar el saldo de la cuenta",
        variant: "destructive",
      });
    }
  }, [accounts, toast, onReloadAccounts]);

  return (
    <div className="space-y-4" data-testid="account-manager">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Mis cuentas</h2>
      </div>
      {/* Selector de cuenta activa */}

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={handleNewAccount} data-testid="add-account-button">
          <PlusCircle className="h-4 w-4 mr-1" />
          Añadir
        </Button>
        {activeAccount && (
          <>
            {!activeAccount.isDefault && (
              <Button size="sm" variant="outline" onClick={() => handleEditAccount(activeAccount)} data-testid="edit-account-button">
                <Pencil className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleOpenTransfer} data-testid="transfer-account-button">
              <ArrowRightLeft className="h-4 w-4 mr-1" />
              Transferir
            </Button>
            {!activeAccount.isDefault && (
              <Button size="sm" variant="outline" onClick={() => handleConfirmDelete(activeAccount.id)} className="text-destructive" data-testid="delete-account-button">
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            )}
          </>
        )}
      </div>

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

      {/* Diálogo de confirmación para reiniciar saldo */}
      <DrawerDialog
        open={isResetBalanceOpen}
        onOpenChange={setIsResetBalanceOpen}
        title="Reiniciar saldo de Efectivo"
        description={
          <div className="space-y-2">
            <p className="text-destructive font-medium">⚠️ Operación de emergencia</p>
            <p>Esta acción reiniciará el saldo de la cuenta &ldquo;Efectivo&rdquo; a cero.</p>
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>
                Solo usa esta función cuando detectes inconsistencias graves en el saldo. Esta acción no afecta tus registros de ingresos y gastos, solo reinicia el balance a cero.
              </AlertDescription>
            </Alert>
          </div>
        }>
        <div className="flex flex-col space-y-4 mt-4">
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsResetBalanceOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleResetDefaultAccountBalance}>
              Reiniciar a cero
            </Button>
          </div>
        </div>
      </DrawerDialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
        {/* Usar un Set con los IDs para asegurarse de que no haya duplicados */}
        {(() => {
          // Crear un mapa para eliminar duplicados por ID
          const uniqueAccountsMap = new Map();
          accounts.forEach((account) => uniqueAccountsMap.set(account.id, account));

          // Convertir el mapa a array de cuentas únicas
          const uniqueAccounts = Array.from(uniqueAccountsMap.values());

          // Renderizar las cuentas únicas
          return uniqueAccounts.map((account) => (
            <Card
              key={account.id}
              className={`group ${
                activeAccountId === account.id ? "ring-2 ring-primary ring-offset-1" : "hover:border-primary/50"
              } transition-all duration-200 shadow-soft cursor-pointer relative overflow-hidden`}
              onClick={() => handleSelectAccount(account.id)}>
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }} />
                    <h3 className="font-medium text-sm">{account.name}</h3>
                    {account.isDefault && <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Predeterminada</span>}
                  </div>
                  <div className="flex items-center space-x-1">
                    {account.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsResetBalanceOpen(true);
                        }}
                        title="Reiniciar saldo (Solo para Efectivo)">
                        <RefreshCcw className="h-3.5 w-3.5 text-amber-500" />
                      </Button>
                    )}

                    {!account.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAccount(account);
                        }}
                        title="Editar cuenta">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    {!account.isDefault && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmDelete(account.id);
                        }}
                        title="Eliminar cuenta">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="text-xl font-semibold">{formatCurrency(account.balance)}</div>
              </CardContent>
            </Card>
          ));
        })()}
      </div>
    </div>
  );
}
