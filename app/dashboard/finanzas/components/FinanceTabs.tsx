"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@bill/_components/ui/tabs";
import IncomePanel from "./tabs/IncomePanel";
import ExpensePanel from "./tabs/ExpensePanel";

export default function FinanceTabs() {
  return (
    <Tabs defaultValue="expenses" className="w-full">
      <TabsList className="grid grid-cols-2 mb-6">
        <TabsTrigger value="expenses" data-testid="expenses-tab">
          Gastos
        </TabsTrigger>
        <TabsTrigger value="incomes" data-testid="incomes-tab">
          Ingresos
        </TabsTrigger>
      </TabsList>
      <TabsContent value="expenses" className="space-y-4">
        <ExpensePanel />
      </TabsContent>
      <TabsContent value="incomes" className="space-y-4">
        <IncomePanel />
      </TabsContent>
    </Tabs>
  );
}
