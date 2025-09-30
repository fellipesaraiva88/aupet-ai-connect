import { proto } from '@whiskeysockets/baileys';

/**
 * Types customizados para Baileys Service
 */

export interface BaileysConnectionConfig {
  userId: string;
  printQRInTerminal?: boolean;
  syncFullHistory?: boolean;
}

export interface BaileysInstanceInfo {
  userId: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'qr';
  phoneNumber?: string;
  qrCode?: string;
  lastConnected?: Date;
}

export interface SendMessageOptions {
  quoted?: proto.IWebMessageInfo;
  ephemeralExpiration?: number;
  backgroundColor?: string;
  font?: number;
}

export interface SendMediaOptions extends SendMessageOptions {
  caption?: string;
  fileName?: string;
  mimetype?: string;
}

export interface MessageKey {
  remoteJid: string;
  id: string;
  fromMe?: boolean;
  participant?: string;
}

export interface BaileysMessage {
  key: MessageKey;
  message: proto.IMessage | null | undefined;
  messageTimestamp?: number | Long;
  pushName?: string;
  broadcast?: boolean;
}

export interface GroupMetadata {
  id: string;
  subject: string;
  subjectOwner?: string;
  subjectTime?: number;
  creation?: number;
  owner?: string;
  desc?: string;
  descOwner?: string;
  descId?: string;
  restrict?: boolean;
  announce?: boolean;
  isCommunity?: boolean;
  isCommunityAnnounce?: boolean;
  memberAddMode?: boolean;
  author?: string;
  participants: GroupParticipant[];
}

export interface GroupParticipant {
  id: string;
  admin?: 'admin' | 'superadmin' | null;
  isSuperAdmin?: boolean;
  isAdmin?: boolean;
}

export interface ContactInfo {
  id: string;
  name?: string;
  notify?: string;
  verifiedName?: string;
  imgUrl?: string;
  status?: string;
}

export interface PresenceData {
  id: string;
  presences: {
    [participant: string]: {
      lastKnownPresence: 'available' | 'unavailable' | 'composing' | 'recording' | 'paused';
      lastSeen?: number;
    };
  };
}

export type WAPresence = 'unavailable' | 'available' | 'composing' | 'recording' | 'paused';

export interface ChatModification {
  archive?: boolean;
  pin?: boolean;
  mute?: number | null;
  markRead?: boolean;
  clear?: 'all' | { messages: MessageKey[] };
  star?: { messages: MessageKey[]; star: boolean };
  delete?: boolean;
  lastMessages?: proto.IWebMessageInfo[];
}

export interface MessageUpdateType {
  key: MessageKey;
  update: {
    status?: number;
    pollUpdates?: any;
    reactions?: any;
  };
}