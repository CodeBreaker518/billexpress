'use client';

import { Search, XCircle, Plus } from 'lucide-react';
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddNew: () => void;
  placeholder?: string;
  addButtonLabel?: string;
}

export default function SearchBar({
  searchTerm,
  onSearchChange,
  onAddNew,
  placeholder = 'Buscar...',
  addButtonLabel = 'Agregar nuevo'
}: SearchBarProps) {
  const handleClearSearch = () => {
    onSearchChange('');
  };

  return (
    <div className="flex gap-2 flex-col sm:flex-row mb-4 sm:mb-6">
      <div className="relative flex-1">
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500/70" />
        {searchTerm && (
          <button
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={handleClearSearch}
            aria-label="Limpiar búsqueda"
          >
            <XCircle className="w-4 h-4" />
          </button> 
        )}
      </div>
      <Button 
        onClick={onAddNew}
        className="text-xs sm:text-sm"
      >
        <Plus className="w-4 h-4 mr-2" />
        <span className="hidden xs:inline">{addButtonLabel}</span>
        <span className="xs:hidden">Agregar</span>
      </Button>
    </div>
  );
} 