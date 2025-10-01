import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { getEvolutionAPIService } from '../services/evolution-api-unified';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Validation schemas
const createInstanceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  webhookUrl: z.string().url().optional()
});

/**
 * @route POST /api/instances
 * @desc Create new WhatsApp instance
 * @access Private
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const organizationId = (req as any).user?.organizationId;

  if (!userId || !organizationId) {
    throw createError('Usuário não autenticado', 401);
  }

  const validatedData = createInstanceSchema.parse(req.body);

  try {
    // Generate unique instance ID
    const instanceName = `org_${organizationId.substring(0, 8)}_${Date.now()}`;

    // Configure webhook URL
    const webhookUrl = process.env.WEBHOOK_URL || 'https://auzap-backend-py0l.onrender.com/api/webhook';
    const evolutionWebhookUrl = `${webhookUrl}/evolution`;

    // Create instance in Evolution API with webhook
    const evolutionService = getEvolutionAPIService();
    const evolutionResponse = await evolutionService.createInstance({
      instanceName,
      qrcode: true,
      webhook: {
        url: evolutionWebhookUrl,
        byEvents: true,
        events: [
          'QRCODE_UPDATED',
          'CONNECTION_UPDATE',
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE'
        ]
      }
    });

    // Save to Supabase whatsapp_instances table
    const { data: instance, error } = await supabase
      .from('whatsapp_instances')
      .insert({
        user_id: userId,
        organization_id: organizationId,
        instance_name: instanceName,
        instance_id: instanceName,
        status: 'created',
        webhook_url: evolutionWebhookUrl,
        api_key: evolutionResponse.hash?.apikey,
        metadata: {
          evolution_data: evolutionResponse
        }
      })
      .select()
      .single();

    if (error) {
      logger.error('Error saving instance to Supabase:', error);
      throw error;
    }

    logger.info('Instance created successfully', {
      instanceName,
      instanceId: instance.id,
      organizationId
    });

    res.status(201).json({
      success: true,
      data: instance,
      message: 'Instância criada com sucesso'
    });

  } catch (error: any) {
    logger.error('Error creating instance:', error);
    throw createError(error.message || 'Erro ao criar instância', 500);
  }
}));

/**
 * @route GET /api/instances
 * @desc Get all organization instances
 * @access Private
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const organizationId = (req as any).user?.organizationId;

  if (!organizationId) {
    throw createError('Organização não identificada', 401);
  }

  try {
    const { data: instances, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: instances || [],
      message: `${instances?.length || 0} instâncias encontradas`
    });

  } catch (error: any) {
    logger.error('Error fetching instances:', error);
    throw createError('Erro ao buscar instâncias', 500);
  }
}));

/**
 * @route POST /api/instances/:instanceId/connect
 * @desc Connect instance and get QR code
 * @access Private
 */
router.post('/:instanceId/connect', asyncHandler(async (req: Request, res: Response) => {
  const organizationId = (req as any).user?.organizationId;
  const { instanceId } = req.params;

  if (!organizationId) {
    throw createError('Organização não identificada', 401);
  }

  try {
    // Verify instance ownership
    const { data: instance, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !instance) {
      throw createError('Instância não encontrada', 404);
    }

    // Connect to Evolution API
    const evolutionService = getEvolutionAPIService();
    const connectResponse = await evolutionService.connect(instanceId);

    // Update instance with QR code
    const { error: updateError } = await supabase
      .from('whatsapp_instances')
      .update({
        status: 'connecting',
        qr_code: connectResponse.qrcode?.base64 || null,
        updated_at: new Date().toISOString()
      })
      .eq('instance_id', instanceId);

    if (updateError) throw updateError;

    res.json({
      success: true,
      data: {
        qrCode: connectResponse.qrcode?.base64 || null,
        code: connectResponse.qrcode?.code || null
      },
      message: 'QR Code gerado com sucesso. Escaneie para conectar.'
    });

  } catch (error: any) {
    logger.error('Error connecting instance:', error);
    throw createError(error.message || 'Erro ao conectar instância', 500);
  }
}));

/**
 * @route GET /api/instances/:instanceId/status
 * @desc Get instance connection status
 * @access Private
 */
router.get('/:instanceId/status', asyncHandler(async (req: Request, res: Response) => {
  const organizationId = (req as any).user?.organizationId;
  const { instanceId } = req.params;

  if (!organizationId) {
    throw createError('Organização não identificada', 401);
  }

  try {
    // Verify instance ownership
    const { data: instance, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !instance) {
      throw createError('Instância não encontrada', 404);
    }

    // Get current status from Evolution API
    const evolutionService = getEvolutionAPIService();
    const statusResponse = await evolutionService.getConnectionState(instanceId);

    const connectionState = statusResponse.instance.state;

    // Update database
    const updates: any = {
      connection_status: connectionState,
      last_heartbeat: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Update status based on connection state
    if (connectionState === 'open') {
      updates.status = 'connected';
      updates.is_connected = true;
      if (!instance.connected_at) {
        updates.connected_at = new Date().toISOString();
      }
      // Clear QR code when connected
      updates.qr_code = null;
    } else if (connectionState === 'close') {
      updates.status = 'disconnected';
      updates.is_connected = false;
    } else if (connectionState === 'connecting') {
      updates.status = 'connecting';
    }

    await supabase
      .from('whatsapp_instances')
      .update(updates)
      .eq('instance_id', instanceId);

    res.json({
      success: true,
      data: {
        instanceId,
        connectionState,
        status: updates.status
      },
      message: `Status: ${connectionState}`
    });

  } catch (error: any) {
    logger.error('Error checking status:', error);
    throw createError(error.message || 'Erro ao verificar status', 500);
  }
}));

/**
 * @route DELETE /api/instances/:instanceId/disconnect
 * @desc Disconnect instance
 * @access Private
 */
router.delete('/:instanceId/disconnect', asyncHandler(async (req: Request, res: Response) => {
  const organizationId = (req as any).user?.organizationId;
  const { instanceId } = req.params;

  if (!organizationId) {
    throw createError('Organização não identificada', 401);
  }

  try {
    // Verify instance ownership
    const { data: instance, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !instance) {
      throw createError('Instância não encontrada', 404);
    }

    // Logout from Evolution API
    const evolutionService = getEvolutionAPIService();
    await evolutionService.logout(instanceId);

    // Update instance status
    await supabase
      .from('whatsapp_instances')
      .update({
        status: 'disconnected',
        connection_status: 'close',
        is_connected: false,
        qr_code: null,
        updated_at: new Date().toISOString()
      })
      .eq('instance_id', instanceId);

    res.json({
      success: true,
      data: { disconnected: true },
      message: 'Instância desconectada com sucesso'
    });

  } catch (error: any) {
    logger.error('Error disconnecting instance:', error);
    throw createError(error.message || 'Erro ao desconectar instância', 500);
  }
}));

/**
 * @route DELETE /api/instances/:instanceId
 * @desc Delete instance permanently
 * @access Private
 */
router.delete('/:instanceId', asyncHandler(async (req: Request, res: Response) => {
  const organizationId = (req as any).user?.organizationId;
  const { instanceId } = req.params;

  if (!organizationId) {
    throw createError('Organização não identificada', 401);
  }

  try {
    // Verify instance ownership
    const { data: instance, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !instance) {
      throw createError('Instância não encontrada', 404);
    }

    // Delete from Evolution API
    const evolutionService = getEvolutionAPIService();
    try {
      await evolutionService.deleteInstance(instanceId);
    } catch (evolutionError) {
      logger.error('Error deleting from Evolution API:', evolutionError);
      // Continue with database deletion even if Evolution API fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('whatsapp_instances')
      .delete()
      .eq('instance_id', instanceId)
      .eq('organization_id', organizationId);

    if (deleteError) throw deleteError;

    res.json({
      success: true,
      data: { deleted: true },
      message: 'Instância deletada com sucesso'
    });

  } catch (error: any) {
    logger.error('Error deleting instance:', error);
    throw createError(error.message || 'Erro ao deletar instância', 500);
  }
}));

export default router;
