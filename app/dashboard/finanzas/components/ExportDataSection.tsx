'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@bill/_components/ui/card";
import TransactionExporter from '@bill/_components/reports/TransactionExporter';
import { useFinanceStore } from '@bill/_store/useFinanceStore';
import { Download, FileText } from 'lucide-react';

export default function ExportDataSection() {
  const { isLoading } = useFinanceStore();

  return (
    <Card className="shadow-soft card-hover">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Exportar Datos
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <TransactionExporter isLoading={isLoading} />
      </CardContent>
    </Card>
  );
} 