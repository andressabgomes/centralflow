import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getWhatsAppService, destroyWhatsAppService } from './services/WhatsAppWebService';
import type { ApiResponse } from '../shared/types';

const app = new Hono();

// Schema para envio de mensagem
const SendMessageSchema = z.object({
  to: z.string().min(1, 'Destinatário é obrigatório'),
  message: z.string().min(1, 'Mensagem é obrigatória')
});

// ==================== WHATSAPP WEB API ====================

// Iniciar conexão WhatsApp Web
app.post('/api/whatsapp-web/start', async (c) => {
  try {
    const whatsappService = getWhatsAppService();
    
    // Verificar se já está conectado
    if (whatsappService.isWhatsAppConnected()) {
      return c.json<ApiResponse>({ 
        success: true, 
        message: 'WhatsApp Web já está conectado',
        data: { connected: true }
      });
    }

    // Gerar QR Code
    const qrCode = await whatsappService.generateQRCode();
    
    return c.json<ApiResponse>({ 
      success: true, 
      message: 'WhatsApp Web iniciado com sucesso',
      data: { connected: false, qrRequired: true, qrCode }
    });
  } catch (error) {
    console.error('Erro ao iniciar WhatsApp Web:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Erro ao iniciar WhatsApp Web' 
    }, 500);
  }
});

// Obter QR Code
app.get('/api/whatsapp-web/qr', async (c) => {
  try {
    const whatsappService = getWhatsAppService();
    
    if (!whatsappService.isWhatsAppConnected()) {
      const qrCode = whatsappService.getQRCode();
      
      if (qrCode) {
        const qrImage = await whatsappService.getQRCodeImage();
        return c.json<ApiResponse>({ 
          success: true, 
          data: { 
            qrCode: qrCode,
            qrImage: qrImage,
            connected: false
          }
        });
      } else {
        return c.json<ApiResponse>({ 
          success: false, 
          error: 'QR Code não disponível. Inicie a conexão primeiro.' 
        }, 400);
      }
    } else {
      return c.json<ApiResponse>({ 
        success: true, 
        data: { 
          connected: true,
          message: 'WhatsApp Web já está conectado'
        }
      });
    }
  } catch (error) {
    console.error('Erro ao obter QR Code:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Erro ao obter QR Code' 
    }, 500);
  }
});

// Simular conexão (para demonstração)
app.post('/api/whatsapp-web/connect', async (c) => {
  try {
    const whatsappService = getWhatsAppService();
    
    if (whatsappService.isWhatsAppConnected()) {
      return c.json<ApiResponse>({ 
        success: true, 
        message: 'WhatsApp Web já está conectado',
        data: { connected: true }
      });
    }

    // Simular conexão
    await whatsappService.connect();
    
    return c.json<ApiResponse>({ 
      success: true, 
      message: 'WhatsApp Web conectado com sucesso',
      data: { connected: true }
    });
  } catch (error) {
    console.error('Erro ao conectar WhatsApp Web:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Erro ao conectar WhatsApp Web' 
    }, 500);
  }
});

// Verificar status da conexão
app.get('/api/whatsapp-web/status', async (c) => {
  try {
    const whatsappService = getWhatsAppService();
    const isConnected = whatsappService.isWhatsAppConnected();
    
    let clientInfo = null;
    if (isConnected) {
      clientInfo = whatsappService.getClientInfo();
    }
    
    return c.json<ApiResponse>({ 
      success: true, 
      data: { 
        connected: isConnected,
        clientInfo: clientInfo,
        qrAvailable: !isConnected && whatsappService.getQRCode() !== null
      }
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Erro ao verificar status' 
    }, 500);
  }
});

// Enviar mensagem de texto
app.post('/api/whatsapp-web/send-message', zValidator('json', SendMessageSchema), async (c) => {
  try {
    const { to, message } = c.req.valid('json');
    const whatsappService = getWhatsAppService();
    
    if (!whatsappService.isWhatsAppConnected()) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'WhatsApp Web não está conectado' 
      }, 400);
    }
    
    const success = await whatsappService.sendMessage(to, message);
    
    if (success) {
      return c.json<ApiResponse>({ 
        success: true, 
        message: 'Mensagem enviada com sucesso' 
      });
    } else {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'Erro ao enviar mensagem' 
      }, 500);
    }
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Erro ao enviar mensagem' 
    }, 500);
  }
});

// Obter contatos
app.get('/api/whatsapp-web/contacts', async (c) => {
  try {
    const whatsappService = getWhatsAppService();
    
    if (!whatsappService.isWhatsAppConnected()) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'WhatsApp Web não está conectado' 
      }, 400);
    }
    
    const contacts = await whatsappService.getContacts();
    
    return c.json<ApiResponse>({ 
      success: true, 
      data: contacts 
    });
  } catch (error) {
    console.error('Erro ao obter contatos:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Erro ao obter contatos' 
    }, 500);
  }
});

// Obter mensagens
app.get('/api/whatsapp-web/messages', async (c) => {
  try {
    const whatsappService = getWhatsAppService();
    
    if (!whatsappService.isWhatsAppConnected()) {
      return c.json<ApiResponse>({ 
        success: false, 
        error: 'WhatsApp Web não está conectado' 
      }, 400);
    }
    
    const messages = whatsappService.getMessages();
    
    return c.json<ApiResponse>({ 
      success: true, 
      data: messages 
    });
  } catch (error) {
    console.error('Erro ao obter mensagens:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Erro ao obter mensagens' 
    }, 500);
  }
});

// Desconectar WhatsApp Web
app.post('/api/whatsapp-web/disconnect', async (c) => {
  try {
    const whatsappService = getWhatsAppService();
    await whatsappService.disconnect();
    
    return c.json<ApiResponse>({ 
      success: true, 
      message: 'WhatsApp Web desconectado com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao desconectar WhatsApp Web:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Erro ao desconectar WhatsApp Web' 
    }, 500);
  }
});

// Limpar sessão (logout completo)
app.post('/api/whatsapp-web/logout', async (c) => {
  try {
    destroyWhatsAppService();
    
    return c.json<ApiResponse>({ 
      success: true, 
      message: 'Sessão WhatsApp Web limpa com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao limpar sessão:', error);
    return c.json<ApiResponse>({ 
      success: false, 
      error: 'Erro ao limpar sessão' 
    }, 500);
  }
});

export default app;