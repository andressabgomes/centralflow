/**
 * WhatsApp Business API Service for Cloudflare Workers
 * Uses official WhatsApp Business API instead of whatsapp-web.js for production compatibility
 */

export interface WhatsAppSession {
  id: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  phoneNumber?: string;
  error?: string;
  lastActivity: Date;
  accessToken?: string;
  phoneNumberId?: string;
}

export interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  profilePicUrl?: string;
}

export interface WhatsAppChatInfo {
  id: string;
  name: string;
  phone: string;
  unreadCount: number;
  lastMessage?: {
    body: string;
    timestamp: number;
    from: string;
  };
}

export interface WhatsAppMessageData {
  id: string;
  from: string;
  to: string;
  body: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document';
  timestamp: number;
  hasMedia: boolean;
  media?: {
    mimetype: string;
    filename?: string;
    data: string; // base64 or URL
  };
}

class WhatsAppService {
  private sessions: Map<string, WhatsAppSession> = new Map();
  private db: D1Database;
  private accessToken: string;
  private phoneNumberId: string;
  private apiUrl = 'https://graph.facebook.com/v18.0';

  constructor(db: D1Database, accessToken?: string, phoneNumberId?: string) {
    this.db = db;
    this.accessToken = accessToken || '';
    this.phoneNumberId = phoneNumberId || '';
  }

  // Initialize WhatsApp Business API connection
  async createSession(): Promise<{ sessionId: string; status: string }> {
    const sessionId = this.generateSessionId();
    
    try {
      // Check if we have valid credentials
      if (!this.accessToken || !this.phoneNumberId) {
        throw new Error('WhatsApp Business API credentials not configured');
      }

      // Verify phone number status
      const phoneStatus = await this.verifyPhoneNumber();
      
      const session: WhatsAppSession = {
        id: sessionId,
        status: (phoneStatus as any).verified ? 'connected' : 'error',
        phoneNumber: (phoneStatus as any).display_phone_number,
        accessToken: this.accessToken,
        phoneNumberId: this.phoneNumberId,
        lastActivity: new Date(),
        error: (phoneStatus as any).verified ? undefined : 'Phone number not verified'
      };

      this.sessions.set(sessionId, session);

      // Update integration status in database
      await this.updateIntegrationStatus(sessionId, session.status, session.phoneNumber);

      return { 
        sessionId, 
        status: session.status 
      };
    } catch (error) {
      console.error('Error creating WhatsApp session:', error);
      
      const session: WhatsAppSession = {
        id: sessionId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastActivity: new Date()
      };
      
      this.sessions.set(sessionId, session);
      
      return { 
        sessionId, 
        status: 'error' 
      };
    }
  }

  // Verify phone number with WhatsApp Business API
  private async verifyPhoneNumber() {
    try {
      const response = await fetch(
        `${this.apiUrl}/${this.phoneNumberId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying phone number:', error);
      return { verified: false, error: error instanceof Error ? error.message : 'Verification failed' };
    }
  }

  // Generate unique session ID
  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  // Send message via WhatsApp Business API
  async sendMessage(
    phoneE164: string, 
    message: string, 
    mediaData?: { data: string; mimetype: string; filename?: string }
  ): Promise<boolean> {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        throw new Error('WhatsApp Business API not configured');
      }

      const normalizedPhone = this.normalizePhoneNumber(phoneE164);
      
      let messageBody: any = {
        messaging_product: 'whatsapp',
        to: normalizedPhone,
        type: 'text',
        text: { body: message }
      };

      // Handle media messages
      if (mediaData) {
        const mediaType = this.getMediaType(mediaData.mimetype);
        
        if (mediaType === 'document') {
          messageBody = {
            messaging_product: 'whatsapp',
            to: normalizedPhone,
            type: 'document',
            document: {
              link: `data:${mediaData.mimetype};base64,${mediaData.data}`,
              caption: message,
              filename: mediaData.filename
            }
          };
        } else if (mediaType === 'image') {
          messageBody = {
            messaging_product: 'whatsapp',
            to: normalizedPhone,
            type: 'image',
            image: {
              link: `data:${mediaData.mimetype};base64,${mediaData.data}`,
              caption: message
            }
          };
        } else if (mediaType === 'video') {
          messageBody = {
            messaging_product: 'whatsapp',
            to: normalizedPhone,
            type: 'video',
            video: {
              link: `data:${mediaData.mimetype};base64,${mediaData.data}`,
              caption: message
            }
          };
        } else if (mediaType === 'audio') {
          messageBody = {
            messaging_product: 'whatsapp',
            to: normalizedPhone,
            type: 'audio',
            audio: {
              link: `data:${mediaData.mimetype};base64,${mediaData.data}`
            }
          };
        }
      }

      const response = await fetch(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(messageBody)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('WhatsApp API error:', errorData);
        throw new Error(`WhatsApp API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('Message sent successfully:', result);
      
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  // Handle incoming webhook messages
  async handleIncomingWebhook(webhookData: any): Promise<void> {
    try {
      const entry = webhookData.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      
      if (!value?.messages) {
        return;
      }

      for (const message of value.messages) {
        await this.processIncomingMessage(message, value.contacts);
      }
      
      // Mark messages as read
      for (const message of value.messages) {
        await this.markMessageAsRead(message.id);
      }
    } catch (error) {
      console.error('Error handling incoming webhook:', error);
    }
  }

  // Process incoming message from webhook
  private async processIncomingMessage(message: any, contacts: any[]): Promise<void> {
    try {
      const contact = contacts?.find(c => c.wa_id === message.from);
      const phoneE164 = this.normalizePhoneNumber(message.from);
      
      // Find or create conversation
      const conversation = await this.findOrCreateConversation(phoneE164, contact?.profile?.name);
      
      if (!conversation?.id) {
        console.error('Failed to find or create conversation');
        return;
      }

      // Extract message data
      const messageData = await this.extractWebhookMessageData(message);
      
      // Save message to database
      await this.saveMessageToDatabase(conversation.id as number, messageData, 'inbound');
      
      // Process message for bot/automation
      await this.processIncomingMessageForBot(conversation, messageData);
      
    } catch (error) {
      console.error('Error processing incoming message:', error);
    }
  }

  // Extract message data from webhook
  private async extractWebhookMessageData(message: any): Promise<WhatsAppMessageData> {
    const data: WhatsAppMessageData = {
      id: message.id,
      from: message.from,
      to: this.phoneNumberId,
      body: '',
      type: 'text',
      timestamp: parseInt(message.timestamp) * 1000,
      hasMedia: false
    };

    // Handle different message types
    if (message.text) {
      data.body = message.text.body;
      data.type = 'text';
    } else if (message.image) {
      data.type = 'image';
      data.hasMedia = true;
      data.body = message.image.caption || '';
      data.media = {
        mimetype: message.image.mime_type,
        data: message.image.id // WhatsApp media ID
      };
    } else if (message.document) {
      data.type = 'document';
      data.hasMedia = true;
      data.body = message.document.caption || '';
      data.media = {
        mimetype: message.document.mime_type,
        filename: message.document.filename,
        data: message.document.id // WhatsApp media ID
      };
    } else if (message.audio) {
      data.type = 'audio';
      data.hasMedia = true;
      data.media = {
        mimetype: message.audio.mime_type,
        data: message.audio.id // WhatsApp media ID
      };
    } else if (message.video) {
      data.type = 'video';
      data.hasMedia = true;
      data.body = message.video.caption || '';
      data.media = {
        mimetype: message.video.mime_type,
        data: message.video.id // WhatsApp media ID
      };
    }

    return data;
  }

  // Mark message as read
  private async markMessageAsRead(messageId: string): Promise<void> {
    try {
      await fetch(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId
          })
        }
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  // Find or create conversation
  private async findOrCreateConversation(phoneE164: string, contactName?: string) {
    const normalizedPhone = this.normalizePhoneNumber(phoneE164);
    
    // Try to find existing conversation
    const existing = await this.db.prepare(`
      SELECT * FROM whatsapp_conversations 
      WHERE phone_e164 = ? AND is_active = 1
    `).bind(normalizedPhone).first();

    if (existing) {
      return existing;
    }

    // Create new conversation with bot mode
    const result = await this.db.prepare(`
      INSERT INTO whatsapp_conversations (
        phone_e164, status, bot_stage, last_message_at, updated_at
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(normalizedPhone, 'bot', 'identify').run();

    if (result.success) {
      // If we have contact name, try to find/create customer
      if (contactName) {
        await this.findOrCreateCustomerByPhone(normalizedPhone, contactName);
      }
      
      return await this.db.prepare(`
        SELECT * FROM whatsapp_conversations WHERE id = ?
      `).bind(result.meta.last_row_id).first();
    }

    throw new Error('Failed to create conversation');
  }

  // Find or create customer by phone
  private async findOrCreateCustomerByPhone(phone: string, name: string): Promise<number | null> {
    try {
      // Try to find existing customer
      const existing = await this.db.prepare(`
        SELECT id FROM customers WHERE phone = ?
      `).bind(phone).first();

      if (existing) {
        return existing.id as number;
      }

      // Create new customer
      const result = await this.db.prepare(`
        INSERT INTO customers (
          name, phone, updated_at
        ) VALUES (?, ?, CURRENT_TIMESTAMP)
      `).bind(name, phone).run();

      if (result.success && result.meta.last_row_id) {
        return result.meta.last_row_id as number;
      }
    } catch (error) {
      console.error('Error finding/creating customer:', error);
    }
    
    return null;
  }

  // Save message to database
  private async saveMessageToDatabase(
    conversationId: number, 
    messageData: WhatsAppMessageData, 
    direction: 'inbound' | 'outbound'
  ) {
    await this.db.prepare(`
      INSERT INTO whatsapp_messages (
        conversation_id, whatsapp_message_id, direction, message_type,
        content, media_url, media_type, media_caption, received_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      conversationId,
      messageData.id,
      direction,
      messageData.type,
      messageData.body,
      messageData.media?.data || null,
      messageData.media?.mimetype || null,
      messageData.media?.filename || null
    ).run();

    // Update conversation last message time
    await this.db.prepare(`
      UPDATE whatsapp_conversations 
      SET last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(conversationId).run();
  }

  // Process incoming message for automation
  private async processIncomingMessageForBot(conversation: any, messageData: WhatsAppMessageData) {
    if (conversation.status === 'bot') {
      await this.processBotFlow(conversation, messageData);
    }
  }

  // Bot flow processing (same logic as before)
  private async processBotFlow(conversation: any, messageData: WhatsAppMessageData) {
    const currentStage = conversation.bot_stage || 'identify';
    const collectedData = conversation.collected_data ? JSON.parse(conversation.collected_data) : {};
    
    let nextStage = currentStage;
    let responseMessage = '';
    let shouldSendResponse = true;

    switch (currentStage) {
      case 'identify':
        responseMessage = `Olá! 👋 Bem-vindo(a) ao atendimento da CentralFlow.\n\nPara melhor atendê-lo(a), você é:\n\n1️⃣ Pessoa Física (CPF)\n2️⃣ Pessoa Jurídica (CNPJ)\n\nDigite 1 ou 2:`;
        nextStage = 'person_type';
        break;

      case 'person_type':
        if (messageData.body === '1') {
          collectedData.person_type = 'fisica';
          responseMessage = 'Perfeito! 👤 Por favor, digite seu CPF (apenas números):';
          nextStage = 'document_request';
        } else if (messageData.body === '2') {
          collectedData.person_type = 'juridica';
          responseMessage = 'Perfeito! 🏢 Por favor, digite o CNPJ da empresa (apenas números):';
          nextStage = 'document_request';
        } else {
          responseMessage = 'Por favor, digite apenas 1 para Pessoa Física ou 2 para Pessoa Jurídica.';
        }
        break;

      case 'document_request':
        const document = messageData.body.replace(/\D/g, '');
        if (collectedData.person_type === 'fisica' && document.length === 11) {
          collectedData.document = document;
          collectedData.document_type = 'CPF';
          responseMessage = 'CPF registrado! 📋 Agora, por favor, digite seu nome completo:';
          nextStage = 'name_request';
        } else if (collectedData.person_type === 'juridica' && document.length === 14) {
          collectedData.document = document;
          collectedData.document_type = 'CNPJ';
          responseMessage = 'CNPJ registrado! 🏢 Agora, por favor, digite o nome da empresa:';
          nextStage = 'name_request';
        } else {
          const expectedLength = collectedData.person_type === 'fisica' ? '11' : '14';
          const docType = collectedData.person_type === 'fisica' ? 'CPF' : 'CNPJ';
          responseMessage = `Por favor, digite um ${docType} válido (${expectedLength} dígitos, apenas números).`;
        }
        break;

      case 'name_request':
        if (messageData.body.trim().length >= 3) {
          if (collectedData.person_type === 'fisica') {
            collectedData.customer_name = messageData.body.trim();
          } else {
            collectedData.company_name = messageData.body.trim();
          }
          responseMessage = 'Obrigado! 📞 Para finalizar, qual o motivo do seu contato?\n\n1️⃣ Suporte técnico\n2️⃣ Dúvidas sobre produtos\n3️⃣ Solicitação comercial\n4️⃣ Reclamação\n5️⃣ Outros\n\nDigite o número correspondente:';
          nextStage = 'contact_reason';
        } else {
          responseMessage = 'Por favor, digite um nome válido (pelo menos 3 caracteres).';
        }
        break;

      case 'contact_reason':
        const reasons = {
          '1': 'Suporte técnico',
          '2': 'Dúvidas sobre produtos', 
          '3': 'Solicitação comercial',
          '4': 'Reclamação',
          '5': 'Outros'
        };
        
        if (reasons[messageData.body as keyof typeof reasons]) {
          collectedData.contact_reason = reasons[messageData.body as keyof typeof reasons];
          
          // Create customer if not exists
          const customerId = await this.createOrUpdateCustomer(collectedData);
          
          // Create ticket
          const ticketId = await this.createTicketFromBot(customerId, collectedData);
          
          responseMessage = `Perfeito! ✅ Seus dados foram registrados.\n\n📋 **Resumo:**\n${collectedData.person_type === 'fisica' ? `Nome: ${collectedData.customer_name}` : `Empresa: ${collectedData.company_name}`}\n${collectedData.document_type}: ${this.formatDocument(collectedData.document, collectedData.document_type)}\nMotivo: ${collectedData.contact_reason}\n\n🎫 **Ticket #${ticketId}** criado com sucesso!\n\nEm breve um de nossos atendentes entrará em contato. Obrigado!`;
          
          nextStage = 'completed';
          
          // Update conversation status
          await this.db.prepare(`
            UPDATE whatsapp_conversations 
            SET status = ?, customer_id = ?, ticket_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind('waiting', customerId, ticketId, conversation.id).run();
        } else {
          responseMessage = 'Por favor, digite apenas o número correspondente ao motivo do contato (1 a 5).';
        }
        break;

      case 'completed':
        shouldSendResponse = false;
        break;
    }

    // Update conversation with new stage and collected data
    if (nextStage !== currentStage || Object.keys(collectedData).length > 0) {
      await this.db.prepare(`
        UPDATE whatsapp_conversations 
        SET bot_stage = ?, collected_data = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(nextStage, JSON.stringify(collectedData), conversation.id).run();
    }

    // Send response message
    if (shouldSendResponse && responseMessage) {
      await this.sendMessage(conversation.phone_e164, responseMessage);
    }
  }

  // Create or update customer from bot data
  private async createOrUpdateCustomer(collectedData: any): Promise<number> {
    const existing = await this.db.prepare(`
      SELECT id FROM customers WHERE document = ?
    `).bind(collectedData.document).first();

    if (existing) {
      await this.db.prepare(`
        UPDATE customers SET
          name = ?, document_type = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        collectedData.customer_name || collectedData.company_name,
        collectedData.document_type,
        existing.id
      ).run();
      return existing.id as number;
    } else {
      const result = await this.db.prepare(`
        INSERT INTO customers (
          name, document, document_type, company_name, updated_at
        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        collectedData.customer_name || collectedData.company_name,
        collectedData.document,
        collectedData.document_type,
        collectedData.person_type === 'juridica' ? collectedData.company_name : null
      ).run();

      if (result.success && result.meta.last_row_id) {
        return result.meta.last_row_id as number;
      }
      throw new Error('Failed to create customer');
    }
  }

  // Create ticket from bot flow
  private async createTicketFromBot(customerId: number, collectedData: any): Promise<number> {
    const title = `${collectedData.contact_reason} - ${collectedData.customer_name || collectedData.company_name}`;
    const description = `Ticket criado automaticamente via WhatsApp.\n\nDados coletados:\n- Tipo: ${collectedData.person_type === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}\n- ${collectedData.document_type}: ${this.formatDocument(collectedData.document, collectedData.document_type)}\n- Nome: ${collectedData.customer_name || collectedData.company_name}\n- Motivo: ${collectedData.contact_reason}`;

    const result = await this.db.prepare(`
      INSERT INTO tickets (
        title, description, status, priority, category, customer_id, 
        channel, created_by, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      title,
      description,
      'open',
      'medium',
      'WhatsApp',
      customerId,
      'whatsapp',
      1
    ).run();

    if (result.success) {
      return result.meta.last_row_id as number;
    }
    throw new Error('Failed to create ticket');
  }

  // Get session status
  getSessionStatus(sessionId: string): WhatsAppSession | null {
    return this.sessions.get(sessionId) || null;
  }

  // Disconnect session
  async disconnectSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    try {
      this.sessions.delete(sessionId);
      await this.updateIntegrationStatus(sessionId, 'disconnected');
      return true;
    } catch (error) {
      console.error('Error disconnecting session:', error);
      return false;
    }
  }

  // Update integration status in database
  private async updateIntegrationStatus(sessionId: string, status: string, phoneNumber?: string) {
    try {
      await this.db.prepare(`
        INSERT OR REPLACE INTO integration_settings (
          integration_type, is_active, config_data, updated_at
        ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        'whatsapp',
        status === 'connected' ? 1 : 0,
        JSON.stringify({ sessionId, status, phoneNumber })
      ).run();
    } catch (error) {
      console.error('Error updating integration status:', error);
    }
  }

  // Utility functions
  private normalizePhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    
    if (digits.length === 11 && digits.startsWith('85')) {
      return `55${digits}`;
    } else if (digits.length === 13 && digits.startsWith('55')) {
      return digits;
    } else if (digits.length === 10 || digits.length === 11) {
      return `55${digits}`;
    }
    
    return phone.replace(/\D/g, '');
  }

  private formatDocument(document: string, type: string): string {
    if (!document) return '';
    const clean = document.replace(/\D/g, '');
    if (type === 'CPF' && clean.length === 11) {
      return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
    }
    if (type === 'CNPJ' && clean.length === 14) {
      return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`;
    }
    return document;
  }

  private getMediaType(mimetype: string): string {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    return 'document';
  }
}

export default WhatsAppService;
