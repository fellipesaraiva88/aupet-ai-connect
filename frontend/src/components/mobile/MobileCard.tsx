import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Heart, Share, MoreHorizontal, Trash2, Edit, Star } from 'lucide-react';

interface MobileCardProps {
  title: string;
  description?: string;
  content?: React.ReactNode;
  image?: string;
  avatar?: string;
  badge?: string | number;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  onTap?: () => void;
  onLongPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onFavorite?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  swipeEnabled?: boolean;
  pressEnabled?: boolean;
  favoriteEnabled?: boolean;
  shareEnabled?: boolean;
  isFavorited?: boolean;
  isLoading?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'elevated' | 'gradient';
}

export function MobileCard({
  title,
  description,
  content,
  image,
  avatar,
  badge,
  badgeVariant = 'default',
  onTap,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  onFavorite,
  onShare,
  onEdit,
  onDelete,
  swipeEnabled = true,
  pressEnabled = true,
  favoriteEnabled = true,
  shareEnabled = true,
  isFavorited = false,
  isLoading = false,
  className,
  variant = 'default'
}: MobileCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const controls = useAnimation();

  // Gesture handlers
  const handlePanStart = useCallback(() => {
    if (swipeEnabled) {
      setSwipeProgress(0);
    }
  }, [swipeEnabled]);

  const handlePan = useCallback((event: any, info: PanInfo) => {
    if (!swipeEnabled) return;

    const progress = Math.abs(info.offset.x) / 100;
    setSwipeProgress(Math.min(progress, 1));
  }, [swipeEnabled]);

  const handlePanEnd = useCallback((event: any, info: PanInfo) => {
    if (!swipeEnabled) return;

    const threshold = 80;
    const velocity = Math.abs(info.velocity.x);

    if (Math.abs(info.offset.x) > threshold || velocity > 500) {
      if (info.offset.x > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (info.offset.x < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    // Reset position
    controls.start({ x: 0 });
    setSwipeProgress(0);
  }, [swipeEnabled, onSwipeLeft, onSwipeRight, controls]);

  const handleTap = useCallback(() => {
    if (onTap && pressEnabled) {
      // Add haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
      onTap();
    }
  }, [onTap, pressEnabled]);

  const handleLongPress = useCallback(() => {
    if (onLongPress && pressEnabled) {
      // Add haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 100, 50]);
      }
      onLongPress();
    }
  }, [onLongPress, pressEnabled]);

  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return 'p-3 shadow-sm border border-gray-200';
      case 'elevated':
        return 'p-4 shadow-lg border-0 bg-white';
      case 'gradient':
        return 'p-4 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 shadow-md';
      default:
        return 'p-4 shadow-md border border-gray-200';
    }
  };

  return (
    <motion.div
      drag={swipeEnabled ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onPanStart={handlePanStart}
      onPan={handlePan}
      onPanEnd={handlePanEnd}
      animate={controls}
      whileTap={pressEnabled ? { scale: 0.98 } : {}}
      whileHover={pressEnabled ? { scale: 1.02 } : {}}
      onTap={handleTap}
      onLongPress={handleLongPress}
      className={cn(
        'relative cursor-pointer select-none',
        isPressed && 'scale-98',
        className
      )}
      layout
    >
      {/* Swipe Actions Background */}
      {swipeEnabled && (onSwipeLeft || onSwipeRight) && (
        <div className="absolute inset-0 flex items-center justify-between px-4 rounded-lg overflow-hidden">
          {onSwipeRight && (
            <motion.div
              className="flex items-center space-x-2 text-green-600"
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: swipeProgress > 0.3 ? 1 : 0,
                x: swipeProgress > 0.3 ? 0 : -20
              }}
            >
              <Heart className="h-5 w-5" />
              <span className="font-medium">Favoritar</span>
            </motion.div>
          )}

          {onSwipeLeft && (
            <motion.div
              className="flex items-center space-x-2 text-red-600 ml-auto"
              initial={{ opacity: 0, x: 20 }}
              animate={{
                opacity: swipeProgress > 0.3 ? 1 : 0,
                x: swipeProgress > 0.3 ? 0 : 20
              }}
            >
              <span className="font-medium">Excluir</span>
              <Trash2 className="h-5 w-5" />
            </motion.div>
          )}
        </div>
      )}

      {/* Main Card */}
      <Card className={cn(
        'relative overflow-hidden transition-all duration-300',
        getVariantStyles(),
        isLoading && 'opacity-60 pointer-events-none'
      )}>
        {/* Image */}
        {image && (
          <div className="relative h-48 -m-4 mb-4 overflow-hidden">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />

            {/* Image Overlay Actions */}
            <div className="absolute top-2 right-2 flex space-x-1">
              {favoriteEnabled && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 rounded-full bg-white/90 backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFavorite?.();
                  }}
                >
                  <Heart
                    className={cn(
                      'h-4 w-4',
                      isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'
                    )}
                  />
                </Button>
              )}

              {shareEnabled && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 rounded-full bg-white/90 backdrop-blur-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare?.();
                  }}
                >
                  <Share className="h-4 w-4 text-gray-600" />
                </Button>
              )}
            </div>

            {/* Badge on Image */}
            {badge && (
              <div className="absolute top-2 left-2">
                <Badge variant={badgeVariant} className="shadow-md">
                  {badge}
                </Badge>
              </div>
            )}
          </div>
        )}

        <CardHeader className={cn(
          variant === 'compact' ? 'p-0 pb-2' : 'p-0 pb-3'
        )}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className={cn(
                'line-clamp-2',
                variant === 'compact' ? 'text-base' : 'text-lg'
              )}>
                {title}
              </CardTitle>

              {description && (
                <CardDescription className={cn(
                  'mt-1 line-clamp-2',
                  variant === 'compact' ? 'text-xs' : 'text-sm'
                )}>
                  {description}
                </CardDescription>
              )}
            </div>

            {!image && badge && (
              <Badge variant={badgeVariant} className="ml-2 flex-shrink-0">
                {badge}
              </Badge>
            )}
          </div>

          {/* Avatar Row */}
          {avatar && (
            <div className="flex items-center space-x-2 mt-2">
              <img
                src={avatar}
                alt=""
                className="h-6 w-6 rounded-full object-cover"
              />
              <span className="text-xs text-gray-500">Pet Care Team</span>
            </div>
          )}
        </CardHeader>

        {content && (
          <CardContent className={cn(
            variant === 'compact' ? 'p-0 pt-2' : 'p-0 pt-3'
          )}>
            {content}
          </CardContent>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
          </div>
        )}
      </Card>

      {/* Swipe Progress Indicator */}
      {swipeEnabled && swipeProgress > 0 && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-blue-500 rounded-full"
          style={{ width: `${swipeProgress * 100}%` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
    </motion.div>
  );
}

// Specialized card variants
export function PetCard({
  petName,
  ownerName,
  breed,
  age,
  image,
  lastVisit,
  onTap,
  className,
  ...props
}: {
  petName: string;
  ownerName: string;
  breed?: string;
  age?: string;
  image?: string;
  lastVisit?: string;
  onTap?: () => void;
  className?: string;
} & Omit<MobileCardProps, 'title' | 'description' | 'content'>) {
  return (
    <MobileCard
      title={petName}
      description={`Tutor: ${ownerName}`}
      image={image}
      onTap={onTap}
      className={cn('pet-card', className)}
      content={
        <div className="space-y-2 text-sm">
          {breed && (
            <div className="flex justify-between">
              <span className="text-gray-500">Raça:</span>
              <span className="font-medium">{breed}</span>
            </div>
          )}
          {age && (
            <div className="flex justify-between">
              <span className="text-gray-500">Idade:</span>
              <span className="font-medium">{age}</span>
            </div>
          )}
          {lastVisit && (
            <div className="flex justify-between">
              <span className="text-gray-500">Última visita:</span>
              <span className="font-medium text-blue-600">{lastVisit}</span>
            </div>
          )}
        </div>
      }
      {...props}
    />
  );
}

export function CustomerCard({
  customerName,
  phone,
  email,
  petsCount,
  lastMessage,
  avatar,
  onTap,
  className,
  ...props
}: {
  customerName: string;
  phone?: string;
  email?: string;
  petsCount?: number;
  lastMessage?: string;
  avatar?: string;
  onTap?: () => void;
  className?: string;
} & Omit<MobileCardProps, 'title' | 'description' | 'content'>) {
  return (
    <MobileCard
      title={customerName}
      description={lastMessage ? `"${lastMessage}"` : phone}
      avatar={avatar}
      onTap={onTap}
      className={cn('customer-card', className)}
      badge={petsCount ? `${petsCount} pets` : undefined}
      content={
        <div className="space-y-1 text-sm">
          {phone && (
            <div className="flex items-center text-gray-600">
              <span>📞 {phone}</span>
            </div>
          )}
          {email && (
            <div className="flex items-center text-gray-600">
              <span>✉️ {email}</span>
            </div>
          )}
        </div>
      }
      {...props}
    />
  );
}