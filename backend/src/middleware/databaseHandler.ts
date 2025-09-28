import { logger } from '../utils/logger';

export interface DatabaseError {
  code: string;
  message: string;
  hint?: string;
  details?: string;
}

export const handleDatabaseError = (error: DatabaseError, context: string): Error => {
  // Log detailed error information
  logger.error(`Database error in ${context}:`, {
    code: error.code,
    message: error.message,
    hint: error.hint,
    details: error.details,
    context
  });

  // Map common database errors to user-friendly messages
  switch (error.code) {
    case '42703': // Column does not exist
      logger.error(`Column reference error: ${error.message}`, { hint: error.hint });
      return new Error('Erro de estrutura do banco de dados. Nossa equipe foi notificada.');

    case '23505': // Unique violation
      return new Error('Este registro já existe no sistema.');

    case '23503': // Foreign key violation
      return new Error('Não é possível realizar esta operação devido a dependências.');

    case '42P01': // Undefined table
      logger.error(`Table reference error: ${error.message}`);
      return new Error('Recurso não encontrado no sistema.');

    case 'PGRST116': // Row not found
      return new Error('Registro não encontrado.');

    case '42601': // Syntax error
      logger.error(`SQL syntax error: ${error.message}`);
      return new Error('Erro interno na consulta ao banco de dados.');

    case '23502': // Not null violation
      return new Error('Campos obrigatórios não foram preenchidos.');

    case '22001': // String data right truncation
      return new Error('Os dados fornecidos são muito longos para este campo.');

    case '08006': // Connection failure
    case '08001': // Connection does not exist
      logger.error('Database connection error:', error);
      return new Error('Erro de conexão com o banco de dados. Tente novamente em alguns momentos.');

    case '53300': // Too many connections
      logger.error('Database connection pool exhausted:', error);
      return new Error('Sistema temporariamente sobrecarregado. Tente novamente em alguns momentos.');

    default:
      // For unknown errors, log everything and return generic message
      logger.error(`Unknown database error [${error.code}]:`, {
        message: error.message,
        hint: error.hint,
        details: error.details,
        context
      });
      return new Error('Erro interno do banco de dados. Nossa equipe foi notificada.');
  }
};

// Utility function to check if an error is a database error
export const isDatabaseError = (error: any): error is DatabaseError => {
  return error && typeof error.code === 'string' && typeof error.message === 'string';
};

// Enhanced wrapper for database operations
export const withDatabaseErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    if (isDatabaseError(error)) {
      throw handleDatabaseError(error, context);
    }

    // Re-throw non-database errors as-is
    logger.error(`Non-database error in ${context}:`, error);
    throw error;
  }
};

export default {
  handleDatabaseError,
  isDatabaseError,
  withDatabaseErrorHandling
};