import express from 'express';
import { AILogger } from '../services/ai/ai-logger';
import { logger } from '../utils/logger';

const router = express.Router();
const aiLogger = new AILogger();

/**
 * GET /api/ai-metrics/logs
 * Buscar logs de IA com filtros
 */
router.get('/logs', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const {
      eventType,
      conversationId,
      startDate,
      endDate,
      limit = 50
    } = req.query;

    const logs = await aiLogger.getAILogs(organizationId, {
      eventType: eventType as string,
      conversationId: conversationId as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: parseInt(limit as string)
    });

    return res.json({
      success: true,
      logs,
      count: logs.length
    });
  } catch (error) {
    logger.error('Error fetching AI logs:', error);
    return res.status(500).json({ error: 'Failed to fetch AI logs' });
  }
});

/**
 * GET /api/ai-metrics/metrics
 * Obter métricas agregadas de IA
 */
router.get('/metrics', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate = new Date().toISOString()
    } = req.query;

    const metrics = await aiLogger.getAIMetrics(
      organizationId,
      startDate as string,
      endDate as string
    );

    if (!metrics) {
      return res.status(500).json({ error: 'Failed to calculate metrics' });
    }

    return res.json({
      success: true,
      metrics,
      period: {
        start: startDate,
        end: endDate
      }
    });
  } catch (error) {
    logger.error('Error fetching AI metrics:', error);
    return res.status(500).json({ error: 'Failed to fetch AI metrics' });
  }
});

/**
 * GET /api/ai-metrics/conversation/:conversationId
 * Obter histórico completo de IA de uma conversa
 */
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const { conversationId } = req.params;

    const logs = await aiLogger.getAILogs(organizationId, {
      conversationId
    });

    return res.json({
      success: true,
      conversationId,
      logs,
      timeline: logs.map(log => ({
        timestamp: log.metadata?.timestamp || new Date().toISOString(),
        eventType: log.event_type,
        summary: generateLogSummary(log)
      }))
    });
  } catch (error) {
    logger.error('Error fetching conversation AI logs:', error);
    return res.status(500).json({ error: 'Failed to fetch conversation logs' });
  }
});

/**
 * GET /api/ai-metrics/pnl-performance
 * Análise de performance das técnicas de PNL
 */
router.get('/pnl-performance', async (req, res) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: 'Organization not found' });
    }

    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate = new Date().toISOString()
    } = req.query;

    const logs = await aiLogger.getAILogs(organizationId, {
      eventType: 'opportunity_detected',
      startDate: startDate as string,
      endDate: endDate as string
    });

    // Análise por técnica PNL
    const pnlStats = logs.reduce((acc, log) => {
      const technique = log.pnl_technique || 'unknown';
      if (!acc[technique]) {
        acc[technique] = {
          count: 0,
          avgConfidence: 0,
          services: {} as Record<string, number>
        };
      }

      acc[technique].count++;
      acc[technique].avgConfidence += (log.opportunity_confidence || 0);

      if (log.opportunity_service) {
        acc[technique].services[log.opportunity_service] =
          (acc[technique].services[log.opportunity_service] || 0) + 1;
      }

      return acc;
    }, {} as Record<string, any>);

    // Calcular médias
    Object.keys(pnlStats).forEach(technique => {
      pnlStats[technique].avgConfidence =
        Math.round((pnlStats[technique].avgConfidence / pnlStats[technique].count) * 100) / 100;
    });

    res.json({
      success: true,
      pnlPerformance: pnlStats,
      totalOpportunities: logs.length,
      period: {
        start: startDate,
        end: endDate
      }
    });
  } catch (error) {
    logger.error('Error fetching PNL performance:', error);
    res.status(500).json({ error: 'Failed to fetch PNL performance' });
  }
});

/**
 * Gera resumo legível de um log
 */
function generateLogSummary(log: any): string {
  switch (log.event_type) {
    case 'message_analyzed':
      return `Mensagem analisada - Intent: ${log.intent} (${Math.round((log.confidence || 0) * 100)}% confiança)`;

    case 'opportunity_detected':
      return `Oportunidade detectada: ${log.opportunity_service} (${log.pnl_technique})`;

    case 'response_generated':
      return `Resposta gerada com ${log.response_fragments} fragmentos`;

    case 'escalated':
      return `Conversa escalada para humano - Motivo: ${log.escalation_reason}`;

    case 'error':
      return `Erro: ${log.error_message}`;

    default:
      return log.event_type;
  }
}

export default router;