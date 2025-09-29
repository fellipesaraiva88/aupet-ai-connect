import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { Search, Filter, X, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string | number;
  label: string;
  count?: number;
}

interface FilterGroup {
  key: string;
  title: string;
  options: FilterOption[];
  multiple?: boolean;
  type?: 'checkbox' | 'radio' | 'range';
}

interface SearchFilterContextValue {
  searchQuery: string;
  activeFilters: Record<string, any>;
  filterGroups: FilterGroup[];
  onSearchChange: (query: string) => void;
  onFilterChange: (key: string, value: any) => void;
  onFilterRemove: (key: string, value?: any) => void;
  onClearAll: () => void;
  isFilterActive: (key: string, value?: any) => boolean;
  getActiveFilterCount: () => number;
}

const SearchFilterContext = createContext<SearchFilterContextValue | null>(null);

function useSearchFilter() {
  const context = useContext(SearchFilterContext);
  if (!context) {
    throw new Error('SearchFilter components must be used within SearchFilter');
  }
  return context;
}

interface SearchFilterProps {
  children: React.ReactNode;
  searchQuery?: string;
  activeFilters?: Record<string, any>;
  filterGroups?: FilterGroup[];
  onSearchChange?: (query: string) => void;
  onFilterChange?: (filters: Record<string, any>) => void;
  className?: string;
}

function SearchFilter({
  children,
  searchQuery: initialSearchQuery = '',
  activeFilters: initialActiveFilters = {},
  filterGroups = [],
  onSearchChange,
  onFilterChange,
  className
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [activeFilters, setActiveFilters] = useState(initialActiveFilters);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    onSearchChange?.(query);
  }, [onSearchChange]);

  const handleFilterChange = useCallback((key: string, value: any) => {
    const newFilters = { ...activeFilters };

    const filterGroup = filterGroups.find(group => group.key === key);
    if (filterGroup?.multiple) {
      if (!newFilters[key]) newFilters[key] = [];

      const currentValues = newFilters[key] as any[];
      const exists = currentValues.includes(value);

      if (exists) {
        newFilters[key] = currentValues.filter(v => v !== value);
        if (newFilters[key].length === 0) delete newFilters[key];
      } else {
        newFilters[key] = [...currentValues, value];
      }
    } else {
      if (newFilters[key] === value) {
        delete newFilters[key];
      } else {
        newFilters[key] = value;
      }
    }

    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  }, [activeFilters, filterGroups, onFilterChange]);

  const handleFilterRemove = useCallback((key: string, value?: any) => {
    const newFilters = { ...activeFilters };

    if (value !== undefined) {
      const filterGroup = filterGroups.find(group => group.key === key);
      if (filterGroup?.multiple && Array.isArray(newFilters[key])) {
        newFilters[key] = newFilters[key].filter((v: any) => v !== value);
        if (newFilters[key].length === 0) delete newFilters[key];
      } else {
        delete newFilters[key];
      }
    } else {
      delete newFilters[key];
    }

    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  }, [activeFilters, filterGroups, onFilterChange]);

  const handleClearAll = useCallback(() => {
    setSearchQuery('');
    setActiveFilters({});
    onSearchChange?.('');
    onFilterChange?.({});
  }, [onSearchChange, onFilterChange]);

  const isFilterActive = useCallback((key: string, value?: any) => {
    if (value === undefined) return key in activeFilters;

    const filterValue = activeFilters[key];
    if (Array.isArray(filterValue)) {
      return filterValue.includes(value);
    }
    return filterValue === value;
  }, [activeFilters]);

  const getActiveFilterCount = useCallback(() => {
    return Object.keys(activeFilters).reduce((count, key) => {
      const value = activeFilters[key];
      if (Array.isArray(value)) {
        return count + value.length;
      }
      return count + 1;
    }, 0) + (searchQuery ? 1 : 0);
  }, [activeFilters, searchQuery]);

  const contextValue = useMemo(() => ({
    searchQuery,
    activeFilters,
    filterGroups,
    onSearchChange: handleSearchChange,
    onFilterChange: handleFilterChange,
    onFilterRemove: handleFilterRemove,
    onClearAll: handleClearAll,
    isFilterActive,
    getActiveFilterCount
  }), [
    searchQuery,
    activeFilters,
    filterGroups,
    handleSearchChange,
    handleFilterChange,
    handleFilterRemove,
    handleClearAll,
    isFilterActive,
    getActiveFilterCount
  ]);

  return (
    <SearchFilterContext.Provider value={contextValue}>
      <div className={cn('space-y-4', className)}>
        {children}
      </div>
    </SearchFilterContext.Provider>
  );
}

interface SearchBoxProps {
  placeholder?: string;
  showIcon?: boolean;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

function SearchBox({
  placeholder = 'Search...',
  showIcon = true,
  size = 'default',
  className
}: SearchBoxProps) {
  const { searchQuery, onSearchChange } = useSearchFilter();

  const sizeClasses = {
    sm: 'h-8 text-sm',
    default: 'h-10',
    lg: 'h-12 text-lg'
  };

  return (
    <div className={cn('relative flex-1', className)}>
      {showIcon && (
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      )}
      <Input
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className={cn(sizeClasses[size], showIcon && 'pl-9')}
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSearchChange('')}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

interface FilterButtonProps {
  children?: React.ReactNode;
  showCount?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

function FilterButton({
  children,
  showCount = true,
  variant = 'outline',
  size = 'default'
}: FilterButtonProps) {
  const { getActiveFilterCount, filterGroups } = useSearchFilter();
  const activeCount = getActiveFilterCount();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Filter className="h-4 w-4" />
          {children || 'Filter'}
          {showCount && activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
              {activeCount}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <FilterDropdown />
      </PopoverContent>
    </Popover>
  );
}

function FilterDropdown() {
  const { filterGroups, activeFilters, onFilterChange, isFilterActive, onClearAll, getActiveFilterCount } = useSearchFilter();
  const activeCount = getActiveFilterCount();

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">Filters</h4>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      {filterGroups.map((group, index) => (
        <div key={group.key}>
          {index > 0 && <Separator className="my-3" />}
          <div className="space-y-2">
            <h5 className="font-medium text-sm text-muted-foreground">{group.title}</h5>
            <div className="space-y-1">
              {group.options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${group.key}-${option.value}`}
                    checked={isFilterActive(group.key, option.value)}
                    onCheckedChange={() => onFilterChange(group.key, option.value)}
                  />
                  <label
                    htmlFor={`${group.key}-${option.value}`}
                    className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {option.count !== undefined && (
                        <span className="text-xs text-muted-foreground">({option.count})</span>
                      )}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActiveFilters() {
  const { searchQuery, activeFilters, filterGroups, onSearchChange, onFilterRemove } = useSearchFilter();

  const getFilterLabel = (key: string, value: any) => {
    const group = filterGroups.find(g => g.key === key);
    if (!group) return `${key}: ${value}`;

    const option = group.options.find(o => o.value === value);
    return option ? option.label : value;
  };

  const getFilterGroupTitle = (key: string) => {
    const group = filterGroups.find(g => g.key === key);
    return group ? group.title : key;
  };

  const renderFilterBadges = () => {
    const badges = [];

    // Search query badge
    if (searchQuery) {
      badges.push(
        <Badge key="search" variant="secondary" className="gap-1">
          Search: {searchQuery}
          <X
            className="h-3 w-3 cursor-pointer hover:bg-muted-foreground/20 rounded"
            onClick={() => onSearchChange('')}
          />
        </Badge>
      );
    }

    // Filter badges
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => {
          badges.push(
            <Badge key={`${key}-${v}`} variant="secondary" className="gap-1">
              {getFilterLabel(key, v)}
              <X
                className="h-3 w-3 cursor-pointer hover:bg-muted-foreground/20 rounded"
                onClick={() => onFilterRemove(key, v)}
              />
            </Badge>
          );
        });
      } else {
        badges.push(
          <Badge key={key} variant="secondary" className="gap-1">
            {getFilterLabel(key, value)}
            <X
              className="h-3 w-3 cursor-pointer hover:bg-muted-foreground/20 rounded"
              onClick={() => onFilterRemove(key)}
            />
          </Badge>
        );
      }
    });

    return badges;
  };

  const badges = renderFilterBadges();

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {badges}
    </div>
  );
}

interface SearchFilterBarProps {
  searchPlaceholder?: string;
  showFilterButton?: boolean;
  showActiveFilters?: boolean;
  children?: React.ReactNode;
}

function SearchFilterBar({
  searchPlaceholder = 'Search...',
  showFilterButton = true,
  showActiveFilters = true,
  children
}: SearchFilterBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <SearchBox placeholder={searchPlaceholder} />
        {showFilterButton && <FilterButton />}
        {children}
      </div>
      {showActiveFilters && <ActiveFilters />}
    </div>
  );
}

// Export compound components
SearchFilter.Box = SearchBox;
SearchFilter.Button = FilterButton;
SearchFilter.Dropdown = FilterDropdown;
SearchFilter.ActiveFilters = ActiveFilters;
SearchFilter.Bar = SearchFilterBar;

export { SearchFilter, type FilterGroup, type FilterOption };
export default SearchFilter;