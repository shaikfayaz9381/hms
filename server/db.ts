import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Prisma Client with connection logging in development
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export interface DatabaseStatus {
  isConnected: boolean;
  isSupabase: boolean;
  host: string;
  databaseName: string;
  latencyMs?: number;
  message: string;
  error?: string;
  configuredUrl: string;
}

/**
 * Checks connection to the database configured in DATABASE_URL.
 */
export async function checkDatabaseConnection(): Promise<DatabaseStatus> {
  const dbUrl = process.env.DATABASE_URL || '';
  
  if (!dbUrl || dbUrl.includes('[YOUR-PASSWORD]') || dbUrl.includes('[YOUR-PROJECT-REF]')) {
    return {
      isConnected: false,
      isSupabase: false,
      host: 'Not configured',
      databaseName: 'None',
      configuredUrl: dbUrl ? 'Placeholder detected' : 'Missing',
      message: 'DATABASE_URL is not configured in .env. Please configure your Supabase connection string.',
    };
  }

  const isSupabase = dbUrl.includes('supabase.com') || dbUrl.includes('pooler.supabase.com');
  let host = 'Unknown';
  try {
    const parsed = new URL(dbUrl);
    host = parsed.hostname;
  } catch {
    // If URL parsing fails due to protocol quirks
    const hostMatch = dbUrl.match(/@([^:/]+)/);
    if (hostMatch) host = hostMatch[1];
  }

  const startTime = Date.now();
  try {
    // Ping the database
    await prisma.$queryRaw`SELECT 1 as ping`;
    const latencyMs = Date.now() - startTime;

    return {
      isConnected: true,
      isSupabase,
      host,
      databaseName: 'postgres',
      latencyMs,
      configuredUrl: `${host} (credentials redacted)`,
      message: isSupabase 
        ? `Successfully connected to Supabase PostgreSQL at ${host} (${latencyMs}ms)`
        : `Successfully connected to PostgreSQL at ${host} (${latencyMs}ms)`,
    };
  } catch (err: any) {
    return {
      isConnected: false,
      isSupabase,
      host,
      databaseName: 'postgres',
      configuredUrl: `${host} (credentials redacted)`,
      message: 'Failed to connect to database.',
      error: err.message || String(err),
    };
  }
}
