import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

// WhatsApp webhook verification and message handling
app.get("/whatsapp", async (c) => {
  try {
    const mode = c.req.query("hub.mode");
    const token = c.req.query("hub.verify_token");
    const challenge = c.req.query("hub.challenge");

    // Verify webhook - this should match the token configured in WhatsApp Business API
    const verifyToken = "teste_webhook_verify_2025";

    if (mode === "subscribe" && token === verifyToken) {
      console.log("WhatsApp webhook verified successfully");
      return c.text(challenge || "");
    } else {
      console.log("WhatsApp webhook verification failed");
      return c.text("Verification failed", 403);
    }
  } catch (error) {
    console.error("Error verifying WhatsApp webhook:", error);
    return c.text("Error", 500);
  }
});

// Handle incoming WhatsApp messages
app.post("/whatsapp", async (c) => {
  try {
    const body = await c.req.json();
    console.log("WhatsApp webhook received:", JSON.stringify(body, null, 2));

    // Process WhatsApp Business API webhook
    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === "messages") {
            await processWhatsAppMessage(c.env.DB, change.value);
          }
        }
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Error processing WhatsApp webhook:", error);
    return c.json({ error: "Error processing webhook" }, 500);
  }
});

// Process WhatsApp message from webhook
async function processWhatsAppMessage(db: D1Database, messageData: any) {
  try {
    const messages = messageData.messages || [];
    // const contacts = messageData.contacts || [];
    // const metadata = messageData.metadata || {};

    for (const message of messages) {
      const phoneNumber = message.from;
      const messageId = message.id;
      const messageType = message.type;
      let content = '';
      let mediaUrl = null;
      let mediaType = null;
      let mediaCaption = null;

      // Extract message content based on type
      switch (messageType) {
        case 'text':
          content = message.text?.body || '';
          break;
        case 'image':
          content = message.image?.caption || '';
          mediaUrl = message.image?.id; // In real implementation, download media
          mediaType = 'image';
          mediaCaption = message.image?.caption;
          break;
        case 'video':
          content = message.video?.caption || '';
          mediaUrl = message.video?.id;
          mediaType = 'video';
          mediaCaption = message.video?.caption;
          break;
        case 'audio':
          mediaUrl = message.audio?.id;
          mediaType = 'audio';
          break;
        case 'document':
          content = message.document?.caption || message.document?.filename || '';
          mediaUrl = message.document?.id;
          mediaType = 'document';
          mediaCaption = message.document?.filename;
          break;
        default:
          content = `Mensagem do tipo ${messageType} não suportada`;
      }

      // Find or create conversation
      const conversation = await findOrCreateConversation(db, phoneNumber);
      
      if (!conversation) {
        console.error('Failed to find or create conversation');
        continue;
      }

      // Check for duplicate message
      const existingMessage = await db.prepare(`
        SELECT id FROM whatsapp_messages 
        WHERE whatsapp_message_id = ?
      `).bind(messageId).first();

      if (existingMessage) {
        console.log(`Message ${messageId} already exists, skipping`);
        continue;
      }

      // Save message to database
      await db.prepare(`
        INSERT INTO whatsapp_messages (
          conversation_id, whatsapp_message_id, direction, message_type,
          content, media_url, media_type, media_caption, received_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        conversation.id,
        messageId,
        'inbound',
        messageType,
        content,
        mediaUrl,
        mediaType,
        mediaCaption
      ).run();

      // Update conversation
      await db.prepare(`
        UPDATE whatsapp_conversations 
        SET last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(conversation.id).run();

      // Process bot flow if conversation is in bot mode
      if (conversation.status === 'bot') {
        await processBotFlow(db, conversation, { content, messageType });
      }

      console.log(`Processed message ${messageId} for conversation ${conversation.id}`);
    }
  } catch (error) {
    console.error("Error processing WhatsApp message:", error);
  }
}

// Find or create conversation
async function findOrCreateConversation(db: D1Database, phoneE164: string) {
  // Normalize phone number
  const normalizedPhone = normalizePhoneNumber(phoneE164);
  
  // Try to find existing conversation
  const existing = await db.prepare(`
    SELECT * FROM whatsapp_conversations 
    WHERE phone_e164 = ? AND is_active = 1
  `).bind(normalizedPhone).first();

  if (existing) {
    return existing;
  }

  // Create new conversation in bot mode
  const result = await db.prepare(`
    INSERT INTO whatsapp_conversations (
      phone_e164, status, bot_stage, last_message_at, updated_at
    ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(normalizedPhone, 'bot', 'identify').run();

  if (result.success) {
    const newConversation = await db.prepare(`
      SELECT * FROM whatsapp_conversations WHERE id = ?
    `).bind(result.meta.last_row_id).first();
    
    // Send welcome message
    await sendBotMessage(db, newConversation, 'identify');
    
    return newConversation;
  }

  throw new Error('Failed to create conversation');
}

// Process bot flow (simplified version)
async function processBotFlow(db: D1Database, conversation: any, messageData: any) {
  const currentStage = conversation.bot_stage || 'identify';
  const collectedData = conversation.collected_data ? JSON.parse(conversation.collected_data) : {};
  const userMessage = messageData.content?.toLowerCase().trim();
  
  let nextStage = currentStage;
  let shouldUpdateStage = false;

  switch (currentStage) {
    case 'identify':
      // Send welcome message automatically
      await sendBotMessage(db, conversation, 'person_type');
      nextStage = 'person_type';
      shouldUpdateStage = true;
      break;

    case 'person_type':
      if (userMessage === '1') {
        collectedData.person_type = 'fisica';
        await sendBotMessage(db, conversation, 'document_request_cpf');
        nextStage = 'document_request';
        shouldUpdateStage = true;
      } else if (userMessage === '2') {
        collectedData.person_type = 'juridica';
        await sendBotMessage(db, conversation, 'document_request_cnpj');
        nextStage = 'document_request';
        shouldUpdateStage = true;
      } else {
        await sendBotMessage(db, conversation, 'person_type_invalid');
      }
      break;

    case 'document_request':
      const document = messageData.content.replace(/\D/g, '');
      const isValidCPF = collectedData.person_type === 'fisica' && document.length === 11;
      const isValidCNPJ = collectedData.person_type === 'juridica' && document.length === 14;
      
      if (isValidCPF || isValidCNPJ) {
        collectedData.document = document;
        collectedData.document_type = isValidCPF ? 'CPF' : 'CNPJ';
        await sendBotMessage(db, conversation, 'name_request');
        nextStage = 'name_request';
        shouldUpdateStage = true;
      } else {
        const docType = collectedData.person_type === 'fisica' ? 'CPF' : 'CNPJ';
        await sendBotMessage(db, conversation, `document_invalid_${docType.toLowerCase()}`);
      }
      break;

    case 'name_request':
      if (messageData.content?.trim().length >= 3) {
        if (collectedData.person_type === 'fisica') {
          collectedData.customer_name = messageData.content.trim();
        } else {
          collectedData.company_name = messageData.content.trim();
        }
        await sendBotMessage(db, conversation, 'contact_reason');
        nextStage = 'contact_reason';
        shouldUpdateStage = true;
      } else {
        await sendBotMessage(db, conversation, 'name_invalid');
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
      
      if (reasons[userMessage as keyof typeof reasons]) {
        collectedData.contact_reason = reasons[userMessage as keyof typeof reasons];
        
        // Create customer and ticket
        const customerId = await createOrUpdateCustomer(db, collectedData);
        const ticketId = await createTicketFromBot(db, customerId, collectedData);
        
        // Send completion message
        await sendBotMessage(db, conversation, 'completed', { ticketId, collectedData });
        
        // Update conversation status
        await db.prepare(`
          UPDATE whatsapp_conversations 
          SET status = ?, customer_id = ?, ticket_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind('waiting', customerId, ticketId, conversation.id).run();
        
        nextStage = 'completed';
        shouldUpdateStage = true;
      } else {
        await sendBotMessage(db, conversation, 'contact_reason_invalid');
      }
      break;
  }

  // Update conversation stage and data
  if (shouldUpdateStage) {
    await db.prepare(`
      UPDATE whatsapp_conversations 
      SET bot_stage = ?, collected_data = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(nextStage, JSON.stringify(collectedData), conversation.id).run();
  }
}

// Send bot message
async function sendBotMessage(db: D1Database, conversation: any, messageType: string, data?: any) {
  const messages = {
    person_type: `Olá! 👋 Bem-vindo(a) ao atendimento da CentralFlow.\n\nPara melhor atendê-lo(a), você é:\n\n1️⃣ Pessoa Física (CPF)\n2️⃣ Pessoa Jurídica (CNPJ)\n\nDigite 1 ou 2:`,
    document_request_cpf: `Perfeito! 👤 Por favor, digite seu CPF (apenas números):`,
    document_request_cnpj: `Perfeito! 🏢 Por favor, digite o CNPJ da empresa (apenas números):`,
    person_type_invalid: `Por favor, digite apenas 1 para Pessoa Física ou 2 para Pessoa Jurídica.`,
    document_invalid_cpf: `Por favor, digite um CPF válido (11 dígitos, apenas números).`,
    document_invalid_cnpj: `Por favor, digite um CNPJ válido (14 dígitos, apenas números).`,
    name_request: `Documento registrado! 📋 Agora, por favor, digite seu ${data?.collectedData?.person_type === 'fisica' ? 'nome completo' : 'nome da empresa'}:`,
    name_invalid: `Por favor, digite um nome válido (pelo menos 3 caracteres).`,
    contact_reason: `Obrigado! 📞 Para finalizar, qual o motivo do seu contato?\n\n1️⃣ Suporte técnico\n2️⃣ Dúvidas sobre produtos\n3️⃣ Solicitação comercial\n4️⃣ Reclamação\n5️⃣ Outros\n\nDigite o número correspondente:`,
    contact_reason_invalid: `Por favor, digite apenas o número correspondente ao motivo do contato (1 a 5).`,
    completed: `Perfeito! ✅ Seus dados foram registrados.\n\n📋 **Resumo:**\n${data?.collectedData?.person_type === 'fisica' ? `Nome: ${data?.collectedData?.customer_name}` : `Empresa: ${data?.collectedData?.company_name}`}\n${data?.collectedData?.document_type}: ${formatDocument(data?.collectedData?.document, data?.collectedData?.document_type)}\nMotivo: ${data?.collectedData?.contact_reason}\n\n🎫 **Ticket #${data?.ticketId}** criado com sucesso!\n\nEm breve um de nossos atendentes entrará em contato. Obrigado!`
  };

  const message = messages[messageType as keyof typeof messages] || 'Mensagem não encontrada';

  // Save bot message to database
  await db.prepare(`
    INSERT INTO whatsapp_messages (
      conversation_id, direction, message_type, content, sent_by, updated_at
    ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(
    conversation.id,
    'outbound',
    'text',
    message,
    0 // Bot user ID
  ).run();

  // In a real implementation, you would also send the message via WhatsApp API
  console.log(`Bot message sent to ${conversation.phone_e164}: ${message}`);
}

// Create or update customer
async function createOrUpdateCustomer(db: D1Database, collectedData: any): Promise<number> {
  const existing = await db.prepare(`
    SELECT id FROM customers WHERE document = ?
  `).bind(collectedData.document).first();

  if (existing) {
    await db.prepare(`
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
    const result = await db.prepare(`
      INSERT INTO customers (
        name, document, document_type, company_name, updated_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      collectedData.customer_name || collectedData.company_name,
      collectedData.document,
      collectedData.document_type,
      collectedData.person_type === 'juridica' ? collectedData.company_name : null
    ).run();

    if (result.success) {
      return result.meta.last_row_id as number;
    }
    throw new Error('Failed to create customer');
  }
}

// Create ticket from bot
async function createTicketFromBot(db: D1Database, customerId: number, collectedData: any): Promise<number> {
  const title = `${collectedData.contact_reason} - ${collectedData.customer_name || collectedData.company_name}`;
  const description = `Ticket criado automaticamente via WhatsApp.\n\nDados coletados:\n- Tipo: ${collectedData.person_type === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}\n- ${collectedData.document_type}: ${formatDocument(collectedData.document, collectedData.document_type)}\n- Nome: ${collectedData.customer_name || collectedData.company_name}\n- Motivo: ${collectedData.contact_reason}`;

  const result = await db.prepare(`
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
    1 // System user
  ).run();

  if (result.success) {
    return result.meta.last_row_id as number;
  }
  throw new Error('Failed to create ticket');
}

// Utility functions
function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('85')) {
    return `+55${digits}`;
  } else if (digits.length === 13 && digits.startsWith('55')) {
    return `+${digits}`;
  } else if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }
  return phone;
}

function formatDocument(document: string, type: string): string {
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

export default app;
