import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Income } from '@bill/_store/useIncomeStore';
import type { Expense } from '@bill/_store/useExpenseStore';
import type { Account } from '@bill/_firebase/accountService';

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
};

// Helper to format date
const formatDate = (date: Date | string) => {
  try {
    const d = date instanceof Date ? date : new Date(date);
    return format(d, 'dd/MM/yyyy', { locale: es });
  } catch {
    return 'Fecha inválida';
  }
};

export interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  netFlow: number;
  dateRange: string;
}

export const exportTransactionsToPdf = (
  filename: string,
  incomes: Income[],
  expenses: Expense[],
  accounts: Account[],
  summaryData: SummaryData,
  incomeChartUrl: string | null,
  expenseChartUrl: string | null
) => {
  const doc = new jsPDF();
  const accountMap = new Map(accounts.map(acc => [acc.id, acc.name]));

  // --- Title ---
  doc.setFontSize(18);
  doc.text("Reporte de Transacciones - BillExpress", 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, 14, 30);
  if (summaryData.dateRange) {
    doc.text(`Periodo: ${summaryData.dateRange}`, 14, 36);
  }

  let startY = 45;

  // --- Summary Section (Always included now) ---
  doc.setFontSize(14);
  doc.setTextColor(40);
  doc.text("Resumen Financiero", 14, startY);
  startY += 8;
  autoTable(doc, {
    startY,
    body: [
      ['Total Ingresos:', formatCurrency(summaryData.totalIncome)],
      ['Total Gastos:', formatCurrency(summaryData.totalExpense)],
      ['Flujo Neto:', formatCurrency(summaryData.netFlow)],
    ],
    theme: 'plain',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right' },
    },
    didDrawPage: (data) => { startY = data.cursor?.y ?? startY; }
  });
  startY += 10; // Add spacing after summary

  // --- Account Balances Table ---
  if (accounts.length > 0) {
    let accountTableStartY = startY;
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text("Saldos de Cuentas (Actuales)", 14, accountTableStartY);
    accountTableStartY += 8;
    autoTable(doc, {
      startY: accountTableStartY,
      head: [['Cuenta', 'Saldo Actual']],
      body: accounts.map(acc => [
        acc.name,
        formatCurrency(acc.balance)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [75, 85, 99] }, // Tailwind's gray-500
      styles: { fontSize: 10 },
      columnStyles: {
        1: { halign: 'right' }
      },
      didDrawPage: (data) => { 
        startY = data.cursor?.y ? data.cursor.y + 10 : startY + 10; 
      } 
    });
  } else {
      startY += 5; // Add a little space even if no accounts table
  }

  // --- Charts Section (if URLs provided) ---
  let chartStartY = startY;
  let chartWidth = 80; // Adjust as needed
  let chartHeight = 60; // Adjust as needed
  let chartsAdded = false;

  if (incomeChartUrl) {
    try {
      doc.setFontSize(12);
      doc.setTextColor(40);
      doc.text("Ingresos por Categoría", 14, chartStartY);
      doc.addImage(incomeChartUrl, 'PNG', 14, chartStartY + 4, chartWidth, chartHeight);
      chartsAdded = true;
    } catch (e) {
      console.error("Error adding income chart to PDF:", e);
    }
  }
  if (expenseChartUrl) {
    try {
      doc.setFontSize(12);
      doc.setTextColor(40);
      const expenseChartX = chartsAdded ? 14 + chartWidth + 10 : 14; // Position next to income chart or at start
      doc.text("Gastos por Categoría", expenseChartX, chartStartY);
      doc.addImage(expenseChartUrl, 'PNG', expenseChartX, chartStartY + 4, chartWidth, chartHeight);
      chartsAdded = true;
    } catch (e) {
      console.error("Error adding expense chart to PDF:", e);
    }
  }

  if (chartsAdded) {
    startY = chartStartY + chartHeight + 15; // Update startY if charts were added
  }

  // --- Incomes Table ---
  if (incomes.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text("Ingresos", 14, startY);
    startY += 6;
    autoTable(doc, {
      startY,
      head: [['Fecha', 'Descripción', 'Categoría', 'Cuenta', 'Monto']],
      body: incomes.map(inc => [
        formatDate(inc.date),
        inc.description,
        inc.category || 'N/A',
        accountMap.get(inc.accountId || '') || 'Cuenta no encontrada',
        formatCurrency(inc.amount)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [3, 105, 161] }, // Tailwind's sky-700
      styles: { fontSize: 9 },
      columnStyles: {
        4: { halign: 'right' }
      },
      didDrawPage: (data) => { startY = data.cursor?.y ?? startY; }
    });
    startY += 10; // Add spacing after table
  }

  // --- Expenses Table ---
  if (expenses.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text("Gastos", 14, startY);
    startY += 6;
    autoTable(doc, {
      startY,
      head: [['Fecha', 'Descripción', 'Categoría', 'Cuenta', 'Monto']],
      body: expenses.map(exp => [
        formatDate(exp.date),
        exp.description,
        exp.category || 'N/A',
        accountMap.get(exp.accountId || '') || 'Cuenta no encontrada',
        formatCurrency(exp.amount)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [220, 38, 38] }, // Tailwind's red-600
      styles: { fontSize: 9 },
      columnStyles: {
        4: { halign: 'right' }
      },
      didDrawPage: (data) => { startY = data.cursor?.y ?? startY; }
    });
  }

  // --- Footer Note (Optional - regarding transfers) ---
  // Could add a small note at the bottom about transfers affecting totals if desired.
  // Example:
  // const finalY = doc.internal.pageSize.height - 10;
  // doc.setFontSize(8);
  // doc.setTextColor(150);
  // doc.text("Nota: Los totales pueden incluir transferencias internas registradas como ingresos/gastos.", 14, finalY);

  doc.save(filename);
}; 