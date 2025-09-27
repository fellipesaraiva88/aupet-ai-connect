import { Request, Response } from 'express';
import { ApiResponse } from '../types';

export const notFound = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    error: `Endpoint não encontrado: ${req.method} ${req.originalUrl}`,
    message: 'O endpoint solicitado não existe. Verifique a URL e tente novamente.',
    timestamp: new Date().toISOString()
  };

  res.status(404).json(response);
};