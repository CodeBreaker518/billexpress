'use client';

import React, { useState, useEffect } from 'react';
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
  Sector
} from 'recharts';
import { cn } from '../../../app/_lib/utils';

// Colores para gráficos
const colors = {
  primary: '#1a7ffa',
  blue: '#1a7ffa',
  emerald: '#26b066',
  green: '#26b066',
  red: '#ef4444',
  purple: '#7c3aed',
  orange: '#f97316',
  indigo: '#6366f1',
  yellow: '#eab308',
  pink: '#ec4899',
  gray: '#6b7280',
  slate: '#64748b',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  teal: '#14b8a6',
  cyan: '#06b6d4',
};

const defaultColors = ['#1a7ffa', '#26b066', '#ef4444', '#f97316', '#7c3aed', '#64748b', '#eab308', '#8b5cf6', '#f59e0b'];

// Interfaz para el BarChart
interface BarChartProps {
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  stack?: boolean;
  yAxisWidth?: number;
  className?: string;
}

// Componente BarChart
export function BarChart({
  data,
  index,
  categories,
  colors = defaultColors,
  valueFormatter = (value) => value.toString(),
  stack = false,
  yAxisWidth = 40,
  className
}: BarChartProps) {
  return (
    <div className={cn("w-full h-72", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: yAxisWidth,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey={index}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            width={yAxisWidth}
            tickFormatter={valueFormatter}
          />
          <Tooltip 
            formatter={(value: number) => [valueFormatter(value), '']}
            contentStyle={{ 
              backgroundColor: 'var(--tooltip-bg, white)', 
              border: '1px solid var(--tooltip-border, #e5e7eb)',
              borderRadius: '0.375rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              color: 'var(--tooltip-text, black)'
            }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: 10 }}
            formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
          />
          {categories.map((category, index) => (
            <Bar
              key={category}
              dataKey={category}
              stackId={stack ? "stack" : undefined}
              fill={colors[index % colors.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Interfaz para el DonutChart
interface DonutChartProps {
  data: any[];
  category: string;
  index: string;
  colors?: string[];
  valueFormatter?: (value: number) => string;
  variant?: 'pie' | 'donut';
  className?: string;
}

// Componente DonutChart (y PieChart)
export function DonutChart({
  data,
  category,
  index,
  colors = defaultColors,
  valueFormatter = (value) => value.toString(),
  variant = 'donut',
  className
}: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const innerRadius = variant === 'donut' ? '60%' : 0;
  const outerRadius = '80%';

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  // Renderizado personalizado para sector activo
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
    
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={innerRadius - 6}
          outerRadius={innerRadius - 2}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <div className={cn("w-full h-72", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey={category}
            nameKey={index}
            onMouseEnter={onPieEnter}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [valueFormatter(value), '']}
            contentStyle={{ 
              backgroundColor: 'var(--tooltip-bg, white)', 
              border: '1px solid var(--tooltip-border, #e5e7eb)',
              borderRadius: '0.375rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              color: 'var(--tooltip-text, black)'
            }}
          />
          <Legend 
            formatter={(value, entry, index) => (
              <span style={{ fontSize: 12 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
} 