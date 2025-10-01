import { Router } from 'express';
import usersRouter from './users';
import auditRouter from './audit';

const router = Router();

// Mount sub-routers
router.use('/users', usersRouter);
router.use('/audit', auditRouter);

export default router;
