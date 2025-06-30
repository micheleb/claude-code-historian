import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

interface SearchBarProps {
  placeholder?: string;
}

export function SearchBar({ placeholder = "Search conversations..." }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-12 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <Search 
        size={18} 
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
      />
      <button
        type="submit"
        disabled={!query.trim()}
        className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-md transition-colors ${
          query.trim() 
            ? 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer' 
            : 'text-gray-300 cursor-not-allowed'
        }`}
        title={query.trim() ? 'Search' : 'Enter search query'}
      >
        <Search size={16} />
      </button>
    </form>
  );
}