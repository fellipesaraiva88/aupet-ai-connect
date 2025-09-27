import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import {
  SocketEvent,
  HumanAlert,
  DashboardStats,
  MessageData
} from '../types';

interface ConnectedClient {
  socketId: string;
  userId?: string;
  organizationId: string;
  connectedAt: Date;
  lastActivity: Date;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedClients: Map<string, ConnectedClient> = new Map();
  private organizationRooms: Map<string, Set<string>> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupEventHandlers();
    this.startHeartbeat();

    logger.info('WebSocket service initialized');
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.websocket('CONNECTION', socket.id);

      // Handle client authentication and room joining
      socket.on('authenticate', (data: { organizationId: string; userId?: string }) => {
        this.handleAuthentication(socket, data);
      });

      // Handle joining organization room
      socket.on('join_organization', (organizationId: string) => {
        this.joinOrganizationRoom(socket, organizationId);
      });

      // Handle leaving organization room
      socket.on('leave_organization', (organizationId: string) => {
        this.leaveOrganizationRoom(socket, organizationId);
      });

      // Handle message read status
      socket.on('mark_message_read', (data: { messageId: string; conversationId: string }) => {
        this.handleMessageRead(socket, data);
      });

      // Handle typing indicators
      socket.on('typing_start', (data: { conversationId: string; organizationId: string }) => {
        this.handleTypingStart(socket, data);
      });

      socket.on('typing_stop', (data: { conversationId: string; organizationId: string }) => {
        this.handleTypingStop(socket, data);
      });

      // Handle human takeover
      socket.on('take_over_conversation', (data: { conversationId: string; userId: string; organizationId: string }) => {
        this.handleTakeOver(socket, data);
      });

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        this.handleDisconnection(socket, reason);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`Socket error for ${socket.id}:`, error);
      });

      // Ping/Pong for connection health
      socket.on('ping', () => {
        socket.emit('pong');
        this.updateClientActivity(socket.id);
      });
    });
  }

  // Authentication and Room Management
  private handleAuthentication(socket: Socket, data: { organizationId: string; userId?: string }): void {
    const client: ConnectedClient = {
      socketId: socket.id,
      userId: data.userId,
      organizationId: data.organizationId,
      connectedAt: new Date(),
      lastActivity: new Date()
    };

    this.connectedClients.set(socket.id, client);
    this.joinOrganizationRoom(socket, data.organizationId);

    socket.emit('authenticated', {
      success: true,
      message: 'Conectado com sucesso! 💝',
      organizationId: data.organizationId
    });

    logger.websocket('AUTHENTICATED', socket.id, {
      organizationId: data.organizationId,
      userId: data.userId
    });
  }

  private joinOrganizationRoom(socket: Socket, organizationId: string): void {
    const roomName = `org_${organizationId}`;

    socket.join(roomName);

    // Track room membership
    if (!this.organizationRooms.has(organizationId)) {
      this.organizationRooms.set(organizationId, new Set());
    }
    this.organizationRooms.get(organizationId)!.add(socket.id);

    // Update client info
    const client = this.connectedClients.get(socket.id);
    if (client) {
      client.organizationId = organizationId;
      client.lastActivity = new Date();
    }

    logger.websocket('JOINED_ROOM', socket.id, { room: roomName });

    // Notify about current online users
    this.broadcastOnlineStatus(organizationId);
  }

  private leaveOrganizationRoom(socket: Socket, organizationId: string): void {
    const roomName = `org_${organizationId}`;

    socket.leave(roomName);

    // Remove from room tracking
    const room = this.organizationRooms.get(organizationId);
    if (room) {
      room.delete(socket.id);
      if (room.size === 0) {
        this.organizationRooms.delete(organizationId);
      }
    }

    logger.websocket('LEFT_ROOM', socket.id, { room: roomName });

    // Notify about updated online status
    this.broadcastOnlineStatus(organizationId);
  }

  private handleDisconnection(socket: Socket, reason: string): void {
    const client = this.connectedClients.get(socket.id);

    if (client) {
      // Remove from room tracking
      const room = this.organizationRooms.get(client.organizationId);
      if (room) {
        room.delete(socket.id);
        if (room.size === 0) {
          this.organizationRooms.delete(client.organizationId);
        }
      }

      // Notify about updated online status
      this.broadcastOnlineStatus(client.organizationId);

      logger.websocket('DISCONNECTED', socket.id, {
        reason,
        organizationId: client.organizationId,
        connectedDuration: Date.now() - client.connectedAt.getTime()
      });
    }

    this.connectedClients.delete(socket.id);
  }

  // Message Events
  public notifyNewMessage(organizationId: string, message: MessageData & { customerName: string }): void {
    const event: SocketEvent = {
      type: 'new_message',
      organizationId,
      data: message,
      timestamp: new Date().toISOString()
    };

    this.io.to(`org_${organizationId}`).emit('new_message', event.data);

    logger.websocket('NEW_MESSAGE_SENT', `org_${organizationId}`, {
      messageId: message.id,
      direction: message.direction
    });
  }

  public notifyMessageRead(organizationId: string, messageId: string, conversationId: string): void {
    this.io.to(`org_${organizationId}`).emit('message_read', {
      messageId,
      conversationId,
      readAt: new Date().toISOString()
    });
  }

  private handleMessageRead(socket: Socket, data: { messageId: string; conversationId: string }): void {
    const client = this.connectedClients.get(socket.id);
    if (!client) return;

    // Broadcast to other clients in the same organization
    socket.to(`org_${client.organizationId}`).emit('message_read', {
      ...data,
      readBy: client.userId,
      readAt: new Date().toISOString()
    });
  }

  // Typing Indicators
  private handleTypingStart(socket: Socket, data: { conversationId: string; organizationId: string }): void {
    const client = this.connectedClients.get(socket.id);
    if (!client) return;

    socket.to(`org_${data.organizationId}`).emit('user_typing', {
      conversationId: data.conversationId,
      userId: client.userId,
      isTyping: true
    });
  }

  private handleTypingStop(socket: Socket, data: { conversationId: string; organizationId: string }): void {
    const client = this.connectedClients.get(socket.id);
    if (!client) return;

    socket.to(`org_${data.organizationId}`).emit('user_typing', {
      conversationId: data.conversationId,
      userId: client.userId,
      isTyping: false
    });
  }

  // Human Alert Events
  public notifyHumanNeeded(organizationId: string, alert: HumanAlert): void {
    const event: SocketEvent = {
      type: 'human_needed',
      organizationId,
      data: alert,
      timestamp: new Date().toISOString()
    };

    this.io.to(`org_${organizationId}`).emit('human_needed', event.data);

    logger.websocket('HUMAN_ALERT_SENT', `org_${organizationId}`, {
      alertId: alert.id,
      urgency: alert.urgency,
      customer: alert.customerName
    });
  }

  private handleTakeOver(socket: Socket, data: { conversationId: string; userId: string; organizationId: string }): void {
    // Notify all clients that a human has taken over this conversation
    this.io.to(`org_${data.organizationId}`).emit('conversation_taken_over', {
      conversationId: data.conversationId,
      takenOverBy: data.userId,
      takenOverAt: new Date().toISOString()
    });

    logger.websocket('TAKEOVER', socket.id, {
      conversationId: data.conversationId,
      userId: data.userId
    });
  }

  // Dashboard Events
  public updateDashboard(organizationId: string, stats: DashboardStats): void {
    const event: SocketEvent = {
      type: 'dashboard_update',
      organizationId,
      data: stats,
      timestamp: new Date().toISOString()
    };

    this.io.to(`org_${organizationId}`).emit('dashboard_update', event.data);

    logger.websocket('DASHBOARD_UPDATE_SENT', `org_${organizationId}`, {
      conversations: stats.conversations_today,
      appointments: stats.daily_appointments
    });
  }

  // Status Events
  public notifyStatusChange(organizationId: string, status: { type: string; message: string; data?: any }): void {
    const event: SocketEvent = {
      type: 'status_change',
      organizationId,
      data: status,
      timestamp: new Date().toISOString()
    };

    this.io.to(`org_${organizationId}`).emit('status_change', event.data);
  }

  // WhatsApp Connection Events
  public notifyWhatsAppStatus(organizationId: string, instanceName: string, status: string, qrCode?: string): void {
    this.io.to(`org_${organizationId}`).emit('whatsapp_status', {
      instanceName,
      status,
      qrCode,
      timestamp: new Date().toISOString()
    });

    logger.websocket('WHATSAPP_STATUS_SENT', `org_${organizationId}`, {
      instanceName,
      status
    });
  }

  // Notification Events
  public sendNotification(organizationId: string, notification: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    action?: { label: string; url: string };
  }): void {
    this.io.to(`org_${organizationId}`).emit('notification', {
      ...notification,
      id: `notif_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  }

  // Online Status Management
  private broadcastOnlineStatus(organizationId: string): void {
    const room = this.organizationRooms.get(organizationId);
    const onlineCount = room ? room.size : 0;

    const onlineUsers = Array.from(this.connectedClients.values())
      .filter(client => client.organizationId === organizationId)
      .map(client => ({
        userId: client.userId,
        socketId: client.socketId,
        connectedAt: client.connectedAt,
        lastActivity: client.lastActivity
      }));

    this.io.to(`org_${organizationId}`).emit('online_status', {
      onlineCount,
      onlineUsers,
      timestamp: new Date().toISOString()
    });
  }

  private updateClientActivity(socketId: string): void {
    const client = this.connectedClients.get(socketId);
    if (client) {
      client.lastActivity = new Date();
    }
  }

  // Heartbeat and Health Monitoring
  private startHeartbeat(): void {
    setInterval(() => {
      const now = new Date();
      const staleThreshold = 5 * 60 * 1000; // 5 minutes

      // Check for stale connections
      for (const [socketId, client] of this.connectedClients.entries()) {
        if (now.getTime() - client.lastActivity.getTime() > staleThreshold) {
          logger.warn(`Stale connection detected: ${socketId}`);
          // Could disconnect stale connections here if needed
        }
      }

      // Send heartbeat to all connected clients
      this.io.emit('heartbeat', {
        timestamp: now.toISOString(),
        connectedClients: this.connectedClients.size
      });

    }, 30000); // Every 30 seconds
  }

  // Public Utility Methods
  public getConnectedClients(organizationId?: string): ConnectedClient[] {
    if (organizationId) {
      return Array.from(this.connectedClients.values())
        .filter(client => client.organizationId === organizationId);
    }
    return Array.from(this.connectedClients.values());
  }

  public getOnlineCount(organizationId: string): number {
    const room = this.organizationRooms.get(organizationId);
    return room ? room.size : 0;
  }

  public isOrganizationOnline(organizationId: string): boolean {
    return this.getOnlineCount(organizationId) > 0;
  }

  // Emergency broadcast
  public emergencyBroadcast(message: string): void {
    this.io.emit('emergency', {
      message,
      timestamp: new Date().toISOString()
    });

    logger.websocket('EMERGENCY_BROADCAST', 'all', { message });
  }

  // Health check
  public getHealthStatus(): {
    isHealthy: boolean;
    connectedClients: number;
    organizationRooms: number;
    uptime: number;
  } {
    return {
      isHealthy: true,
      connectedClients: this.connectedClients.size,
      organizationRooms: this.organizationRooms.size,
      uptime: process.uptime()
    };
  }
}