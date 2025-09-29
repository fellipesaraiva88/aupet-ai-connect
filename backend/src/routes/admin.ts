import { Router } from 'express';
import adminOrganizationsRouter from './admin-organizations';
import adminUsersRouter from './admin-users';
import adminStatsRouter from './admin-stats';
import adminTokensRouter from './admin-tokens';

/**
 * Main admin router
 * All routes under /api/admin/*
 */
const router = Router();

// Mount sub-routers
router.use('/organizations', adminOrganizationsRouter);
router.use('/users', adminUsersRouter);
router.use('/stats', adminStatsRouter);
router.use('/logs', adminStatsRouter); // Logs are in the stats router
router.use('/tokens', adminTokensRouter); // Token usage monitoring

// Health check for admin area
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      service: 'admin',
      status: 'healthy',
      timestamp: new Date().toISOString()
    }
  });
});

export default router;