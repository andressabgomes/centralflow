# 🌐 Configuração de Domínio Personalizado - CentralFlow

## 📋 **Pré-requisitos**

- ✅ Domínio comprado e ativo
- ✅ Acesso ao painel do Cloudflare (cloudflare.com)
- ✅ Projeto CentralFlow já deployado
- ✅ Conta Cloudflare ativa

## 🚀 **Opções de Configuração**

### **Opção 1: Domínio no Cloudflare (Recomendado)**

#### **Passo 1: Adicionar Domínio ao Cloudflare**
1. Acesse [cloudflare.com](https://cloudflare.com)
2. Faça login na sua conta
3. Clique em "Add a Site"
4. Digite seu domínio (ex: `meudominio.com.br`)
5. Escolha o plano (Free é suficiente)
6. Cloudflare irá escanear seus DNS atuais

#### **Passo 2: Configurar DNS**
1. No painel do Cloudflare, vá para "DNS" > "Records"
2. Adicione os seguintes registros:

```
Tipo: A
Nome: @
Conteúdo: 192.0.2.1
Proxy: ✅ (nuvem laranja)

Tipo: CNAME
Nome: www
Conteúdo: meudominio.com.br
Proxy: ✅ (nuvem laranja)
```

#### **Passo 3: Configurar Workers Route**
1. No painel do Cloudflare, vá para "Workers & Pages"
2. Clique em "Workers"
3. Encontre seu worker "019911ce-cd37-7321-803c-5c193c44d1a9"
4. Vá para "Triggers" > "Routes"
5. Adicione a rota: `meudominio.com.br/*`

### **Opção 2: Subdomínio (Mais Simples)**

#### **Passo 1: Configurar Subdomínio**
1. No painel do Cloudflare, vá para "DNS" > "Records"
2. Adicione o registro:

```
Tipo: CNAME
Nome: app (ou centralflow)
Conteúdo: 019911ce-cd37-7321-803c-5c193c44d1a9.andressagomes-adm.workers.dev
Proxy: ✅ (nuvem laranja)
```

#### **Passo 2: Configurar Workers Route**
1. Vá para "Workers & Pages" > "Workers"
2. Encontre seu worker
3. Vá para "Triggers" > "Routes"
4. Adicione a rota: `app.meudominio.com.br/*`

## 🔧 **Configuração do Projeto**

### **Atualizar wrangler.jsonc**

```json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "centralflow",
  "main": "./src/worker/index.ts",
  "compatibility_date": "2025-06-17",
  "compatibility_flags": ["nodejs_compat"],
  "observability": {
    "enabled": true
  },
  "upload_source_maps": true,
  "assets": {
    "directory": "./dist/client",
    "not_found_handling": "single-page-application"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "centralflow-db",
      "database_id": "460b733b-8b69-4317-965e-1103e3ffc0c0"
    }
  ],
  "routes": [
    {
      "pattern": "meudominio.com.br/*",
      "zone_name": "meudominio.com.br"
    }
  ]
}
```

### **Deploy com Domínio Personalizado**

```bash
# Deploy normal
npm run wrangler:deploy

# Ou deploy específico para domínio
npx wrangler deploy --compatibility-date=2025-06-17
```

## 🔒 **Configuração SSL**

### **SSL Automático**
- Cloudflare fornece SSL automático
- Certificados são gerenciados automaticamente
- HTTPS será ativado automaticamente

### **Configurações SSL Recomendadas**
1. No painel do Cloudflare, vá para "SSL/TLS"
2. Configure:
   - **Encryption mode**: Full (strict)
   - **Always Use HTTPS**: ✅
   - **HTTP Strict Transport Security (HSTS)**: ✅

## 🧪 **Teste da Configuração**

### **Verificar DNS**
```bash
# Verificar se o domínio aponta para o Cloudflare
nslookup meudominio.com.br

# Verificar se o worker está respondendo
curl -I https://meudominio.com.br
```

### **Testar APIs**
```bash
# Testar API de health
curl https://meudominio.com.br/health

# Testar API de clientes
curl https://meudominio.com.br/api/customers
```

## 🚨 **Troubleshooting**

### **Problemas Comuns**

#### **1. Domínio não resolve**
- Verifique se os nameservers estão corretos
- Aguarde propagação DNS (até 24h)
- Verifique se o domínio está ativo no Cloudflare

#### **2. SSL não funciona**
- Verifique se o proxy está ativado (nuvem laranja)
- Aguarde alguns minutos para ativação do SSL
- Verifique se o domínio está ativo

#### **3. Worker não responde**
- Verifique se a rota está configurada corretamente
- Verifique se o worker está ativo
- Verifique os logs do worker

### **Comandos de Diagnóstico**

```bash
# Verificar status do worker
npx wrangler deployments list

# Ver logs do worker
npx wrangler tail

# Verificar configuração
npx wrangler whoami
```

## 📱 **Configuração de Apps Móveis**

### **Atualizar URLs nos Apps**
Se você tiver apps móveis ou outras integrações, atualize as URLs:

```javascript
// Antes
const API_BASE_URL = 'https://019911ce-cd37-7321-803c-5c193c44d1a9.andressagomes-adm.workers.dev';

// Depois
const API_BASE_URL = 'https://meudominio.com.br';
```

## 🎯 **Próximos Passos**

1. **Configurar domínio** seguindo as opções acima
2. **Testar todas as APIs** com o novo domínio
3. **Atualizar documentação** com nova URL
4. **Configurar monitoramento** e alertas
5. **Configurar backup** e recuperação

## 📞 **Suporte**

Se precisar de ajuda:
- Documentação Cloudflare: https://developers.cloudflare.com/
- Suporte Cloudflare: https://support.cloudflare.com/
- Logs do projeto: `npx wrangler tail`

---

**Status**: ✅ Pronto para configuração
**Última atualização**: 05/09/2025
