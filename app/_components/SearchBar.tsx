'use client';

import { TextInput, Button } from '@tremor/react';
import { Search, XCircle, Plus } from 'lucide-react';

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
    <div className="flex gap-2 flex-col sm:flex-row mb-6">
      <div className="relative flex-1">
        <TextInput
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          icon={Search}
        />
        {searchTerm && (
          <button
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
            onClick={handleClearSearch}
          >
            <XCircle className="w-5 h-5" />
          </button> 
        )}
      </div>
      <Button icon={Plus} onClick={onAddNew}>
        {addButtonLabel}
      </Button>
    </div>
  );
} 