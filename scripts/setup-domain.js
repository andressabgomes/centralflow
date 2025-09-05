#!/usr/bin/env node

/**
 * Script para configurar domínio personalizado no CentralFlow
 * Uso: node scripts/setup-domain.js <dominio>
 * Exemplo: node scripts/setup-domain.js meudominio.com.br
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPrerequisites() {
  log('\n🔍 Verificando pré-requisitos...', 'cyan');
  
  try {
    // Verificar se wrangler está instalado
    execSync('npx wrangler --version', { stdio: 'pipe' });
    log('✅ Wrangler encontrado', 'green');
  } catch (error) {
    log('❌ Wrangler não encontrado. Execute: npm install', 'red');
    process.exit(1);
  }

  try {
    // Verificar se está logado no Cloudflare
    const whoami = execSync('npx wrangler whoami', { stdio: 'pipe' }).toString();
    if (whoami.includes('You are logged in')) {
      log('✅ Logado no Cloudflare', 'green');
    } else {
      log('❌ Não está logado no Cloudflare. Execute: npx wrangler login', 'red');
      process.exit(1);
    }
  } catch (error) {
    log('❌ Erro ao verificar login no Cloudflare', 'red');
    process.exit(1);
  }
}

function updateWranglerConfig(domain) {
  log(`\n🔧 Atualizando wrangler.jsonc para domínio: ${domain}`, 'cyan');
  
  const wranglerPath = path.join(process.cwd(), 'wrangler.jsonc');
  
  if (!fs.existsSync(wranglerPath)) {
    log('❌ Arquivo wrangler.jsonc não encontrado', 'red');
    process.exit(1);
  }

  try {
    const wranglerConfig = JSON.parse(fs.readFileSync(wranglerPath, 'utf8'));
    
    // Atualizar nome do worker
    wranglerConfig.name = 'centralflow';
    
    // Adicionar rota para o domínio
    if (!wranglerConfig.routes) {
      wranglerConfig.routes = [];
    }
    
    // Remover rotas antigas se existirem
    wranglerConfig.routes = wranglerConfig.routes.filter(route => 
      !route.pattern.includes(domain)
    );
    
    // Adicionar nova rota
    wranglerConfig.routes.push({
      pattern: `${domain}/*`,
      zone_name: domain
    });

    // Salvar configuração atualizada
    fs.writeFileSync(wranglerPath, JSON.stringify(wranglerConfig, null, 2));
    log('✅ wrangler.jsonc atualizado', 'green');
    
  } catch (error) {
    log(`❌ Erro ao atualizar wrangler.jsonc: ${error.message}`, 'red');
    process.exit(1);
  }
}

function updateEnvironmentVariables(domain) {
  log(`\n🔧 Atualizando variáveis de ambiente para domínio: ${domain}`, 'cyan');
  
  const envPath = path.join(process.cwd(), '.env');
  const envContent = `# CentralFlow Environment Variables
# Domínio personalizado
DOMAIN=${domain}
API_BASE_URL=https://${domain}

# URLs de produção
PRODUCTION_URL=https://${domain}
API_URL=https://${domain}/api

# Configurações do Cloudflare
CLOUDFLARE_ACCOUNT_ID=0fcf859333ab748f1f4412f3d496cc99
CLOUDFLARE_WORKER_NAME=centralflow
`;

  try {
    fs.writeFileSync(envPath, envContent);
    log('✅ Arquivo .env criado/atualizado', 'green');
  } catch (error) {
    log(`❌ Erro ao criar .env: ${error.message}`, 'red');
  }
}

function updateDocumentation(domain) {
  log(`\n📚 Atualizando documentação para domínio: ${domain}`, 'cyan');
  
  const readmePath = path.join(process.cwd(), 'README.md');
  
  if (fs.existsSync(readmePath)) {
    try {
      let readmeContent = fs.readFileSync(readmePath, 'utf8');
      
      // Atualizar URL de produção
      readmeContent = readmeContent.replace(
        /https:\/\/[a-zA-Z0-9-]+\.andressagomes-adm\.workers\.dev/g,
        `https://${domain}`
      );
      
      // Adicionar seção de domínio personalizado
      const domainSection = `

## 🌐 Domínio Personalizado

**URL de Produção**: https://${domain}

### Configuração
- ✅ Domínio configurado: ${domain}
- ✅ SSL ativado automaticamente
- ✅ Cloudflare Workers ativo
- ✅ Banco D1 configurado

### APIs Disponíveis
- **Health Check**: https://${domain}/health
- **Clientes**: https://${domain}/api/customers
- **Tickets**: https://${domain}/api/tickets
- **Equipe**: https://${domain}/api/team
- **WhatsApp**: https://${domain}/api/whatsapp
- **Analytics**: https://${domain}/api/analytics
`;

      // Adicionar seção se não existir
      if (!readmeContent.includes('## 🌐 Domínio Personalizado')) {
        readmeContent += domainSection;
      }
      
      fs.writeFileSync(readmePath, readmeContent);
      log('✅ README.md atualizado', 'green');
      
    } catch (error) {
      log(`❌ Erro ao atualizar README.md: ${error.message}`, 'red');
    }
  }
}

function deployWorker() {
  log('\n🚀 Fazendo deploy do worker...', 'cyan');
  
  try {
    execSync('npm run build', { stdio: 'inherit' });
    log('✅ Build concluído', 'green');
    
    execSync('npx wrangler deploy', { stdio: 'inherit' });
    log('✅ Deploy concluído', 'green');
    
  } catch (error) {
    log(`❌ Erro no deploy: ${error.message}`, 'red');
    process.exit(1);
  }
}

function showNextSteps(domain) {
  log('\n🎯 Próximos passos:', 'yellow');
  log('1. Acesse o painel do Cloudflare: https://dash.cloudflare.com', 'blue');
  log('2. Adicione seu domínio se ainda não estiver configurado', 'blue');
  log('3. Configure os registros DNS:', 'blue');
  log(`   - Tipo: A, Nome: @, Conteúdo: 192.0.2.1, Proxy: ✅`, 'blue');
  log(`   - Tipo: CNAME, Nome: www, Conteúdo: ${domain}, Proxy: ✅`, 'blue');
  log('4. Configure a rota do worker:', 'blue');
  log(`   - Padrão: ${domain}/*`, 'blue');
  log('5. Aguarde a propagação DNS (até 24h)', 'blue');
  log('6. Teste o domínio:', 'blue');
  log(`   - curl https://${domain}/health`, 'blue');
  
  log('\n✅ Configuração concluída!', 'green');
  log(`🌐 Seu CentralFlow estará disponível em: https://${domain}`, 'green');
}

function main() {
  const domain = process.argv[2];
  
  if (!domain) {
    log('❌ Uso: node scripts/setup-domain.js <dominio>', 'red');
    log('Exemplo: node scripts/setup-domain.js meudominio.com.br', 'yellow');
    process.exit(1);
  }

  log('🚀 Configurando domínio personalizado para CentralFlow', 'bright');
  log(`📋 Domínio: ${domain}`, 'cyan');

  checkPrerequisites();
  updateWranglerConfig(domain);
  updateEnvironmentVariables(domain);
  updateDocumentation(domain);
  deployWorker();
  showNextSteps(domain);
}

// Executar se for o arquivo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
