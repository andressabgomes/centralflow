# CentralFlow

Sistema completo de atendimento ao cliente com integração WhatsApp, interface moderna e deploy em Cloudflare Workers.

## 🚀 Demo

**Aplicação em Produção:** https://019911ce-cd37-7321-803c-5c193c44d1a9.andressagomes-adm.workers.dev

### ✅ Status do Deploy
- ✅ **Deploy realizado com sucesso** em 05/09/2025
- ✅ **APIs funcionando** em produção
- ✅ **Banco de dados D1** configurado e populado
- ✅ **50 clientes** cadastrados
- ✅ **4 membros da equipe** ativos
- ✅ **1 ticket** em andamento

### 🔗 URLs de Acesso
- **Frontend**: https://019911ce-cd37-7321-803c-5c193c44d1a9.andressagomes-adm.workers.dev
- **API Health Check**: https://019911ce-cd37-7321-803c-5c193c44d1a9.andressagomes-adm.workers.dev/health
- **API Team**: https://019911ce-cd37-7321-803c-5c193c44d1a9.andressagomes-adm.workers.dev/api/team
- **API Analytics**: https://019911ce-cd37-7321-803c-5c193c44d1a9.andressagomes-adm.workers.dev/api/analytics

## ✨ Funcionalidades

### 🎯 **Gestão de Tickets**
- Criação e acompanhamento de tickets
- Sistema de prioridades (baixa, média, alta, urgente)
- Status de tickets (aberto, em progresso, pendente, resolvido, fechado)
- Comentários e histórico de atividades

### 👥 **Gestão de Equipe**
- Cadastro de membros da equipe
- Controle de permissões (Admin, Manager, Agent)
- Atribuição de tickets
- Dashboard de atividades

### 👤 **Gestão de Clientes**
- Cadastro completo de clientes
- Histórico de atendimentos
- Perfil detalhado com informações de contato
- Integração com tickets

### 📱 **Integração WhatsApp Business**
- Recebimento automático de mensagens
- Criação automática de tickets
- Bot de atendimento inteligente
- Upload de mídias (imagens, documentos, áudio)

### 📞 **Sistema de Chamadas**
- Registro de ligações telefônicas
- Criação automática de tickets
- Gravação de chamadas (opcional)
- Histórico de atendimentos

### 📧 **Email de Suporte**
- Recebimento de emails
- Criação automática de tickets
- Resposta automática configurável

### 📊 **Analytics e Relatórios**
- Dashboard com métricas em tempo real
- Relatórios de performance
- Análise de atendimentos
- Gráficos interativos

## 🛠️ Tecnologias

### Frontend
- **React 19** - Interface moderna e responsiva
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização utilitária
- **Vite** - Build tool rápido
- **React Router** - Navegação SPA
- **Recharts** - Gráficos e visualizações
- **Lucide React** - Ícones modernos

### Backend
- **Hono** - Framework web rápido
- **Cloudflare Workers** - Runtime serverless
- **D1 Database** - Banco de dados SQL
- **Zod** - Validação de schemas
- **TypeScript** - Tipagem estática

### Integrações
- **WhatsApp Business API** - Mensagens e webhooks
- **Mocha API** - Integração com sistema externo
- **QR Code** - Conexão WhatsApp

## 🔌 APIs Disponíveis

### 📊 **Endpoints Principais**

#### **Health Check**
```bash
GET /health
# Retorna: {"success":true,"message":"CentralFlow API is running"}
```

#### **Gestão de Equipe**
```bash
GET /api/team                    # Listar membros da equipe
GET /api/team/:id               # Buscar membro por ID
POST /api/team                  # Criar novo membro
PUT /api/team/:id               # Atualizar membro
DELETE /api/team/:id            # Remover membro
PATCH /api/team/:id/toggle-status # Alternar status ativo
```

#### **Gestão de Clientes**
```bash
GET /api/customers              # Listar clientes
GET /api/customers/:id          # Buscar cliente por ID
POST /api/customers             # Criar novo cliente
PUT /api/customers/:id          # Atualizar cliente
DELETE /api/customers/:id       # Remover cliente
PATCH /api/customers/:id/toggle-status # Alternar status ativo
```

#### **Sistema de Tickets**
```bash
GET /api/tickets                # Listar tickets
GET /api/tickets/:id            # Buscar ticket por ID
POST /api/tickets               # Criar novo ticket
PUT /api/tickets/:id            # Atualizar ticket
DELETE /api/tickets/:id         # Remover ticket
POST /api/tickets/:id/comments  # Adicionar comentário
GET /api/tickets/stats          # Estatísticas de tickets
```

#### **Analytics e Relatórios**
```bash
GET /api/analytics              # Dashboard de métricas
GET /api/analytics?period=7d    # Analytics dos últimos 7 dias
GET /api/analytics?period=30d   # Analytics dos últimos 30 dias
```

#### **WhatsApp Integration**
```bash
GET /api/whatsapp/conversations # Listar conversas
GET /api/whatsapp/conversations/:id/messages # Mensagens da conversa
POST /api/whatsapp/conversations/:id/claim   # Assumir conversa
POST /api/whatsapp/conversations/:id/send    # Enviar mensagem
```

#### **Integração Mocha**
```bash
POST /api/customers/:id/sync-mocha        # Sincronizar cliente com Mocha
POST /api/customers/bulk-sync-mocha       # Sincronização em lote
```

### 📝 **Exemplos de Uso**

#### Criar um Cliente
```bash
curl -X POST https://019911ce-cd37-7321-803c-5c193c44d1a9.andressagomes-adm.workers.dev/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "phone": "(11) 99999-9999",
    "document": "12345678901",
    "document_type": "CPF",
    "address_city": "São Paulo",
    "address_state": "SP"
  }'
```

#### Criar um Ticket
```bash
curl -X POST https://019911ce-cd37-7321-803c-5c193c44d1a9.andressagomes-adm.workers.dev/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Problema com produto",
    "description": "Cliente relatando defeito no produto",
    "status": "open",
    "priority": "medium",
    "category": "Suporte Técnico",
    "customer_id": 1,
    "assigned_to": 4,
    "channel": "email"
  }'
```

## 🚀 Deploy

O projeto está configurado para deploy automático no Cloudflare Workers:

### Pré-requisitos
- Node.js 18+
- Conta Cloudflare
- Wrangler CLI v4+

### Comandos de Deploy
```bash
# Instalar dependências
npm install

# Build do projeto
npm run build

# Deploy para Cloudflare
npx wrangler deploy
```

### Configuração do Banco
```bash
# Executar migrações
npx wrangler d1 execute centralflow-db --remote --file=./migrations/001_initial_schema.sql
npx wrangler d1 execute centralflow-db --remote --file=./migrations/4.sql
npx wrangler d1 execute centralflow-db --remote --file=./migrations/5.sql
npx wrangler d1 execute centralflow-db --remote --file=./migrations/6.sql
npx wrangler d1 execute centralflow-db --remote --file=./migrations/7.sql
npx wrangler d1 execute centralflow-db --remote --file=./migrations/8.sql
npx wrangler d1 execute centralflow-db --remote --file=./migrations/9.sql
```

### ✅ Deploy Realizado
- **Data**: 05/09/2025
- **Versão Wrangler**: 4.34.0
- **Status**: ✅ Sucesso
- **URL**: https://019911ce-cd37-7321-803c-5c193c44d1a9.andressagomes-adm.workers.dev

## 🌐 Domínio Personalizado

**Domínio**: `cajait.shop`  
**Status**: ⏳ Aguardando configuração DNS  
**Worker**: `centralflow`  
**Rota**: `cajait.shop/*`

### Configuração DNS
- ✅ Worker deployado com rota configurada
- ⏳ Aguardando alteração de nameservers na Hostinger
- ⏳ Aguardando adição do domínio no Cloudflare
- ⏳ Aguardando propagação DNS (24-48h)

### URLs Finais (após configuração)
- **Site Principal**: https://cajait.shop
- **API Base**: https://cajait.shop/api
- **Health Check**: https://cajait.shop/health

## 📁 Estrutura do Projeto

```
CentralFlow/
├── src/
│   ├── react-app/          # Frontend React
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   └── main.tsx       # Entry point
│   ├── worker/            # Backend Hono
│   │   ├── services/      # Serviços de integração
│   │   └── index.ts       # API routes
│   └── shared/            # Tipos compartilhados
├── migrations/            # Scripts de banco de dados
├── dist/                  # Build output
└── wrangler.jsonc        # Configuração Cloudflare
```

## 🔧 Configuração

### Variáveis de Ambiente
Configure as seguintes variáveis no Cloudflare Workers:

- `WHATSAPP_BUSINESS_API_KEY` - Token da API do WhatsApp
- `WHATSAPP_BUSINESS_PHONE_ID` - ID do telefone WhatsApp
- `MOCHA_API_KEY` - Chave da API Mocha
- `MOCHA_USERS_SERVICE_API_KEY` - Chave do serviço de usuários
- `MOCHA_USERS_SERVICE_API_URL` - URL do serviço de usuários

### Banco de Dados
O sistema usa Cloudflare D1 com as seguintes tabelas:
- `team_members` - Membros da equipe
- `customers` - Clientes
- `tickets` - Tickets de atendimento
- `ticket_comments` - Comentários dos tickets
- `whatsapp_conversations` - Conversas WhatsApp
- `whatsapp_messages` - Mensagens WhatsApp
- `phone_call_logs` - Logs de chamadas
- `integration_settings` - Configurações de integração

## 🛠️ Desenvolvimento Local

### Instalação e Configuração
```bash
# Clonar o repositório
git clone https://github.com/andressabgomes/centralflow.git
cd centralflow

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (Frontend)
npm run dev
# Acesse: http://localhost:5173

# Iniciar servidor de API (Backend)
npm run wrangler:dev
# Acesse: http://localhost:8787
```

### Comandos Disponíveis
```bash
npm run dev          # Servidor de desenvolvimento (Vite)
npm run build        # Build de produção
npm run preview      # Preview do build
npm run lint         # Linter ESLint
npm run type-check   # Verificação de tipos TypeScript
npm run wrangler:dev # Servidor local com Wrangler
npm run wrangler:deploy # Deploy para produção
```

### Configuração do Banco Local
```bash
# Executar migrações no banco local
npx wrangler d1 execute centralflow-db --file=./migrations/001_initial_schema.sql
npx wrangler d1 execute centralflow-db --file=./migrations/4.sql
npx wrangler d1 execute centralflow-db --file=./migrations/5.sql
npx wrangler d1 execute centralflow-db --file=./migrations/6.sql
npx wrangler d1 execute centralflow-db --file=./migrations/7.sql
npx wrangler d1 execute centralflow-db --file=./migrations/8.sql
npx wrangler d1 execute centralflow-db --file=./migrations/9.sql
```

### 🔧 Troubleshooting

#### Erro: "vite: command not found"
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

#### Erro: "assets.directory does not exist"
```bash
# Fazer build antes de iniciar o servidor
npm run build
npm run wrangler:dev
```

#### Erro: "D1_ERROR: misuse of aggregate function"
- Este erro foi corrigido na versão deployada
- A API de analytics foi simplificada para evitar queries complexas

#### Problemas de Deploy
```bash
# Atualizar Wrangler
npm install --save-dev wrangler@4

# Limpar cache
npx wrangler whoami
npx wrangler deploy --force
```

## 📱 Como Usar

1. **Acesse a aplicação** na URL de produção
2. **Configure as integrações** nas configurações
3. **Adicione membros da equipe** através da interface
4. **Configure webhooks** do WhatsApp Business API
5. **Comece a receber e gerenciar tickets**

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte, entre em contato através de:
- Email: admin@centralflow.com
- Issues no GitHub: [CentralFlow Issues](https://github.com/andressabgomes/centralflow/issues)

---

**CentralFlow** - Transformando atendimento ao cliente em uma experiência excepcional! 🚀