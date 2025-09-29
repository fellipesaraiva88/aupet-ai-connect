import { useState, useEffect, useMemo, useCallback } from 'react';

interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  items: any[];
  overscan?: number;
}

interface VirtualScrollResult {
  virtualItems: Array<{
    index: number;
    offsetTop: number;
    item: any;
  }>;
  totalHeight: number;
  scrollElementProps: {
    style: React.CSSProperties;
    onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  };
  containerProps: {
    style: React.CSSProperties;
  };
}

export function useVirtualScroll({
  itemHeight,
  containerHeight,
  items,
  overscan = 5
}: VirtualScrollOptions): VirtualScrollResult {
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const virtualItems = useMemo(() => {
    const visibleItemsCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + visibleItemsCount + overscan,
      items.length - 1
    );

    const actualStartIndex = Math.max(0, startIndex - overscan);

    return Array.from({ length: endIndex - actualStartIndex + 1 }, (_, i) => {
      const index = actualStartIndex + i;
      return {
        index,
        offsetTop: index * itemHeight,
        item: items[index],
      };
    });
  }, [scrollTop, itemHeight, containerHeight, items, overscan]);

  const totalHeight = items.length * itemHeight;

  return {
    virtualItems,
    totalHeight,
    scrollElementProps: {
      style: {
        height: containerHeight,
        overflow: 'auto',
      },
      onScroll: handleScroll,
    },
    containerProps: {
      style: {
        height: totalHeight,
        position: 'relative',
      },
    },
  };
}

// Dynamic height virtual scrolling
interface DynamicVirtualScrollOptions {
  items: any[];
  estimatedItemHeight: number;
  getItemHeight: (index: number) => number;
  containerHeight: number;
  overscan?: number;
}

export function useDynamicVirtualScroll({
  items,
  estimatedItemHeight,
  getItemHeight,
  containerHeight,
  overscan = 5
}: DynamicVirtualScrollOptions) {
  const [scrollTop, setScrollTop] = useState(0);
  const [measuredHeights, setMeasuredHeights] = useState<Record<number, number>>({});

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const measureItem = useCallback((index: number, height: number) => {
    setMeasuredHeights(prev => ({
      ...prev,
      [index]: height
    }));
  }, []);

  const virtualItems = useMemo(() => {
    const itemOffsets: number[] = [0];
    let currentOffset = 0;

    // Calculate offsets for all items
    for (let i = 0; i < items.length; i++) {
      const height = measuredHeights[i] || estimatedItemHeight;
      currentOffset += height;
      itemOffsets.push(currentOffset);
    }

    // Find visible range
    let startIndex = 0;
    let endIndex = items.length - 1;

    for (let i = 0; i < itemOffsets.length - 1; i++) {
      if (itemOffsets[i + 1] > scrollTop) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
    }

    for (let i = startIndex; i < itemOffsets.length - 1; i++) {
      if (itemOffsets[i] > scrollTop + containerHeight) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }
    }

    return Array.from({ length: endIndex - startIndex + 1 }, (_, i) => {
      const index = startIndex + i;
      return {
        index,
        offsetTop: itemOffsets[index],
        item: items[index],
        height: measuredHeights[index] || estimatedItemHeight,
      };
    });
  }, [scrollTop, items, measuredHeights, estimatedItemHeight, containerHeight, overscan]);

  const totalHeight = useMemo(() => {
    return items.reduce((acc, _, index) => {
      return acc + (measuredHeights[index] || estimatedItemHeight);
    }, 0);
  }, [items, measuredHeights, estimatedItemHeight]);

  return {
    virtualItems,
    totalHeight,
    measureItem,
    scrollElementProps: {
      style: {
        height: containerHeight,
        overflow: 'auto',
      },
      onScroll: handleScroll,
    },
    containerProps: {
      style: {
        height: totalHeight,
        position: 'relative',
      },
    },
  };
}