import { Router } from 'express';
import usersRouter from './users';
import auditRouter from './audit';
import auditLogsRouter from './audit-logs';
import permissionsRouter from './permissions';
import dashboardRouter from './dashboard';
import settingsRouter from './settings';

const router = Router();

// Mount sub-routers
router.use('/users', usersRouter);
router.use('/audit', auditRouter);
router.use('/audit-logs', auditLogsRouter);
router.use('/permissions', permissionsRouter);
router.use('/dashboard', dashboardRouter);
router.use('/settings', settingsRouter);

export default router;
