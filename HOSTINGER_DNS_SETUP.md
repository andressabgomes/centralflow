# 🌐 Configuração DNS - Hostinger para cajait.shop

## ✅ **Status Atual**

- ✅ **Worker deployado** com sucesso
- ✅ **Rota configurada**: `cajait.shop/*`
- ✅ **Build concluído** e assets enviados
- ⏳ **Aguardando configuração DNS** na Hostinger

## 🔧 **Configuração DNS na Hostinger**

### **Passo 1: Acessar o Painel da Hostinger**

1. Acesse [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. Faça login com suas credenciais
3. Selecione o domínio `cajait.shop`

### **Passo 2: Configurar Nameservers do Cloudflare**

**IMPORTANTE**: Você precisa alterar os nameservers para o Cloudflare:

#### **Nameservers Atuais (Hostinger):**
```
ns1.dns-parking.com
ns2.dns-parking.com
```

#### **Nameservers do Cloudflare (Novos):**
```
ns1.cloudflare.com
ns2.cloudflare.com
```

### **Passo 3: Adicionar Domínio ao Cloudflare**

1. Acesse [dash.cloudflare.com](https://dash.cloudflare.com)
2. Clique em "Add a Site"
3. Digite: `cajait.shop`
4. Escolha o plano **Free**
5. Cloudflare irá escanear seus DNS atuais

### **Passo 4: Configurar DNS no Cloudflare**

Após adicionar o domínio, configure os registros DNS:

#### **Registros DNS Necessários:**

```
Tipo: A
Nome: @
Conteúdo: 192.0.2.1
Proxy: ✅ (nuvem laranja ativada)
TTL: Auto

Tipo: CNAME
Nome: www
Conteúdo: cajait.shop
Proxy: ✅ (nuvem laranja ativada)
TTL: Auto
```

### **Passo 5: Configurar Worker Route**

1. No painel do Cloudflare, vá para "Workers & Pages"
2. Clique em "Workers"
3. Encontre o worker "centralflow"
4. Vá para "Triggers" > "Routes"
5. Adicione a rota: `cajait.shop/*`

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
nslookup cajait.shop

# Verificar se o worker está respondendo
curl -I https://cajait.shop
```

### **Testar APIs**
```bash
# Testar API de health
curl https://cajait.shop/health

# Testar API de clientes
curl https://cajait.shop/api/customers
```

## ⏱️ **Tempo de Propagação**

- **Nameservers**: 24-48 horas
- **DNS Records**: 1-24 horas
- **SSL**: 5-15 minutos após configuração

## 🚨 **Troubleshooting**

### **Problemas Comuns**

#### **1. Domínio não resolve**
- Verifique se os nameservers estão corretos
- Aguarde propagação DNS (até 48h)
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

## 📱 **URLs Finais**

Após a configuração completa:

- **Site Principal**: https://cajait.shop
- **API Base**: https://cajait.shop/api
- **Health Check**: https://cajait.shop/health
- **Clientes**: https://cajait.shop/api/customers
- **Tickets**: https://cajait.shop/api/tickets
- **Equipe**: https://cajait.shop/api/team
- **WhatsApp**: https://cajait.shop/api/whatsapp
- **Analytics**: https://cajait.shop/api/analytics

## 🎯 **Próximos Passos**

1. **Alterar nameservers** na Hostinger
2. **Adicionar domínio** no Cloudflare
3. **Configurar DNS** no Cloudflare
4. **Configurar rota** do worker
5. **Aguardar propagação** DNS
6. **Testar domínio** personalizado

---

**Status**: ⏳ Aguardando configuração DNS
**Última atualização**: 05/09/2025
