import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Supabase Umgebungsvariablen fehlen. Lege eine .env-Datei mit " +
      "VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY an (siehe .env.example) " +
      "und setze dieselben Variablen auch in den Vercel Projekt-Einstellungen."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
