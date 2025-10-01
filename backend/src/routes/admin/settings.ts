import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../../middleware/errorHandler';
import { requireSuperAdmin } from '../../middleware/permissions';
import { SupabaseService } from '../../services/supabase';
import { logger } from '../../utils/logger';
import { ApiResponse } from '../../types';
import nodemailer from 'nodemailer';
import axios from 'axios';

const router = Router();
let supabaseService: SupabaseService;

const getSupabaseService = () => {
  if (!supabaseService) {
    supabaseService = new SupabaseService();
  }
  return supabaseService;
};

// GET /admin/settings - Get all settings
router.get('/', requireSuperAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { data: settings, error } = await getSupabaseService().supabase
    .from('system_settings')
    .select('*')
    .order('category', { ascending: true });

  if (error) throw error;

  // Group by category
  const grouped = (settings || []).reduce((acc: any, setting: any) => {
    if (!acc[setting.category]) {
      acc[setting.category] = {};
    }
    acc[setting.category][setting.key] = setting.value;
    return acc;
  }, {});

  res.json({ success: true, data: grouped, timestamp: new Date().toISOString() });
}));

// PUT /admin/settings - Update settings
router.put('/', requireSuperAdmin, asyncHandler(async (req: Request, res: Response) => {
  const updates = req.body;

  for (const [key, value] of Object.entries(updates)) {
    await getSupabaseService().supabase
      .from('system_settings')
      .upsert({
        key,
        value: JSON.stringify(value),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
  }

  logger.info(`Settings updated by ${req.user?.email}`);
  res.json({ success: true, message: 'Configurações atualizadas com sucesso', timestamp: new Date().toISOString() });
}));

// POST /admin/settings/test-email - Test SMTP
router.post('/test-email', requireSuperAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { smtp_host, smtp_port, smtp_user, smtp_password } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      host: smtp_host,
      port: smtp_port,
      auth: { user: smtp_user, pass: smtp_password }
    });

    await transporter.verify();
    res.json({ success: true, message: 'Conexão SMTP OK!', timestamp: new Date().toISOString() });
  } catch (error: any) {
    throw createError(`Erro ao testar SMTP: ${error.message}`, 500);
  }
}));

// POST /admin/settings/test-whatsapp - Test Evolution API
router.post('/test-whatsapp', requireSuperAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { evolution_api_url, evolution_api_key } = req.body;

  try {
    const response = await axios.get(`${evolution_api_url}/manager/instances`, {
      headers: { 'apikey': evolution_api_key },
      timeout: 5000
    });

    if (response.status === 200) {
      res.json({ success: true, message: 'Evolution API conectada!', data: response.data, timestamp: new Date().toISOString() });
    } else {
      throw new Error('Resposta inesperada da API');
    }
  } catch (error: any) {
    throw createError(`Erro ao testar Evolution API: ${error.message}`, 500);
  }
}));

export default router;
