"use client";

import TransactionsTable from "./TransactionsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@bill/_components/ui/card";

export default function FinanceTable() {
  return (
    <div className="w-full">
      <TransactionsTable />
    </div>
  );
}
