"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Wallet, ChevronRight, BanknoteIcon, Receipt, ArrowLeftRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { Button } from "@bill/_components/ui/button";
import { Text } from "@bill/_components/ui/typography";
import { List, ListItem } from "@bill/_components/ui/list";
import { useExpenseStore } from "@bill/_store/useExpenseStore";
import { useIncomeStore } from "@bill/_store/useIncomeStore";
import { useFinanceStore } from "@bill/_store/useFinanceStore";
import { useAuthStore } from "@bill/_store/useAuthStore";
import { CategoryBadge } from "@bill/_components/ui/category-badge";
import { getUserTransfers } from "@bill/_firebase/accountService";
import Link from "next/link";
import { Badge } from "@bill/_components/ui/badge";

interface Transaction {
  id: string;
  type: "income" | "expense" | "transfer";
  description: string;
  amount: number;
  category?: string;
  date: Date;
  fromAccountName?: string;
  toAccountName?: string;
}

export default function RecentTransactions() {
  const { expenses } = useExpenseStore();
  const { incomes } = useIncomeStore();
  const { user } = useAuthStore();
  const { formatCurrency } = useFinanceStore();
  const [transfers, setTransfers] = useState<any[]>([]);

  // Cargar transferencias
  useEffect(() => {
    const loadTransfers = async () => {
      if (!user?.uid) return;
      
      try {
        const data = await getUserTransfers(user.uid);
        setTransfers(data);
      } catch (error) {
        console.error("Error al cargar transferencias:", error);
      }
    };

    loadTransfers();
  }, [user?.uid]);

  // Combinar y ordenar transacciones
  const recentTransactions = useMemo(() => {
    if (!user) return [];
    
    const userExpenses = expenses.filter(exp => exp.userId === user.uid);
    const userIncomes = incomes.filter(inc => inc.userId === user.uid);
    const userTransfers = transfers.filter(transfer => transfer.userId === user.uid);

    const allTransactions: Transaction[] = [
      ...userExpenses.map((expense) => ({
        ...expense,
        type: "expense" as const,
        date: new Date(expense.date),
      })),
      ...userIncomes.map((income) => ({
        ...income,
        type: "income" as const,
        date: new Date(income.date),
      })),
      ...userTransfers.map((transfer) => ({
        ...transfer,
        type: "transfer" as const,
        description: transfer.description || `Transferencia de ${transfer.fromAccountName} a ${transfer.toAccountName}`,
        category: "Transferencia",
        date: new Date(transfer.date),
      })),
    ];

    return allTransactions
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  }, [expenses, incomes, transfers, user]);

  return (
    <Card className="shadow-soft">
      <CardHeader className="px-4 sm:px-6 flex flex-row items-center justify-between">
        <CardTitle className="text-base sm:text-lg">Transacciones Recientes</CardTitle>
        <Link href="/dashboard/finanzas/#historial-transacciones">
          <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1">
            Ver todas <ChevronRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <List className="mt-2">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => (
              <ListItem key={transaction.id}>
                <div className="flex items-center space-x-2">
                  {transaction.type === "income" ? (
                    <BanknoteIcon className="h-4 w-4 text-blue-600" />
                  ) : transaction.type === "expense" ? (
                    <Receipt className="h-4 w-4 text-red-600" />
                  ) : (
                    <ArrowLeftRight className="h-4 w-4 text-green-600" />
                  )}
                  <div>
                    <Text className="text-sm font-medium">{transaction.description}</Text>
                    <div className="flex items-center space-x-2">
                      {transaction.type === "transfer" ? (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:border-green-800 dark:text-green-400">
                          <span className="text-xs">{transaction.fromAccountName} → {transaction.toAccountName}</span>
                        </Badge>
                      ) : transaction.category ? (
                        <CategoryBadge category={transaction.category} type={transaction.type} showIcon={true} />
                      ) : (
                        <Badge variant="outline">Sin categoría</Badge>
                      )}
                      <Text className="text-xs text-muted-foreground">
                        {format(transaction.date, "d MMM yyyy, HH:mm", { locale: es })}
                      </Text>
                    </div>
                  </div>
                </div>
                <Text
                  className={`text-sm ${
                    transaction.type === "income" ? "text-blue-600 dark:text-blue-400" : 
                    transaction.type === "expense" ? "text-red-600 dark:text-red-400" :
                    "text-green-600 dark:text-green-400"
                  }`}
                >
                  {transaction.type === "income" ? "+" : 
                   transaction.type === "expense" ? "-" : ""}
                  {formatCurrency(transaction.amount)}
                </Text>
              </ListItem>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-56 py-6 text-center">
              <Wallet className="w-12 h-12 text-muted-foreground mb-2 opacity-50" />
              <Text className="text-sm text-muted-foreground">No hay transacciones recientes</Text>
              <Text className="text-xs text-muted-foreground mt-1">Registra tus primeros movimientos para ver el historial</Text>
            </div>
          )}
        </List>
      </CardContent>
    </Card>
  );
} 