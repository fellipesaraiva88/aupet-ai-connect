import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { getEvolutionAPIService } from '../services/evolution-api';
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

const updateInstanceSchema = z.object({
  name: z.string().min(1).optional(),
  webhookUrl: z.string().url().optional()
});

/**
 * @route POST /api/instances
 * @desc Create new WhatsApp instance
 * @access Private
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  
  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }

  const validatedData = createInstanceSchema.parse(req.body);
  
  try {
    // Generate unique instance ID
    const instanceId = `aupet_${userId.substring(0, 8)}_${Date.now()}`;
    
    // Create instance in Evolution API
    const evolutionService = getEvolutionAPIService();
    const evolutionResponse = await evolutionService.createInstance(instanceId, true);
    
    // Save to Supabase
    const { data: instance, error } = await supabase
      .from('instances')
      .insert({
        user_id: userId,
        name: validatedData.name,
        instance_id: instanceId,
        status: 'created',
        webhook_url: validatedData.webhookUrl || null,
        metadata: {
          evolution_data: evolutionResponse
        }
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Set webhook if provided
    if (validatedData.webhookUrl) {
      try {
        const webhookUrl = `${process.env.WEBHOOK_URL || 'http://localhost:3001'}/api/webhook/evolution`;
        await evolutionService.client.post(`/webhook/set/${instanceId}`, {
          enabled: true,
          url: webhookUrl,
          webhookByEvents: true,
          events: [
            'QRCODE_UPDATED',
            'CONNECTION_UPDATE',
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE'
          ]
        });
      } catch (webhookError) {
        logger.error('Error setting webhook:', webhookError);
      }
    }
    
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
 * @desc Get all user instances
 * @access Private
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  
  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }
  
  try {
    const { data: instances, error } = await supabase
      .from('instances')
      .select('*')
      .eq('user_id', userId)
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
 * @route GET /api/instances/:instanceId
 * @desc Get specific instance
 * @access Private
 */
router.get('/:instanceId', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { instanceId } = req.params;
  
  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }
  
  try {
    const { data: instance, error } = await supabase
      .from('instances')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    if (!instance) throw createError('Instância não encontrada', 404);
    
    // Get current status from Evolution API
    const evolutionService = getEvolutionAPIService();
    try {
      const statusResponse = await evolutionService.getInstanceStatus(instanceId);
      
      // Update status in database if different
      if (statusResponse.instance.state !== instance.connection_state) {
        await supabase
          .from('instances')
          .update({
            connection_state: statusResponse.instance.state,
            last_seen_at: new Date().toISOString()
          })
          .eq('instance_id', instanceId);
        
        instance.connection_state = statusResponse.instance.state;
      }
    } catch (evolutionError) {
      logger.error('Error fetching Evolution API status:', evolutionError);
    }
    
    res.json({
      success: true,
      data: instance,
      message: 'Instância obtida com sucesso'
    });
    
  } catch (error: any) {
    logger.error('Error fetching instance:', error);
    throw createError(error.message || 'Erro ao buscar instância', 500);
  }
}));

/**
 * @route POST /api/instances/:instanceId/connect
 * @desc Connect instance and get QR code
 * @access Private
 */
router.post('/:instanceId/connect', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { instanceId } = req.params;
  
  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }
  
  try {
    // Verify instance ownership
    const { data: instance, error } = await supabase
      .from('instances')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('user_id', userId)
      .single();
    
    if (error || !instance) {
      throw createError('Instância não encontrada', 404);
    }
    
    // Connect to Evolution API
    const evolutionService = getEvolutionAPIService();
    const connectResponse = await evolutionService.connect(instanceId);
    
    // Update instance with QR code
    const { error: updateError } = await supabase
      .from('instances')
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
 * @route GET /api/instances/:instanceId/qrcode
 * @desc Get current QR code for instance
 * @access Private
 */
router.get('/:instanceId/qrcode', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { instanceId } = req.params;
  
  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }
  
  try {
    // Verify instance ownership
    const { data: instance, error } = await supabase
      .from('instances')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('user_id', userId)
      .single();
    
    if (error || !instance) {
      throw createError('Instância não encontrada', 404);
    }
    
    // Get fresh QR code from Evolution API
    const evolutionService = getEvolutionAPIService();
    const connectResponse = await evolutionService.connect(instanceId);
    
    const qrCode = connectResponse.qrcode?.base64 || instance.qr_code;
    
    // Update QR code in database if new one available
    if (qrCode && qrCode !== instance.qr_code) {
      await supabase
        .from('instances')
        .update({
          qr_code: qrCode,
          updated_at: new Date().toISOString()
        })
        .eq('instance_id', instanceId);
    }
    
    res.json({
      success: true,
      data: {
        qrCode: qrCode,
        available: !!qrCode
      },
      message: qrCode ? 'QR Code disponível' : 'QR Code não disponível'
    });
    
  } catch (error: any) {
    logger.error('Error fetching QR code:', error);
    throw createError(error.message || 'Erro ao obter QR Code', 500);
  }
}));

/**
 * @route GET /api/instances/:instanceId/status
 * @desc Get instance connection status
 * @access Private
 */
router.get('/:instanceId/status', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { instanceId } = req.params;
  
  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }
  
  try {
    // Verify instance ownership
    const { data: instance, error } = await supabase
      .from('instances')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('user_id', userId)
      .single();
    
    if (error || !instance) {
      throw createError('Instância não encontrada', 404);
    }
    
    // Get current status from Evolution API
    const evolutionService = getEvolutionAPIService();
    const statusResponse = await evolutionService.getInstanceStatus(instanceId);
    
    const connectionState = statusResponse.instance.state;
    
    // Update database
    const updates: any = {
      connection_state: connectionState,
      last_seen_at: new Date().toISOString()
    };
    
    // Update status based on connection state
    if (connectionState === 'open') {
      updates.status = 'connected';
      if (!instance.connected_at) {
        updates.connected_at = new Date().toISOString();
      }
      // Clear QR code when connected
      updates.qr_code = null;
    } else if (connectionState === 'close') {
      updates.status = 'disconnected';
    } else if (connectionState === 'connecting') {
      updates.status = 'connecting';
    }
    
    await supabase
      .from('instances')
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
  const userId = (req as any).user?.id;
  const { instanceId } = req.params;
  
  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }
  
  try {
    // Verify instance ownership
    const { data: instance, error } = await supabase
      .from('instances')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('user_id', userId)
      .single();
    
    if (error || !instance) {
      throw createError('Instância não encontrada', 404);
    }
    
    // Logout from Evolution API
    const evolutionService = getEvolutionAPIService();
    await evolutionService.logout(instanceId);
    
    // Update instance status
    await supabase
      .from('instances')
      .update({
        status: 'disconnected',
        connection_state: 'close',
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
  const userId = (req as any).user?.id;
  const { instanceId } = req.params;
  
  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }
  
  try {
    // Verify instance ownership
    const { data: instance, error } = await supabase
      .from('instances')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('user_id', userId)
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
      .from('instances')
      .delete()
      .eq('instance_id', instanceId)
      .eq('user_id', userId);
    
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

/**
 * @route PUT /api/instances/:instanceId
 * @desc Update instance details
 * @access Private
 */
router.put('/:instanceId', asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { instanceId } = req.params;
  
  if (!userId) {
    throw createError('Usuário não autenticado', 401);
  }
  
  const validatedData = updateInstanceSchema.parse(req.body);
  
  try {
    // Verify instance ownership
    const { data: instance, error } = await supabase
      .from('instances')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('user_id', userId)
      .single();
    
    if (error || !instance) {
      throw createError('Instância não encontrada', 404);
    }
    
    // Update instance
    const { data: updatedInstance, error: updateError } = await supabase
      .from('instances')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('instance_id', instanceId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    res.json({
      success: true,
      data: updatedInstance,
      message: 'Instância atualizada com sucesso'
    });
    
  } catch (error: any) {
    logger.error('Error updating instance:', error);
    throw createError(error.message || 'Erro ao atualizar instância', 500);
  }
}));

export default router;
