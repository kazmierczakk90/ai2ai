import { create } from "zustand";

export type Lang = "en" | "pl" | "fr" | "es";

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "EN" },
  { code: "pl", label: "Polski", flag: "PL" },
  { code: "fr", label: "Français", flag: "FR" },
  { code: "es", label: "Español", flag: "ES" },
];

type Dict = Record<string, Record<Lang, string>>;

export const DICT: Dict = {
  "app.tagline": {
    en: "AGI Strategic Engine",
    pl: "Silnik Strategiczny AGI",
    fr: "Moteur Stratégique AGI",
    es: "Motor Estratégico AGI",
  },
  "nav.channels": {
    en: "Channels",
    pl: "Kanały",
    fr: "Canaux",
    es: "Canales",
  },
  "nav.modules": {
    en: "Modules",
    pl: "Moduły",
    fr: "Modules",
    es: "Módulos",
  },
  "nav.operator": {
    en: "operator",
    pl: "operator",
    fr: "opérateur",
    es: "operador",
  },
  "nav.active": {
    en: "active",
    pl: "aktywny",
    fr: "actif",
    es: "activo",
  },
  "top.online": {
    en: "engine online",
    pl: "silnik online",
    fr: "moteur en ligne",
    es: "motor en línea",
  },
  "top.build": {
    en: "build",
    pl: "kompilacja",
    fr: "build",
    es: "build",
  },
  "top.region": {
    en: "region",
    pl: "region",
    fr: "région",
    es: "región",
  },
  "top.rev": {
    en: "rev",
    pl: "rew",
    fr: "rév",
    es: "rev",
  },
  "term.title": {
    en: "Dual-Output Terminal",
    pl: "Terminal Podwójnego Wyjścia",
    fr: "Terminal à Double Sortie",
    es: "Terminal de Doble Salida",
  },
  "term.channel": {
    en: "channel",
    pl: "kanał",
    fr: "canal",
    es: "canal",
  },
  "term.frames": {
    en: "frames",
    pl: "ramki",
    fr: "trames",
    es: "tramas",
  },
  "term.sys": {
    en: "sys",
    pl: "sys",
    fr: "sys",
    es: "sis",
  },
  "term.uplink": {
    en: "uplink",
    pl: "łącze",
    fr: "liaison",
    es: "enlace",
  },
  "term.role.operator": {
    en: "operator",
    pl: "operator",
    fr: "opérateur",
    es: "operador",
  },
  "term.role.system": {
    en: "kk1.core",
    pl: "kk1.core",
    fr: "kk1.core",
    es: "kk1.core",
  },
  "term.tag.ingress": {
    en: "INGRESS",
    pl: "WEJŚCIE",
    fr: "ENTRÉE",
    es: "ENTRADA",
  },
  "term.tag.dialogue": {
    en: "DIALOGUE",
    pl: "DIALOG",
    fr: "DIALOGUE",
    es: "DIÁLOGO",
  },
  "composer.placeholder": {
    en: "dispatch to @ceo · run #-market_scan- inside $-launch_readiness · enforce !-no_pii_leak-",
    pl: "wyślij do @ceo · uruchom #-market_scan- w $-launch_readiness · wymuś !-no_pii_leak-",
    fr: "envoyer à @ceo · exécuter #-market_scan- dans $-launch_readiness · appliquer !-no_pii_leak-",
    es: "enviar a @ceo · ejecutar #-market_scan- en $-launch_readiness · aplicar !-no_pii_leak-",
  },
  "composer.enter": {
    en: "enter · send",
    pl: "enter · wyślij",
    fr: "entrée · envoyer",
    es: "entrar · enviar",
  },
  "composer.newline": {
    en: "shift+enter · newline",
    pl: "shift+enter · nowa linia",
    fr: "maj+entrée · nouvelle ligne",
    es: "mayús+enter · nueva línea",
  },
  "composer.fuko": {
    en: "FUKO-LANG live",
    pl: "FUKO-LANG aktywny",
    fr: "FUKO-LANG actif",
    es: "FUKO-LANG activo",
  },
  "reason.title": {
    en: "Deep Reasoning UI",
    pl: "Głęboka Analiza",
    fr: "Raisonnement Approfondi",
    es: "Razonamiento Profundo",
  },
  "reason.w0": {
    en: "W0 · Ingestion Summary",
    pl: "W0 · Podsumowanie Ingestii",
    fr: "W0 · Résumé d'Ingestion",
    es: "W0 · Resumen de Ingesta",
  },
  "reason.w1": {
    en: "W1 · Identity Filter & FUKO Decision",
    pl: "W1 · Filtr Tożsamości i Decyzja FUKO",
    fr: "W1 · Filtre d'Identité et Décision FUKO",
    es: "W1 · Filtro de Identidad y Decisión FUKO",
  },
  "reason.6d": {
    en: "6D Scoring Matrix",
    pl: "Macierz Oceny 6D",
    fr: "Matrice de Notation 6D",
    es: "Matriz de Puntuación 6D",
  },
  "reason.sda": {
    en: "SDA · Routing Path",
    pl: "SDA · Ścieżka Routingu",
    fr: "SDA · Chemin de Routage",
    es: "SDA · Ruta SDA",
  },
  "reason.identity": {
    en: "identity",
    pl: "tożsamość",
    fr: "identité",
    es: "identidad",
  },
  "score.confidence": {
    en: "Confidence",
    pl: "Pewność",
    fr: "Confiance",
    es: "Confianza",
  },
  "score.risk": { en: "Risk", pl: "Ryzyko", fr: "Risque", es: "Riesgo" },
  "score.empathy": { en: "Empathy", pl: "Empatia", fr: "Empathie", es: "Empatía" },
  "score.focus": { en: "Focus", pl: "Skupienie", fr: "Focus", es: "Enfoque" },
  "score.energy": { en: "Energy", pl: "Energia", fr: "Énergie", es: "Energía" },
  "score.curiosity": {
    en: "Curiosity",
    pl: "Ciekawość",
    fr: "Curiosité",
    es: "Curiosidad",
  },
  "rail.pulse": {
    en: "System pulse",
    pl: "Puls systemu",
    fr: "Pouls du système",
    es: "Pulso del sistema",
  },
  "rail.legend": {
    en: "FUKO-LANG legend",
    pl: "Legenda FUKO-LANG",
    fr: "Légende FUKO-LANG",
    es: "Leyenda FUKO-LANG",
  },
  "rail.guard": {
    en: "Guardrail stack",
    pl: "Stos Wytycznych",
    fr: "Pile de Garde-fous",
    es: "Pila de Salvaguardas",
  },
  "rail.load": { en: "load", pl: "obciążenie", fr: "charge", es: "carga" },
  "rail.queue": { en: "queue", pl: "kolejka", fr: "file", es: "cola" },
  "rail.agents": { en: "agents", pl: "agenci", fr: "agents", es: "agentes" },
  "rail.p95": {
    en: "p95 lat",
    pl: "p95 opóźn",
    fr: "p95 lat",
    es: "p95 lat",
  },
  "lang.label": {
    en: "language",
    pl: "język",
    fr: "langue",
    es: "idioma",
  },
  "agents.title": {
    en: "Agent status board",
    pl: "Tablica statusu agentów",
    fr: "Tableau des agents",
    es: "Panel de agentes",
  },
  "agent.license": {
    en: "License level",
    pl: "Poziom licencji",
    fr: "Niveau de licence",
    es: "Nivel de licencia",
  },
  "agent.trust": {
    en: "Trust score",
    pl: "Ocena zaufania",
    fr: "Score de confiance",
    es: "Puntuación de confianza",
  },
  "voice.mode.on": {
    en: "voice mode · on",
    pl: "tryb głosowy · wł.",
    fr: "mode vocal · activé",
    es: "modo voz · activo",
  },
  "voice.mode.off": {
    en: "voice mode · off",
    pl: "tryb głosowy · wył.",
    fr: "mode vocal · désactivé",
    es: "modo voz · inactivo",
  },
  "voice.mic": {
    en: "Voice input",
    pl: "Wejście głosowe",
    fr: "Entrée vocale",
    es: "Entrada de voz",
  },
  "voice.listening": {
    en: "listening…",
    pl: "słucham…",
    fr: "écoute…",
    es: "escuchando…",
  },
  "voice.unsupported": {
    en: "Speech API unavailable in this browser.",
    pl: "API mowy niedostępne w tej przeglądarce.",
    fr: "API vocale indisponible dans ce navigateur.",
    es: "API de voz no disponible en este navegador.",
  },
  "shortcuts.hint": {
    en: "F1 style · F4 halt · F6 voice",
    pl: "F1 styl · F4 stop · F6 głos",
    fr: "F1 style · F4 arrêt · F6 voix",
    es: "F1 estilo · F4 paro · F6 voz",
  },
  "import.title": {
    en: "Chat Import · Telegram",
    pl: "Import Czatu · Telegram",
    fr: "Import Chat · Telegram",
    es: "Import Chat · Telegram",
  },
  "import.conversations": {
    en: "conversations",
    pl: "rozmowy",
    fr: "conversations",
    es: "conversaciones",
  },
  "import.webhook.on": {
    en: "webhook active",
    pl: "webhook aktywny",
    fr: "webhook actif",
    es: "webhook activo",
  },
  "import.webhook.off": {
    en: "webhook idle",
    pl: "webhook nieaktywny",
    fr: "webhook inactif",
    es: "webhook inactivo",
  },
  "import.retag": {
    en: "retag",
    pl: "retaguj",
    fr: "reclasser",
    es: "reetiquetar",
  },
  "import.empty": {
    en: "No messages yet. Send a message to the bot.",
    pl: "Brak wiadomości. Wyślij wiadomość do bota.",
    fr: "Aucun message. Envoyez un message au bot.",
    es: "Sin mensajes. Envía un mensaje al bot.",
  },
};

type I18nState = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof DICT) => string;
};

const STORAGE_KEY = "kk1.lang";

function initialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (saved && LANGS.some((l) => l.code === saved)) return saved;
  const nav = window.navigator.language.slice(0, 2).toLowerCase();
  if (LANGS.some((l) => l.code === nav)) return nav as Lang;
  return "en";
}

export const useI18n = create<I18nState>((set, get) => ({
  lang: "en",
  setLang: (l) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
    }
    set({ lang: l });
  },
  t: (key) => {
    const entry = DICT[key as string];
    if (!entry) return key as string;
    return entry[get().lang] ?? entry.en ?? (key as string);
  },
}));

// Hydrate on client after mount to avoid SSR mismatch.
export function hydrateI18n() {
  if (typeof window === "undefined") return;
  const l = initialLang();
  useI18n.setState({ lang: l });
  document.documentElement.lang = l;
}
