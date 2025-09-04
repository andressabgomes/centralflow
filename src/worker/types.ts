// Environment variables interface for Cloudflare Workers
export interface Env {
  // Cloudflare D1 Database
  DB: D1Database;
  
  // WhatsApp Business API
  WHATSAPP_BUSINESS_API_KEY?: string;
  WHATSAPP_BUSINESS_PHONE_ID?: string;
  
  // Environment
  ENVIRONMENT?: string;
  
  // Cloudflare API
  CLOUDFLARE_API_TOKEN?: string;
  
  // AI Gateway
  AI_GATEWAY_API_KEY?: string;
  
  // Mocha Users Service
  MOCHA_USERS_SERVICE_API_KEY?: string;
  MOCHA_USERS_SERVICE_API_URL?: string;
}

// Declare global types for Cloudflare Workers environment
declare global {
  interface Env extends Env {}
}
