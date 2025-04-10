"use client";

import { useState, useCallback, useEffect } from "react";
import { PlusCircle, Pencil, Trash2, ArrowRightLeft, RefreshCcw } from "lucide-react";
import { DrawerDialog } from "@bill/_components/ui/drawer-dialog";
import { Button } from "@bill/_components/ui/button";
import { Card, CardContent } from "@bill/_components/ui/card";
import { Input } from "@bill/_components/ui/input";
import { Label } from "@bill/_components/ui/label";
import { DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@bill/_components/ui/dialog";
import { Alert, AlertDescription } from "@bill/_components/ui/alert";
import { useToast } from "@bill/_components/ui/use-toast";
import { useAccountStore } from "@bill/_store/useAccountStore";
import { Account, addAccount, updateAccount, deleteAccount, transferBetweenAccounts, getUserAccounts } from "@bill/_firebase/accountService";
import { Separator } from "@bill/_components/ui/separator";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface AccountManagerProps {
  userId: string;
  onReloadAccounts: () => Promise<void>;
  isLoading?: boolean;
}

export default function AccountManager({ userId, onReloadAccounts, isLoading }: AccountManagerProps) {
  const { accounts, activeAccountId, setActiveAccountId } = useAccountStore();
  const { toast } = useToast();

  // Estado para controlar la visualización de todas las cuentas
  const [showAllAccounts, setShowAllAccounts] = useState(false);

  // Estado para mantener el orden personalizado de las cuentas
  const [accountOrder, setAccountOrder] = useState<string[]>([]);

  // Estado para controlar si ya se ha cargado el orden desde localStorage
  const [orderLoaded, setOrderLoaded] = useState(false);

  // Clave para almacenar el orden en localStorage
  const ACCOUNT_ORDER_KEY = `account-order-${userId}`;

  // Efecto para cargar el orden personalizado desde localStorage (solo una vez al inicio)
  useEffect(() => {
    if (typeof window === "undefined" || !userId) return;

    try {
      const savedOrder = localStorage.getItem(ACCOUNT_ORDER_KEY);
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        setAccountOrder(parsedOrder);
      }
      setOrderLoaded(true);
    } catch (error) {
      console.error("Error al cargar el orden de cuentas:", error);
      setOrderLoaded(true);
    }
  }, [userId, ACCOUNT_ORDER_KEY]); // Solo se ejecuta cuando cambia el userId

  // Efecto para actualizar la cuenta activa
  useEffect(() => {
    if (accounts.length > 0 && !activeAccountId) {
      // Si hay cuentas pero no hay cuenta activa, activar la primera
      const defaultAccount = accounts.find((acc) => acc.isDefault) || accounts[0];
      setActiveAccountId(defaultAccount.id);
    }
  }, [accounts, activeAccountId, setActiveAccountId]);

  // Efecto para sincronizar accountOrder con las cuentas actuales (solo cuando cambian las cuentas)
  useEffect(() => {
    // Solo ejecutar esto si tenemos cuentas y ya se ha intentado cargar el orden desde localStorage
    if (!accounts.length || !orderLoaded) return;

    // Crear un mapa para eliminar duplicados por ID y acceso rápido
    const accountsMap = new Map(accounts.map((account) => [account.id, account]));

    // Obtener la cuenta predeterminada (si existe)
    const defaultAccount = accounts.find((acc) => acc.isDefault);
    const defaultAccountId = defaultAccount?.id;

    // Filtrar el orden guardado para mantener solo IDs de cuentas existentes
    const filteredOrder = accountOrder.filter((id) => accountsMap.has(id));

    // Determinar qué cuentas no están en el orden actual
    const missingAccountIds = accounts.filter((account) => !filteredOrder.includes(account.id)).map((account) => account.id);

    // Si no hay nada guardado o todas las cuentas son nuevas
    if (!filteredOrder.length) {
      // Crear un orden inicial con la cuenta predeterminada primero
      const initialOrder = [...accounts]
        .sort((a, b) => {
          if (a.isDefault) return -1;
          if (b.isDefault) return 1;
          return 0;
        })
        .map((acc) => acc.id);

      setAccountOrder(initialOrder);
      return;
    }

    // Si existen cuentas que no están en el orden, agregarlas
    if (missingAccountIds.length) {
      const newOrder = [...filteredOrder, ...missingAccountIds];

      // Garantizar que la cuenta predeterminada siempre esté primera
      if (defaultAccountId) {
        const defaultIndex = newOrder.indexOf(defaultAccountId);

        // Si la cuenta predeterminada existe y no está en primera posición
        if (defaultIndex > 0) {
          newOrder.splice(defaultIndex, 1); // Quitar de su posición actual
          newOrder.unshift(defaultAccountId); // Poner al inicio
        }
      }

      setAccountOrder(newOrder);
      return;
    }

    // Si el orden filtrado es diferente del actual (debido a cuentas eliminadas)
    if (filteredOrder.length !== accountOrder.length) {
      setAccountOrder(filteredOrder);
    }
  }, [accounts, orderLoaded, accountOrder]);

  // Efecto para guardar el orden en localStorage cuando cambia
  useEffect(() => {
    // Solo guardar si ya cargamos el orden inicial y tenemos cuentas
    if (typeof window === "undefined" || !userId || !orderLoaded || !accountOrder.length) return;

    try {
      localStorage.setItem(ACCOUNT_ORDER_KEY, JSON.stringify(accountOrder));
    } catch (error) {
      console.error("Error al guardar el orden de cuentas:", error);
    }
  }, [accountOrder, userId, ACCOUNT_ORDER_KEY, orderLoaded]);

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
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<{
    id: string;
    name: string;
    hasOrphanedRecords: boolean;
    orphanedCount: number;
    orphanedIncomesCount: number;
    orphanedExpensesCount: number;
    isDuplicateDefault?: boolean;
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
        const uniqueAccountsMap = new Map(freshAccounts.map((account) => [account.id, account]));

        // Si se encontraron duplicados, registrar un mensaje de advertencia
        if (uniqueAccountsMap.size < freshAccounts.length) {
          console.warn("Se detectaron y eliminaron cuentas duplicadas", {
            original: freshAccounts.length,
            unique: uniqueAccountsMap.size,
          });
        }

        // Actualizar el estado global con estas cuentas recién obtenidas (sin duplicados)
        useAccountStore.getState().setAccounts(Array.from(uniqueAccountsMap.values()));
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
      // Usar setTimeout para asegurar que no estamos actualizando durante el renderizado
      setTimeout(() => {
        setActiveAccountId(accountId);
        // Actualizar el fromAccountId para transferencias
        setFromAccountId(accountId);
      }, 0);
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
      // Verificar que la cuenta exista
      const account = accounts.find((acc) => acc.id === accountId);
      if (!account) {
        toast({
          title: "Error",
          description: "No se encontró la cuenta a eliminar",
          variant: "destructive",
        });
        return;
      }

      // Verificamos si es la única cuenta predeterminada (no se debe eliminar)
      // O si hay múltiples cuentas predeterminadas (situación de error que queremos corregir)
      const defaultAccounts = accounts.filter((acc) => acc.isDefault);
      const isOnlyDefault = account.isDefault && defaultAccounts.length === 1;
      const isDuplicateDefault = account.isDefault && defaultAccounts.length > 1;

      if (isOnlyDefault) {
        toast({
          title: "No se puede eliminar",
          description: "No puedes eliminar la única cuenta predeterminada",
          variant: "destructive",
        });
        return;
      }

      // Si es una cuenta predeterminada duplicada, mostramos una alerta especial
      if (isDuplicateDefault) {
        toast({
          title: "Cuenta predeterminada duplicada",
          description: "Se detectó una cuenta predeterminada duplicada. Puedes eliminarla para corregir este problema.",
          variant: "warning",
        });
      }

      try {
        // Consultar si hay ingresos o gastos asociados a esta cuenta
        const { countOrphanedFinances } = await import("@bill/_firebase/financeService");

        const { orphanedCount, orphanedIncomesCount, orphanedExpensesCount } = await countOrphanedFinances(accountId, userId);

        const hasOrphanedRecords = orphanedCount > 0;

        // Guardar esta información para mostrarla en el modal de confirmación
        setAccountToDelete({
          id: accountId,
          name: account?.name || "Cuenta",
          hasOrphanedRecords,
          orphanedCount,
          orphanedIncomesCount,
          orphanedExpensesCount,
          isDuplicateDefault: isDuplicateDefault, // Guardamos esta información para usarla durante la eliminación
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
          isDuplicateDefault: isDuplicateDefault, // Guardamos esta información para usarla durante la eliminación
        });
        setDeleteConfirmOpen(true);
      }
    },
    [accounts, toast, userId]
  );

  // Eliminar cuenta
  const handleDeleteAccount = useCallback(async () => {
    if (!accountToDelete?.id) return;

    try {
      const { deleteFinancesByAccountId } = await import("@bill/_firebase/financeService");
      const { deleteDoc, doc } = await import("firebase/firestore");
      const { db } = await import("@bill/_firebase/config");

      // Eliminar todas las transacciones asociadas a la cuenta
      const { deletedIncomesCount, deletedExpensesCount } = await deleteFinancesByAccountId(accountToDelete.id, userId);
      const totalDeleted = deletedIncomesCount + deletedExpensesCount;

      // Si es una cuenta predeterminada duplicada, eliminamos directamente el documento
      // para evitar los controles que impiden eliminar cuentas predeterminadas
      if (accountToDelete.isDuplicateDefault) {
        // Eliminar directamente sin usar la función estándar
        const accountRef = doc(db, "accounts", accountToDelete.id);
        await deleteDoc(accountRef);

        // Actualizar directamente el estado global
        const { deleteAccount: deleteAccountFromStore } = useAccountStore.getState();
        deleteAccountFromStore(accountToDelete.id);
      } else {
        // Eliminar la cuenta usando la función estándar
        await deleteAccount(accountToDelete.id);
      }

      // Recargar cuentas con recálculo automático de saldos
      await reloadAccountsWithRecalculation();

      // Actualizar el estado de las transacciones para que no aparezcan huérfanas en la UI
      try {
        // Intentar actualizar los estados de transacciones si están disponibles
        // Este bloque es para actualizar la UI y evitar que se muestren registros eliminados
        
        // Actualizar estado de ingresos
        const { useIncomeStore } = await import("@bill/_store/useIncomeStore");
        if (useIncomeStore) {
          // Obtener los ingresos actualizados del usuario (sin los eliminados)
          const { incomeService } = await import("@bill/_firebase/financeService");
          const updatedIncomes = await incomeService.getUserItems(userId);
          
          // Actualizar el estado completo con los datos actualizados
          const incomeStore = useIncomeStore.getState();
          if (incomeStore.setIncomes) {
            incomeStore.setIncomes(updatedIncomes);
          }
        }
        
        // Actualizar estado de gastos
        const { useExpenseStore } = await import("@bill/_store/useExpenseStore");
        if (useExpenseStore) {
          // Obtener los gastos actualizados del usuario (sin los eliminados)
          const { expenseService } = await import("@bill/_firebase/financeService");
          const updatedExpenses = await expenseService.getUserItems(userId);
          
          // Actualizar el estado completo con los datos actualizados
          const expenseStore = useExpenseStore.getState();
          if (expenseStore.setExpenses) {
            expenseStore.setExpenses(updatedExpenses);
          }
        }
      } catch (storeError) {
        console.warn("Error al actualizar estados de transacciones:", storeError);
        // No interrumpimos el flujo principal si hay un error en la actualización del estado
      }
      
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
  }, [accountToDelete, reloadAccountsWithRecalculation, toast, userId]);

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

  // Manejar el fin del arrastre
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        // No deberíamos llegar aquí con la cuenta predeterminada debido a disabled
        // Pero añadimos una verificación extra por seguridad
        const defaultAccount = accounts.find((acc) => acc.isDefault);
        if (defaultAccount && active.id === defaultAccount.id) {
          // En vez de usar toast aquí, podemos simplemente mostrar un console.warn
          console.warn("Operación no permitida: La cuenta predeterminada no se puede mover.");
          return;
        }

        setAccountOrder((items) => {
          const oldIndex = items.indexOf(active.id.toString());
          const newIndex = items.indexOf(over.id.toString());

          // Mover cuentas y guardar en localStorage
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    },
    [accounts]
  );

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Configuración ajustada para funcionar tanto en móvil como escritorio
      activationConstraint: {
        // En dispositivos táctiles, necesitamos una distancia más pequeña
        distance: typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches ? 5 : 8,
        // Retraso corto en dispositivos táctiles para distinguir entre tap y arrastre
        delay: typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches ? 100 : 0,
        // Tolerancia para prevenir activaciones accidentales en móvil
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Componente para cada cuenta sorteable
  function SortableAccountCard({ account }: { account: Account }) {
    // Verificar si es una cuenta predeterminada duplicada
    const isDuplicateDefault = account.isDefault && accounts.filter((acc) => acc.isDefault).length > 1;

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: account.id,
      disabled: account.isDefault, // Deshabilitar arrastre para cuentas predeterminadas
    });

    // Manejo seguro de la transformación CSS para evitar errores undefined
    const style = {
      transform: transform ? CSS.Transform.toString(transform) : undefined,
      transition,
      zIndex: isDragging ? 10 : 1,
      opacity: isDragging ? 0.8 : 1,
      touchAction: "none", // Prevenir scroll al arrastrar en móvil
    };

    const isActive = activeAccountId === account.id;

    // Manejador directo para la selección de cuenta
    const selectThisAccount = (e: React.MouseEvent) => {
      // Solo permitir clics directos en la tarjeta, no en los botones
      if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("[data-drag-handle]")) {
        return;
      }
      handleSelectAccount(account.id);
    };

    return (
      <Card
        ref={setNodeRef}
        style={style}
        className={`group transition-all duration-200 shadow-soft relative overflow-hidden 
        ${isDragging ? "shadow-lg" : ""} 
        ${isDuplicateDefault ? "border-2 border-red-500 bg-red-50 dark:bg-red-950/20" : ""}
        ${isActive ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900 shadow-md border-primary/50" : "hover:border-primary/50"}`}
        onClick={selectThisAccount}
        aria-selected={isActive}
        aria-label={`Cuenta ${account.name} con saldo ${formatCurrency(account.balance)}${isActive ? ", seleccionada" : ""}`}>
        <CardContent className="p-4 flex flex-col gap-2">
          {/* Indicador de selección en la esquina superior derecha (visible solo en desktop) */}
          {isActive && (
            <div
              className="absolute top-0 right-0 w-0 h-0 
                          border-t-[20px] border-t-primary 
                          border-l-[20px] border-l-transparent
                          hidden md:block"></div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-wrap">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: account.color }} />
              <h3 className="font-medium text-sm">{account.name}</h3>
              {isDuplicateDefault && <span className="text-xs bg-red-500/20 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded">Duplicada</span>}
              {isActive && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded ml-1 md:hidden">Seleccionada</span>}
            </div>

            {/* Contenedor para botones e icono de arrastre */}
            <div className="flex items-center">
              {/* Drag handle - Mejorado para móvil */}
              {!account.isDefault && (
                <div
                  className="h-8 w-8 md:h-7 md:w-6 flex flex-col items-center justify-center cursor-grab opacity-70 hover:opacity-100 mr-1 touch-none active:bg-gray-100 dark:active:bg-gray-800 rounded-md"
                  {...attributes}
                  {...listeners}
                  data-drag-handle
                  title="Arrastrar para reordenar"
                  aria-label="Arrastrar para reordenar">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 md:w-1 md:h-1 rounded-full bg-gray-400"></div>
                      <div className="w-1.5 h-1.5 md:w-1 md:h-1 rounded-full bg-gray-400"></div>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 md:w-1 md:h-1 rounded-full bg-gray-400"></div>
                      <div className="w-1.5 h-1.5 md:w-1 md:h-1 rounded-full bg-gray-400"></div>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 md:w-1 md:h-1 rounded-full bg-gray-400"></div>
                      <div className="w-1.5 h-1.5 md:w-1 md:h-1 rounded-full bg-gray-400"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  onClick={() => handleEditAccount(account)}
                  aria-label="Editar cuenta"
                  title="Editar cuenta">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  onClick={() => handleConfirmDelete(account.id)}
                  aria-label="Eliminar cuenta"
                  title="Eliminar cuenta">
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          </div>

          <div className="text-xl font-semibold">{formatCurrency(account.balance)}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="account-manager">
      {/* Selector de cuenta activa */}

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={handleNewAccount} data-testid="add-account-button">
          <PlusCircle className="h-4 w-4 mr-1" />
          Añadir
        </Button>
        {activeAccount && (
          <>
            {/* Mostrar botón de editar solo si la cuenta activa no es la predeterminada o es una duplicada */}
            {(!activeAccount.isDefault || (activeAccount.isDefault && accounts.filter((acc) => acc.isDefault).length > 1)) && (
              <Button size="sm" variant="outline" onClick={() => handleEditAccount(activeAccount)} data-testid="edit-account-button">
                <Pencil className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleOpenTransfer} data-testid="transfer-account-button">
              <ArrowRightLeft className="h-4 w-4 mr-1" />
              Transferir
            </Button>
            {/* Mostrar botón de eliminar solo si la cuenta activa no es la predeterminada o es una duplicada */}
            {(!activeAccount.isDefault || (activeAccount.isDefault && accounts.filter((acc) => acc.isDefault).length > 1)) && (
              <Button size="sm" variant="outline" onClick={() => handleConfirmDelete(activeAccount.id)} className="text-destructive" data-testid="delete-account-button">
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </Button>
            )}
            {/* Mostrar botón de reiniciar saldo solo si la cuenta activa es la predeterminada y no es duplicada */}
            {activeAccount.isDefault && accounts.filter((acc) => acc.isDefault).length === 1 && (
              <Button size="sm" variant="outline" onClick={() => setIsResetBalanceOpen(true)} className="text-amber-500 dark:text-amber-400" data-testid="reset-account-button">
                <RefreshCcw className="h-4 w-4 mr-1" />
                Reiniciar saldo
              </Button>
            )}
          </>
        )}
      </div>

      {/* Separador visual */}
      <Separator className="my-4" />

      {/* Mostrar cuentas y saldo */}
      <div className="space-y-3 mt-2">
        {/* Cuenta predeterminada - separada y estática */}
        {(() => {
          // Buscar la cuenta predeterminada
          const defaultAccount = accounts.find((acc) => acc.isDefault);
          if (!defaultAccount) return null;

          const isActive = activeAccountId === defaultAccount.id;

          // Manejador directo para la selección de cuenta predeterminada
          const selectDefaultAccount = (e: React.MouseEvent) => {
            // Solo permitir clics directos en la tarjeta, no en los botones
            if ((e.target as HTMLElement).closest("button")) {
              return;
            }
            handleSelectAccount(defaultAccount.id);
          };

          return (
            <div className="mb-3">
              <Card
                className={`group relative overflow-hidden cursor-pointer border-2 border-amber-500/50 
                  ${isActive ? "ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900 shadow-md" : ""}`}
                onClick={selectDefaultAccount}
                aria-selected={isActive}
                aria-label={`Cuenta ${defaultAccount.name} con saldo ${formatCurrency(defaultAccount.balance)}${isActive ? ", seleccionada" : ""}, predeterminada`}>
                <CardContent className="p-4 flex flex-col gap-2">
                  {/* Indicador de selección en la esquina superior derecha (visible solo en desktop) */}
                  {isActive && (
                    <div
                      className="absolute top-0 right-0 w-0 h-0 
                                  border-t-[20px] border-t-primary 
                                  border-l-[20px] border-l-transparent
                                  hidden md:block"></div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: defaultAccount.color }} />
                      <h3 className="font-medium text-sm">{defaultAccount.name}</h3>
                      <span className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">Predeterminada</span>
                      {isActive && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded ml-1 md:hidden">Seleccionada</span>}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                        onClick={() => setIsResetBalanceOpen(true)}
                        aria-label="Reiniciar saldo (Solo para Efectivo)"
                        title="Reiniciar saldo (Solo para Efectivo)">
                        <RefreshCcw className="h-3.5 w-3.5 text-amber-500" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xl font-semibold">{formatCurrency(defaultAccount.balance)}</div>
                </CardContent>
              </Card>
            </div>
          );
        })()}

        {/* Resto de cuentas - sortables */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 touch-none">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            {(() => {
              // Filtrar cuentas excluyendo la predeterminada
              const nonDefaultAccounts = accounts.filter((acc) => !acc.isDefault);

              // Crear un mapa para acceder rápidamente a las cuentas por ID
              const accountsMap = new Map(nonDefaultAccounts.map((account) => [account.id, account]));

              // Filtrar el accountOrder para que solo contenga IDs de cuentas no predeterminadas existentes
              const validAccountIds = accountOrder.filter((id) => accountsMap.has(id));

              // Si hay cuentas que existen pero no están en el orden, agregarlas al final
              nonDefaultAccounts.forEach((account) => {
                if (!validAccountIds.includes(account.id)) {
                  validAccountIds.push(account.id);
                }
              });

              // Aplicar límite según el tamaño de pantalla si no se muestran todas
              const desktopLimit = 6;
              const mobileLimit = 4;

              // Determinar cuántas cuentas mostrar
              let accountIdsToShow = validAccountIds;
              if (!showAllAccounts) {
                // Aplicar límites solo si hay más cuentas que el límite
                accountIdsToShow = validAccountIds.slice(0, typeof window !== "undefined" && window.innerWidth < 768 ? mobileLimit : desktopLimit);
              }

              // Mapear IDs a objetos de cuenta completos
              const accountsToShow = accountIdsToShow.map((id) => accountsMap.get(id)!);

              // Renderizar las cuentas limitadas
              return (
                <>
                  <SortableContext items={accountIdsToShow} strategy={rectSortingStrategy}>
                    {accountsToShow.map((account) => (
                      <SortableAccountCard key={account.id} account={account} />
                    ))}
                  </SortableContext>

                  {/* Botón "Mostrar todos" cuando hay más cuentas que el límite */}
                  {!showAllAccounts && validAccountIds.length > (typeof window !== "undefined" && window.innerWidth < 768 ? mobileLimit : desktopLimit) && (
                    <Button variant="outline" className="mt-2 w-full" onClick={() => setShowAllAccounts(true)}>
                      Mostrar todas ({validAccountIds.length})
                    </Button>
                  )}

                  {/* Botón "Mostrar menos" cuando se muestran todas las cuentas */}
                  {showAllAccounts && validAccountIds.length > (typeof window !== "undefined" && window.innerWidth < 768 ? mobileLimit : desktopLimit) && (
                    <Button variant="outline" className="mt-2 w-full" onClick={() => setShowAllAccounts(false)}>
                      Mostrar menos
                    </Button>
                  )}
                </>
              );
            })()}
          </DndContext>
        </div>
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
    </div>
  );
}
