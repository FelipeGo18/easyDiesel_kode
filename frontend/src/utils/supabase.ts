import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gfuctahftqgxvoxhdxkb.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdWN0YWhmdHFneHZveGhkeGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2ODA3OTYsImV4cCI6MjA4ODI1Njc5Nn0.S8JADPRmPmCm8aKN1xd6bqL_212AuP8NDXZrki0y_fw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
