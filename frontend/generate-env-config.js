#!/usr/bin/env node

/**
 * Generate runtime environment configuration
 * This script runs at container startup to inject environment variables
 * into the built SPA so they can be read at runtime via window._env_
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envConfig = {
  // API endpoints
  VITE_API_URL: process.env.VITE_API_URL,
  VITE_WS_URL: process.env.VITE_WS_URL,

  // Supabase
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  VITE_SUPABASE_PROJECT_ID: process.env.VITE_SUPABASE_PROJECT_ID,

  // Pusher (real-time)
  VITE_PUSHER_APP_ID: process.env.VITE_PUSHER_APP_ID,
  VITE_PUSHER_KEY: process.env.VITE_PUSHER_KEY,
  VITE_PUSHER_CLUSTER: process.env.VITE_PUSHER_CLUSTER,

  // Google OAuth
  VITE_GOOGLE_CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID,
  VITE_GOOGLE_AUTH_REDIRECT_URL: process.env.VITE_GOOGLE_AUTH_REDIRECT_URL,
  VITE_GOOGLE_CALLBACK_URL: process.env.VITE_GOOGLE_CALLBACK_URL,

  // Firebase
  VITE_FIREBASE_API_KEY: process.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: process.env.VITE_FIREBASE_APP_ID,
  VITE_FIREBASE_MEASUREMENT_ID: process.env.VITE_FIREBASE_MEASUREMENT_ID,

  // Stripe (public key only)
  VITE_STRIPE_PUBLIC_KEY: process.env.VITE_STRIPE_PUBLIC_KEY,
  VITE_STRIPE_SUCCESS_URL: process.env.VITE_STRIPE_SUCCESS_URL,
  VITE_STRIPE_CANCEL_URL: process.env.VITE_STRIPE_CANCEL_URL,

  // Cloudinary
  VITE_CLOUDINARY_CLOUD_NAME: process.env.VITE_CLOUDINARY_CLOUD_NAME,

  // Image search APIs
  VITE_PEXELS_API_KEY: process.env.VITE_PEXELS_API_KEY,
  VITE_FREEPIK_API_KEY: process.env.VITE_FREEPIK_API_KEY,

  // Feature flags
  VITE_ENABLE_ANALYTICS: process.env.VITE_ENABLE_ANALYTICS,
  VITE_ENABLE_STRIPE: process.env.VITE_ENABLE_STRIPE,
  VITE_ENABLE_PUSHER: process.env.VITE_ENABLE_PUSHER,
  VITE_ENABLE_GOOGLE_AUTH: process.env.VITE_ENABLE_GOOGLE_AUTH,
};

const configContent = `window._env_ = ${JSON.stringify(envConfig, null, 2)};`;

const distPath = path.join(__dirname, 'dist');
const configPath = path.join(distPath, 'env-config.js');

// Ensure dist directory exists
if (!fs.existsSync(distPath)) {
  console.error('Error: dist directory not found. Run npm run build first.');
  process.exit(1);
}

// Write the config file
fs.writeFileSync(configPath, configContent);

const loaded = Object.values(envConfig).filter(Boolean).length;
const total  = Object.keys(envConfig).length;

console.log('✅ Runtime environment configuration generated');
console.log(`   Variables loaded: ${loaded}/${total}`);

if (loaded === 0) {
  console.warn('⚠️  WARNING: No environment variables were injected. Check Coolify env config.');
}
