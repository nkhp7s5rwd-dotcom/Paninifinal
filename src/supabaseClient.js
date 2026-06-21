import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "DEINE_SUPABASE_URL";
const supabaseAnonKey = "DEIN_ANON_KEY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
