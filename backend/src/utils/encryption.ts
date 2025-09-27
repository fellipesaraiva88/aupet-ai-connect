import crypto from 'crypto';
import { logger } from './logger';
import { envValidator } from '../config/env-validator';

// ===================================================================
// SERVIÇO DE CRIPTOGRAFIA PARA SECRETS
// OBJETIVO: Proteger dados sensíveis em repouso e trânsito
// ===================================================================

export class EncryptionService {
  private static instance: EncryptionService;
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private encryptionKey: Buffer;

  private constructor() {
    this.initializeEncryptionKey();
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  private initializeEncryptionKey(): void {
    const envKey = envValidator.get('ENCRYPTION_KEY');

    if (envKey) {
      // Usar chave do environment
      this.encryptionKey = crypto.scryptSync(envKey, 'auzap-salt', this.keyLength);
    } else if (envValidator.isDevelopment()) {
      // Gerar chave temporária para desenvolvimento
      logger.warn('ENCRYPTION_KEY não configurado, usando chave temporária para desenvolvimento');
      this.encryptionKey = crypto.scryptSync('dev-encryption-key-change-in-production', 'auzap-salt', this.keyLength);
    } else {
      throw new Error('ENCRYPTION_KEY é obrigatório em produção');
    }

    logger.info('Encryption service initialized successfully');
  }

  // ===================================================================
  // CRIPTOGRAFIA DE DADOS
  // ===================================================================

  public encrypt(plaintext: string): string {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      // Combinar IV + Tag + Encrypted data
      const result = {
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        encrypted: encrypted
      };

      return Buffer.from(JSON.stringify(result)).toString('base64');

    } catch (error) {
      logger.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  public decrypt(encryptedData: string): string {
    try {
      const data = JSON.parse(Buffer.from(encryptedData, 'base64').toString());

      const iv = Buffer.from(data.iv, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(Buffer.from(data.tag, 'hex'));

      let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;

    } catch (error) {
      logger.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // ===================================================================
  // HASH PARA SENHAS E TOKENS
  // ===================================================================

  public hashPassword(password: string): string {
    const salt = crypto.randomBytes(16);
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');

    return `${salt.toString('hex')}:${hash.toString('hex')}`;
  }

  public verifyPassword(password: string, hashedPassword: string): boolean {
    try {
      const parts = hashedPassword.split(':');
      if (parts.length !== 2) {
        logger.error('Invalid hashed password format');
        return false;
      }

      const [salt, hash] = parts;
      if (!salt || !hash) {
        logger.error('Invalid hashed password format - missing salt or hash');
        return false;
      }
      const hashBuffer = Buffer.from(hash, 'hex');
      const saltBuffer = Buffer.from(salt, 'hex');

      const computedHash = crypto.pbkdf2Sync(password, saltBuffer, 100000, 64, 'sha512');

      return crypto.timingSafeEqual(hashBuffer, computedHash);
    } catch (error) {
      logger.error('Password verification failed:', error);
      return false;
    }
  }

  // ===================================================================
  // GERAÇÃO DE TOKENS SEGUROS
  // ===================================================================

  public generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  public generateApiKey(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(16).toString('hex');
    return `auzap_${timestamp}_${random}`;
  }

  // ===================================================================
  // VALIDAÇÃO DE INTEGRIDADE
  // ===================================================================

  public createHMAC(data: string, secret?: string): string {
    const secretKey = secret || this.encryptionKey.toString('hex');
    return crypto.createHmac('sha256', secretKey).update(data).digest('hex');
  }

  public verifyHMAC(data: string, signature: string, secret?: string): boolean {
    const expectedSignature = this.createHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  // ===================================================================
  // MASCARAMENTO DE DADOS SENSÍVEIS
  // ===================================================================

  public maskSensitiveData(data: any): any {
    if (typeof data === 'string') {
      return this.maskString(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.maskSensitiveData(item));
    }

    if (typeof data === 'object' && data !== null) {
      const masked: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitiveField(key)) {
          masked[key] = this.maskString(String(value));
        } else {
          masked[key] = this.maskSensitiveData(value);
        }
      }
      return masked;
    }

    return data;
  }

  private maskString(str: string): string {
    if (!str || str.length < 8) return '***';
    return str.substring(0, 4) + '*'.repeat(str.length - 8) + str.substring(str.length - 4);
  }

  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'password', 'token', 'key', 'secret', 'auth', 'credential',
      'apikey', 'api_key', 'jwt', 'bearer', 'authorization',
      'supabase_service_key', 'openai_api_key', 'evolution_api_key'
    ];

    return sensitiveFields.some(field =>
      fieldName.toLowerCase().includes(field)
    );
  }

  // ===================================================================
  // ROTAÇÃO DE CHAVES
  // ===================================================================

  public rotateEncryptionKey(newKey: string): void {
    try {
      // Validar nova chave
      if (newKey.length < 32) {
        throw new Error('Nova chave deve ter pelo menos 32 caracteres');
      }

      // Backup da chave atual
      const oldKey = this.encryptionKey;

      // Atualizar chave
      this.encryptionKey = crypto.scryptSync(newKey, 'auzap-salt', this.keyLength);

      logger.info('Encryption key rotated successfully');

      // Em produção, aqui você re-criptografaria dados existentes
      // com a nova chave se necessário

    } catch (error) {
      logger.error('Key rotation failed:', error);
      throw error;
    }
  }

  // ===================================================================
  // UTILITIES
  // ===================================================================

  public generateSecureId(): string {
    return crypto.randomUUID();
  }

  public hashForConsistency(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

// ===================================================================
// FACTORY FUNCTIONS
// ===================================================================
export const encryption = EncryptionService.getInstance();

export const encryptSecret = (secret: string): string => encryption.encrypt(secret);
export const decryptSecret = (encryptedSecret: string): string => encryption.decrypt(encryptedSecret);
export const generateApiKey = (): string => encryption.generateApiKey();
export const generateSecureToken = (length?: number): string => encryption.generateSecureToken(length);
export const maskSensitiveData = (data: any): any => encryption.maskSensitiveData(data);