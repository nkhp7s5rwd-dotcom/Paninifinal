import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./supabaseClient";

/* ---------- WM 2026 Sticker-Abschnitte ----------
   Reihenfolge wie im Panini-Heft: zuerst die Sonderserie "FWC" (1-19),
   danach die 12 Gruppen A-L in der offiziellen Reihenfolge der
   Gruppenauslosung. Innerhalb jeder Gruppe steht das gesetzte Team
   (Gastgeber / Topf 1) zuerst, der Rest alphabetisch. */
const DEFAULT_SECTIONS = [
  { name: "FWC – Sondersticker", count: 19 },
  { name: "Mexiko (A)", count: 20 },
  { name: "Südafrika (A)", count: 20 },
  { name: "Südkorea (A)", count: 20 },
  { name: "Tschechien (A)", count: 20 },
  { name: "Kanada (B)", count: 20 },
  { name: "Bosnien-Herzegowina (B)", count: 20 },
  { name: "Katar (B)", count: 20 },
  { name: "Schweiz (B)", count: 20 },
  { name: "Brasilien (C)", count: 20 },
  { name: "Haiti (C)", count: 20 },
  { name: "Marokko (C)", count: 20 },
  { name: "Schottland (C)", count: 20 },
  { name: "USA (D)", count: 20 },
  { name: "Australien (D)", count: 20 },
  { name: "Paraguay (D)", count: 20 },
  { name: "Türkei (D)", count: 20 },
  { name: "Deutschland (E)", count: 20 },
  { name: "Curaçao (E)", count: 20 },
  { name: "Ecuador (E)", count: 20 },
  { name: "Elfenbeinküste (E)", count: 20 },
  { name: "Niederlande (F)", count: 20 },
  { name: "Japan (F)", count: 20 },
  { name: "Schweden (F)", count: 20 },
  { name: "Tunesien (F)", count: 20 },
  { name: "Belgien (G)", count: 20 },
  { name: "Ägypten (G)", count: 20 },
  { name: "Iran (G)", count: 20 },
  { name: "Neuseeland (G)", count: 20 },
  { name: "Spanien (H)", count: 20 },
  { name: "Kap Verde (H)", count: 20 },
  { name: "Saudi-Arabien (H)", count: 20 },
  { name: "Uruguay (H)", count: 20 },
  { name: "Frankreich (I)", count: 20 },
  { name: "Irak (I)", count: 20 },
  { name: "Norwegen (I)", count: 20 },
  { name: "Senegal (I)", count: 20 },
  { name: "Argentinien (J)", count: 20 },
  { name: "Algerien (J)", count: 20 },
  { name: "Jordanien (J)", count: 20 },
  { name: "Österreich (J)", count: 20 },
  { name: "Portugal (K)", count: 20 },
  { name: "DR Kongo (K)", count: 20 },
  { name: "Kolumbien (K)", count: 20 },
  { name: "Usbekistan (K)", count: 20 },
  { name: "England (L)", count: 20 },
  { name: "Ghana (L)", count: 20 },
  { name: "Kroatien (L)", count: 20 },
  { name: "Panama (L)", count: 20 },
];

const STATUS_CYCLE = { missing: "have", have: "duplicate", duplicate: "missing" };
const LOCAL_KEY = "yannes_tauschboerse_profile";

function stickerKey(sectionName, number) {
  return `${sectionName}#${number}`;
}

/* ===================== App ===================== */

export default function App() {
  const [profile, setProfile] = useState(undefined); // undefined=lädt, null=ausgeloggt
  const [users, setUsers] = useState([]); // [{id, name}]
  const [myStickers, setMyStickers] = useState(null); // { key: 'have' | 'duplicate' }
  const [tab, setTab] = useState("sammlung");
  const [openSection, setOpenSection] = useState(null);
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);
  const [debugMessage, setDebugMessage] = useState(null);

  useEffect(() => {
    document.title = "Yannes' Tauschbörse";
  }, []);

  // ---- beim Start: gespeichertes Profil aus localStorage lesen + Nutzerliste laden ----
  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) {
        try { setProfile(JSON.parse(raw)); } catch (e) { setProfile(null); }
      } else {
        setProfile(null);
      }
      const { data } = await supabase.from("profiles").select("id, name").order("name");
      if (data) setUsers(data);
    })();
  }, []);

  // ---- eigene Sticker laden, sobald eingeloggt ----
  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data, error } = await supabase
        .from("user_stickers")
        .select("sticker_id, status")
        .eq("user_id", profile.id);
      if (error) { console.error(error); return; }
      const map = {};
      (data || []).forEach((row) => { map[row.sticker_id] = row.status; });
      setMyStickers(map);
    })();
  }, [profile]);

  // ---- Login / Registrierung ----
  const handleLogin = async (e) => {
    e.preventDefault();
    const name = loginInput.trim();
    if (!name) return;
    if (name.length > 30) { setLoginError("Name ist zu lang."); return; }
    setBusy(true);
    setLoginError("");
    try {
      const { data: existing, error: findErr } = await supabase
        .from("profiles")
        .select("id, name")
        .ilike("name", name)
        .maybeSingle();
      if (findErr) throw findErr;

      let p = existing;
      if (!p) {
        const { data: created, error: insertErr } = await supabase
          .from("profiles")
          .insert({ name })
          .select("id, name")
          .single();
        if (insertErr) throw insertErr;
        p = created;
        setUsers((prev) => [...prev, p].sort((a, b) => a.name.localeCompare(b.name)));
      }

      localStorage.setItem(LOCAL_KEY, JSON.stringify(p));
      setProfile(p);
    } catch (err) {
      console.error(err);
      setLoginError("Da ist etwas schiefgelaufen. Prüfe die Supabase-Verbindung.");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(LOCAL_KEY);
    setProfile(null);
    setMyStickers(null);
  };

  // ---- Sticker umschalten (missing -> have -> duplicate -> missing) ----
  const toggleSticker = useCallback(
    async (sectionName, idx) => {
      if (!myStickers || !profile) return;
      const key = stickerKey(sectionName, idx + 1);
      const current = myStickers[key] || "missing";
      const next = STATUS_CYCLE[current];

      const updated = { ...myStickers };
      if (next === "missing") delete updated[key];
      else updated[key] = next;
      setMyStickers(updated); // optimistisches Update

      try {
        if (next === "missing") {
          const { error } = await supabase
            .from("user_stickers")
            .delete()
            .eq("user_id", profile.id)
            .eq("sticker_id", key);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("user_stickers")
            .upsert(
              { user_id: profile.id, sticker_id: key, status: next },
              { onConflict: "user_id,sticker_id" }
            );
          if (error) throw error;
        }
        setDebugMessage(null);
      } catch (err) {
        console.error("Speichern fehlgeschlagen:", err);
        setDebugMessage(
          (err && (err.message || err.error_description)) +
            (err && err.hint ? " · Hinweis: " + err.hint : "") +
            (err && err.details ? " · Details: " + err.details : "") +
            (err && err.code ? " · Code: " + err.code : "")
        );
        setMyStickers(myStickers); // bei Fehler zurückrollen
      }
    },
    [myStickers, profile]
  );

  // ---- PDF Export (als Download, kein Popup nötig) ----
  const exportPDF = useCallback(() => {
    if (!myStickers || !profile) return;

    const missing = [];
    const duplicates = [];

    DEFAULT_SECTIONS.forEach((section) => {
      const sectionMissing = [];
      const sectionDuplicates = [];
      for (let i = 1; i <= section.count; i++) {
        const key = stickerKey(section.name, i);
        const st = myStickers[key];
        if (!st || st === "missing") sectionMissing.push(i);
        else if (st === "duplicate") sectionDuplicates.push(i);
      }
      if (sectionMissing.length > 0) missing.push({ section: section.name, numbers: sectionMissing });
      if (sectionDuplicates.length > 0) duplicates.push({ section: section.name, numbers: sectionDuplicates });
    });

    const tableRows = (rows) => rows.map((r) => `
      <tr>
        <td>${r.section}</td>
        <td>${r.numbers.join(", ")}</td>
      </tr>
    `).join("");

    const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Yannes Tauschboerse</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #1C2541; padding: 28px; font-size: 11px; }
    h1 { font-size: 22px; margin-bottom: 2px; }
    .subtitle { font-size: 11px; color: #665f45; margin-bottom: 20px; }
    h2 { font-size: 14px; margin: 18px 0 6px; }
    .badge { display: inline-block; border-radius: 999px; padding: 2px 8px; font-size: 10px; font-weight: 700; margin-left: 6px; vertical-align: middle; }
    .badge-dark { background: #1C2541; color: white; }
    .badge-amber { background: #E2862F; color: white; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th { background: #1C2541; color: #D9A441; font-size: 11px; padding: 6px 10px; text-align: left; }
    td { padding: 5px 10px; border-bottom: 1px solid #e8dec4; vertical-align: top; }
    tr:nth-child(even) td { background: #f9f5ec; }
    .empty { color: #8a8265; font-style: italic; margin: 8px 0; }
    .footer { margin-top: 24px; font-size: 9px; color: #aaa; border-top: 1px solid #e8dec4; padding-top: 8px; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <h1>Yannes' Tauschboerse</h1>
  <div class="subtitle">WM 2026 &middot; Sammler: ${profile.name} &middot; ${new Date().toLocaleDateString("de-DE")}</div>

  <h2>Fehlende Sticker <span class="badge badge-dark">${missing.reduce((s, r) => s + r.numbers.length, 0)}</span></h2>
  ${missing.length === 0
    ? '<div class="empty">Keine fehlenden Sticker!</div>'
    : `<table><thead><tr><th>Abschnitt</th><th>Sticker-Nummern</th></tr></thead><tbody>${tableRows(missing)}</tbody></table>`
  }

  <h2>Doppelte Sticker <span class="badge badge-amber">${duplicates.reduce((s, r) => s + r.numbers.length, 0)}</span></h2>
  ${duplicates.length === 0
    ? '<div class="empty">Keine doppelten Sticker.</div>'
    : `<table><thead><tr><th>Abschnitt</th><th>Sticker-Nummern</th></tr></thead><tbody>${tableRows(duplicates)}</tbody></table>`
  }

  <div class="footer">Yannes' Tauschboerse &middot; WM 2026 Panini Stickertracker</div>
  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, [myStickers, profile]);

  const myStats = useMemo(() => {
    if (!myStickers) return null;
    let have = 0, dup = 0;
    Object.values(myStickers).forEach((s) => {
      if (s === "have") have++;
      else if (s === "duplicate") dup++;
    });
    const total = DEFAULT_SECTIONS.reduce((sum, s) => sum + s.count, 0);
    return { have, dup, missing: total - have - dup, total };
  }, [myStickers]);

  if (profile === undefined) return <LoadingScreen />;

  if (!profile) {
    return (
      <LoginScreen
        loginInput={loginInput}
        setLoginInput={setLoginInput}
        handleLogin={handleLogin}
        error={loginError}
        busy={busy}
        userCount={users.length}
      />
    );
  }

  return (
    <div style={styles.app}>
      <FontStyles />
      {debugMessage && (
        <div style={styles.debugBanner}>
          ⚠️ Speichern fehlgeschlagen: {debugMessage}
          <button style={styles.debugClose} onClick={() => setDebugMessage(null)}>✕</button>
        </div>
      )}
      <Header profile={profile} stats={myStats} onLogout={handleLogout} />
      <nav style={styles.tabs}>
        <TabButton active={tab === "sammlung"} onClick={() => setTab("sammlung")}>Meine Sammlung</TabButton>
        <TabButton active={tab === "sammler"} onClick={() => setTab("sammler")}>Andere Sammler</TabButton>
        <TabButton active={tab === "tausch"} onClick={() => setTab("tausch")}>Tauschbörse</TabButton>
        <button onClick={exportPDF} style={styles.pdfButton} title="Als PDF exportieren">📄 PDF</button>
      </nav>

      <main style={styles.main}>
        {tab === "sammlung" && myStickers && (
          <CollectionView
            data={myStickers}
            openSection={openSection}
            setOpenSection={setOpenSection}
            onToggle={toggleSticker}
            editable
          />
        )}
        {tab === "sammler" && (
          <OthersView users={users.filter((u) => u.id !== profile.id)} />
        )}
        {tab === "tausch" && myStickers && (
          <TradeView
            profile={profile}
            myStickers={myStickers}
            users={users.filter((u) => u.id !== profile.id)}
          />
        )}
      </main>
      <footer style={styles.footer}>
        Sticker antippen: leer → habe ich → doppelt. Alle Sammler sehen, was du brauchst und doppelt hast.
      </footer>
    </div>
  );
}

/* ===================== Screens ===================== */

function LoadingScreen() {
  return (
    <div style={{ ...styles.app, alignItems: "center", justifyContent: "center", display: "flex", minHeight: "100vh" }}>
      <FontStyles />
      <div style={{ fontFamily: "'Anton', sans-serif", color: "#1C2541", fontSize: 22, letterSpacing: 1 }}>
        Stickerheft wird geladen …
      </div>
    </div>
  );
}

function LoginScreen({ loginInput, setLoginInput, handleLogin, error, busy, userCount }) {
  return (
    <div style={styles.loginWrap}>
      <FontStyles />
      <div style={styles.loginCard}>
        <div style={styles.loginRibbon}>WM 2026</div>
        <h1 style={styles.loginTitle}>Yannes'<br />Tauschbörse</h1>
        <p style={styles.loginSub}>
          Trag dich mit deinem Namen ein und verwalte dein Panini-Heft.
          {userCount > 0 && <> Schon <b>{userCount}</b> Sammler dabei.</>}
        </p>
        <form onSubmit={handleLogin} style={{ width: "100%" }}>
          <input
            style={styles.loginInput}
            placeholder="Dein Name, z. B. Lukas"
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            autoFocus
            maxLength={30}
          />
          {error && <div style={styles.loginError}>{error}</div>}
          <button type="submit" style={styles.loginButton} disabled={busy}>
            {busy ? "Einen Moment …" : "Heft öffnen"}
          </button>
        </form>
        <div style={styles.loginNote}>
          Jeder, der sich hier mit einem Namen einträgt, kann seine eigene Sammlung pflegen
          – und sehen, was andere noch brauchen oder doppelt haben.
        </div>
      </div>
    </div>
  );
}

function Header({ profile, stats, onLogout }) {
  const pct = stats && stats.total ? Math.round((stats.have + stats.dup) / stats.total * 100) : 0;
  return (
    <header style={styles.header}>
      <div style={styles.headerRibbon}>YANNES' TAUSCHBÖRSE · WM 2026</div>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.headerName}>{profile.name}</div>
          {stats && (
            <div style={styles.headerStats}>
              {stats.have + stats.dup} / {stats.total} geklebt · {stats.dup} doppelt · {stats.missing} fehlen
            </div>
          )}
        </div>
        <div style={styles.headerRight}>
          {stats && (
            <div style={styles.progressOuter}>
              <div style={{ ...styles.progressInner, width: `${pct}%` }} />
              <span style={styles.progressLabel}>{pct}%</span>
            </div>
          )}
          <button style={styles.logoutBtn} onClick={onLogout}>Abmelden</button>
        </div>
      </div>
    </header>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button onClick={onClick} style={{ ...styles.tabButton, ...(active ? styles.tabButtonActive : {}) }}>
      {children}
    </button>
  );
}

/* ===================== Sticker-Raster ===================== */

function CollectionView({ data, openSection, setOpenSection, onToggle, editable }) {
  return (
    <div style={styles.countryList}>
      {DEFAULT_SECTIONS.map((section) => {
        let have = 0, dup = 0;
        for (let i = 1; i <= section.count; i++) {
          const st = data[stickerKey(section.name, i)];
          if (st === "have") have++;
          else if (st === "duplicate") dup++;
        }
        const complete = have + dup === section.count;
        const isOpen = openSection === section.name;
        return (
          <div key={section.name} style={styles.countryCard}>
            <button
              style={{ ...styles.countryHeader, ...(complete ? styles.countryHeaderComplete : {}) }}
              onClick={() => setOpenSection(isOpen ? null : section.name)}
            >
              <span style={styles.countryName}>{section.name}</span>
              <span style={styles.countryProgress}>
                {have + dup}/{section.count}{dup > 0 ? ` · ${dup}×2` : ""}
              </span>
              <span style={styles.chevron}>{isOpen ? "▲" : "▼"}</span>
            </button>
            {isOpen && (
              <div style={styles.stickerGrid}>
                {Array.from({ length: section.count }, (_, i) => i + 1).map((number) => {
                  const status = data[stickerKey(section.name, number)] || "missing";
                  return (
                    <StickerCell
                      key={number}
                      number={number}
                      status={status}
                      onClick={editable ? () => onToggle(section.name, number - 1) : undefined}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StickerCell({ number, status, onClick }) {
  const styleMap = { missing: styles.stickerMissing, have: styles.stickerHave, duplicate: styles.stickerDuplicate };
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{ ...styles.sticker, ...styleMap[status], cursor: onClick ? "pointer" : "default" }}
      title={status === "missing" ? "fehlt" : status === "have" ? "vorhanden" : "doppelt"}
    >
      <span style={styles.stickerNumber}>{number}</span>
      {status === "duplicate" && <span style={styles.stickerBadge}>2×</span>}
      {status === "have" && <span style={styles.stickerCheck}>✓</span>}
    </button>
  );
}

/* ===================== Andere Sammler ===================== */

function OthersView({ users }) {
  const [viewUserId, setViewUserId] = useState("");
  const [data, setData] = useState(null);
  const [openSection, setOpenSection] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!viewUserId) { setData(null); return; }
    setLoading(true);
    (async () => {
      const { data: rows } = await supabase
        .from("user_stickers")
        .select("sticker_id, status")
        .eq("user_id", viewUserId);
      const map = {};
      (rows || []).forEach((r) => { map[r.sticker_id] = r.status; });
      setData(map);
      setLoading(false);
    })();
  }, [viewUserId]);

  if (users.length === 0) {
    return <EmptyState text="Noch hat sich niemand sonst eingetragen. Teile den Link mit deinen Mit-Sammlern!" />;
  }

  return (
    <div>
      <div style={styles.selectRow}>
        <label style={styles.selectLabel}>Sammler auswählen:</label>
        <select style={styles.select} value={viewUserId} onChange={(e) => { setViewUserId(e.target.value); setOpenSection(null); }}>
          <option value="">– bitte wählen –</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      {loading && <div style={styles.note}>Lade Sammlung …</div>}
      {data && !loading && (
        <CollectionView data={data} openSection={openSection} setOpenSection={setOpenSection} onToggle={() => {}} editable={false} />
      )}
    </div>
  );
}

/* ===================== Tauschbörse ===================== */

function TradeView({ profile, myStickers, users }) {
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [allRows, setAllRows] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleUser = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setAllRows(null); // Ergebnisse zurücksetzen wenn Auswahl ändert
  };

  const search = async () => {
    if (selectedUserIds.length === 0) return;
    setLoading(true);
    const { data } = await supabase
      .from("user_stickers")
      .select("user_id, sticker_id, status")
      .in("user_id", selectedUserIds);
    setAllRows(data || []);
    setLoading(false);
  };

  const nameOf = useCallback((id) => users.find((u) => u.id === id)?.name || "Unbekannt", [users]);

  const myMissingKeys = useMemo(() => {
    const missing = new Set();
    DEFAULT_SECTIONS.forEach((s) => {
      for (let i = 1; i <= s.count; i++) {
        const key = stickerKey(s.name, i);
        if (!myStickers[key]) missing.add(key);
      }
    });
    return missing;
  }, [myStickers]);

  const myDuplicateKeys = useMemo(
    () => Object.entries(myStickers).filter(([, st]) => st === "duplicate").map(([k]) => k),
    [myStickers]
  );

  const offersForMe = useMemo(() => {
    if (!allRows) return [];
    return allRows
      .filter((r) => r.status === "duplicate" && myMissingKeys.has(r.sticker_id))
      .map((r) => ({ user: nameOf(r.user_id), key: r.sticker_id }));
  }, [allRows, myMissingKeys, nameOf]);

  const requestsFromOthers = useMemo(() => {
    if (!allRows) return [];
    const presenceByUser = {};
    allRows.forEach((r) => {
      if (!presenceByUser[r.user_id]) presenceByUser[r.user_id] = new Set();
      presenceByUser[r.user_id].add(r.sticker_id);
    });
    const reqs = [];
    myDuplicateKeys.forEach((key) => {
      selectedUserIds.forEach((uid) => {
        if (!presenceByUser[uid]?.has(key)) reqs.push({ user: nameOf(uid), key });
      });
    });
    return reqs;
  }, [allRows, myDuplicateKeys, selectedUserIds, nameOf]);

  if (users.length === 0) {
    return <EmptyState text="Sobald sich weitere Sammler eintragen, kannst du hier Tauschmöglichkeiten prüfen." />;
  }

  return (
    <div>
      <SectionTitle>Mit wem möchtest du tauschen?</SectionTitle>
      <div style={styles.userPickerGrid}>
        {users.map((u) => {
          const selected = selectedUserIds.includes(u.id);
          return (
            <button
              key={u.id}
              onClick={() => toggleUser(u.id)}
              style={{ ...styles.userChip, ...(selected ? styles.userChipActive : {}) }}
            >
              {selected ? "✓ " : ""}{u.name}
            </button>
          );
        })}
      </div>

      <button
        onClick={search}
        disabled={selectedUserIds.length === 0 || loading}
        style={{ ...styles.searchButton, opacity: selectedUserIds.length === 0 ? 0.5 : 1 }}
      >
        {loading ? "Suche läuft …" : "Tauschmöglichkeiten prüfen"}
      </button>

      {allRows && !loading && (
        <>
          <SectionTitle>Das kannst du bekommen</SectionTitle>
          {offersForMe.length === 0 ? (
            <EmptyState text="Niemand aus deiner Auswahl hat einen Sticker doppelt, den du brauchst." />
          ) : (
            <ul style={styles.tradeList}>
              {offersForMe.map((o, i) => (
                <li key={i} style={styles.tradeItem}>
                  <span style={styles.tradeBadgeGreen}>2×</span>
                  <b>{o.key.replace("#", " #")}</b> — <b>{o.user}</b> hat ihn doppelt
                </li>
              ))}
            </ul>
          )}

          <SectionTitle>Das kannst du anbieten</SectionTitle>
          {requestsFromOthers.length === 0 ? (
            <EmptyState text="Niemand aus deiner Auswahl braucht deine doppelten Sticker." />
          ) : (
            <ul style={styles.tradeList}>
              {requestsFromOthers.map((r, i) => (
                <li key={i} style={styles.tradeItem}>
                  <span style={styles.tradeBadgeAmber}>fehlt</span>
                  <b>{r.key.replace("#", " #")}</b> — <b>{r.user}</b> sucht ihn, du hast ihn doppelt
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 style={styles.sectionTitle}>{children}</h2>;
}

function EmptyState({ text }) {
  return <div style={styles.emptyState}>{text}</div>;
}

function FontStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Anton&family=Manrope:wght@400;600;700;800&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; }
    `}</style>
  );
}

/* ===================== Styles ===================== */

const COLORS = {
  paper: "#F3ECD9", paperDark: "#E8DEC4", ink: "#1C2541", gold: "#D9A441",
  have: "#2E7D5B", haveLight: "#DCEEE3", missing: "#C9C2AC",
  dup: "#E2862F", dupLight: "#FBE6CC", white: "#FFFCF4",
};

const styles = {
  app: { minHeight: "100vh", background: COLORS.paper, fontFamily: "'Manrope', sans-serif", color: COLORS.ink, paddingBottom: 40 },
  header: { background: COLORS.ink, color: COLORS.white, padding: "10px 18px 16px", borderBottom: `4px solid ${COLORS.gold}` },
  headerRibbon: { fontFamily: "'Anton', sans-serif", fontSize: 12, letterSpacing: 2, color: COLORS.gold, marginBottom: 6 },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" },
  headerName: { fontFamily: "'Anton', sans-serif", fontSize: 24, letterSpacing: 0.5 },
  headerStats: { fontSize: 12.5, opacity: 0.85, marginTop: 2 },
  headerRight: { display: "flex", alignItems: "center", gap: 10 },
  progressOuter: { position: "relative", width: 110, height: 22, background: "rgba(255,255,255,0.15)", borderRadius: 999, overflow: "hidden", border: "1px solid rgba(255,255,255,0.3)" },
  progressInner: { position: "absolute", top: 0, left: 0, bottom: 0, background: COLORS.gold },
  progressLabel: { position: "relative", zIndex: 1, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: COLORS.ink },
  logoutBtn: { background: "transparent", border: `1px solid ${COLORS.gold}`, color: COLORS.gold, borderRadius: 8, padding: "6px 12px", fontSize: 12.5, cursor: "pointer", fontWeight: 700 },
  tabs: { display: "flex", gap: 6, padding: "14px 18px 0", background: COLORS.paper },
  tabButton: { flex: 1, padding: "10px 8px", borderRadius: "10px 10px 0 0", border: "none", background: COLORS.paperDark, color: COLORS.ink, fontWeight: 700, fontSize: 13, cursor: "pointer", opacity: 0.7 },
  tabButtonActive: { background: COLORS.white, opacity: 1, boxShadow: "0 -2px 0 0 " + COLORS.gold + " inset" },
  pdfButton: { padding: "10px 10px", borderRadius: "10px 10px 0 0", border: "none", background: COLORS.ink, color: COLORS.gold, fontWeight: 700, fontSize: 12, cursor: "pointer" },
  main: { padding: "16px 14px 0", maxWidth: 720, margin: "0 auto" },
  footer: { textAlign: "center", fontSize: 11.5, color: "#8a8265", padding: "26px 24px 0" },
  countryList: { display: "flex", flexDirection: "column", gap: 10 },
  countryCard: { background: COLORS.white, borderRadius: 12, boxShadow: "0 1px 3px rgba(28,37,65,0.12)", overflow: "hidden" },
  countryHeader: { width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" },
  countryHeaderComplete: { background: COLORS.haveLight },
  countryName: { fontFamily: "'Anton', sans-serif", fontSize: 15, flex: 1, letterSpacing: 0.3 },
  countryProgress: { fontSize: 12.5, fontWeight: 700, color: "#665f45" },
  chevron: { fontSize: 11, opacity: 0.6 },
  stickerGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, padding: "4px 14px 16px" },
  sticker: { position: "relative", aspectRatio: "1", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed " + COLORS.missing, background: COLORS.paper },
  stickerMissing: { background: COLORS.paper, borderColor: COLORS.missing, color: "#9b9477" },
  stickerHave: { background: COLORS.haveLight, borderStyle: "solid", borderColor: COLORS.have, color: COLORS.have },
  stickerDuplicate: { background: COLORS.dupLight, borderStyle: "solid", borderColor: COLORS.dup, color: "#8a4f12" },
  stickerNumber: { fontFamily: "'Anton', sans-serif", fontSize: 15 },
  stickerBadge: { position: "absolute", top: -6, right: -6, background: COLORS.dup, color: "white", fontSize: 9, fontWeight: 800, borderRadius: 999, padding: "2px 5px" },
  stickerCheck: { position: "absolute", top: -6, right: -6, color: COLORS.have, fontSize: 13, fontWeight: 900 },
  selectRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" },
  selectLabel: { fontSize: 13, fontWeight: 700 },
  select: { flex: 1, minWidth: 160, padding: "9px 10px", borderRadius: 8, border: `1px solid ${COLORS.missing}`, background: COLORS.white, fontSize: 14 },
  note: { fontSize: 13.5, color: "#665f45", padding: "10px 0" },
  sectionTitle: { fontFamily: "'Anton', sans-serif", fontSize: 16, margin: "18px 0 8px", letterSpacing: 0.3 },
  tradeList: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 },
  tradeItem: { background: COLORS.white, borderRadius: 10, padding: "10px 12px", fontSize: 13.5, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 1px 3px rgba(28,37,65,0.1)" },
  tradeBadgeGreen: { background: COLORS.have, color: "white", fontSize: 10, fontWeight: 800, borderRadius: 999, padding: "2px 7px" },
  tradeBadgeAmber: { background: COLORS.dup, color: "white", fontSize: 10, fontWeight: 800, borderRadius: 999, padding: "2px 7px" },
  emptyState: { fontSize: 13.5, color: "#8a8265", background: COLORS.paperDark, borderRadius: 10, padding: "16px 14px" },
  userPickerGrid: { display: "flex", flexWrap: "wrap", gap: 8, margin: "10px 0 14px" },
  userChip: { padding: "8px 14px", borderRadius: 999, border: `2px solid ${COLORS.missing}`, background: COLORS.white, color: COLORS.ink, fontWeight: 700, fontSize: 13, cursor: "pointer" },
  userChipActive: { background: COLORS.ink, color: COLORS.gold, borderColor: COLORS.ink },
  searchButton: { width: "100%", padding: "13px", borderRadius: 10, border: "none", background: COLORS.gold, color: COLORS.ink, fontFamily: "'Anton', sans-serif", fontSize: 15, letterSpacing: 0.5, cursor: "pointer", marginBottom: 4 },
  loginWrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.ink, padding: 20 },
  loginCard: { background: COLORS.paper, borderRadius: 18, padding: "26px 24px 22px", maxWidth: 360, width: "100%", boxShadow: "0 20px 50px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", overflow: "hidden" },
  loginRibbon: { position: "absolute", top: 14, right: -38, background: COLORS.gold, color: COLORS.ink, fontFamily: "'Anton', sans-serif", fontSize: 12, padding: "4px 40px", transform: "rotate(35deg)", letterSpacing: 1, fontWeight: 700 },
  loginTitle: { fontFamily: "'Anton', sans-serif", fontSize: 30, margin: "8px 0 6px", textAlign: "center", lineHeight: 1.15 },
  loginSub: { fontSize: 13.5, textAlign: "center", color: "#5a543c", marginBottom: 18, lineHeight: 1.5 },
  loginInput: { width: "100%", padding: "13px 14px", borderRadius: 10, border: `2px solid ${COLORS.missing}`, fontSize: 15, marginBottom: 10, background: COLORS.white },
  loginError: { color: "#b3401a", fontSize: 12.5, marginBottom: 8 },
  loginButton: { width: "100%", padding: "13px 14px", borderRadius: 10, border: "none", background: COLORS.ink, color: COLORS.gold, fontFamily: "'Anton', sans-serif", fontSize: 15, letterSpacing: 0.5, cursor: "pointer" },
  loginNote: { fontSize: 11.5, color: "#7a7456", marginTop: 16, textAlign: "center", lineHeight: 1.5 },
  debugBanner: { background: "#B3401A", color: "white", fontSize: 12.5, padding: "10px 38px 10px 14px", position: "relative", lineHeight: 1.4 },
  debugClose: { position: "absolute", top: 6, right: 10, background: "transparent", border: "none", color: "white", fontSize: 16, cursor: "pointer" },
};
