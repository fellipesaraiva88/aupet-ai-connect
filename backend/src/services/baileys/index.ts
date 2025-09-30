/**
 * Baileys Service - Módulo centralizado para WhatsApp via Baileys
 *
 * Substitui Evolution API por implementação nativa do Baileys
 * Com melhor performance, zero custos externos e controle total
 */

export { AuthManager } from './auth-manager';
export { BaileysEventHandlers } from './event-handlers';
export { StoreManager } from './store-manager';
export { ConnectionManager } from './connection-manager';

export * from './types';
export * from './utils';