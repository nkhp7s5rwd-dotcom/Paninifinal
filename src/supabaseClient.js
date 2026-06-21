import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://aeivlmsitgapuvwggawn.supabase.co/rest/v1/";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlaXZsbXNpdGdhcHV2d2dnYXduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwMzYwMjMsImV4cCI6MjA5NzYxMjAyM30.w-tb5Gk2v0QMI7vnvPXqac0MFAhgUhq6geLtGWhY4IE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
