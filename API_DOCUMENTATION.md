# CentralFlow API Documentation

## 📋 Visão Geral

A CentralFlow API é uma API REST completa para gerenciamento de atendimento ao cliente, construída com Hono e deployada no Cloudflare Workers.

**Base URL**: `https://019911ce-cd37-7321-803c-5c193c44d1a9.andressagomes-adm.workers.dev`

## 🔐 Autenticação

Atualmente, a API não requer autenticação. Em produção, recomenda-se implementar autenticação JWT ou API Keys.

## 📊 Formato de Resposta

Todas as respostas seguem o formato padrão:

```json
{
  "success": true|false,
  "data": any,
  "error": "string (apenas em caso de erro)",
  "message": "string (opcional)"
}
```

## 🏥 Health Check

### GET /health

Verifica se a API está funcionando.

**Resposta:**
```json
{
  "success": true,
  "message": "CentralFlow API is running"
}
```

## 👥 Gestão de Equipe

### GET /api/team

Lista todos os membros da equipe.

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Admin CentralFlow",
      "email": "admin@centralflow.com",
      "role": "Admin",
      "phone": null,
      "department": "Administração",
      "is_active": 1,
      "created_at": "2025-09-05 18:01:55",
      "updated_at": "2025-09-05 18:01:55"
    }
  ]
}
```

### GET /api/team/:id

Busca um membro da equipe por ID.

### POST /api/team

Cria um novo membro da equipe.

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@empresa.com",
  "role": "Agent",
  "phone": "(11) 99999-9999",
  "department": "Suporte"
}
```

### PUT /api/team/:id

Atualiza um membro da equipe.

### DELETE /api/team/:id

Remove um membro da equipe.

### PATCH /api/team/:id/toggle-status

Alterna o status ativo/inativo de um membro.

## 👤 Gestão de Clientes

### GET /api/customers

Lista todos os clientes.

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Cliente Teste",
      "email": "cliente@teste.com",
      "phone": "(11) 99999-9999",
      "document": "12345678901",
      "document_type": "CPF",
      "address_street": "Rua Teste",
      "address_number": "123",
      "address_city": "São Paulo",
      "address_state": "SP",
      "address_zipcode": "01234-567",
      "is_active": 1,
      "created_at": "2025-09-05 17:57:49",
      "updated_at": "2025-09-05 17:57:49"
    }
  ]
}
```

### GET /api/customers/:id

Busca um cliente por ID.

### POST /api/customers

Cria um novo cliente.

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "phone": "(11) 99999-9999",
  "document": "12345678901",
  "document_type": "CPF",
  "address_street": "Rua das Flores",
  "address_number": "123",
  "address_complement": "Apto 45",
  "address_neighborhood": "Centro",
  "address_city": "São Paulo",
  "address_state": "SP",
  "address_zipcode": "01234-567",
  "company_name": "Empresa LTDA",
  "contact_person": "Maria Santos",
  "notes": "Cliente VIP"
}
```

### PUT /api/customers/:id

Atualiza um cliente.

### DELETE /api/customers/:id

Remove um cliente.

### PATCH /api/customers/:id/toggle-status

Alterna o status ativo/inativo de um cliente.

## 🎫 Sistema de Tickets

### GET /api/tickets

Lista todos os tickets.

**Query Parameters:**
- `customer_id` (opcional): Filtrar por cliente
- `limit` (opcional): Limitar número de resultados

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Problema com impressão",
      "description": "Cliente está relatando problemas com a impressão de documentos",
      "status": "open",
      "priority": "medium",
      "category": "Suporte Técnico",
      "customer_id": 1,
      "assigned_to": 4,
      "created_by": 1,
      "resolution": null,
      "closed_at": null,
      "channel": "email",
      "created_at": "2025-09-05 17:57:54",
      "updated_at": "2025-09-05 17:57:54",
      "customer_name": "Cliente Teste",
      "customer_email": "cliente@teste.com",
      "assigned_name": "Pedro Oliveira",
      "assigned_email": "pedro.oliveira@starprint.com"
    }
  ]
}
```

### GET /api/tickets/:id

Busca um ticket por ID com comentários.

### POST /api/tickets

Cria um novo ticket.

**Body:**
```json
{
  "title": "Problema com produto",
  "description": "Cliente relatando defeito no produto",
  "status": "open",
  "priority": "medium",
  "category": "Suporte Técnico",
  "customer_id": 1,
  "assigned_to": 4,
  "channel": "email"
}
```

### PUT /api/tickets/:id

Atualiza um ticket.

### DELETE /api/tickets/:id

Remove um ticket e seus comentários.

### POST /api/tickets/:id/comments

Adiciona um comentário ao ticket.

**Body:**
```json
{
  "content": "Comentário do atendente",
  "is_internal": false
}
```

### GET /api/tickets/stats

Retorna estatísticas dos tickets.

## 📊 Analytics

### GET /api/analytics

Retorna métricas e analytics do sistema.

**Query Parameters:**
- `period` (opcional): `7d`, `30d`, `90d` (padrão: `30d`)

**Resposta:**
```json
{
  "success": true,
  "data": {
    "tickets": {
      "total": 1,
      "open": 1,
      "resolved": 0,
      "closed": 0,
      "urgent": 0,
      "resolutionRate": 0
    },
    "team": {
      "totalAgents": 4,
      "activeAgents": 4,
      "operationalAgents": 1,
      "utilization": 0
    },
    "customers": {
      "total": 50,
      "active": 50
    },
    "periodData": {
      "period": "30d",
      "ticketCounts": [2.29, 2.88, 2.21, 0, 0, 1.61, 0.64],
      "utilizations": [5.17, 0, 0, 0, 1.02, 0, 0],
      "labels": ["06/08", "10/08", "14/08", "18/08", "22/08", "26/08", "30/08"]
    }
  }
}
```

## 📱 WhatsApp Integration

### GET /api/whatsapp/conversations

Lista conversas do WhatsApp.

**Query Parameters:**
- `filter` (opcional): `all`, `waiting`, `claimed`, `bot`

### GET /api/whatsapp/conversations/:id/messages

Lista mensagens de uma conversa.

### POST /api/whatsapp/conversations/:id/claim

Assume uma conversa para atendimento.

### POST /api/whatsapp/conversations/:id/send

Envia uma mensagem via WhatsApp.

**Body:**
```json
{
  "content": "Olá! Como posso ajudar?",
  "message_type": "text",
  "media_data": "base64_string (opcional)",
  "media_mimetype": "image/jpeg (opcional)",
  "media_filename": "foto.jpg (opcional)"
}
```

## 🔗 Integração Mocha

### POST /api/customers/:id/sync-mocha

Sincroniza um cliente com a API Mocha.

### POST /api/customers/bulk-sync-mocha

Sincroniza todos os clientes ativos com a API Mocha.

## 📞 Logs de Chamadas

### GET /api/phone-calls

Lista logs de chamadas telefônicas.

### POST /api/phone-calls

Registra uma nova chamada telefônica.

**Body:**
```json
{
  "caller_phone": "(11) 99999-9999",
  "customer_id": 1,
  "call_duration": 300,
  "call_status": "completed",
  "notes": "Cliente satisfeito com o atendimento",
  "create_ticket": true,
  "ticket_data": {
    "title": "Ligação de suporte",
    "description": "Atendimento telefônico",
    "priority": "medium",
    "channel": "phone"
  }
}
```

## 🚨 Códigos de Erro

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Dados inválidos
- `404` - Recurso não encontrado
- `500` - Erro interno do servidor

## 📝 Exemplos de Uso

### Criar um Cliente e Ticket
```bash
# 1. Criar cliente
curl -X POST https://019911ce-cd37-7321-803c-5c193c44d1a9.andressagomes-adm.workers.dev/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Silva",
    "email": "maria@exemplo.com",
    "phone": "(11) 99999-8888",
    "document": "98765432100",
    "document_type": "CPF"
  }'

# 2. Criar ticket para o cliente
curl -X POST https://019911ce-cd37-7321-803c-5c193c44d1a9.andressagomes-adm.workers.dev/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Dúvida sobre produto",
    "description": "Cliente tem dúvidas sobre funcionalidades",
    "status": "open",
    "priority": "low",
    "customer_id": 1,
    "channel": "email"
  }'
```

### Buscar Analytics
```bash
# Analytics dos últimos 7 dias
curl "https://019911ce-cd37-7321-803c-5c193c44d1a9.andressagomes-adm.workers.dev/api/analytics?period=7d"

# Analytics dos últimos 30 dias (padrão)
curl "https://019911ce-cd37-7321-803c-5c193c44d1a9.andressagomes-adm.workers.dev/api/analytics"
```

## 🔄 Rate Limiting

Atualmente não há rate limiting implementado. Em produção, recomenda-se implementar limites de requisições por IP/usuário.

## 📈 Monitoramento

A API está deployada no Cloudflare Workers com:
- Logs automáticos
- Métricas de performance
- Monitoramento de erros
- Analytics de uso

---

**Última atualização**: 05/09/2025  
**Versão da API**: 1.0.0  
**Status**: ✅ Produção
