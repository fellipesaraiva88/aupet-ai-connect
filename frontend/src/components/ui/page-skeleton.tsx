import React from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 }
  }
};

export const PageSkeleton: React.FC = () => {
  return (
    <motion.div
      className="min-h-screen bg-background"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Skeleton */}
      <motion.div variants={itemVariants} className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-10 w-32" variant="shimmer" />
              <div className="hidden md:flex space-x-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-20" variant="wave" />
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" variant="pulse" />
              <Skeleton className="h-8 w-24" variant="shimmer" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content Skeleton */}
      <div className="flex">
        {/* Sidebar Skeleton */}
        <motion.div variants={itemVariants} className="w-64 bg-card border-r">
          <div className="p-6 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-5 w-5" variant="wave" />
                <Skeleton className="h-4 w-24" variant="shimmer" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Content Area */}
        <motion.div variants={itemVariants} className="flex-1 p-8">
          <div className="space-y-6">
            {/* Page Title */}
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" variant="shimmer" />
              <Skeleton className="h-4 w-96" variant="wave" />
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <motion.div key={i} variants={itemVariants}>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-lg" variant="pulse" />
                        <div className="space-y-2">
                          <Skeleton className="h-8 w-16" variant="shimmer" />
                          <Skeleton className="h-4 w-24" variant="wave" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Main Content Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Large Card */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" variant="shimmer" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-10 rounded-full" variant="pulse" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" variant="wave" />
                          <Skeleton className="h-3 w-1/2" variant="shimmer" />
                        </div>
                        <Skeleton className="h-6 w-16" variant="pulse" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Sidebar Card */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" variant="shimmer" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" variant="wave" />
                        <Skeleton className="h-6 w-12" variant="pulse" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};