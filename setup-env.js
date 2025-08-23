#!/usr/bin/env node

/**
 * Environment Setup Script
 * Run this script to create your .env.local file
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://diubdforaeqzbtbwxdfc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdWJkZm9yYWVxemJ0Ynd4ZGZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NDc4NDUsImV4cCI6MjA3MDMyMzg0NX0.W9kNfkg3HE_fjIWlCggY2qcButBKUvBCsNQ8955CY1I

# NextAuth Configuration
NEXTAUTH_SECRET=${crypto.randomBytes(32).toString('base64')}
NEXTAUTH_URL=http://localhost:3000

# Application Configuration
BASE_URL=http://localhost:3000

# Shopee API Configuration (Optional - for production)
SHOPEE_PARTNER_ID=1181853
SHOPEE_PARTNER_KEY=shpk4862574b726c77774655794f5241555a534d447876475678795048577a61

# Database URL (if using Prisma - currently using Supabase)
# DATABASE_URL="file:./dev.db"
`;

const envPath = path.join(process.cwd(), '.env.local');

try {
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local already exists');
    console.log('Please check env-config.md for the required variables');
  } else {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.local created successfully!');
    console.log('📝 Generated new NEXTAUTH_SECRET');
    console.log('🔧 You can modify the values in .env.local as needed');
  }
} catch (error) {
  console.error('❌ Error creating .env.local:', error.message);
  console.log('📖 Please create .env.local manually using env-config.md as reference');
}
