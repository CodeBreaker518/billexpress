"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowUp, ArrowDown, Wallet, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@bill/_components/ui/card";
import { Button } from "@bill/_components/ui/button";
import { Text } from "@bill/_components/ui/typography";
import { List, ListItem } from "@bill/_components/ui/list";
import { useExpenseStore } from "@bill/_store/useExpenseStore";
import { useIncomeStore } from "@bill/_store/useIncomeStore";
import { useFinanceStore } from "@bill/_store/useFinanceStore";
import { CategoryBadge } from "@bill/_components/ui/category-badge";
import Link from "next/link";

interface Transaction {
  id: string;
  type: "income" | "expense";
  description: string;
  amount: number;
  category: string;
  date: Date;
}

export default function RecentTransactions() {
  const { expenses } = useExpenseStore();
  const { incomes } = useIncomeStore();
  const { formatCurrency } = useFinanceStore();

  // Combinar y ordenar transacciones
  const recentTransactions = useMemo(() => {
    const allTransactions: Transaction[] = [
      ...expenses.map((expense) => ({
        ...expense,
        type: "expense" as const,
        date: new Date(expense.date),
      })),
      ...incomes.map((income) => ({
        ...income,
        type: "income" as const,
        date: new Date(income.date),
      })),
    ];

    return allTransactions
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  }, [expenses, incomes]);

  return (
    <Card className="shadow-soft">
      <CardHeader className="px-4 sm:px-6 flex flex-row items-center justify-between">
        <CardTitle className="text-base sm:text-lg">Transacciones Recientes</CardTitle>
        <Link href="/transactions">
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
                    <ArrowUp className="h-4 w-4 text-blue-600" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-600" />
                  )}
                  <div>
                    <Text className="text-sm font-medium">{transaction.description}</Text>
                    <div className="flex items-center space-x-2">
                      <CategoryBadge category={transaction.category} type={transaction.type} showIcon={true} />
                      <Text className="text-xs text-muted-foreground">
                        {format(transaction.date, "d MMM yyyy, HH:mm", { locale: es })}
                      </Text>
                    </div>
                  </div>
                </div>
                <Text
                  className={`text-sm ${
                    transaction.type === "income" ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {transaction.type === "income" ? "+" : "-"}
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