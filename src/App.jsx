
import { supabase } from "./supabaseClient";
import { useState, useEffect, useMemo, useCallback } from "react";

/* ---------- WM 2026 Sticker-Abschnitte ----------
   Reihenfolge wie im Panini-Heft: zuerst die Sonderserie "FWC" (1-19),
   danach die 12 Gruppen A-L in der offiziellen Reihenfolge der
   Gruppenauslosung vom 5. Dezember 2025. Innerhalb jeder Gruppe steht
   das gesetzte Team (Gastgeber / Topf 1) zuerst, der Rest alphabetisch
   - das ist die übliche Panini-Reihenfolge. Lässt sich unten in
   DEFAULT_SECTIONS jederzeit anpassen, falls dein Heft leicht abweicht. */
const DEFAULT_SECTIONS = [
  { name: "FWC – Sondersticker", count: 19 },

  // Gruppe A
  { name: "Mexiko (A)", count: 20 },
  { name: "Südafrika (A)", count: 20 },
  { name: "Südkorea (A)", count: 20 },
  { name: "Tschechien (A)", count: 20 },
  // Gruppe B
  { name: "Kanada (B)", count: 20 },
  { name: "Bosnien-Herzegowina (B)", count: 20 },
  { name: "Katar (B)", count: 20 },
  { name: "Schweiz (B)", count: 20 },
  // Gruppe C
  { name: "Brasilien (C)", count: 20 },
  { name: "Haiti (C)", count: 20 },
  { name: "Marokko (C)", count: 20 },
  { name: "Schottland (C)", count: 20 },
  // Gruppe D
  { name: "USA (D)", count: 20 },
  { name: "Australien (D)", count: 20 },
  { name: "Paraguay (D)", count: 20 },
  { name: "Türkei (D)", count: 20 },
  // Gruppe E
  { name: "Deutschland (E)", count: 20 },
  { name: "Curaçao (E)", count: 20 },
  { name: "Ecuador (E)", count: 20 },
  { name: "Elfenbeinküste (E)", count: 20 },
  // Gruppe F
  { name: "Niederlande (F)", count: 20 },
  { name: "Japan (F)", count: 20 },
  { name: "Schweden (F)", count: 20 },
  { name: "Tunesien (F)", count: 20 },
  // Gruppe G
  { name: "Belgien (G)", count: 20 },
  { name: "Ägypten (G)", count: 20 },
  { name: "Iran (G)", count: 20 },
  { name: "Neuseeland (G)", count: 20 },
  // Gruppe H
  { name: "Spanien (H)", count: 20 },
  { name: "Kap Verde (H)", count: 20 },
  { name: "Saudi-Arabien (H)", count: 20 },
  { name: "Uruguay (H)", count: 20 },
  // Gruppe I
  { name: "Frankreich (I)", count: 20 },
  { name: "Irak (I)", count: 20 },
  { name: "Norwegen (I)", count: 20 },
  { name: "Senegal (I)", count: 20 },
  // Gruppe J
  { name: "Argentinien (J)", count: 20 },
  { name: "Algerien (J)", count: 20 },
  { name: "Jordanien (J)", count: 20 },
  { name: "Österreich (J)", count: 20 },
  // Gruppe K
  { name: "Portugal (K)", count: 20 },
  { name: "DR Kongo (K)", count: 20 },
  { name: "Kolumbien (K)", count: 20 },
  { name: "Usbekistan (K)", count: 20 },
  // Gruppe L
  { name: "England (L)", count: 20 },
  { name: "Ghana (L)", count: 20 },
  { name: "Kroatien (L)", count: 20 },
  { name: "Panama (L)", count: 20 },
];

const STATUS = { MISSING: 0, HAVE: 1, DUPLICATE: 2 };

const USERS_KEY = "wm2026_users";
const SECTIONS_KEY = "wm2026_sections_v2";
const collectionKey = (name) => `wm2026_collection_v2_${name}`;

function emptyArray(count) {
  return Array(count).fill(STATUS.MISSING);
}

function emptyCollection(sections) {
  const c = {};
  sections.forEach((s) => { c[s.name] = emptyArray(s.count); });
  return c;
}

function mergeWithSections(parsed, sections) {
  const merged = {};
  sections.forEach((s) => {
    merged[s.name] = Array.isArray(parsed[s.name]) && parsed[s.name].length === s.count
      ? parsed[s.name]
      : emptyArray(s.count);
  });
  return merged;
}

/* ---------- Speicher-Zugriff mit Fallback & Timeout ----------
   Falls window.storage einmal nicht verfügbar ist oder nicht
   rechtzeitig antwortet, fällt die App auf einen In-Memory-Speicher
   zurück, damit der Ladebildschirm nie ewig hängen bleibt. */
const memStore = { personal: {}, shared: {} };

function memoryStorage() {
  return {
    async get(key, shared) {
      const store = shared ? memStore.shared : memStore.personal;
      if (!(key in store)) throw new Error("not found");
      return { key, value: store[key], shared: !!shared };
    },
    async set(key, value, shared) {
      const store = shared ? memStore.shared : memStore.personal;
      store[key] = value;
      return { key, value, shared: !!shared };
    },
    async delete(key, shared) {
      const store = shared ? memStore.shared : memStore.personal;
      delete store[key];
      return { key, deleted: true, shared: !!shared };
    },
    async list(prefix, shared) {
      const store = shared ? memStore.shared : memStore.personal;
      const keys = Object.keys(store).filter((k) => !prefix || k.startsWith(prefix));
      return { keys, prefix, shared: !!shared };
    },
  };
}

function getStorage() {
  if (typeof window !== "undefined" && window.storage) return window.storage;
  return memoryStorage();
}

function withTimeout(promise, ms = 7000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

async function safeGet(key, shared) {
  try {
    const res = await withTimeout(getStorage().get(key, shared));
    return res ? res.value : null;
  } catch (e) {
    return null;
  }
}

async function safeSet(key, value, shared) {
  try {
    await withTimeout(getStorage().set(key, value, shared));
    return true;
  } catch (e) {
    return false;
  }
}

async function safeDelete(key, shared) {
  try {
    await withTimeout(getStorage().delete(key, shared));
    return true;
  } catch (e) {
    return false;
  }
}

export default function App() {
   const [userId, setUserId] = useState(null);
const [stickers, setStickers] = useState([]);
  const [profile, setProfile] = useState(undefined); // undefined = lädt, null = ausgeloggt
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [users, setUsers] = useState([]);
  const [collection, setCollection] = useState(null);
  const [tab, setTab] = useState("sammlung");
  const [viewUser, setViewUser] = useState("");
  const [openSection, setOpenSection] = useState(null);
  const [loginInput, setLoginInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") document.title = "Yannes' Tauschbörse";
  }, []);
useEffect(() => {
  async function loadStickers() {
    const { data } = await supabase
      .from("user_stickers")
      .select("*")
      .eq("user_id", userId);

    setStickers(data || []);
  }

  if (userId) {
    loadStickers();
  }
}, [userId]);
  // ---- initial load (mit Sicherheitsnetz, damit nie ewig geladen wird) ----
  useEffect(() => {
    let settled = false;
    const safetyTimer = setTimeout(() => {
      if (!settled) {
        settled = true;
        setProfile((p) => (p === undefined ? null : p));
      }
    }, 8000);

    (async () => {
      const sectionsRaw = await safeGet(SECTIONS_KEY, true);
      let sList = DEFAULT_SECTIONS;
      if (sectionsRaw) {
        try {
          const parsed = JSON.parse(sectionsRaw);
          if (Array.isArray(parsed) && parsed.length) sList = parsed;
        } catch (e) {}
      } else {
        await safeSet(SECTIONS_KEY, JSON.stringify(DEFAULT_SECTIONS), true);
      }
      setSections(sList);

      const usersRaw = await safeGet(USERS_KEY, true);
      let uList = [];
      if (usersRaw) {
        try { uList = JSON.parse(usersRaw); } catch (e) {}
      }
      setUsers(uList);

      const profileRaw = await safeGet("profile", false);
      if (profileRaw) {
        try {
          const p = JSON.parse(profileRaw);
          setProfile(p);
        } catch (e) { setProfile(null); }
      } else {
        setProfile(null);
      }

      settled = true;
      clearTimeout(safetyTimer);
    })();

    return () => clearTimeout(safetyTimer);
  }, []);

  // ---- eigene Sammlung laden, sobald eingeloggt / Abschnitte bekannt ----
  useEffect(() => {
    if (!profile) return;
    (async () => {
      const raw = await safeGet(collectionKey(profile.name), true);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setCollection(mergeWithSections(parsed, sections));
          return;
        } catch (e) {}
      }
      const fresh = emptyCollection(sections);
      setCollection(fresh);
      await safeSet(collectionKey(profile.name), JSON.stringify(fresh), true);
    })();
  }, [profile, sections]);

  // ---- login / registrieren ----
  const handleLogin = async (e) => {
    e.preventDefault();
    const name = loginInput.trim();
    if (!name) return;
    if (name.length > 30) { setLoginError("Name ist zu lang."); return; }
    setBusy(true);
    setLoginError("");
    try {
      let uList = users;
      const raw = await safeGet(USERS_KEY, true);
      if (raw) { try { uList = JSON.parse(raw); } catch (e) {} }
      if (!uList.includes(name)) {
        uList = [...uList, name];
        await safeSet(USERS_KEY, JSON.stringify(uList), true);
      }
      setUsers(uList);
      const p = { name };
      await safeSet("profile", JSON.stringify(p), false);
      setProfile(p);
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await safeDelete("profile", false);
    setProfile(null);
    setCollection(null);
  };

  // ---- Sticker für eingeloggten Nutzer umschalten ----
  const toggleSticker = useCallback(
    async (sectionName, idx) => {
      if (!collection || !profile) return;
      const next = { ...collection, [sectionName]: [...collection[sectionName]] };
      next[sectionName][idx] = (next[sectionName][idx] + 1) % 3;
      setCollection(next);
      await safeSet(collectionKey(profile.name), JSON.stringify(next), true);
    },
    [collection, profile]
  );

  // ---- abgeleitete Statistik ----
  const myStats = useMemo(() => {
    if (!collection) return null;
    let have = 0, dup = 0, missing = 0, total = 0;
    sections.forEach((s) => {
      const arr = collection[s.name] || [];
      total += arr.length;
      arr.forEach((st) => {
        if (st === STATUS.HAVE) have++;
        else if (st === STATUS.DUPLICATE) dup++;
        else missing++;
      });
    });
    return { have, dup, missing, total };
  }, [collection, sections]);

  if (profile === undefined) {
    return <LoadingScreen />;
  }

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
      <Header profile={profile} stats={myStats} onLogout={handleLogout} />
      <nav style={styles.tabs}>
        <TabButton active={tab === "sammlung"} onClick={() => setTab("sammlung")}>Meine Sammlung</TabButton>
        <TabButton active={tab === "sammler"} onClick={() => setTab("sammler")}>Andere Sammler</TabButton>
        <TabButton active={tab === "tausch"} onClick={() => setTab("tausch")}>Tauschbörse</TabButton>
      </nav>

      <main style={styles.main}>
        {tab === "sammlung" && collection && (
          <CollectionView
            sections={sections}
            collection={collection}
            openSection={openSection}
            setOpenSection={setOpenSection}
            onToggle={toggleSticker}
            editable
          />
        )}

        {tab === "sammler" && (
          <OthersView
            sections={sections}
            users={users.filter((u) => u !== profile.name)}
            viewUser={viewUser}
            setViewUser={setViewUser}
          />
        )}

        {tab === "tausch" && collection && (
          <TradeView
            sections={sections}
            myCollection={collection}
            users={users.filter((u) => u !== profile.name)}
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

function CollectionView({ sections, collection, openSection, setOpenSection, onToggle, editable, readOnlyData }) {
  return (
    <div style={styles.countryList}>
      {sections.map((section) => {
        const stickers = readOnlyData ? readOnlyData[section.name] : collection[section.name];
        if (!stickers) return null;
        const have = stickers.filter((s) => s === STATUS.HAVE).length;
        const dup = stickers.filter((s) => s === STATUS.DUPLICATE).length;
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
                {stickers.map((status, idx) => (
                  <StickerCell
                    key={idx}
                    number={idx + 1}
                    status={status}
                    onClick={editable ? () => onToggle(section.name, idx) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StickerCell({ number, status, onClick }) {
  const styleMap = [styles.stickerMissing, styles.stickerHave, styles.stickerDuplicate];
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      style={{ ...styles.sticker, ...styleMap[status], cursor: onClick ? "pointer" : "default" }}
      title={status === 0 ? "fehlt" : status === 1 ? "vorhanden" : "doppelt"}
    >
      <span style={styles.stickerNumber}>{number}</span>
      {status === STATUS.DUPLICATE && <span style={styles.stickerBadge}>2×</span>}
      {status === STATUS.HAVE && <span style={styles.stickerCheck}>✓</span>}
    </button>
  );
}

/* ===================== Andere Sammler ===================== */

function OthersView({ sections, users, viewUser, setViewUser }) {
  const [data, setData] = useState(null);
  const [openSection, setOpenSection] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!viewUser) { setData(null); return; }
    setLoading(true);
    (async () => {
      const raw = await safeGet(collectionKey(viewUser), true);
      let parsed = {};
      if (raw) { try { parsed = JSON.parse(raw); } catch (e) {} }
      setData(mergeWithSections(parsed, sections));
      setLoading(false);
    })();
  }, [viewUser, sections]);

  if (users.length === 0) {
    return <EmptyState text="Noch hat sich niemand sonst eingetragen. Teile den Link mit deinen Mit-Sammlern!" />;
  }

  return (
    <div>
      <div style={styles.selectRow}>
        <label style={styles.selectLabel}>Sammler auswählen:</label>
        <select style={styles.select} value={viewUser} onChange={(e) => { setViewUser(e.target.value); setOpenSection(null); }}>
          <option value="">– bitte wählen –</option>
          {users.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      {loading && <div style={styles.note}>Lade Sammlung …</div>}
      {data && !loading && (
        <CollectionView
          sections={sections}
          collection={null}
          readOnlyData={data}
          openSection={openSection}
          setOpenSection={setOpenSection}
          onToggle={() => {}}
          editable={false}
        />
      )}
    </div>
  );
}

/* ===================== Tauschbörse ===================== */

function TradeView({ sections, myCollection, users }) {
  const [allData, setAllData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const result = {};
      for (const u of users) {
        const raw = await safeGet(collectionKey(u), true);
        let parsed = {};
        if (raw) { try { parsed = JSON.parse(raw); } catch (e) {} }
        result[u] = parsed;
      }
      setAllData(result);
      setLoading(false);
    })();
  }, [users, sections]);

  const myMissing = useMemo(() => {
    const set = [];
    sections.forEach((s) => {
      (myCollection[s.name] || []).forEach((st, idx) => {
        if (st === STATUS.MISSING) set.push(`${s.name}#${idx + 1}`);
      });
    });
    return new Set(set);
  }, [myCollection, sections]);

  const myDuplicates = useMemo(() => {
    const list = [];
    sections.forEach((s) => {
      (myCollection[s.name] || []).forEach((st, idx) => {
        if (st === STATUS.DUPLICATE) list.push({ section: s.name, number: idx + 1 });
      });
    });
    return list;
  }, [myCollection, sections]);

  const offersForMe = useMemo(() => {
    if (!allData) return [];
    const offers = [];
    Object.entries(allData).forEach(([user, coll]) => {
      sections.forEach((s) => {
        const arr = coll[s.name];
        if (!Array.isArray(arr)) return;
        arr.forEach((st, idx) => {
          if (st === STATUS.DUPLICATE && myMissing.has(`${s.name}#${idx + 1}`)) {
            offers.push({ user, section: s.name, number: idx + 1 });
          }
        });
      });
    });
    return offers;
  }, [allData, sections, myMissing]);

  const requestsFromOthers = useMemo(() => {
    if (!allData) return [];
    const reqs = [];
    myDuplicates.forEach(({ section, number }) => {
      Object.entries(allData).forEach(([user, coll]) => {
        const arr = coll[section];
        if (Array.isArray(arr) && arr[number - 1] === STATUS.MISSING) {
          reqs.push({ user, section, number });
        }
      });
    });
    return reqs;
  }, [allData, myDuplicates]);

  if (users.length === 0) {
    return <EmptyState text="Sobald sich weitere Sammler eintragen, zeigt dir die Tauschbörse passende Treffer." />;
  }
  if (loading) return <div style={styles.note}>Suche nach Tauschmöglichkeiten …</div>;

  return (
    <div>
      <SectionTitle>Das kannst du bekommen</SectionTitle>
      {offersForMe.length === 0 ? (
        <EmptyState text="Aktuell hat niemand einen Sticker doppelt, den du noch brauchst." />
      ) : (
        <ul style={styles.tradeList}>
          {offersForMe.map((o, i) => (
            <li key={i} style={styles.tradeItem}>
              <span style={styles.tradeBadgeGreen}>2×</span>
              <b>{o.section} #{o.number}</b> — <b>{o.user}</b> hat ihn doppelt
            </li>
          ))}
        </ul>
      )}

      <SectionTitle>Das kannst du anbieten</SectionTitle>
      {requestsFromOthers.length === 0 ? (
        <EmptyState text="Niemand braucht aktuell einen deiner doppelten Sticker." />
      ) : (
        <ul style={styles.tradeList}>
          {requestsFromOthers.map((r, i) => (
            <li key={i} style={styles.tradeItem}>
              <span style={styles.tradeBadgeAmber}>fehlt</span>
              <b>{r.section} #{r.number}</b> — <b>{r.user}</b> sucht ihn, du hast ihn doppelt
            </li>
          ))}
        </ul>
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
  paper: "#F3ECD9",
  paperDark: "#E8DEC4",
  ink: "#1C2541",
  gold: "#D9A441",
  have: "#2E7D5B",
  haveLight: "#DCEEE3",
  missing: "#C9C2AC",
  dup: "#E2862F",
  dupLight: "#FBE6CC",
  white: "#FFFCF4",
};

const styles = {
  app: {
    minHeight: "100vh",
    background: COLORS.paper,
    fontFamily: "'Manrope', sans-serif",
    color: COLORS.ink,
    paddingBottom: 40,
  },
  header: {
    background: COLORS.ink,
    color: COLORS.white,
    padding: "10px 18px 16px",
    borderBottom: `4px solid ${COLORS.gold}`,
  },
  headerRibbon: {
    fontFamily: "'Anton', sans-serif",
    fontSize: 12,
    letterSpacing: 2,
    color: COLORS.gold,
    marginBottom: 6,
  },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" },
  headerName: { fontFamily: "'Anton', sans-serif", fontSize: 24, letterSpacing: 0.5 },
  headerStats: { fontSize: 12.5, opacity: 0.85, marginTop: 2 },
  headerRight: { display: "flex", alignItems: "center", gap: 10 },
  progressOuter: {
    position: "relative", width: 110, height: 22, background: "rgba(255,255,255,0.15)",
    borderRadius: 999, overflow: "hidden", border: "1px solid rgba(255,255,255,0.3)",
  },
  progressInner: { position: "absolute", top: 0, left: 0, bottom: 0, background: COLORS.gold },
  progressLabel: {
    position: "relative", zIndex: 1, fontSize: 11, fontWeight: 800, display: "flex",
    alignItems: "center", justifyContent: "center", height: "100%", color: COLORS.ink,
  },
  logoutBtn: {
    background: "transparent", border: `1px solid ${COLORS.gold}`, color: COLORS.gold,
    borderRadius: 8, padding: "6px 12px", fontSize: 12.5, cursor: "pointer", fontWeight: 700,
  },
  tabs: { display: "flex", gap: 6, padding: "14px 18px 0", background: COLORS.paper },
  tabButton: {
    flex: 1, padding: "10px 8px", borderRadius: "10px 10px 0 0", border: "none",
    background: COLORS.paperDark, color: COLORS.ink, fontWeight: 700, fontSize: 13,
    cursor: "pointer", opacity: 0.7,
  },
  tabButtonActive: { background: COLORS.white, opacity: 1, boxShadow: "0 -2px 0 0 " + COLORS.gold + " inset" },
  main: { padding: "16px 14px 0", maxWidth: 720, margin: "0 auto" },
  footer: { textAlign: "center", fontSize: 11.5, color: "#8a8265", padding: "26px 24px 0" },

  countryList: { display: "flex", flexDirection: "column", gap: 10 },
  countryCard: { background: COLORS.white, borderRadius: 12, boxShadow: "0 1px 3px rgba(28,37,65,0.12)", overflow: "hidden" },
  countryHeader: {
    width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "13px 14px",
    background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
  },
  countryHeaderComplete: { background: COLORS.haveLight },
  countryName: { fontFamily: "'Anton', sans-serif", fontSize: 15, flex: 1, letterSpacing: 0.3 },
  countryProgress: { fontSize: 12.5, fontWeight: 700, color: "#665f45" },
  chevron: { fontSize: 11, opacity: 0.6 },
  stickerGrid: {
    display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, padding: "4px 14px 16px",
  },
  sticker: {
    position: "relative", aspectRatio: "1", borderRadius: 7, display: "flex",
    alignItems: "center", justifyContent: "center", border: "2px dashed " + COLORS.missing,
    background: COLORS.paper,
  },
  stickerMissing: { background: COLORS.paper, borderColor: COLORS.missing, color: "#9b9477" },
  stickerHave: { background: COLORS.haveLight, borderStyle: "solid", borderColor: COLORS.have, color: COLORS.have },
  stickerDuplicate: { background: COLORS.dupLight, borderStyle: "solid", borderColor: COLORS.dup, color: "#8a4f12" },
  stickerNumber: { fontFamily: "'Anton', sans-serif", fontSize: 15 },
  stickerBadge: {
    position: "absolute", top: -6, right: -6, background: COLORS.dup, color: "white",
    fontSize: 9, fontWeight: 800, borderRadius: 999, padding: "2px 5px",
  },
  stickerCheck: { position: "absolute", top: -6, right: -6, color: COLORS.have, fontSize: 13, fontWeight: 900 },

  selectRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" },
  selectLabel: { fontSize: 13, fontWeight: 700 },
  select: { flex: 1, minWidth: 160, padding: "9px 10px", borderRadius: 8, border: `1px solid ${COLORS.missing}`, background: COLORS.white, fontSize: 14 },
  note: { fontSize: 13.5, color: "#665f45", padding: "10px 0" },

  sectionTitle: { fontFamily: "'Anton', sans-serif", fontSize: 16, margin: "18px 0 8px", letterSpacing: 0.3 },
  tradeList: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 },
  tradeItem: {
    background: COLORS.white, borderRadius: 10, padding: "10px 12px", fontSize: 13.5,
    display: "flex", alignItems: "center", gap: 8, boxShadow: "0 1px 3px rgba(28,37,65,0.1)",
  },
  tradeBadgeGreen: { background: COLORS.have, color: "white", fontSize: 10, fontWeight: 800, borderRadius: 999, padding: "2px 7px" },
  tradeBadgeAmber: { background: COLORS.dup, color: "white", fontSize: 10, fontWeight: 800, borderRadius: 999, padding: "2px 7px" },
  emptyState: { fontSize: 13.5, color: "#8a8265", background: COLORS.paperDark, borderRadius: 10, padding: "16px 14px" },

  loginWrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.ink, padding: 20 },
  loginCard: {
    background: COLORS.paper, borderRadius: 18, padding: "26px 24px 22px", maxWidth: 360, width: "100%",
    boxShadow: "0 20px 50px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", alignItems: "center",
    position: "relative", overflow: "hidden",
  },
  loginRibbon: {
    position: "absolute", top: 14, right: -38, background: COLORS.gold, color: COLORS.ink,
    fontFamily: "'Anton', sans-serif", fontSize: 12, padding: "4px 40px", transform: "rotate(35deg)",
    letterSpacing: 1, fontWeight: 700,
  },
  loginTitle: { fontFamily: "'Anton', sans-serif", fontSize: 30, margin: "8px 0 6px", textAlign: "center", lineHeight: 1.15 },
  loginSub: { fontSize: 13.5, textAlign: "center", color: "#5a543c", marginBottom: 18, lineHeight: 1.5 },
  loginInput: {
    width: "100%", padding: "13px 14px", borderRadius: 10, border: `2px solid ${COLORS.missing}`,
    fontSize: 15, marginBottom: 10, background: COLORS.white,
  },
  loginError: { color: "#b3401a", fontSize: 12.5, marginBottom: 8 },
  loginButton: {
    width: "100%", padding: "13px 14px", borderRadius: 10, border: "none", background: COLORS.ink,
    color: COLORS.gold, fontFamily: "'Anton', sans-serif", fontSize: 15, letterSpacing: 0.5, cursor: "pointer",
  },
  loginNote: { fontSize: 11.5, color: "#7a7456", marginTop: 16, textAlign: "center", lineHeight: 1.5 },
};
