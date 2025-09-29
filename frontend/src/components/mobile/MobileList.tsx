import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  ChevronDown,
  Loader2
} from 'lucide-react';

interface MobileListItem {
  id: string | number;
  title: string;
  subtitle?: string;
  description?: string;
  avatar?: string;
  image?: string;
  badge?: string | number;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  metadata?: Record<string, any>;
  timestamp?: Date | string;
  isNew?: boolean;
  isFavorite?: boolean;
}

interface MobileListProps<T extends MobileListItem> {
  items: T[];
  onItemClick?: (item: T) => void;
  onItemLongPress?: (item: T) => void;
  onItemSwipeLeft?: (item: T) => void;
  onItemSwipeRight?: (item: T) => void;
  onRefresh?: () => Promise<void>;
  onLoadMore?: () => Promise<void>;
  searchEnabled?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  sortEnabled?: boolean;
  sortOptions?: Array<{
    key: keyof T;
    label: string;
    direction?: 'asc' | 'desc';
  }>;
  filterEnabled?: boolean;
  filterOptions?: Array<{
    key: string;
    label: string;
    value: any;
  }>;
  virtualScrolling?: boolean;
  itemHeight?: number;
  isLoading?: boolean;
  hasMore?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ComponentType<{ className?: string }>;
  className?: string;
  itemClassName?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

export function MobileList<T extends MobileListItem>({
  items,
  onItemClick,
  onItemLongPress,
  onItemSwipeLeft,
  onItemSwipeRight,
  onRefresh,
  onLoadMore,
  searchEnabled = true,
  searchPlaceholder = 'Buscar...',
  searchKeys = ['title', 'subtitle', 'description'],
  sortEnabled = false,
  sortOptions = [],
  filterEnabled = false,
  filterOptions = [],
  virtualScrolling = false,
  itemHeight = 80,
  isLoading = false,
  hasMore = false,
  emptyTitle = 'Nenhum item encontrado',
  emptyDescription = 'Não há itens para exibir no momento.',
  emptyIcon: EmptyIcon,
  className,
  itemClassName,
  variant = 'default'
}: MobileListProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let result = items;

    // Apply search
    if (searchQuery) {
      result = result.filter(item =>
        searchKeys.some(key => {
          const value = item[key];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchQuery.toLowerCase());
          }
          return false;
        })
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        result = result.filter(item => item.metadata?.[key] === value);
      }
    });

    // Apply sorting
    if (sortBy) {
      result.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];

        let comparison = 0;
        if (aValue > bValue) comparison = 1;
        if (aValue < bValue) comparison = -1;

        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [items, searchQuery, searchKeys, activeFilters, sortBy, sortDirection]);

  // Pull to refresh handler
  const handlePullToRefresh = useCallback(async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    }
  }, [onRefresh, isRefreshing]);

  // Load more handler
  const handleLoadMore = useCallback(async () => {
    if (onLoadMore && !isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      try {
        await onLoadMore();
      } finally {
        setIsLoadingMore(false);
      }
    }
  }, [onLoadMore, isLoadingMore, hasMore]);

  // Scroll handler for infinite loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

    if (isNearBottom && hasMore && !isLoadingMore) {
      handleLoadMore();
    }
  }, [hasMore, isLoadingMore, handleLoadMore]);

  // Touch handlers for pull to refresh
  const [touchStart, setTouchStart] = useState<number>(0);
  const [touchCurrent, setTouchCurrent] = useState<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const current = e.touches[0].clientY;
    setTouchCurrent(current);

    // Only allow pull down if at top of list
    const container = e.currentTarget;
    if (container.scrollTop === 0 && current > touchStart) {
      const distance = Math.min(current - touchStart, 100);
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      handlePullToRefresh();
    } else {
      setPullDistance(0);
    }
    setTouchStart(0);
    setTouchCurrent(0);
  };

  // Render list item
  const renderItem = (item: T, index: number) => {
    return (
      <motion.div
        key={item.id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.2, delay: index * 0.02 }}
        className={cn(
          'mobile-list-item',
          itemClassName
        )}
      >
        <MobileListItem
          item={item}
          onClick={() => onItemClick?.(item)}
          onLongPress={() => onItemLongPress?.(item)}
          onSwipeLeft={() => onItemSwipeLeft?.(item)}
          onSwipeRight={() => onItemSwipeRight?.(item)}
          variant={variant}
        />
      </motion.div>
    );
  };

  return (
    <div className={cn('mobile-list', className)}>
      {/* Header with Search and Actions */}
      {(searchEnabled || sortEnabled || filterEnabled) && (
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 p-4 space-y-3 z-10">
          {searchEnabled && (
            <div className="relative">
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          )}

          {(sortEnabled || filterEnabled) && (
            <div className="flex space-x-2">
              {sortEnabled && sortOptions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Toggle sort logic here
                  }}
                  className="flex items-center space-x-1"
                >
                  {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  <span>Ordenar</span>
                </Button>
              )}

              {filterEnabled && filterOptions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filtros</span>
                  {Object.keys(activeFilters).length > 0 && (
                    <Badge variant="destructive" className="ml-1">
                      {Object.keys(activeFilters).length}
                    </Badge>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pull to Refresh Indicator */}
      <AnimatePresence>
        {pullDistance > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-4 text-sm text-gray-500"
            style={{ transform: `translateY(${Math.min(pullDistance, 60)}px)` }}
          >
            {pullDistance > 60 ? (
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Solte para atualizar</span>
              </div>
            ) : (
              <span>Puxe para atualizar</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* List Content */}
      <div
        className="flex-1 overflow-auto"
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            {EmptyIcon && <EmptyIcon className="h-16 w-16 text-gray-300 mb-4" />}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{emptyTitle}</h3>
            <p className="text-gray-500 mb-4">{emptyDescription}</p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery('')}
                className="mt-2"
              >
                Limpar busca
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            <AnimatePresence>
              {filteredItems.map((item, index) => renderItem(item, index))}
            </AnimatePresence>
          </div>
        )}

        {/* Load More Indicator */}
        {isLoadingMore && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <span className="ml-2 text-sm text-gray-500">Carregando mais...</span>
          </div>
        )}

        {hasMore && !isLoadingMore && filteredItems.length > 0 && (
          <div className="flex items-center justify-center py-4">
            <Button
              variant="ghost"
              onClick={handleLoadMore}
              className="flex items-center space-x-2"
            >
              <ChevronDown className="h-4 w-4" />
              <span>Carregar mais</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Individual list item component
function MobileListItem<T extends MobileListItem>({
  item,
  onClick,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  variant = 'default'
}: {
  item: T;
  onClick?: () => void;
  onLongPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
}) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <motion.div
      className={cn(
        'flex items-center p-4 bg-white hover:bg-gray-50 active:bg-gray-100 cursor-pointer select-none',
        variant === 'compact' && 'py-3',
        variant === 'detailed' && 'py-5'
      )}
      whileTap={{ scale: 0.98 }}
      onTap={onClick}
      onPanStart={() => setIsPressed(true)}
      onPanEnd={() => setIsPressed(false)}
    >
      {/* Avatar/Image */}
      {(item.avatar || item.image) && (
        <div className="flex-shrink-0 mr-3">
          <div className={cn(
            'rounded-full bg-gray-200 overflow-hidden',
            variant === 'compact' ? 'h-10 w-10' : 'h-12 w-12'
          )}>
            <img
              src={item.avatar || item.image}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className={cn(
            'font-medium text-gray-900 truncate',
            variant === 'compact' ? 'text-sm' : 'text-base'
          )}>
            {item.title}
            {item.isNew && (
              <Badge variant="destructive" className="ml-2 text-xs">
                Novo
              </Badge>
            )}
          </h3>

          {item.badge && (
            <Badge variant={item.badgeVariant} className="ml-2 flex-shrink-0">
              {item.badge}
            </Badge>
          )}
        </div>

        {item.subtitle && (
          <p className={cn(
            'text-gray-600 truncate',
            variant === 'compact' ? 'text-xs' : 'text-sm'
          )}>
            {item.subtitle}
          </p>
        )}

        {item.description && variant === 'detailed' && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {item.description}
          </p>
        )}

        {item.timestamp && (
          <p className="text-xs text-gray-400 mt-1">
            {typeof item.timestamp === 'string'
              ? item.timestamp
              : item.timestamp.toLocaleString()
            }
          </p>
        )}
      </div>

      {/* Favorite indicator */}
      {item.isFavorite && (
        <div className="flex-shrink-0 ml-2">
          <span className="text-red-500">❤️</span>
        </div>
      )}
    </motion.div>
  );
}