'use client';

import React, { useState } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
  LineChart as RechartsLineChart,
  Line,
} from 'recharts';
import { cn } from '../../../app/_lib/utils';
import { getCategoryColors } from '../../_lib/utils/categoryConfig';

// Definiciones de tipo para datos de gráficos
type ChartData = Record<string, string | number>;

// Componente BarChart
interface BarChartProps {
  data: ChartData[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  stack?: boolean;
  yAxisWidth?: number;
  className?: string;
  chartType?: 'income' | 'expense';
}

export function BarChart({
  data,
  index,
  categories,
  colors,
  valueFormatter = (value) => value.toString(),
  stack = false,
  yAxisWidth = 40,
  className,
  chartType = 'expense',
}: BarChartProps) {
  // Si no se proporcionan colores, usar los del sistema
  const chartColors = colors || getCategoryColors(chartType);

  return (
    <div className={cn('w-full h-72', className)}>
      <ResponsiveContainer width='100%' height='100%'>
        <RechartsBarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: yAxisWidth,
            bottom: 20,
          }}>
          <CartesianGrid strokeDasharray='3 3' vertical={false} />
          <XAxis dataKey={index} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={yAxisWidth} tickFormatter={valueFormatter} />
          <Tooltip
            formatter={(value: number, name: string) => [valueFormatter(value), name]}
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg, white)',
              border: '1px solid var(--tooltip-border, #e5e7eb)',
              borderRadius: '0.375rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              color: 'var(--tooltip-text, black)',
            }}
            cursor={{ stroke: '#d1d5db', strokeWidth: 1 }}
          />
          <Legend wrapperStyle={{ paddingTop: 10 }} formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>} />
          {categories.map((category, index) => (
            <Bar key={category} dataKey={category} stackId={stack ? 'stack' : undefined} fill={chartColors[index % chartColors.length]} radius={[4, 4, 0, 0]} />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Interfaz para el DonutChart
interface DonutChartProps {
  data: ChartData[];
  category: string;
  index: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  variant?: 'pie' | 'donut';
  className?: string;
  chartType?: 'income' | 'expense';
}

// Componente DonutChart (y PieChart)
export function DonutChart({ data, category, index, colors, valueFormatter = (value) => value.toString(), variant = 'donut', className, chartType = 'expense' }: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Si no se proporcionan colores, usar los del sistema
  const chartColors = colors || getCategoryColors(chartType);

  const innerRadius = variant === 'donut' ? '60%' : 0;
  const outerRadius = '80%';

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  // Renderizado personalizado para sector activo - usar any temporalmente para resolver el error de tipo
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

    return (
      <g>
        <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={innerRadius - 6} outerRadius={innerRadius - 2} fill={fill} />
      </g>
    );
  };

  return (
    <div className={cn('w-full h-72', className)}>
      <ResponsiveContainer width='100%' height='100%'>
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={data}
            cx='50%'
            cy='50%'
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey={category}
            nameKey={index}
            onMouseEnter={onPieEnter}>
            {data.map((_, idx) => (
              <Cell key={`cell-${idx}`} fill={chartColors[idx % chartColors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [valueFormatter(value), '']}
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg, white)',
              border: '1px solid var(--tooltip-border, #e5e7eb)',
              borderRadius: '0.375rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              color: 'var(--tooltip-text, black)',
            }}
          />
          <Legend formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Interfaz para LineChart
interface LineChartProps {
  data: ChartData[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  yAxisWidth?: number;
  className?: string;
  showLegend?: boolean;
  curveType?: 'basis' | 'linear' | 'natural' | 'monotone' | 'step';
}

// Componente LineChart
export function LineChart({
  data,
  index,
  categories,
  colors = ['#3b82f6', '#ef4444', '#22c55e', '#f97316', '#8b5cf6', '#06b6d4'], // Colores por defecto (azul, rojo, verde, naranja, morado, cian)
  valueFormatter = (value) => value.toString(),
  yAxisWidth = 60,
  className,
  showLegend = true,
  curveType = 'monotone',
}: LineChartProps) {
  return (
    <div className={cn('w-full h-72', className)}>
      <ResponsiveContainer width='100%' height='100%'>
        <RechartsLineChart
          data={data}
          margin={{
            top: 5,
            right: 10, // Menos margen derecho
            left: 0, // Menos margen izquierdo para que quepa yAxisWidth
            bottom: showLegend ? 20 : 5, // Más margen si hay leyenda
          }}>
          <CartesianGrid strokeDasharray='3 3' vertical={false} />
          <XAxis dataKey={index} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} padding={{ left: 10, right: 10 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={yAxisWidth} tickFormatter={valueFormatter} />
          <Tooltip
            formatter={(value: number, name: string) => [valueFormatter(value), name]}
            labelFormatter={(label: string) => label} // Mostrar la etiqueta del eje X (mes)
            contentStyle={{
              backgroundColor: 'var(--tooltip-bg, white)',
              border: '1px solid var(--tooltip-border, #e5e7eb)',
              borderRadius: '0.375rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              color: 'var(--tooltip-text, black)',
              fontSize: '12px', // Tooltip más pequeño
              padding: '4px 8px', // Padding del tooltip
            }}
            cursor={{ stroke: '#d1d5db', strokeWidth: 1 }} // Cursor más sutil
          />
          {showLegend && (
            <Legend
              verticalAlign='bottom'
              height={36}
              wrapperStyle={{ paddingTop: 10 }}
              formatter={(value) => <span style={{ fontSize: 12, marginLeft: '4px' }}>{value}</span>} // Añadir margen a la leyenda
              iconSize={10} // Icono de leyenda más pequeño
            />
          )}
          {categories.map((category, idx) => (
            <Line
              key={category}
              type={curveType}
              dataKey={category}
              stroke={colors[idx % colors.length]}
              strokeWidth={2}
              dot={false} // Ocultar puntos por defecto
              activeDot={{ r: 4, strokeWidth: 1 }} // Punto activo al pasar el ratón
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
