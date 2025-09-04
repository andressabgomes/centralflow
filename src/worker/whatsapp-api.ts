import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import WhatsAppService from "./services/WhatsAppService";
import type { ApiResponse } from "@/shared/types";

// Global WhatsApp service instance
let whatsappService: WhatsAppService | null = null;

const getWhatsAppService = (env: Env): WhatsAppService => {
  if (!whatsappService) {
    whatsappService = new WhatsAppService(
      env.DB,
      env.WHATSAPP_BUSINESS_API_KEY,
      env.WHATSAPP_BUSINESS_PHONE_ID
    );
  }
  return whatsappService;
};

// Validation schemas
const SendMessageSchema = z.object({
  content: z.string().min(1, "Mensagem é obrigatória"),
  message_type: z.enum(["text", "image", "document", "audio", "video"]).default("text"),
  media_data: z.string().optional(),
  media_mimetype: z.string().optional(),
  media_filename: z.string().optional(),
});

const WebhookVerificationSchema = z.object({
  "hub.mode": z.string(),
  "hub.verify_token": z.string(),
  "hub.challenge": z.string(),
});

const app = new Hono<{ Bindings: Env }>();

// ==================== WEBHOOK HANDLING ====================

// Webhook verification (GET request from Meta)
app.get("/webhook", zValidator("query", WebhookVerificationSchema), async (c) => {
  try {
    const query = c.req.valid("query");
    
    // Verify the webhook with your verify token
    const verifyToken = "your_verify_token_here"; // Should be in env
    
    if (query["hub.mode"] === "subscribe" && query["hub.verify_token"] === verifyToken) {
      console.log("Webhook verified successfully");
      return c.text(query["hub.challenge"]);
    } else {
      console.log("Webhook verification failed");
      return c.text("Forbidden", 403);
    }
  } catch (error) {
    console.error("Webhook verification error:", error);
    return c.text("Bad Request", 400);
  }
});

// Webhook message handler (POST request from Meta)
app.post("/webhook", async (c) => {
  try {
    const body = await c.req.json();
    console.log("Received webhook:", JSON.stringify(body, null, 2));
    
    // Verify webhook signature if needed
    // const signature = c.req.header("x-hub-signature-256");
    
    const whatsapp = getWhatsAppService(c.env);
    await whatsapp.handleIncomingWebhook(body);
    
    return c.json({ status: "success" });
  } catch (error) {
    console.error("Webhook handling error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ==================== CONNECTION MANAGEMENT ====================

// Create new WhatsApp Business API connection
app.post("/connect", async (c) => {
  try {
    const whatsapp = getWhatsAppService(c.env);
    const result = await whatsapp.createSession();
    
    return c.json<ApiResponse>({ 
      success: true, 
      data: {
        sessionId: result.sessionId,
        status: result.status,
        message: result.status === 'connected' ? 'WhatsApp Business API conectado' : 'Erro na conexão'
      }
    });
  } catch (error) {
    console.error("Error creating WhatsApp session:", error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: "Erro ao conectar WhatsApp Business API. Verifique as credenciais." 
    }, 500);
  }
});

// Get session status
app.get("/status/:sessionId", async (c) => {
  try {
    const sessionId = c.req.param("sessionId");
    const whatsapp = getWhatsAppService(c.env);
    const session = whatsapp.getSessionStatus(sessionId);
    
    if (!session) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: "Sessão não encontrada" 
      }, 404);
    }
    
    return c.json<ApiResponse>({ 
      success: true, 
      data: {
        status: session.status,
        phoneNumber: session.phoneNumber,
        error: session.error
      }
    });
  } catch (error) {
    console.error("Error getting session status:", error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: "Erro ao verificar status da sessão" 
    }, 500);
  }
});

// Disconnect WhatsApp
app.post("/disconnect", async (c) => {
  try {
    // In a real implementation, you'd specify which session to disconnect
    return c.json<ApiResponse>({ 
      success: true, 
      message: "WhatsApp Business API desconectado" 
    });
  } catch (error) {
    console.error("Error disconnecting WhatsApp:", error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: "Erro ao desconectar WhatsApp" 
    }, 500);
  }
});

// ==================== CONVERSATIONS ====================

// Get all conversations
app.get("/conversations", async (c) => {
  try {
    const db = c.env.DB;
    const filter = c.req.query("filter") || "all";
    
    let whereClause = "WHERE wc.is_active = 1";
    
    switch (filter) {
      case "waiting":
        whereClause += " AND (wc.status = 'waiting' OR (wc.status = 'active' AND wc.assigned_to IS NULL))";
        break;
      case "claimed":
        whereClause += " AND wc.status = 'active' AND wc.assigned_to IS NOT NULL";
        break;
      case "bot":
        whereClause += " AND wc.status = 'bot'";
        break;
    }
    
    const result = await db.prepare(`
      SELECT 
        wc.*,
        c.name as customer_name,
        c.email as customer_email,
        c.document as customer_document,
        c.address_city as customer_city,
        c.address_state as customer_state,
        c.company_name as customer_company,
        tm.name as assigned_name,
        t.title as ticket_title,
        (
          SELECT COUNT(*) 
          FROM whatsapp_messages wm 
          WHERE wm.conversation_id = wc.id 
          AND wm.direction = 'inbound' 
          AND wm.is_processed = 0
        ) as unread_count
      FROM whatsapp_conversations wc
      LEFT JOIN customers c ON wc.customer_id = c.id
      LEFT JOIN team_members tm ON wc.assigned_to = tm.id
      LEFT JOIN tickets t ON wc.ticket_id = t.id
      ${whereClause}
      ORDER BY 
        CASE WHEN wc.status = 'waiting' THEN 1 ELSE 2 END,
        wc.last_message_at DESC
    `).all();
    
    return c.json<ApiResponse>({ success: true, data: result.results });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: "Erro ao buscar conversas" 
    }, 500);
  }
});

// Get conversation messages
app.get("/conversations/:id/messages", async (c) => {
  try {
    const conversationId = c.req.param("id");
    const db = c.env.DB;
    
    const result = await db.prepare(`
      SELECT 
        wm.*,
        CASE 
          WHEN wm.direction = 'inbound' THEN 'Cliente'
          WHEN wm.sent_by IS NOT NULL THEN tm.name
          ELSE 'Sistema'
        END as sender_name
      FROM whatsapp_messages wm
      LEFT JOIN team_members tm ON wm.sent_by = tm.id
      WHERE wm.conversation_id = ?
      ORDER BY wm.created_at ASC
    `).bind(conversationId).all();
    
    // Mark messages as read
    await db.prepare(`
      UPDATE whatsapp_messages 
      SET is_processed = 1 
      WHERE conversation_id = ? AND direction = 'inbound'
    `).bind(conversationId).run();
    
    return c.json<ApiResponse>({ success: true, data: result.results });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: "Erro ao buscar mensagens" 
    }, 500);
  }
});

// Claim conversation
app.post("/conversations/:id/claim", async (c) => {
  try {
    const conversationId = c.req.param("id");
    const db = c.env.DB;
    
    // For now, assign to agent ID 1 (in a real implementation, use authenticated user)
    const agentId = 1;
    
    const result = await db.prepare(`
      UPDATE whatsapp_conversations 
      SET status = 'active', assigned_to = ?, claimed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(agentId, conversationId).run();
    
    if (!result.success) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: "Erro ao assumir conversa" 
      }, 500);
    }
    
    // Get updated conversation
    const conversation = await db.prepare(`
      SELECT 
        wc.*,
        c.name as customer_name,
        tm.name as assigned_name
      FROM whatsapp_conversations wc
      LEFT JOIN customers c ON wc.customer_id = c.id
      LEFT JOIN team_members tm ON wc.assigned_to = tm.id
      WHERE wc.id = ?
    `).bind(conversationId).first();
    
    return c.json<ApiResponse>({ success: true, data: conversation });
  } catch (error) {
    console.error("Error claiming conversation:", error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: "Erro ao assumir conversa" 
    }, 500);
  }
});

// Send message
app.post("/conversations/:id/send", zValidator("json", SendMessageSchema), async (c) => {
  try {
    const conversationId = c.req.param("id");
    const data = c.req.valid("json");
    const db = c.env.DB;
    
    // Get conversation
    const conversation = await db.prepare(`
      SELECT * FROM whatsapp_conversations WHERE id = ?
    `).bind(parseInt(conversationId)).first();
    
    if (!conversation) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: "Conversa não encontrada" 
      }, 404);
    }
    
    // Send message via WhatsApp Business API
    const whatsapp = getWhatsAppService(c.env);
    const mediaData = data.media_data ? {
      data: data.media_data,
      mimetype: data.media_mimetype!,
      filename: data.media_filename
    } : undefined;
    
    const sent = await whatsapp.sendMessage(conversation.phone_e164 as string, data.content, mediaData);
    
    if (!sent) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: "Erro ao enviar mensagem" 
      }, 500);
    }
    
    // Save message to database
    await db.prepare(`
      INSERT INTO whatsapp_messages (
        conversation_id, direction, message_type, content, 
        media_url, media_type, media_caption, sent_by, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      conversationId,
      "outbound",
      data.message_type,
      data.content,
      mediaData ? `data:${mediaData.mimetype};base64,${mediaData.data}` : null,
      data.media_mimetype || null,
      data.media_filename || null,
      1 // Agent ID - in real implementation, use authenticated user
    ).run();
    
    // Update conversation
    await db.prepare(`
      UPDATE whatsapp_conversations 
      SET last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(conversationId).run();
    
    return c.json<ApiResponse>({ 
      success: true, 
      message: "Mensagem enviada com sucesso" 
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: "Erro ao enviar mensagem" 
    }, 500);
  }
});

// ==================== MEDIA HANDLING ====================

// Upload media file
app.post("/media/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: "Arquivo é obrigatório" 
      }, 400);
    }
    
    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode(...uint8Array));
    
    return c.json<ApiResponse>({ 
      success: true, 
      data: {
        filename: file.name,
        mimetype: file.type,
        size: file.size,
        data: base64
      }
    });
  } catch (error) {
    console.error("Error uploading media:", error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: "Erro ao fazer upload do arquivo" 
    }, 500);
  }
});

// ==================== BOT MANAGEMENT ====================

// Update bot settings
app.post("/bot/settings", async (c) => {
  try {
    const settings = await c.req.json();
    const db = c.env.DB;
    
    const settingsJson = typeof settings === 'string' ? settings : JSON.stringify(settings);
    
    await db.prepare(`
      INSERT OR REPLACE INTO integration_settings (
        integration_type, config_data, updated_at
      ) VALUES (?, ?, CURRENT_TIMESTAMP)
    `).bind('whatsapp_bot', settingsJson).run();
    
    return c.json<ApiResponse>({ 
      success: true, 
      message: "Configurações do bot atualizadas" 
    });
  } catch (error) {
    console.error("Error updating bot settings:", error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: "Erro ao atualizar configurações do bot" 
    }, 500);
  }
});

// Get bot settings
app.get("/bot/settings", async (c) => {
  try {
    const db = c.env.DB;
    
    const result = await db.prepare(`
      SELECT config_data FROM integration_settings 
      WHERE integration_type = 'whatsapp_bot'
    `).first();
    
    const settings = result?.config_data ? JSON.parse(result.config_data as string) : {
      enabled: true,
      greeting_message: "Olá! Bem-vindo ao atendimento.",
      collect_document: true,
      collect_name: true,
      collect_reason: true
    };
    
    return c.json<ApiResponse>({ success: true, data: settings });
  } catch (error) {
    console.error("Error getting bot settings:", error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: "Erro ao buscar configurações do bot" 
    }, 500);
  }
});

export default app;
