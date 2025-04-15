"use client";

import { useState } from "react";
import TransactionsTable from "./TransactionsTable";
import TransferHistory from "@bill/_components/finanzas/TransferHistory";
import { Card, CardContent } from "@bill/_components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@bill/_components/ui/tabs";

export default function FinanceTabs() {
  const [activeTab, setActiveTab] = useState("transactions");

  return (
    <div className="w-full">
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="transactions" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b px-4">
              <TabsList className="grid grid-cols-3 my-2">
                <TabsTrigger value="transactions">Transacciones</TabsTrigger>
                <TabsTrigger value="transfers">Transferencias</TabsTrigger>
                <TabsTrigger value="summary">Resumen</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="transactions" className="p-0">
              <TransactionsTable />
            </TabsContent>
            
            <TabsContent value="transfers" className="p-4">
              <TransferHistory />
            </TabsContent>
            
            <TabsContent value="summary" className="p-4">
              <div className="py-8 text-center text-muted-foreground">
                <p>El resumen financiero estará disponible próximamente.</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
