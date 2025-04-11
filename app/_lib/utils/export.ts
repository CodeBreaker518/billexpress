import { Account } from "@bill/_firebase/accountService";
import { Income } from "@bill/_store/useIncomeStore";
import { Expense } from "@bill/_store/useExpenseStore";
import { format } from 'date-fns';

interface TransactionData {
  date: string;
  type: 'Ingreso' | 'Gasto';
  description: string;
  category: string;
  accountName: string;
  amount: number;
}

/**
 * Convierte un objeto a una fila CSV, manejando comas y comillas.
 */
function objectToCsvRow(obj: Record<string, any>, headers: string[]): string {
  return headers
    .map((header) => {
      let value = obj[header] === null || obj[header] === undefined ? '' : String(obj[header]);
      // Escapar comillas dobles duplicándolas
      value = value.replace(/"/g, '""');
      // Envolver en comillas dobles si contiene coma, comillas dobles o salto de línea
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = `"${value}"`;
      }
      return value;
    })
    .join(',');
}

/**
 * Formatea y exporta datos de transacciones a un archivo CSV.
 * @param filename - El nombre deseado para el archivo CSV.
 * @param incomes - Array de ingresos.
 * @param expenses - Array de gastos.
 * @param accounts - Array de cuentas.
 */
export function exportTransactionsToCsv(
  filename: string,
  incomes: Income[],
  expenses: Expense[],
  accounts: Account[]
): void {
  const accountMap = new Map(accounts.map(acc => [acc.id, acc.name]));

  const combinedData: TransactionData[] = [
    ...incomes.map(item => ({
      date: format(new Date(item.date), 'yyyy-MM-dd HH:mm:ss'),
      type: 'Ingreso' as const,
      description: item.description,
      category: item.category,
      accountName: item.accountId ? (accountMap.get(item.accountId) ?? 'Cuenta Eliminada') : 'Sin Cuenta',
      amount: item.amount,
    })),
    ...expenses.map(item => ({
      date: format(new Date(item.date), 'yyyy-MM-dd HH:mm:ss'),
      type: 'Gasto' as const,
      description: item.description,
      category: item.category,
      accountName: item.accountId ? (accountMap.get(item.accountId) ?? 'Cuenta Eliminada') : 'Sin Cuenta',
      amount: -item.amount, // Exportar gastos como negativos
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Ordenar por fecha descendente

  if (combinedData.length === 0) {
    console.warn("No hay datos para exportar.");
    // Podrías mostrar un toast aquí
    return;
  }

  const headers = [
    { key: 'date', label: 'Fecha y Hora' },
    { key: 'type', label: 'Tipo' },
    { key: 'description', label: 'Descripción' },
    { key: 'category', label: 'Categoría' },
    { key: 'accountName', label: 'Cuenta' },
    { key: 'amount', label: 'Monto' },
  ];

  const headerKeys = headers.map(h => h.key);
  const headerLabels = headers.map(h => h.label);

  const csvRows = [
    headerLabels.join(','), // Fila de encabezado
    ...combinedData.map(item => objectToCsvRow(item, headerKeys)),
  ];

  const csvString = csvRows.join('\n');

  const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' }); // BOM para Excel

  const link = document.createElement('a');
  if (link.download !== undefined) { // Feature detection
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    console.error("La descarga directa no es soportada por este navegador.");
    // Considerar mostrar el CSV en una nueva ventana o dar otras instrucciones
  }
} 