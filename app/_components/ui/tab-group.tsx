'use client';

import * as React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
import { cn } from '@bill/_lib/utils';

interface TabGroupProps {
  children: React.ReactNode;
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  className?: string;
}

interface TabListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabProps {
  children: React.ReactNode;
  className?: string;
  value?: string;
}

interface TabPanelsProps {
  children: React.ReactNode;
}

interface TabPanelProps {
  children: React.ReactNode;
  value?: string;
  className?: string;
}

// Contexto para manejar el estado
interface TabGroupContextType {
  selectedValue: string;
  setSelectedValue: (value: string) => void;
}

const TabGroupContext = React.createContext<TabGroupContextType | undefined>(undefined);

// Componente TabGroup
export function TabGroup({ 
  children, 
  index, 
  defaultIndex = 0,
  onIndexChange, 
  className
}: TabGroupProps) {
  // Extraer los valores de los tabs directamente de los children
  const tabValues = React.useMemo(() => {
    const values: string[] = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === TabList) {
        const childProps = child.props as { children: React.ReactNode };
        React.Children.forEach(childProps.children, (tab, i) => {
          if (React.isValidElement(tab) && tab.type === Tab) {
            const tabProps = tab.props as { value?: string };
            const tabValue = tabProps.value || `tab-${i}`;
            values.push(tabValue);
          }
        });
      }
    });
    return values;
  }, [children]);

  // Estado interno para modo no controlado
  const [internalValue, setInternalValue] = React.useState(() => {
    if (index !== undefined && tabValues[index]) {
      return tabValues[index];
    }
    if (tabValues[defaultIndex]) {
      return tabValues[defaultIndex];
    }
    return tabValues[0] || '';
  });

  // Determinar si estamos en modo controlado o no
  const isControlled = index !== undefined;
  const selectedValue = isControlled && tabValues[index] ? tabValues[index] : internalValue;

  // Manejar cambio de valor
  const handleValueChange = React.useCallback((value: string) => {
    // En modo no controlado, actualizar estado interno
    if (!isControlled) {
      setInternalValue(value);
    }
    
    // Si hay callback, llamarlo con el índice
    if (onIndexChange) {
      const newIndex = tabValues.indexOf(value);
      if (newIndex !== -1) {
        onIndexChange(newIndex);
      }
    }
  }, [isControlled, onIndexChange, tabValues]);

  return (
    <TabGroupContext.Provider value={{ selectedValue, setSelectedValue: handleValueChange }}>
      <Tabs 
        value={selectedValue} 
        onValueChange={handleValueChange}
        className={cn("w-full", className)}
        defaultValue={tabValues[0]}
      >
        {children}
      </Tabs>
    </TabGroupContext.Provider>
  );
}

// Hook para acceder al contexto
const useTabGroupContext = () => {
  const context = React.useContext(TabGroupContext);
  if (!context) {
    throw new Error('Tab components must be used within a TabGroup');
  }
  return context;
};

// Componente TabList
export function TabList({ children, className }: TabListProps) {
  return (
    <TabsList className={cn("mb-4", className)}>
      {children}
    </TabsList>
  );
}

// Componente Tab
export function Tab({ children, className, value: propValue }: TabProps) {
  const { selectedValue, setSelectedValue } = useTabGroupContext();
  
  // Determinar el valor del tab
  const value = React.useMemo(() => {
    // Si se proporciona un valor, usarlo
    if (propValue) return propValue;
    
    // De lo contrario, generar uno basado en el contenido
    if (typeof children === 'string') {
      return children.toLowerCase().replace(/\s+/g, '-');
    }
    
    // Fallback: valor único basado en timestamp
    return `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }, [propValue, children]);

  return (
    <TabsTrigger value={value} className={cn("flex items-center gap-2", className)}>
      {children}
    </TabsTrigger>
  );
}

// Componente TabPanels
export function TabPanels({ children }: TabPanelsProps) {
  return <>{children}</>;
}

// Componente TabPanel
export function TabPanel({ children, value: propValue, className }: TabPanelProps) {
  const { selectedValue } = useTabGroupContext();
  
  // Inferir el valor del panel basado en children si no se proporciona
  const value = React.useMemo(() => {
    if (propValue) return propValue;
    
    // Extraer texto si es un string
    if (typeof children === 'string') {
      return children.toLowerCase().replace(/\s+/g, '-');
    }
    
    // Generamos el valor único para este panel
    return `panel-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }, [propValue, children]);

  return (
    <TabsContent value={value} className={cn("p-4", className)}>
      {children}
    </TabsContent>
  );
} 