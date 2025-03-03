// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://qpdwvinsbpxdsvumslho.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwZHd2aW5zYnB4ZHN2dW1zbGhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwODE3NzUsImV4cCI6MjA1NTY1Nzc3NX0.1fy9P53q7xzg4zDhg-lm8N3E-GLkjm1lAFtGZ_STX6E";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    redirectTo: `${window.location.origin}/password-reset`,
    debug: true
  }
});