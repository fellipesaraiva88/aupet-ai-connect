import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { ReportsService, ReportFilter, ExportOptions } from '../services/reports';
import { logger } from '../utils/logger';
import { ApiResponse, AuthenticatedRequest } from '../types';
import { z } from 'zod';

const router = Router();
let reportsService: ReportsService;

const getReportsService = () => {
  if (!reportsService) {
    reportsService = new ReportsService();
  }
  return reportsService;
};

// Validation schemas
const reportFiltersSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  customer_id: z.string().uuid().optional(),
  pet_id: z.string().uuid().optional(),
  service_type: z.string().optional(),
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled']).optional(),
  veterinarian_id: z.string().uuid().optional()
});

const exportOptionsSchema = z.object({
  format: z.enum(['csv', 'json', 'pdf']).default('json'),
  include_headers: z.boolean().default(true),
  date_format: z.string().default('YYYY-MM-DD')
});

// GET /reports/financial - Financial report
router.get('/financial', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    const filters = reportFiltersSchema.parse(req.query);
    const report = await getReportsService().generateFinancialReport(organizationId, filters);

    const response: ApiResponse<any> = {
      success: true,
      data: report,
      message: 'Financial report generated successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error generating financial report:', error);
    if (error.name === 'ZodError') {
      throw createError('Filtros de relatório inválidos', 400);
    }
    throw createError('Erro ao gerar relatório financeiro', 500);
  }
}));

// GET /reports/customers - Customer activity report
router.get('/customers', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    const filters = reportFiltersSchema.parse(req.query);
    const report = await getReportsService().generateCustomerActivityReport(organizationId, filters);

    const response: ApiResponse<any> = {
      success: true,
      data: report,
      message: 'Customer activity report generated successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error generating customer report:', error);
    if (error.name === 'ZodError') {
      throw createError('Filtros de relatório inválidos', 400);
    }
    throw createError('Erro ao gerar relatório de clientes', 500);
  }
}));

// GET /reports/pets - Pet health report
router.get('/pets', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    const filters = reportFiltersSchema.parse(req.query);
    const report = await getReportsService().generatePetHealthReport(organizationId, filters);

    const response: ApiResponse<any> = {
      success: true,
      data: report,
      message: 'Pet health report generated successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error generating pet health report:', error);
    if (error.name === 'ZodError') {
      throw createError('Filtros de relatório inválidos', 400);
    }
    throw createError('Erro ao gerar relatório de saúde dos pets', 500);
  }
}));

// GET /reports/appointments - Appointment analytics report
router.get('/appointments', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    const filters = reportFiltersSchema.parse(req.query);
    const report = await getReportsService().generateAppointmentReport(organizationId, filters);

    const response: ApiResponse<any> = {
      success: true,
      data: report,
      message: 'Appointment report generated successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error generating appointment report:', error);
    if (error.name === 'ZodError') {
      throw createError('Filtros de relatório inválidos', 400);
    }
    throw createError('Erro ao gerar relatório de agendamentos', 500);
  }
}));

// GET /reports/business - Comprehensive business report
router.get('/business', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    const filters = reportFiltersSchema.parse(req.query);
    const report = await getReportsService().generateBusinessReport(organizationId, filters);

    const response: ApiResponse<any> = {
      success: true,
      data: report,
      message: 'Business report generated successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error generating business report:', error);
    if (error.name === 'ZodError') {
      throw createError('Filtros de relatório inválidos', 400);
    }
    throw createError('Erro ao gerar relatório de negócio', 500);
  }
}));

// POST /reports/export/financial - Export financial report
router.post('/export/financial', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    const filters = reportFiltersSchema.parse(req.body.filters || {});
    const exportOptions = exportOptionsSchema.parse(req.body.options || {});

    const report = await getReportsService().generateFinancialReport(organizationId, filters);

    let exportedData: string;
    let contentType: string;
    let filename: string;

    switch (exportOptions.format) {
      case 'csv':
        exportedData = await getReportsService().exportToCSV(
          report.appointments,
          `financial_report_${Date.now()}.csv`
        );
        contentType = 'text/csv';
        filename = `financial_report_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'json':
        exportedData = await getReportsService().exportToJSON(
          report,
          `financial_report_${Date.now()}.json`
        );
        contentType = 'application/json';
        filename = `financial_report_${new Date().toISOString().split('T')[0]}.json`;
        break;
      default:
        throw createError('Formato de exportação não suportado', 400);
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportedData);
  } catch (error: any) {
    logger.error('Error exporting financial report:', error);
    if (error.name === 'ZodError') {
      throw createError('Parâmetros de exportação inválidos', 400);
    }
    throw createError('Erro ao exportar relatório financeiro', 500);
  }
}));

// POST /reports/export/customers - Export customer report
router.post('/export/customers', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    const filters = reportFiltersSchema.parse(req.body.filters || {});
    const exportOptions = exportOptionsSchema.parse(req.body.options || {});

    const report = await getReportsService().generateCustomerActivityReport(organizationId, filters);

    let exportedData: string;
    let contentType: string;
    let filename: string;

    switch (exportOptions.format) {
      case 'csv':
        exportedData = await getReportsService().exportToCSV(
          report.customers,
          `customer_report_${Date.now()}.csv`
        );
        contentType = 'text/csv';
        filename = `customer_report_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'json':
        exportedData = await getReportsService().exportToJSON(
          report,
          `customer_report_${Date.now()}.json`
        );
        contentType = 'application/json';
        filename = `customer_report_${new Date().toISOString().split('T')[0]}.json`;
        break;
      default:
        throw createError('Formato de exportação não suportado', 400);
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportedData);
  } catch (error: any) {
    logger.error('Error exporting customer report:', error);
    if (error.name === 'ZodError') {
      throw createError('Parâmetros de exportação inválidos', 400);
    }
    throw createError('Erro ao exportar relatório de clientes', 500);
  }
}));

// POST /reports/export/pets - Export pet health report
router.post('/export/pets', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    const filters = reportFiltersSchema.parse(req.body.filters || {});
    const exportOptions = exportOptionsSchema.parse(req.body.options || {});

    const report = await getReportsService().generatePetHealthReport(organizationId, filters);

    let exportedData: string;
    let contentType: string;
    let filename: string;

    switch (exportOptions.format) {
      case 'csv':
        exportedData = await getReportsService().exportToCSV(
          report.pets,
          `pet_health_report_${Date.now()}.csv`
        );
        contentType = 'text/csv';
        filename = `pet_health_report_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'json':
        exportedData = await getReportsService().exportToJSON(
          report,
          `pet_health_report_${Date.now()}.json`
        );
        contentType = 'application/json';
        filename = `pet_health_report_${new Date().toISOString().split('T')[0]}.json`;
        break;
      default:
        throw createError('Formato de exportação não suportado', 400);
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportedData);
  } catch (error: any) {
    logger.error('Error exporting pet health report:', error);
    if (error.name === 'ZodError') {
      throw createError('Parâmetros de exportação inválidos', 400);
    }
    throw createError('Erro ao exportar relatório de saúde dos pets', 500);
  }
}));

// POST /reports/export/appointments - Export appointment report
router.post('/export/appointments', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    const filters = reportFiltersSchema.parse(req.body.filters || {});
    const exportOptions = exportOptionsSchema.parse(req.body.options || {});

    const report = await getReportsService().generateAppointmentReport(organizationId, filters);

    let exportedData: string;
    let contentType: string;
    let filename: string;

    switch (exportOptions.format) {
      case 'csv':
        exportedData = await getReportsService().exportToCSV(
          report.appointments,
          `appointment_report_${Date.now()}.csv`
        );
        contentType = 'text/csv';
        filename = `appointment_report_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'json':
        exportedData = await getReportsService().exportToJSON(
          report,
          `appointment_report_${Date.now()}.json`
        );
        contentType = 'application/json';
        filename = `appointment_report_${new Date().toISOString().split('T')[0]}.json`;
        break;
      default:
        throw createError('Formato de exportação não suportado', 400);
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportedData);
  } catch (error: any) {
    logger.error('Error exporting appointment report:', error);
    if (error.name === 'ZodError') {
      throw createError('Parâmetros de exportação inválidos', 400);
    }
    throw createError('Erro ao exportar relatório de agendamentos', 500);
  }
}));

// POST /reports/export/business - Export comprehensive business report
router.post('/export/business', asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const organizationId = authReq.user?.organizationId || '51cff6e5-0bd2-47bd-8840-ec65d5df265a';

  try {
    const filters = reportFiltersSchema.parse(req.body.filters || {});
    const exportOptions = exportOptionsSchema.parse(req.body.options || {});

    const report = await getReportsService().generateBusinessReport(organizationId, filters);

    let exportedData: string;
    let contentType: string;
    let filename: string;

    switch (exportOptions.format) {
      case 'json':
        exportedData = await getReportsService().exportToJSON(
          report,
          `business_report_${Date.now()}.json`
        );
        contentType = 'application/json';
        filename = `business_report_${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'csv':
        // For business report, we'll export a summary CSV
        const summaryData = [
          {
            metric: 'Total Revenue',
            value: report.financial_overview.total_revenue,
            period: `${filters.start_date || 'All time'} - ${filters.end_date || 'Present'}`
          },
          {
            metric: 'Total Customers',
            value: report.customer_overview.total_customers,
            period: `${filters.start_date || 'All time'} - ${filters.end_date || 'Present'}`
          },
          {
            metric: 'Total Pets',
            value: report.pet_health_overview.total_pets,
            period: `${filters.start_date || 'All time'} - ${filters.end_date || 'Present'}`
          },
          {
            metric: 'Total Appointments',
            value: report.appointment_overview.total_appointments,
            period: `${filters.start_date || 'All time'} - ${filters.end_date || 'Present'}`
          }
        ];

        exportedData = await getReportsService().exportToCSV(
          summaryData,
          `business_summary_${Date.now()}.csv`
        );
        contentType = 'text/csv';
        filename = `business_summary_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      default:
        throw createError('Formato de exportação não suportado', 400);
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(exportedData);
  } catch (error: any) {
    logger.error('Error exporting business report:', error);
    if (error.name === 'ZodError') {
      throw createError('Parâmetros de exportação inválidos', 400);
    }
    throw createError('Erro ao exportar relatório de negócio', 500);
  }
}));

// GET /reports/templates - Get available report templates
router.get('/templates', asyncHandler(async (req: Request, res: Response) => {
  const templates = [
    {
      id: 'financial',
      name: 'Relatório Financeiro',
      description: 'Análise de receitas, custos e performance financeira',
      filters: ['start_date', 'end_date', 'service_type'],
      export_formats: ['csv', 'json']
    },
    {
      id: 'customers',
      name: 'Relatório de Clientes',
      description: 'Atividade dos clientes, gastos e frequência de visitas',
      filters: ['start_date', 'end_date', 'customer_id'],
      export_formats: ['csv', 'json']
    },
    {
      id: 'pets',
      name: 'Relatório de Saúde dos Pets',
      description: 'Condições de saúde, tratamentos e histórico médico',
      filters: ['start_date', 'end_date', 'pet_id', 'customer_id'],
      export_formats: ['csv', 'json']
    },
    {
      id: 'appointments',
      name: 'Relatório de Agendamentos',
      description: 'Análise de agendamentos, cancelamentos e performance',
      filters: ['start_date', 'end_date', 'service_type', 'status', 'veterinarian_id'],
      export_formats: ['csv', 'json']
    },
    {
      id: 'business',
      name: 'Relatório Completo de Negócio',
      description: 'Visão geral completa do negócio com todas as métricas',
      filters: ['start_date', 'end_date'],
      export_formats: ['csv', 'json']
    }
  ];

  const response: ApiResponse<any[]> = {
    success: true,
    data: templates,
    message: 'Report templates retrieved successfully',
    timestamp: new Date().toISOString()
  };

  res.json(response);
}));

export default router;