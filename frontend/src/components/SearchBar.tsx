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
        className="w-full pl-10 pr-20 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
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
        className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1.5 rounded-md transition-colors text-sm font-medium ${
          query.trim() 
            ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer' 
            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
        }`}
        title={query.trim() ? 'Search' : 'Enter search query'}
      >
        Search
      </button>
    </form>
  );
}