import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://odjifkodaytawrrtetjd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kamlma29kYXl0YXdycnRldGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTI1MzYsImV4cCI6MjA3MTM2ODUzNn0.IeMCKr2NI-wCz4M0b-kHSJmrmSWuHA1Z4-F1Mh1y2FA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

