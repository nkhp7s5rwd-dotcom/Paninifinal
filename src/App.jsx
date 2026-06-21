import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    async function init() {
      // 1. check current session
      const { data: session } = await supabase.auth.getSession();

      if (session?.session?.user) {
        setUserId(session.session.user.id);
        return;
      }

      // 2. fallback login
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        console.log("Login error:", error);
        return;
      }

      setUserId(data.user.id);
    }

    init();
  }, []);

  if (!userId) return <p>Lade...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Panini App 🚀</h1>
      <p>User ID:</p>
      <code>{userId}</code>
    </div>
  );
}
