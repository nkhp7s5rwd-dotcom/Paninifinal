import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [userId, setUserId] = useState("loading");

  useEffect(() => {
    async function init() {
      try {
        // 1. Session prüfen
        const { data: sessionData } = await supabase.auth.getSession();

        const sessionUser = sessionData?.session?.user;

        if (sessionUser) {
          setUserId(sessionUser.id);
          return;
        }

        // 2. Anonymous Login erzwingen
        const { data, error } = await supabase.auth.signInAnonymously();

        if (error) {
          console.log("Auth error:", error);

          // fallback damit es NICHT hängt
          setUserId("no-auth-fallback-" + crypto.randomUUID());
          return;
        }

        setUserId(data.user.id);
      } catch (err) {
        console.log("Fatal error:", err);

        setUserId("fallback-" + crypto.randomUUID());
      }
    }

    init();
  }, []);

  if (userId === "loading") return <p>Lade...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Panini App 🚀</h1>
      <p>User ID:</p>
      <code>{userId}</code>
    </div>
  );
}
