import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import { envValidator } from '../config/env-validator';
import { encryption } from '../utils/encryption';

// ===================================================================
// SERVIÇO DE JWT AVANÇADO COM REFRESH TOKENS
// OBJETIVO: Autenticação robusta com rotação de tokens
// ===================================================================

export interface JWTPayload {
  id: string;
  email: string;
  organizationId: string;
  role: string;
  iat: number;
  exp: number;
  jti?: string; // JWT ID para revogação
  type: 'access' | 'refresh';
}

export interface RefreshTokenPayload {
  id: string;
  organizationId: string;
  iat: number;
  exp: number;
  jti: string;
  type: 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

export interface TokenValidationResult {
  valid: boolean;
  payload?: JWTPayload;
  error?: string;
  needsRefresh?: boolean;
}

// ===================================================================
// GERENCIADOR DE TOKENS REVOGADOS
// ===================================================================
class TokenBlacklistManager {
  private blacklistedTokens = new Set<string>();
  private blacklistCleanupInterval: NodeJS.Timeout;

  constructor() {
    // Limpeza automática a cada hora
    this.blacklistCleanupInterval = setInterval(() => {
      this.cleanupExpiredTokens();
    }, 60 * 60 * 1000);
  }

  public addToBlacklist(jti: string, exp: number): void {
    this.blacklistedTokens.add(`${jti}:${exp}`);
    logger.debug('Token added to blacklist', { jti });
  }

  public isBlacklisted(jti: string): boolean {
    // Verificar se algum token com este JTI está na blacklist
    for (const token of this.blacklistedTokens) {
      if (token.startsWith(`${jti}:`)) {
        return true;
      }
    }
    return false;
  }

  private cleanupExpiredTokens(): void {
    const now = Math.floor(Date.now() / 1000);
    const beforeSize = this.blacklistedTokens.size;

    this.blacklistedTokens.forEach(token => {
      const [, expStr] = token.split(':');
      if (!expStr) return; // Skip malformed tokens
      const exp = parseInt(expStr, 10);
      if (exp < now) {
        this.blacklistedTokens.delete(token);
      }
    });

    const afterSize = this.blacklistedTokens.size;
    if (beforeSize !== afterSize) {
      logger.debug('Cleaned up expired blacklisted tokens', {
        removed: beforeSize - afterSize,
        remaining: afterSize
      });
    }
  }

  public destroy(): void {
    if (this.blacklistCleanupInterval) {
      clearInterval(this.blacklistCleanupInterval);
    }
  }
}

// ===================================================================
// SERVIÇO JWT PRINCIPAL
// ===================================================================
export class JWTService {
  private static instance: JWTService;
  private readonly blacklistManager = new TokenBlacklistManager();
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '7d';

  private constructor() {}

  public static getInstance(): JWTService {
    if (!JWTService.instance) {
      JWTService.instance = new JWTService();
    }
    return JWTService.instance;
  }

  // ===================================================================
  // GERAÇÃO DE TOKENS
  // ===================================================================

  public generateTokenPair(payload: Omit<JWTPayload, 'iat' | 'exp' | 'jti' | 'type'>): TokenPair {
    const jwtSecret = envValidator.get('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is required but not configured');
    }
    const jti = encryption.generateSecureId();

    // Access Token
    const accessPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
      ...payload,
      jti,
      type: 'access'
    };

    const accessOptions: SignOptions = {
      expiresIn: this.accessTokenExpiry,
      issuer: 'auzap-backend',
      audience: 'auzap-frontend',
      subject: payload.id,
      jwtid: jti
    };

    const accessToken = jwt.sign(accessPayload, jwtSecret, accessOptions);

    // Refresh Token
    const refreshJti = encryption.generateSecureId();
    const refreshPayload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
      id: payload.id,
      organizationId: payload.organizationId,
      jti: refreshJti,
      type: 'refresh'
    };

    const refreshOptions: SignOptions = {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'auzap-backend',
      audience: 'auzap-frontend',
      subject: payload.id,
      jwtid: refreshJti
    };

    const refreshToken = jwt.sign(refreshPayload, jwtSecret, refreshOptions);

    logger.info('Token pair generated', {
      userId: payload.id,
      organizationId: payload.organizationId,
      accessJti: jti,
      refreshJti
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      refreshExpiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
    };
  }

  // ===================================================================
  // VALIDAÇÃO DE TOKENS
  // ===================================================================

  public validateToken(token: string, expectedType: 'access' | 'refresh' = 'access'): TokenValidationResult {
    try {
      const jwtSecret = envValidator.get('JWT_SECRET');
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is required but not configured');
      }

      const options: VerifyOptions = {
        issuer: 'auzap-backend',
        audience: 'auzap-frontend',
        algorithms: ['HS256']
      };

      const decoded = jwt.verify(token, jwtSecret, options) as JWTPayload;

      // Verificar tipo de token
      if (decoded.type !== expectedType) {
        return {
          valid: false,
          error: `Token type mismatch. Expected ${expectedType}, got ${decoded.type}`
        };
      }

      // Verificar se token está na blacklist
      if (decoded.jti && this.blacklistManager.isBlacklisted(decoded.jti)) {
        return {
          valid: false,
          error: 'Token has been revoked'
        };
      }

      // Verificar se o token está próximo do vencimento (refresh needed)
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - now;
      const needsRefresh = expectedType === 'access' && timeUntilExpiry < 300; // 5 minutes

      return {
        valid: true,
        payload: decoded,
        needsRefresh
      };

    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          valid: false,
          error: 'Token expired',
          needsRefresh: expectedType === 'access'
        };
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return {
          valid: false,
          error: 'Invalid token'
        };
      }

      logger.error('Token validation failed', { error });
      return {
        valid: false,
        error: 'Token validation failed'
      };
    }
  }

  // ===================================================================
  // REFRESH DE TOKENS
  // ===================================================================

  public async refreshTokens(refreshToken: string): Promise<TokenPair | null> {
    try {
      const validation = this.validateToken(refreshToken, 'refresh');

      if (!validation.valid || !validation.payload) {
        logger.warn('Invalid refresh token provided');
        return null;
      }

      const refreshPayload = validation.payload as RefreshTokenPayload;

      // Revogar o refresh token atual
      if (refreshPayload.jti) {
        this.revokeToken(refreshPayload.jti, refreshPayload.exp);
      }

      // Gerar novo par de tokens
      // Aqui você deveria buscar os dados atualizados do usuário no banco
      const userPayload = {
        id: refreshPayload.id,
        email: 'user@auzap.ai', // Buscar do banco
        organizationId: refreshPayload.organizationId,
        role: 'admin' // Buscar do banco
      };

      return this.generateTokenPair(userPayload);

    } catch (error) {
      logger.error('Token refresh failed', { error });
      return null;
    }
  }

  // ===================================================================
  // REVOGAÇÃO DE TOKENS
  // ===================================================================

  public revokeToken(jti: string, exp?: number): void {
    const expiry = exp || Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24h padrão
    this.blacklistManager.addToBlacklist(jti, expiry);
    logger.info('Token revoked', { jti });
  }

  public revokeAllUserTokens(userId: string): void {
    // Em uma implementação real, você manteria um mapeamento de usuário -> JTIs
    // Por agora, logs para auditoria
    logger.info('All user tokens revoked', { userId });
  }

  // ===================================================================
  // UTILITÁRIOS
  // ===================================================================

  public extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  public getTokenClaims(token: string): any {
    try {
      return jwt.decode(token);
    } catch {
      return null;
    }
  }

  public isTokenExpired(token: string): boolean {
    try {
      const claims = jwt.decode(token) as any;
      if (!claims || !claims.exp) return true;

      return claims.exp < Math.floor(Date.now() / 1000);
    } catch {
      return true;
    }
  }

  // ===================================================================
  // GERAÇÃO DE TOKENS ÚNICOS
  // ===================================================================

  public generateApiKey(): string {
    return encryption.generateApiKey();
  }

  public generateSessionToken(): string {
    return encryption.generateSecureToken(64);
  }

  // ===================================================================
  // CLEANUP
  // ===================================================================

  public destroy(): void {
    this.blacklistManager.destroy();
  }
}

// ===================================================================
// FACTORY FUNCTIONS
// ===================================================================
export const jwtService = JWTService.getInstance();

export const generateTokenPair = (payload: Omit<JWTPayload, 'iat' | 'exp' | 'jti' | 'type'>): TokenPair =>
  jwtService.generateTokenPair(payload);

export const validateToken = (token: string, type?: 'access' | 'refresh'): TokenValidationResult =>
  jwtService.validateToken(token, type);

export const refreshTokens = (refreshToken: string): Promise<TokenPair | null> =>
  jwtService.refreshTokens(refreshToken);

export const revokeToken = (jti: string, exp?: number): void =>
  jwtService.revokeToken(jti, exp);