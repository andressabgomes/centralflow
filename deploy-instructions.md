# Instruções de Deploy - CentralFlow

## Status Atual
✅ **Build da aplicação concluído com sucesso**
❌ **Deploy automático falhou por problemas de autenticação**

## Como fazer o deploy manualmente

### Opção 1: Deploy via Cloudflare Dashboard (Recomendado)

1. **Acesse o Cloudflare Dashboard:**
   - Vá para https://dash.cloudflare.com/workers
   - Faça login na sua conta Cloudflare

2. **Crie um novo Worker:**
   - Clique em "Create a Worker"
   - Nomeie como "centralflow" ou nome de sua escolha

3. **Configure o D1 Database:**
   - Vá para "D1 SQL Database" no dashboard
   - Use o database existente: `centralflow-db` (ID: 460b733b-8b69-4317-965e-1103e3ffc0c0)
   - Execute as seguintes queries SQL para criar as tabelas:

```sql
-- Team Members
CREATE TABLE team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT CHECK(role IN ('Admin', 'Manager', 'Agent')) NOT NULL,
  phone TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers
CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document TEXT,
  document_type TEXT CHECK(document_type IN ('CPF', 'CNPJ', 'RG', 'Outro')),
  address_street TEXT,
  address_number TEXT,
  address_complement TEXT,
  address_neighborhood TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zipcode TEXT,
  company_name TEXT,
  contact_person TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tickets
CREATE TABLE tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK(status IN ('open', 'in_progress', 'pending', 'resolved', 'closed')) DEFAULT 'open',
  priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  category TEXT,
  customer_id INTEGER,
  assigned_to INTEGER,
  created_by INTEGER,
  resolution TEXT,
  closed_at TIMESTAMP,
  channel TEXT CHECK(channel IN ('manual', 'whatsapp', 'phone', 'email')) DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ticket Comments
CREATE TABLE ticket_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  author_id INTEGER NOT NULL,
  author_type TEXT CHECK(author_type IN ('team', 'customer')) DEFAULT 'team',
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WhatsApp Conversations
CREATE TABLE whatsapp_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone_e164 TEXT NOT NULL,
  customer_id INTEGER,
  ticket_id INTEGER,
  status TEXT CHECK(status IN ('active', 'closed', 'waiting', 'bot')) DEFAULT 'active',
  bot_stage TEXT,
  collected_data TEXT,
  last_message_at TIMESTAMP,
  assigned_to INTEGER,
  claimed_at TIMESTAMP,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WhatsApp Messages
CREATE TABLE whatsapp_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  whatsapp_message_id TEXT,
  direction TEXT CHECK(direction IN ('inbound', 'outbound')) NOT NULL,
  message_type TEXT CHECK(message_type IN ('text', 'image', 'document', 'audio', 'video')) DEFAULT 'text',
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  media_caption TEXT,
  sent_by INTEGER,
  received_at TIMESTAMP,
  is_processed BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Phone Call Logs
CREATE TABLE phone_call_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  caller_phone TEXT NOT NULL,
  customer_id INTEGER,
  call_duration INTEGER,
  call_status TEXT CHECK(call_status IN ('answered', 'missed', 'voicemail', 'busy')) NOT NULL,
  notes TEXT,
  ticket_id INTEGER,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Integration Settings
CREATE TABLE integration_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  integration_type TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT 0,
  config_data TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX idx_whatsapp_conversations_phone ON whatsapp_conversations(phone_e164);
CREATE INDEX idx_whatsapp_messages_conversation_id ON whatsapp_messages(conversation_id);

-- Insert default admin
INSERT INTO team_members (name, email, role, department) VALUES 
('Administrador', 'admin@centralflow.com', 'Admin', 'Administração');
```

4. **Configure as variáveis de ambiente:**
   - No Worker, vá para Settings > Variables
   - Configure as seguintes variáveis de ambiente:
     - `WHATSAPP_BUSINESS_API_KEY` (use o valor do secret)
     - `WHATSAPP_BUSINESS_PHONE_ID` (use o valor do secret)
     - `MOCHA_API_KEY` (use o valor do secret)
     - `MOCHA_USERS_SERVICE_API_KEY` (use o valor do secret)
     - `MOCHA_USERS_SERVICE_API_URL` (use o valor do secret)

5. **Configure o D1 Binding:**
   - No Worker Settings, vá para Variables > D1 Database Bindings
   - Adicione binding: `DB` -> `centralflow-db`

6. **Deploy o código:**
   - Copie o conteúdo de `dist/worker/index.js` (gerado pelo build)
   - Cole no editor do Worker
   - Clique em "Save and Deploy"

7. **Configure o static assets:**
   - Configure o Worker para servir os arquivos estáticos da pasta `dist/client`

### Opção 2: Deploy Local com Wrangler (Se tiver acesso local)

Se você tiver acesso ao projeto localmente:

```bash
# Faça login no Wrangler
npx wrangler login

# Execute as migrações do banco
npx wrangler d1 execute centralflow-db --remote --file=./migrations/001_initial_schema.sql

# Deploy
npx wrangler deploy
```

## Verificação pós-deploy

1. Acesse a URL do Worker
2. Verifique se a página inicial carrega
3. Teste as APIs em `/api/health`
4. Configure os webhooks do WhatsApp se necessário

## Próximos passos

1. Configure os webhooks do WhatsApp Business API para apontar para: `https://seu-worker-url.workers.dev/api/webhooks/whatsapp`
2. Teste as funcionalidades básicas (criação de tickets, clientes, etc.)
3. Configure os membros da equipe inicial
