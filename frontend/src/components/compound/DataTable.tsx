import React, { createContext, useContext, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown, Search, Filter } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useVirtualScroll } from '@/hooks/useVirtualScroll';

interface Column<T = any> {
  key: string;
  title: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: number | string;
  className?: string;
  accessor?: (record: T) => any;
}

interface DataTableContextValue<T = any> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  selectedRows?: Set<string | number>;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onSelect?: (key: string | number, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  getRowKey?: (record: T, index: number) => string | number;
}

const DataTableContext = createContext<DataTableContextValue | null>(null);

function useDataTable() {
  const context = useContext(DataTableContext);
  if (!context) {
    throw new Error('DataTable components must be used within DataTable');
  }
  return context;
}

interface DataTableProps<T = any> {
  children: React.ReactNode;
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  selectedRows?: Set<string | number>;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onSelect?: (key: string | number, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  getRowKey?: (record: T, index: number) => string | number;
  className?: string;
}

function DataTable<T = any>({
  children,
  data,
  columns,
  loading = false,
  sortBy,
  sortDirection,
  selectedRows,
  onSort,
  onSelect,
  onSelectAll,
  getRowKey = (_, index) => index,
  className
}: DataTableProps<T>) {
  const contextValue = useMemo(() => ({
    data,
    columns,
    loading,
    sortBy,
    sortDirection,
    selectedRows,
    onSort,
    onSelect,
    onSelectAll,
    getRowKey
  }), [data, columns, loading, sortBy, sortDirection, selectedRows, onSort, onSelect, onSelectAll, getRowKey]);

  return (
    <DataTableContext.Provider value={contextValue}>
      <div className={cn('rounded-md border', className)}>
        {children}
      </div>
    </DataTableContext.Provider>
  );
}

interface DataTableHeaderProps {
  children?: React.ReactNode;
  showSearch?: boolean;
  showFilter?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  onFilter?: () => void;
}

function DataTableHeader({
  children,
  showSearch = false,
  showFilter = false,
  searchPlaceholder = 'Search...',
  onSearch,
  onFilter
}: DataTableHeaderProps) {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  if (!showSearch && !showFilter && !children) return null;

  return (
    <div className="p-4 border-b bg-muted/50">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          {showSearch && (
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
          {showFilter && (
            <Button variant="outline" size="sm" onClick={onFilter}>
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

function DataTableContent() {
  const { data, columns, loading, sortBy, sortDirection, selectedRows, onSort, onSelect, onSelectAll, getRowKey } = useDataTable();

  const hasSelection = onSelect || onSelectAll;
  const allSelected = selectedRows && data.length > 0 && data.every((record, index) => selectedRows.has(getRowKey(record, index)));
  const someSelected = selectedRows && selectedRows.size > 0;

  const handleSort = (key: string) => {
    if (!onSort) return;

    let direction: 'asc' | 'desc' = 'asc';
    if (sortBy === key && sortDirection === 'asc') {
      direction = 'desc';
    }

    onSort(key, direction);
  };

  const handleSelectAll = (checked: boolean) => {
    onSelectAll?.(checked);
  };

  const handleSelectRow = (record: any, index: number) => {
    const key = getRowKey(record, index);
    const isSelected = selectedRows?.has(key) || false;
    onSelect?.(key, !isSelected);
  };

  const renderSortIcon = (key: string) => {
    if (sortBy !== key) return <ChevronsUpDown className="h-4 w-4 ml-2" />;
    if (sortDirection === 'asc') return <ChevronUp className="h-4 w-4 ml-2" />;
    return <ChevronDown className="h-4 w-4 ml-2" />;
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          Loading data...
        </div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {hasSelection && (
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected && !allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all rows"
              />
            </TableHead>
          )}
          {columns.map((column) => (
            <TableHead
              key={column.key}
              className={cn(column.className, column.sortable && 'cursor-pointer hover:bg-muted/50')}
              style={{ width: column.width }}
              onClick={column.sortable ? () => handleSort(column.key) : undefined}
            >
              <div className="flex items-center">
                {column.title}
                {column.sortable && renderSortIcon(column.key)}
              </div>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={columns.length + (hasSelection ? 1 : 0)}
              className="text-center py-8 text-muted-foreground"
            >
              No data available
            </TableCell>
          </TableRow>
        ) : (
          data.map((record, index) => {
            const rowKey = getRowKey(record, index);
            const isSelected = selectedRows?.has(rowKey) || false;

            return (
              <TableRow
                key={rowKey}
                className={cn(isSelected && 'bg-muted/50')}
                onClick={hasSelection ? () => handleSelectRow(record, index) : undefined}
              >
                {hasSelection && (
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onSelect?.(rowKey, checked as boolean)}
                      aria-label={`Select row ${index + 1}`}
                    />
                  </TableCell>
                )}
                {columns.map((column) => {
                  const value = column.accessor ? column.accessor(record) : record[column.key];
                  const rendered = column.render ? column.render(value, record, index) : value;

                  return (
                    <TableCell key={column.key} className={column.className}>
                      {rendered}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

interface DataTableFooterProps {
  children?: React.ReactNode;
  showSelection?: boolean;
}

function DataTableFooter({ children, showSelection = true }: DataTableFooterProps) {
  const { data, selectedRows } = useDataTable();

  if (!children && (!showSelection || !selectedRows || selectedRows.size === 0)) return null;

  return (
    <div className="p-4 border-t bg-muted/50">
      <div className="flex items-center justify-between">
        {showSelection && selectedRows && selectedRows.size > 0 && (
          <div className="text-sm text-muted-foreground">
            <Badge variant="secondary">
              {selectedRows.size} of {data.length} selected
            </Badge>
          </div>
        )}
        {children && (
          <div className="flex items-center gap-2">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

// Virtual scrolling variant for large datasets
interface VirtualDataTableProps<T = any> extends Omit<DataTableProps<T>, 'children'> {
  itemHeight: number;
  containerHeight: number;
}

function VirtualDataTable<T = any>({
  data,
  columns,
  itemHeight,
  containerHeight,
  ...props
}: VirtualDataTableProps<T>) {
  const { virtualItems, totalHeight, scrollElementProps, containerProps } = useVirtualScroll({
    itemHeight,
    containerHeight,
    items: data,
  });

  const { loading, sortBy, sortDirection, selectedRows, onSort, onSelect, onSelectAll, getRowKey } = props;
  const hasSelection = onSelect || onSelectAll;

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          Loading data...
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <div {...scrollElementProps}>
        <div {...containerProps}>
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                {hasSelection && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={data.length > 0 && data.every((record, index) => selectedRows?.has(getRowKey?.(record, index) || index))}
                      onCheckedChange={onSelectAll}
                      aria-label="Select all rows"
                    />
                  </TableHead>
                )}
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(column.className, column.sortable && 'cursor-pointer hover:bg-muted/50')}
                    style={{ width: column.width }}
                    onClick={column.sortable ? () => onSort?.(column.key, sortBy === column.key && sortDirection === 'asc' ? 'desc' : 'asc') : undefined}
                  >
                    <div className="flex items-center">
                      {column.title}
                      {column.sortable && (
                        sortBy === column.key
                          ? sortDirection === 'asc'
                            ? <ChevronUp className="h-4 w-4 ml-2" />
                            : <ChevronDown className="h-4 w-4 ml-2" />
                          : <ChevronsUpDown className="h-4 w-4 ml-2" />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {virtualItems.map(({ index, offsetTop, item: record }) => {
                const rowKey = getRowKey?.(record, index) || index;
                const isSelected = selectedRows?.has(rowKey) || false;

                return (
                  <TableRow
                    key={rowKey}
                    className={cn(isSelected && 'bg-muted/50', 'absolute w-full')}
                    style={{ top: offsetTop, height: itemHeight }}
                  >
                    {hasSelection && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => onSelect?.(rowKey, checked as boolean)}
                          aria-label={`Select row ${index + 1}`}
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => {
                      const value = column.accessor ? column.accessor(record) : record[column.key];
                      const rendered = column.render ? column.render(value, record, index) : value;

                      return (
                        <TableCell key={column.key} className={column.className}>
                          {rendered}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// Export compound components
DataTable.Header = DataTableHeader;
DataTable.Content = DataTableContent;
DataTable.Footer = DataTableFooter;
DataTable.Virtual = VirtualDataTable;

export { DataTable, type Column };
export default DataTable;