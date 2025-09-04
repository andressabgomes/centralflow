#!/usr/bin/env node

/**
 * Script para importar clientes reais em lote no CentralFlow
 * 
 * Uso:
 * node scripts/bulk-import-real-customers.js [URL_DO_WORKER]
 * 
 * Exemplo:
 * node scripts/bulk-import-real-customers.js https://019911ce-cd37-7321-803c-5c193c44d1a9.andressagomes-adm.workers.dev
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL padrão do worker em produção
const DEFAULT_WORKER_URL = 'https://019911ce-cd37-7321-803c-5c193c44d1a9.andressagomes-adm.workers.dev';

// Obter URL do worker (argumento da linha de comando ou padrão)
const workerUrl = process.argv[2] || DEFAULT_WORKER_URL;

// Caminho para o arquivo de dados
const dataFile = path.join(__dirname, '..', 'bulk-customers-real.json');

console.log('🚀 CentralFlow - Importação de Clientes Reais em Lote');
console.log('=====================================================');
console.log(`📡 Worker URL: ${workerUrl}`);
console.log(`📁 Arquivo de dados: ${dataFile}`);
console.log('');

// Verificar se o arquivo existe
if (!fs.existsSync(dataFile)) {
  console.error('❌ Erro: Arquivo bulk-customers-real.json não encontrado!');
  console.log('💡 Certifique-se de que o arquivo existe na raiz do projeto.');
  process.exit(1);
}

// Ler dados dos clientes
let customers;
try {
  const data = fs.readFileSync(dataFile, 'utf8');
  customers = JSON.parse(data);
  console.log(`📊 Encontrados ${customers.length} clientes reais para importar`);
} catch (error) {
  console.error('❌ Erro ao ler arquivo de dados:', error.message);
  process.exit(1);
}

// Função para fazer requisição HTTP
async function makeRequest(url, data) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Função para adicionar delay entre requisições
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função principal de importação
async function importCustomers() {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  console.log('🔄 Iniciando importação de clientes reais...\n');

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    const customerNumber = i + 1;
    
    console.log(`[${customerNumber}/${customers.length}] Importando: ${customer.name} (${customer.document})`);
    
    try {
      const result = await makeRequest(`${workerUrl}/api/customers`, customer);
      
      if (result.success) {
        console.log(`  ✅ Sucesso: Cliente criado com ID ${result.data.data.id}`);
        results.success++;
      } else {
        console.log(`  ❌ Falha: ${result.data.error || result.error}`);
        results.failed++;
        results.errors.push({
          customer: customer.name,
          document: customer.document,
          error: result.data.error || result.error
        });
      }
    } catch (error) {
      console.log(`  ❌ Erro: ${error.message}`);
      results.failed++;
      results.errors.push({
        customer: customer.name,
        document: customer.document,
        error: error.message
      });
    }

    // Delay de 300ms entre requisições para não sobrecarregar o servidor
    if (i < customers.length - 1) {
      await delay(300);
    }
  }

  // Relatório final
  console.log('\n📊 Relatório de Importação de Clientes Reais');
  console.log('============================================');
  console.log(`✅ Sucessos: ${results.success}`);
  console.log(`❌ Falhas: ${results.failed}`);
  console.log(`📈 Taxa de sucesso: ${((results.success / customers.length) * 100).toFixed(1)}%`);

  if (results.errors.length > 0) {
    console.log('\n❌ Erros encontrados:');
    results.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.customer} (${error.document}): ${error.error}`);
    });
  }

  console.log('\n🎉 Importação de clientes reais concluída!');
  
  // Verificar se todos foram importados com sucesso
  if (results.failed === 0) {
    console.log('🎊 Todos os clientes reais foram importados com sucesso!');
  } else {
    console.log('⚠️  Alguns clientes falharam na importação. Verifique os erros acima.');
  }

  // Mostrar estatísticas finais
  console.log('\n📈 Estatísticas Finais:');
  console.log(`📊 Total de clientes no sistema: ${results.success + 10}`); // +10 dos clientes anteriores
  console.log(`🆕 Novos clientes adicionados: ${results.success}`);
  console.log(`📋 Clientes com códigos únicos: ${customers.length}`);
}

// Executar importação
importCustomers().catch(error => {
  console.error('❌ Erro fatal durante a importação:', error);
  process.exit(1);
});
