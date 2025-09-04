# CentralFlow

Sistema completo de atendimento ao cliente com integração WhatsApp, interface moderna e deploy em Cloudflare Workers.

## 🚀 Demo

**Aplicação em Produção:** https://019911ce-cd37-7321-803c-5c193c44d1a9.andressagomes-adm.workers.dev

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

## 🚀 Deploy

O projeto está configurado para deploy automático no Cloudflare Workers:

### Pré-requisitos
- Node.js 18+
- Conta Cloudflare
- Wrangler CLI

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
```

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