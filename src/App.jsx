import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    async function login() {
      let { data } = await supabase.auth.getUser();

      if (!data.user) {
        const { data: anon } = await supabase.auth.signInAnonymously();
        setUserId(anon.user.id);
      } else {
        setUserId(data.user.id);
      }
    }

    login();
  }, []);

  if (!userId) return <p>Lade...</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Login OK 🚀</h1>
      <p>User ID:</p>
      <code>{userId}</code>
    </div>
  );
}
