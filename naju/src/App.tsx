import React, { useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";
import HomeDashboard from "./HomeDashboard";
import ErrorCenter from "./ErrorCenter";
import { appointmentsToCsv, appointmentsToIcs, downloadTextFile } from "./lib/export";
import { makeQrSvgDataUrl } from "./lib/qr";
import {
  Patient,
  PatientFile,
  PatientInput,
  createMentalExam,
  createPatientNote,
  updatePatientNote,
  createPatient,
  deletePatient,
  importFiles,
  listAllFiles,
  listPatientFiles,
  listPatients,
  setPatientPhoto,
  updatePatient,
  Appointment,
  AppointmentInput,
  createAppointment,
  deleteAppointment,
  listAppointments,
  ErrorReport,
  createErrorReport,
  deleteErrorReport,
  listErrorReports,
} from "./lib/api";
import { buildProfileMap } from "./lib/profile";

type Section = "resumen" | "examenes" | "notas" | "citas" | "archivos";
type ConsultaTipo = "presencial" | "virtual";

type ConsentDecision = "acepto" | "no_acepto";
type ConsentData = {
  created_at: string;
  psicologo_nombre: string;
  psicologo_documento: string;
  psicologo_tp: string;
  psicologo_correo: string;
  psicologo_telefono: string;
  psicologo_ciudad_direccion: string;
  modalidad_atencion: ConsultaTipo;
  lugar_plataforma: string;
  canal_derechos_correo: string;
  canal_derechos_telefono: string;
  informe_solicitud: "verbal" | "escrita" | "ambas";
  informe_plazo_dias: string;
  informe_medio: "pdf" | "impreso" | "otro";
  informe_medio_otro: string;
  informe_costo: string;
  paciente_nombre: string;
  paciente_documento: string;
  decision: ConsentDecision;
  firma_paciente_data_url: string | null;
  firma_psicologo_data_url: string | null;
};

type Toast = { type: "ok" | "err"; msg: string } | null;



type ProfessionalProfile = {
  psicologo_nombre: string;
  psicologo_documento: string;
  psicologo_tp: string;
  psicologo_correo: string;
  psicologo_telefono: string;
  psicologo_ciudad_direccion: string;
  modalidad_atencion: ConsultaTipo;
  lugar_plataforma: string;
  canal_derechos_correo: string;
  canal_derechos_telefono: string;
  informe_solicitud: "verbal" | "escrita" | "ambas";
  informe_plazo_dias: string;
  informe_medio: "pdf" | "impreso" | "otro";
  informe_medio_otro: string;
  informe_costo: string;
  firma_psicologo_data_url: string | null;
};

const PROFESSIONAL_PROFILE_STORAGE_KEY = "naju_professional_profile_v1";

type PaletteTokens = {
  primary: string;
  background: string;
  surface: string;
  accent: string;
  text: string;
};

type AppPalette = { name: string; light: PaletteTokens; dark: PaletteTokens };

const APP_PALETTES: Record<string, AppPalette> = {
  original: {
    name: "Original/Base",
    light: { primary: "#8a6a43", background: "#fbf7ef", surface: "#fffdf8", accent: "#c7a45a", text: "#2b241d" },
    dark: { primary: "#e7d1a2", background: "#0b1120", surface: "#0d1526", accent: "#c7a45a", text: "#e7eaf0" },
  },
  cacao: {
    name: "Cacao Latte",
    light: { primary: "#774723", background: "#FBF5E9", surface: "#B99268", accent: "#895720", text: "#391809" },
    dark: { primary: "#B99268", background: "#391809", surface: "#774723", accent: "#FBF5E9", text: "#FBF5E9" },
  },
  lavender: {
    name: "Lavender Depth",
    light: { primary: "#6C5F8D", background: "#DCD7D4", surface: "#BB96C1", accent: "#9D8DBA", text: "#4C3F6D" },
    dark: { primary: "#BB96C1", background: "#4C3F6D", surface: "#6C5F8D", accent: "#DCD7D4", text: "#FFFFFF" },
  },
  nordic: {
    name: "Nordic Saffron",
    light: { primary: "#519CAB", background: "#C3E7F1", surface: "#FFFFFF", accent: "#FFC64F", text: "#20373B" },
    dark: { primary: "#FFC64F", background: "#20373B", surface: "#2E4A50", accent: "#519CAB", text: "#FFFFFF" },
  },
  sage: {
    name: "Sage Therapy",
    light: { primary: "#A6C796", background: "#E7F5DC", surface: "#C8E1B8", accent: "#889F7C", text: "#71815F" },
    dark: { primary: "#C8E1B8", background: "#71815F", surface: "#889F7C", accent: "#E7F5DC", text: "#FFFFFF" },
  },
  caesarCyberpunk: {
    name: "Caesar Cyberpunk",
    light: { primary: "#ff3270", background: "#eeffff", surface: "#ffffff", accent: "#00c3ff", text: "#000807" },
    dark: { primary: "#ff3270", background: "#000807", surface: "#0b1413", accent: "#00c3ff", text: "#eeffff" },
  },
};

function defaultProfessionalProfile(): ProfessionalProfile {
  return {
    psicologo_nombre: "",
    psicologo_documento: "",
    psicologo_tp: "",
    psicologo_correo: "",
    psicologo_telefono: "",
    psicologo_ciudad_direccion: "",
    modalidad_atencion: "presencial",
    lugar_plataforma: "",
    canal_derechos_correo: "",
    canal_derechos_telefono: "",
    informe_solicitud: "verbal",
    informe_plazo_dias: "",
    informe_medio: "pdf",
    informe_medio_otro: "",
    informe_costo: "",
    firma_psicologo_data_url: null,
  };
}

function professionalProfileFromConsent(v: ConsentData): ProfessionalProfile {
  return {
    psicologo_nombre: v.psicologo_nombre,
    psicologo_documento: v.psicologo_documento,
    psicologo_tp: v.psicologo_tp,
    psicologo_correo: v.psicologo_correo,
    psicologo_telefono: v.psicologo_telefono,
    psicologo_ciudad_direccion: v.psicologo_ciudad_direccion,
    modalidad_atencion: v.modalidad_atencion,
    lugar_plataforma: v.lugar_plataforma,
    canal_derechos_correo: v.canal_derechos_correo,
    canal_derechos_telefono: v.canal_derechos_telefono,
    informe_solicitud: v.informe_solicitud,
    informe_plazo_dias: v.informe_plazo_dias,
    informe_medio: v.informe_medio,
    informe_medio_otro: v.informe_medio_otro,
    informe_costo: v.informe_costo,
    firma_psicologo_data_url: v.firma_psicologo_data_url,
  };
}

function createConsentDraft(profile: ProfessionalProfile): ConsentData {
  return {
    created_at: new Date().toISOString(),
    ...profile,
    paciente_nombre: "",
    paciente_documento: "",
    decision: "acepto",
    firma_paciente_data_url: null,
  };
}

function buildInitialAssessmentBodyTemplate() {
  return [
    "VALORACIÓN INICIAL. Campo de texto. Se encuentra al consultante vía Online/consultorio",
    "",
    "En cuanto a su esfera emocional refiere:",
    "",
    "Respecto al ámbito familiar expresa:",
    "",
    "En relación a su esfera laboral menciona:",
    "",
    "ANÁLISIS.",
    "",
    "Consultante masculino en el curso de vida de la adultez",
    "",
    "A la fecha, el consultante",
    "",
    "En cuanto a su composición familiar…",
    "",
    "En el ámbito ocupacional…",
    "",
    "Respecto al estado académico…",
    "",
    "Durante la sesión refiere…",
    "",
    "En cuanto a los factores de riesgo…",
    "",
    "En cuanto a los factores protectores…",
    "",
    "PLAN DE TRABAJO.",
    "",
    "Archivos adjuntos.",
    "",
    "- Diagnósticos: Sí / No → Subir archivo",
    "- Fórmulas médicas / Medicación: Sí / No",
    "- Fotos de medicamentos (pastillas/cajas): Subir archivo → Descripción breve:",
  ].join("\n");
}

function buildInitialAssessmentNoteText(patientName: string, date: string, time: string, body: string) {
  return [
    patientName.toUpperCase(),
    "",
    `Fecha: ${date}   Hora: ${time}`,
    "",
    body.trim(),
  ].join("\n");
}

function errMsg(e: any) {
  if (!e) return "Error desconocido";
  if (typeof e === "string") return e;
  if (e?.message) return e.message;
  try { return JSON.stringify(e); } catch { return String(e); }
}

function startVT(fn: () => void) {
  const d: any = document;
  if (d.startViewTransition) d.startViewTransition(fn);
  else fn();
}

function isoToNice(iso: string) {
  try {
    const dt = new Date(iso);
    return dt.toLocaleString();
  } catch {
    return iso;
  }
}

function calcAge(birth: string | null) {
  if (!birth) return null;
  const d = new Date(birth + "T00:00:00");
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return Math.max(0, age);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase();
}

function valOrDash(v: string | null | undefined) {
  const t = (v ?? "").trim();
  return t.length ? t : "—";
}

function parseMetaJson(file: PatientFile) {
  if (!file.meta_json) return null;
  try {
    return JSON.parse(file.meta_json);
  } catch {
    return null;
  }
}

function parseConsentJson(raw: string | null | undefined): ConsentData | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ConsentData;
  } catch {
    return null;
  }
}

function normalizeConsultaTipo(value: unknown): ConsultaTipo {
  return value === "virtual" ? "virtual" : "presencial";
}

function consultaTipoLabel(value: ConsultaTipo) {
  return value === "virtual" ? "Virtual" : "Presencial";
}

function appointmentModalityLabel(value: Appointment["modality"] | undefined) {
  return value === "virtual" ? "Virtual" : "Presencial";
}

function buildVirtualSessionLink(patientName: string, startIso: string) {
  const date = new Date(startIso);
  const token = patientName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 24);
  const dt = Number.isNaN(date.getTime())
    ? Date.now().toString(36)
    : `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}`;
  return `https://meet.jit.si/naju-${token || "sesion"}-${dt}`;
}

function buildVirtualLinkMessage(patientName: string, link: string) {
  return `Hola ✨ ${patientName} ¿Cómo te encuentras?
Este es el link para conectarte a nuestra sesión virtual: ${link}
Te espero a la hora acordada. ¡Nos vemos! ✨`;
}

function buildPatientReminderMessage(patientName: string, startIso: string) {
  const d = new Date(startIso);
  const date = Number.isNaN(d.getTime()) ? "fecha" : d.toLocaleDateString();
  const hour = Number.isNaN(d.getTime()) ? "hora" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `Hola ✨ ${patientName} Espero se encuentre bien
Escribo para recordarte nuestra sesión de mañana ${date} a las ${hour}. 🗓️ Te espero a la hora acordada. ¡Nos vemos! ✨`;
}

function buildPsychReminderMessage(psychName: string, patientName: string, startIso: string, modality: Appointment["modality"], calendarLink?: string | null) {
  const d = new Date(startIso);
  const date = Number.isNaN(d.getTime()) ? "fecha" : d.toLocaleDateString();
  const hour = Number.isNaN(d.getTime()) ? "hora" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const modalityLabel = modality === "virtual" ? "Virtual" : "Presencial";
  return `Hola 👋 Soy NAJU, ${psychName || "Psicólogo(a)"}. Tienes una sesión programada para mañana ${date} a las ${hour} con ${patientName}. 🗓️ Modalidad: ${modalityLabel}. Ver en calendario: ${calendarLink || "(sin link)"}`;
}

function fileIcon(file: PatientFile) {
  const name = file.filename.toLowerCase();
  if (file.kind === "note") return "📝";
  if (file.kind === "exam") return "🧠";
  if (name.endsWith(".pdf")) return "📄";
  if (name.match(/\.(png|jpg|jpeg|webp|gif)$/)) return "🖼️";
  return "📎";
}

function isImage(path: string) {
  return path.startsWith("data:image/") || /\.(png|jpg|jpeg|webp|gif)$/i.test(path);
}

function isPdf(path: string) {
  return path.startsWith("data:application/pdf") || /\.pdf$/i.test(path);
}

// --- Ocean background (global) ---
function WaveSvg({ variant }: { variant: "back" | "front" }) {
  return (
    <svg className={`waveSvg ${variant}`} viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0,120 C150,60 300,180 450,120 C600,60 750,180 900,120 C1050,60 1200,180 1200,120 L1200,200 L0,200 Z" />
    </svg>
  );
}

function OceanBackground() {
  return (
    <div className="ocean" aria-hidden="true">
      <div className="wave waveBack">
        <div className="waveInner">
          <WaveSvg variant="back" />
          <WaveSvg variant="back" />
        </div>
      </div>
      <div className="wave waveFront">
        <div className="waveInner">
          <WaveSvg variant="front" />
          <WaveSvg variant="front" />
        </div>
      </div>
      <div className="sea" />
    </div>
  );
}



// --- Audio transcription + asset persistence (dev) ---
let asrPipelinePromise: Promise<any> | null = null;

async function getAsrPipeline() {
  if (asrPipelinePromise) return asrPipelinePromise;
  asrPipelinePromise = (async () => {
    const mod: any = await import("@xenova/transformers");
    const pipeline = mod?.pipeline;
    const env = mod?.env;
    if (env) {
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      env.allowRemoteModels = true;
      if (env.backends?.onnx?.wasm) {
        env.backends.onnx.wasm.numThreads = 1;
        env.backends.onnx.wasm.simd = true;
      }
    }
    return pipeline("automatic-speech-recognition", "Xenova/whisper-tiny", { quantized: true });
  })();
  return asrPipelinePromise;
}

async function decodeAudioToMono16k(blob: Blob): Promise<{ array: Float32Array; sampling_rate: number }> {
  const ab = await blob.arrayBuffer();
  const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AC) throw new Error("AudioContext no disponible en este navegador.");
  const ctx = new AC();
  let decoded: AudioBuffer;
  try {
    decoded = await ctx.decodeAudioData(ab.slice(0));
  } finally {
    try {
      await ctx.close();
    } catch {
      /* ignore */
    }
  }

  const n = decoded.numberOfChannels;
  const ch0 = decoded.getChannelData(0);
  let mono: Float32Array;
  if (n === 1) {
    mono = new Float32Array(ch0);
  } else {
    const out = new Float32Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      let sum = 0;
      for (let c = 0; c < n; c++) sum += decoded.getChannelData(c)[i] ?? 0;
      out[i] = sum / n;
    }
    mono = out;
  }

  const srcRate = decoded.sampleRate;
  if (srcRate === 16000) return { array: mono, sampling_rate: 16000 };

  const length = Math.max(1, Math.round(decoded.duration * 16000));
  const offline = new OfflineAudioContext(1, length, 16000);
  const buf = offline.createBuffer(1, mono.length, srcRate);
  buf.copyToChannel(mono, 0);
  const src = offline.createBufferSource();
  src.buffer = buf;
  src.connect(offline.destination);
  src.start(0);
  const rendered = await offline.startRendering();
  return { array: new Float32Array(rendered.getChannelData(0)), sampling_rate: 16000 };
}

function arrayBufferToBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function safeFilename(name: string, fallbackExt = "webm") {
  const base = (name || "").trim();
  const cleaned = base
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (cleaned) return cleaned;
  return `audio-${Date.now()}.${fallbackExt}`;
}

function guessExt(file: File) {
  const fromName = (file.name || "").split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 6) return fromName;
  const t = (file.type || "").toLowerCase();
  if (t.includes("wav")) return "wav";
  if (t.includes("mpeg") || t.includes("mp3")) return "mp3";
  if (t.includes("ogg")) return "ogg";
  if (t.includes("webm")) return "webm";
  if (t.includes("mp4")) return "m4a";
  return "webm";
}

async function trySaveAudioAsset(patientId: string, file: File): Promise<string | null> {
  try {
    const ext = guessExt(file);
    const filename = safeFilename(file.name, ext);
    const b64 = arrayBufferToBase64(await file.arrayBuffer());
    const res = await fetch("/__naju_asset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId,
        filename,
        contentType: file.type || "application/octet-stream",
        dataBase64: b64,
      }),
    });
    if (!res.ok) return null;
    const j = await res.json();
    if (j?.ok && typeof j?.path === "string") return j.path;
  } catch {
    // ignore
  }
  return null;
}
function scoreLookup(value: string | null | undefined, map: Record<string, number>) {
  if (!value) return 0;
  return map[value] ?? 0;
}

type AxisDef = {
  key: string;
  noteKey?: string;
  label: string;
  map: Record<string, number>;
};

const AXES: AxisDef[] = [
  {
    key: "estado_de_animo",
    noteKey: "estado_animo",
    label: "Ánimo",
    map: {
      "Eutímico": 0,
      "Ansioso": 2,
      "Deprimido": 3,
      "Irritable": 2,
      "Expansivo": 2,
    },
  },
  {
    key: "afecto",
    label: "Afecto",
    map: {
      "Congruente": 0,
      "Lábil": 2,
      "Plano": 3,
      "Incongruente": 2,
    },
  },
  {
    key: "orientacion",
    label: "Orientación",
    map: {
      "Orientado": 0,
      "Parcialmente orientado": 2,
      "Desorientado": 3,
    },
  },
  {
    key: "memoria",
    label: "Memoria",
    map: {
      "Conservada": 0,
      "Alterada": 2,
    },
  },
  {
    key: "juicio",
    label: "Juicio",
    map: {
      "Conservado": 0,
      "Parcial": 2,
      "Comprometido": 3,
    },
  },
  {
    key: "riesgo",
    label: "Riesgo",
    map: {
      "Sin riesgo aparente": 0,
      "Sin riesgo": 0,
      "Riesgo bajo": 1,
      "Bajo": 1,
      "Riesgo moderado": 2,
      "Moderado": 2,
      "Riesgo alto": 3,
      "Alto": 3,
    },
  },
];

const PROFILE_COLORS: Record<string, string> = {
  "Ánimo": "#5b7bd5",
  "Afecto": "#b06fdc",
  "Orientación": "#5aa6b2",
  "Memoria": "#c48b5a",
  "Juicio": "#6da878",
  "Riesgo": "#d7665a",
};

function getAxisValues(files: PatientFile[]) {
  const latestByAxis = new Map<string, { value: number; created_at: string }>();
  files
    .filter((f) => f.kind === "exam" || f.kind === "note")
    .forEach((file) => {
      const meta = parseMetaJson(file);
      if (!meta) return;
      AXES.forEach((axis) => {
        const raw = meta[axis.key] ?? (axis.noteKey ? meta[axis.noteKey] : undefined);
        if (!raw) return;
        const value = scoreLookup(raw, axis.map);
        const current = latestByAxis.get(axis.label);
        if (!current || file.created_at > current.created_at) {
          latestByAxis.set(axis.label, { value, created_at: file.created_at });
        }
      });
    });

  const values = AXES.map((axis) => latestByAxis.get(axis.label)?.value ?? 0);
  let dominant: { label: string; value: number } | null = null;
  for (let idx = 0; idx < values.length; idx++) {
    const value = values[idx];
    if (!dominant || value > dominant.value) {
      dominant = { label: AXES[idx].label, value };
    }
  }
  if (!dominant || dominant.value === 0) return { values, dominant: null };
  return { values, dominant };
}

function scoreAxisValues(files: PatientFile[], mode: "aggregate" | "avg3" | "latest") {
  if (files.length === 0) return AXES.map(() => 0);
  const sorted = [...files].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const targetFiles =
    mode === "latest" ? sorted.slice(0, 1) : mode === "avg3" ? sorted.slice(0, 3) : sorted;

  const sums = AXES.map(() => 0);

  targetFiles.forEach((file) => {
    const meta = parseMetaJson(file);
    if (!meta) return;
    AXES.forEach((axis, idx) => {
      const raw = meta[axis.key] ?? (axis.noteKey ? meta[axis.noteKey] : undefined);
      const value = scoreLookup(raw, axis.map);
      sums[idx] += value;
    });
  });

  const totalRecords = targetFiles.length;
  if (!totalRecords) return AXES.map(() => 0);
  return sums.map((sum) => sum / totalRecords);
}

function buildEmotionCounts(files: PatientFile[]) {
  const bucket = new Map<string, number>();
  files.forEach((file) => {
    const meta = parseMetaJson(file);
    if (!meta) return;
    const value = meta.estado_de_animo ?? meta.estado_animo;
    if (!value) return;
    bucket.set(value, (bucket.get(value) ?? 0) + 1);
  });
  const entries = Array.from(bucket.entries()).sort((a, b) => b[1] - a[1]);
  return {
    labels: entries.map(([label]) => label),
    values: entries.map(([, count]) => count),
  };
}

function isoToShortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

function RadarChart({
  labels,
  values,
  compareValues,
  axisSubtitles,
  accent,
  max,
  theme,
}: {
  labels: string[];
  values: number[];
  compareValues?: number[] | null;
  axisSubtitles?: string[];
  accent: string;
  max: number;
  theme?: "light" | "dark";
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevRef = useRef<number[] | null>(null);
  const prevCompareRef = useRef<number[] | null>(null);
  const rafRef = useRef<number | null>(null);
  // Zoom/gestures: we scale the *drawing* (not the DOM element), so the canvas
  // keeps its measured size and always fits the allocated slot.
  const zoomRef = useRef(1);
  const resetZoomRafRef = useRef<number | null>(null);
  const lastMainRef = useRef<number[]>(values);
  const lastCmpRef = useRef<number[] | null>(compareValues ?? null);
  const drawRef = useRef<null | ((main: number[], cmp: number[] | null) => void)>(null);
  const pointersRef = useRef<{ map: Map<number, { x: number; y: number }>; baseDist: number; baseZoom: number }>(
    { map: new Map(), baseDist: 0, baseZoom: 1 }
  );
  const [resizeTick, setResizeTick] = useState(0);

  const dominantColor = useMemo(() => {
    const m = Math.max(...values);
    const idx = values.findIndex((v) => v === m);
    const label = labels[idx] ?? null;
    return (label && PROFILE_COLORS[label]) || accent;
  }, [values, labels, accent]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setResizeTick((t) => t + 1));
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  // Zoom with wheel / pinch (mobile) and reset on mouse-leave.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const st = pointersRef.current;
    const MIN_Z = 0.72;
    const MAX_Z = 2.35;
    const clampZoom = (z: number) => Math.max(MIN_Z, Math.min(MAX_Z, z));

    const stopReset = () => {
      if (resetZoomRafRef.current) cancelAnimationFrame(resetZoomRafRef.current);
      resetZoomRafRef.current = null;
    };

    const redraw = () => {
      const fn = drawRef.current;
      if (!fn) return;
      fn(lastMainRef.current, lastCmpRef.current);
    };

    const animateReset = () => {
      stopReset();
      const from = zoomRef.current;
      if (Math.abs(from - 1) < 0.001) {
        zoomRef.current = 1;
        return;
      }
      const t0 = performance.now();
      const dur = 220;
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - t, 3);
        zoomRef.current = from + (1 - from) * e;
        redraw();
        if (t < 1) resetZoomRafRef.current = requestAnimationFrame(step);
      };
      resetZoomRafRef.current = requestAnimationFrame(step);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stopReset();
      const factor = Math.exp(-e.deltaY * 0.0016);
      zoomRef.current = clampZoom(zoomRef.current * factor);
      redraw();
    };

    const onPointerDown = (e: PointerEvent) => {
      stopReset();
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      st.map.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (st.map.size === 2) {
        const pts = Array.from(st.map.values());
        st.baseDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
        st.baseZoom = zoomRef.current;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!st.map.has(e.pointerId)) return;
      st.map.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (st.map.size === 2) {
        const pts = Array.from(st.map.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
        const next = st.baseZoom * (dist / (st.baseDist || 1));
        zoomRef.current = clampZoom(next);
        redraw();
      }
    };

    const onPointerEnd = (e: PointerEvent) => {
      st.map.delete(e.pointerId);
      if (st.map.size < 2) {
        st.baseDist = 0;
        st.baseZoom = zoomRef.current;
      }
      if (st.map.size === 0) animateReset();
    };

    const onLeave = () => {
      st.map.clear();
      animateReset();
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerEnd);
    canvas.addEventListener("pointercancel", onPointerEnd);
    canvas.addEventListener("mouseleave", onLeave);

    return () => {
      stopReset();
      st.map.clear();
      canvas.removeEventListener("wheel", onWheel as any);
      canvas.removeEventListener("pointerdown", onPointerDown as any);
      canvas.removeEventListener("pointermove", onPointerMove as any);
      canvas.removeEventListener("pointerup", onPointerEnd as any);
      canvas.removeEventListener("pointercancel", onPointerEnd as any);
      canvas.removeEventListener("mouseleave", onLeave as any);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Inicializa dimensiones (se recalculan en cada frame dentro de draw)
    useCanvasSize(canvas);
    const ctx = canvas.getContext("2d")!;

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    const start = performance.now();
    const from = prevRef.current ?? values;
    const to = values;
    const fromCmp = prevCompareRef.current ?? compareValues ?? null;
    const toCmp = compareValues ?? null;

    function easeOutCubic(t: number) {
      return 1 - Math.pow(1 - t, 3);
    }

    function lerp(a: number, b: number, t: number) {
      return a + (b - a) * t;
    }

    function readVar(name: string, fallback: string) {
      try {
        const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return v || fallback;
      } catch {
        return fallback;
      }
    }

    const grid = readVar("--border", "rgba(199,164,90,0.25)");
    const axis = readVar("--muted2", "rgba(120,120,120,0.55)");
    const text = readVar("--text", "#2b241d");
    const muted = readVar("--muted", "#6b5f55");

    function draw(main: number[], cmp: number[] | null, alpha = 1) {
      const size = useCanvasSize(canvas);
      if (!size) return;
      const { width, height, dpr } = size;
      ctx.clearRect(0, 0, width, height);

      // Fondo suave dentro del canvas (se adapta al tema por alpha)
      ctx.save();
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = text;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      const cx = width / 2;
      const cy = height / 2;

      // Fuente de labels y padding dinámico (evita que los textos se corten
      // cuando el canvas se hace pequeño o al cambiar de tema).
      const N = labels.length;
      const labelPx = Math.round(
        Math.max(10 * dpr, Math.min(13 * dpr, Math.min(width, height) / 28))
      );
      const subLabelPx = Math.max(9 * dpr, Math.round(labelPx * 0.82));
      const shortText = (text: string, maxChars = 34) => {
        if (!text) return "";
        return text.length > maxChars ? `${text.slice(0, Math.max(1, maxChars - 1))}…` : text;
      };
      ctx.save();
      let maxLabelW = 0;
      for (let i = 0; i < N; i++) {
        const t = shortText(labels[i] ?? "", 18);
        const sub = shortText(axisSubtitles?.[i] ?? "", 28);
        ctx.font = `${labelPx}px ui-sans-serif, system-ui`;
        const tw = ctx.measureText(t).width;
        ctx.font = `${subLabelPx}px ui-sans-serif, system-ui`;
        const sw = sub ? ctx.measureText(sub).width : 0;
        maxLabelW = Math.max(maxLabelW, tw, sw);
      }
      ctx.restore();
      const basePad = Math.max(26 * dpr, Math.min(width, height) * 0.12);
      const labelPad = maxLabelW / 2 + 30 * dpr;
      // Cap de padding para que el radar no se “encoja” demasiado por textos largos.
      const padCap = Math.min(width, height) * 0.22;
      const pad = Math.max(basePad, Math.min(labelPad, padCap));
      const radius = Math.max(6 * dpr, Math.min(width, height) / 2 - pad);
      const rings = 5;

      // Zoom drawing around the center (keeps canvas size intact).
      const z = zoomRef.current;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(z, z);
      ctx.translate(-cx, -cy);

      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1.2 * dpr;
      for (let r = 1; r <= rings; r++) {
        const rr = (radius * r) / rings;
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          const ang = (Math.PI * 2 * i) / N - Math.PI / 2;
          const x = cx + Math.cos(ang) * rr;
          const y = cy + Math.sin(ang) * rr;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      ctx.strokeStyle = axis;
      ctx.lineWidth = 1.1 * dpr;
      for (let i = 0; i < N; i++) {
        const ang = (Math.PI * 2 * i) / N - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(ang) * radius, cy + Math.sin(ang) * radius);
        ctx.stroke();
      }
      ctx.restore();

      // Labels + subtítulos por arista
      ctx.save();
      for (let i = 0; i < N; i++) {
        const ang = (Math.PI * 2 * i) / N - Math.PI / 2;
        const lx = cx + Math.cos(ang) * (radius + 20 * dpr);
        const ly = cy + Math.sin(ang) * (radius + 20 * dpr);
        const title = shortText(labels[i] ?? "", 18);
        const subtitle = shortText(axisSubtitles?.[i] ?? "", 28);

        ctx.fillStyle = muted;
        ctx.font = `${labelPx}px ui-sans-serif, system-ui`;
        const tw = ctx.measureText(title).width;
        ctx.fillText(title, lx - tw / 2, ly + 3 * dpr);

        if (subtitle) {
          ctx.fillStyle = axis;
          ctx.font = `${subLabelPx}px ui-sans-serif, system-ui`;
          const sw = ctx.measureText(subtitle).width;
          ctx.fillText(subtitle, lx - sw / 2, ly + (3 + subLabelPx + 2 * dpr));
        }
      }
      ctx.restore();

      // Polygon (main)
      const stroke = dominantColor;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const ang = (Math.PI * 2 * i) / N - Math.PI / 2;
        const rr = (radius * Math.max(0, Math.min(max, main[i] ?? 0))) / max;
        const x = cx + Math.cos(ang) * rr;
        const y = cy + Math.sin(ang) * rr;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.save();
      ctx.globalAlpha = alpha * 0.18;
      ctx.fillStyle = stroke;
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2.2 * dpr;
      ctx.shadowColor = stroke;
      ctx.shadowBlur = 14 * dpr;
      ctx.stroke();
      ctx.restore();

      // Compare polygon (dashed)
      if (cmp && cmp.length === N) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.setLineDash([7 * dpr, 6 * dpr]);
        ctx.lineWidth = 2.0 * dpr;
        ctx.strokeStyle = text;
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          const ang = (Math.PI * 2 * i) / N - Math.PI / 2;
          const rr = (radius * Math.max(0, Math.min(max, cmp[i] ?? 0))) / max;
          const x = cx + Math.cos(ang) * rr;
          const y = cy + Math.sin(ang) * rr;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();

      // Keep last values for gesture-based redraws
      lastMainRef.current = main.slice();
      lastCmpRef.current = cmp ? cmp.slice() : null;
    }

    // Allow external (gesture) redraws with the most recent values
    drawRef.current = (main: number[], cmp: number[] | null) => draw(main, cmp, 1);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const duration = prefersReduced ? 1 : 340;

    const tick = (now: number) => {
      const t = duration === 1 ? 1 : Math.min(1, (now - start) / duration);
      const e = easeOutCubic(t);
      const main = values.map((_, i) => lerp(from[i] ?? 0, to[i] ?? 0, e));
      const cmp = toCmp
        ? toCmp.map((_, i) => lerp((fromCmp?.[i] ?? 0), (toCmp?.[i] ?? 0), e))
        : null;
      draw(main, cmp, 1);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    prevRef.current = values;
    prevCompareRef.current = compareValues ?? null;

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [labels, values, compareValues, axisSubtitles, accent, max, dominantColor, theme, resizeTick]);

  return <canvas ref={canvasRef} className="radarCanvas" aria-label="Perfil radial del paciente" />;
}

function useCanvasSize(canvas: HTMLCanvasElement | null) {
  if (!canvas) return null;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  return { width, height, dpr };
}

function buildTopPercentSubtitle(labels: string[], values: number[]) {
  if (!labels.length || !values.length) return "Ítem mayor: --";
  const pairs = labels
    .map((label, idx) => ({ label, value: values[idx] ?? 0 }))
    .filter((item) => item.value > 0);
  if (!pairs.length) return "Ítem mayor: --";

  const sum = pairs.reduce((acc, item) => acc + item.value, 0);
  if (sum <= 0) return "Ítem mayor: --";

  const withPct = pairs.map((item) => ({
    ...item,
    pct: (item.value / sum) * 100,
  }));
  const maxPct = Math.max(...withPct.map((item) => item.pct));
  if (!(maxPct > 0)) return "Ítem mayor: --";

  const topItems = withPct.filter((item) => Math.abs(item.pct - maxPct) < 0.0001);
  return `Ítem mayor: ${topItems
    .map((item) => `${item.label} (${item.pct.toFixed(0)}%)`)
    .join(", ")}`;
}

function ProgressDashes({
  title,
  labels,
  values,
  max,
  colors,
  footer,
  showScale = true,
}: {
  title?: string;
  labels: string[];
  values: number[];
  max: number;
  colors?: Record<string, string>;
  footer?: string;
  showScale?: boolean;
}) {
  const sum = values.reduce((acc, val) => acc + val, 0);
  const subtitle = useMemo(() => buildTopPercentSubtitle(labels, values), [labels, values]);

  return (
    <div className="percent-panel">
      {title ? <h4>{title}</h4> : null}
      {title ? <div className="percent-subtitle">{subtitle}</div> : null}
      {labels.map((label, idx) => {
        const pct = sum === 0 ? 0 : (values[idx] / sum) * 100;
        const barStyle = colors?.[label]
          ? { width: `${pct}%`, background: colors[label] }
          : { width: `${pct}%` };
        return (
          <div key={label} className="percent-row">
            <div className="lbl">{label}</div>
            <div className="pct">{pct.toFixed(0)}%</div>
            <div className="bar">
              <span style={barStyle} />
            </div>
          </div>
        );
      })}
      {footer ? <div className="percentFoot">{footer}</div> : null}
      {!footer && max && showScale ? <div className="percentFoot">Escala: 0–{max}</div> : null}
    </div>
  );
}

function topItemSubtitleFromBucket(bucket: Map<string, number>) {
  const entries = Array.from(bucket.entries()).filter(([, count]) => count > 0);
  if (!entries.length) return "";
  const total = entries.reduce((acc, [, count]) => acc + count, 0);
  if (total <= 0) return "";
  const maxCount = Math.max(...entries.map(([, count]) => count));
  const winners = entries.filter(([, count]) => count === maxCount);
  return winners
    .map(([item, count]) => `${item} (${((count / total) * 100).toFixed(0)}%)`)
    .join(", ");
}

function buildEvidence(files: PatientFile[], labels: string[]) {
  const evidence = labels.map(() => new Map<string, number>());
  files.forEach((file) => {
    const meta = parseMetaJson(file);
    if (!meta) return;
    const values = [
      meta.estado_de_animo ?? meta.estado_animo,
      meta.afecto,
      meta.orientacion,
      meta.memoria,
      meta.juicio,
      meta.riesgo,
    ];
    values.forEach((value, idx) => {
      if (!value) return;
      const bucket = evidence[idx];
      bucket.set(value, (bucket.get(value) ?? 0) + 1);
    });
  });
  return evidence;
}

function TrendCanvas({
  labels,
  files,
  macroValues,
  max,
  theme,
}: {
  labels: string[];
  files: PatientFile[];
  macroValues: number[];
  max: number;
  theme?: "light" | "dark";
}) {
  const treeRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  // Zoom/gestures (same concept as RadarChart): scale the drawing, keep the slot size.
  const zoomRef = useRef(1);
  const resetZoomRafRef = useRef<number | null>(null);
  const lastProgressRef = useRef(1);
  const drawRef = useRef<null | ((progress?: number) => void)>(null);
  const pointersRef = useRef<{ map: Map<number, { x: number; y: number }>; baseDist: number; baseZoom: number }>(
    { map: new Map(), baseDist: 0, baseZoom: 1 }
  );
  const [resizeTick, setResizeTick] = useState(0);
  const [tip, setTip] = useState<null | { x: number; y: number; title: string; sub?: string }>(null);

  useEffect(() => {
    const host = wrapRef.current;
    if (!host || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setResizeTick((t) => t + 1));
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  // Zoom with wheel / pinch (mobile) and reset on mouse-leave.
  useEffect(() => {
    const canvas = treeRef.current;
    if (!canvas) return;

    const st = pointersRef.current;
    const MIN_Z = 0.72;
    const MAX_Z = 2.35;
    const clampZoom = (z: number) => Math.max(MIN_Z, Math.min(MAX_Z, z));

    const stopReset = () => {
      if (resetZoomRafRef.current) cancelAnimationFrame(resetZoomRafRef.current);
      resetZoomRafRef.current = null;
    };

    const redraw = () => {
      const fn = drawRef.current;
      if (!fn) return;
      fn(lastProgressRef.current);
    };

    const animateReset = () => {
      stopReset();
      const from = zoomRef.current;
      if (Math.abs(from - 1) < 0.001) {
        zoomRef.current = 1;
        return;
      }
      const t0 = performance.now();
      const dur = 220;
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / dur);
        const e = 1 - Math.pow(1 - t, 3);
        zoomRef.current = from + (1 - from) * e;
        redraw();
        if (t < 1) resetZoomRafRef.current = requestAnimationFrame(step);
      };
      resetZoomRafRef.current = requestAnimationFrame(step);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      stopReset();
      setTip(null);
      const factor = Math.exp(-e.deltaY * 0.0016);
      zoomRef.current = clampZoom(zoomRef.current * factor);
      redraw();
    };

    const onPointerDown = (e: PointerEvent) => {
      stopReset();
      setTip(null);
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      st.map.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (st.map.size === 2) {
        const pts = Array.from(st.map.values());
        st.baseDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
        st.baseZoom = zoomRef.current;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!st.map.has(e.pointerId)) return;
      st.map.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (st.map.size === 2) {
        const pts = Array.from(st.map.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
        const next = st.baseZoom * (dist / (st.baseDist || 1));
        zoomRef.current = clampZoom(next);
        redraw();
      }
    };

    const onPointerEnd = (e: PointerEvent) => {
      st.map.delete(e.pointerId);
      if (st.map.size < 2) {
        st.baseDist = 0;
        st.baseZoom = zoomRef.current;
      }
      if (st.map.size === 0) animateReset();
    };

    const onLeave = () => {
      st.map.clear();
      setTip(null);
      animateReset();
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerEnd);
    canvas.addEventListener("pointercancel", onPointerEnd);
    canvas.addEventListener("mouseleave", onLeave);

    return () => {
      stopReset();
      st.map.clear();
      canvas.removeEventListener("wheel", onWheel as any);
      canvas.removeEventListener("pointerdown", onPointerDown as any);
      canvas.removeEventListener("pointermove", onPointerMove as any);
      canvas.removeEventListener("pointerup", onPointerEnd as any);
      canvas.removeEventListener("pointercancel", onPointerEnd as any);
      canvas.removeEventListener("mouseleave", onLeave as any);
    };
  }, []);

  useEffect(() => {
    const canvas = treeRef.current;
    if (!canvas) return;
    const size = useCanvasSize(canvas);
    if (!size) return;
    const ctx = canvas.getContext("2d")!;

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

    function readVar(name: string, fallback: string) {
      try {
        const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return v || fallback;
      } catch {
        return fallback;
      }
    }

    // Palette from current theme variables
    const text = readVar("--text", "#2b241d");
    const muted = readVar("--muted", "#6b5f55");
    const panel = readVar("--panel", "rgba(255,255,255,.75)");

    const evidence = buildEvidence(files, labels);
    const sum = macroValues.reduce((acc, v) => acc + v, 0) || 1;
    const weights = macroValues.map((v) => v / sum);

    const { width, height, dpr } = size;

    // Helpers
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

    // Layout (vertical) con márgenes seguros y posiciones adaptativas.
    // Objetivo: que los nodos/labels no se salgan del canvas, incluso en espacios pequeños.
    const mTop = 56 * dpr;
    const mBottom = 40 * dpr;
    const mSide = 38 * dpr;
    const rootR = 18 * dpr;
    const root = { x: width * 0.5, y: mTop + rootR };
    const availH = Math.max(1, height - mTop - mBottom);
    const row1 = clamp(mTop + availH * 0.42, root.y + rootR + 40 * dpr, height - mBottom - 176 * dpr);
    const row2 = clamp(height - mBottom - 24 * dpr, row1 + 112 * dpr, height - 44 * dpr);
    const xs = labels.map((_, i) => mSide + (i * (width - mSide * 2)) / Math.max(1, labels.length - 1));
    function hexToRgb(hex: string) {
      const h = hex.replace("#", "").trim();
      if (h.length === 3) {
        const r = parseInt(h[0] + h[0], 16);
        const g = parseInt(h[1] + h[1], 16);
        const b = parseInt(h[2] + h[2], 16);
        return { r, g, b };
      }
      if (h.length >= 6) {
        const r = parseInt(h.slice(0, 2), 16);
        const g = parseInt(h.slice(2, 4), 16);
        const b = parseInt(h.slice(4, 6), 16);
        return { r, g, b };
      }
      return null;
    }
    function withAlpha(color: string, a: number) {
      // Accept rgba()/rgb()/hex. If we can't parse, return as-is.
      if (color.startsWith("rgba(")) {
        const inner = color.slice(5, -1);
        const parts = inner.split(",").map((s) => s.trim());
        if (parts.length >= 3) return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${a})`;
        return color;
      }
      if (color.startsWith("rgb(")) {
        const inner = color.slice(4, -1);
        const parts = inner.split(",").map((s) => s.trim());
        if (parts.length >= 3) return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${a})`;
        return color;
      }
      const rgb = hexToRgb(color);
      if (!rgb) return color;
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
    }
    function drawEdge(ax: number, ay: number, ar: number, bx: number, by: number, br: number, stroke: string, w: number, alpha: number) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = Math.max(1, w);
      ctx.shadowColor = stroke;
      ctx.shadowBlur = 12 * dpr;
      ctx.beginPath();
      // Bezier curve (vertical)
      const midY = (ay + by) / 2;
      ctx.moveTo(ax, ay + ar * 0.92);
      ctx.bezierCurveTo(ax, midY, bx, midY, bx, by - br * 0.92);
      ctx.stroke();
      ctx.restore();
    }
    function drawNode(params: {
      x: number;
      y: number;
      r: number;
      color: string;
      ringPct: number; // 0..1
      centerText: string;
      label?: string;
      sub?: string;
      labelMode?: "above" | "below";
    }) {
      const { x, y, r, color, ringPct, centerText, label, sub, labelMode } = params;
      const p = clamp(ringPct, 0, 1);

      // Aura
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r + 7 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = withAlpha(color, 0.10 + p * 0.10);
      ctx.fill();
      ctx.restore();

      // Core
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = withAlpha(color, 0.10 + p * 0.18);
      ctx.fill();
      ctx.strokeStyle = withAlpha(color, 0.88);
      ctx.lineWidth = Math.max(1.2, 2.2 * dpr);
      ctx.shadowColor = color;
      ctx.shadowBlur = 16 * dpr;
      ctx.stroke();
      ctx.restore();

      // Intensity ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r + 3.2 * dpr, -Math.PI / 2, -Math.PI / 2 + p * 2 * Math.PI);
      ctx.strokeStyle = withAlpha(color, 0.95);
      ctx.lineWidth = Math.max(1.2, 2.8 * dpr);
      ctx.stroke();
      ctx.restore();

      // Center text
      ctx.save();
      ctx.fillStyle = text;
      ctx.globalAlpha = 0.92;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `800 ${Math.round(11 * dpr)}px ui-sans-serif, system-ui`;
      ctx.fillText(centerText, x, y + 0.5 * dpr);
      ctx.restore();

      // Label + sub text (keep inside canvas)
      if (label) {
        const yBase = labelMode === "above" ? y - (r + 14 * dpr) : y + (r + 18 * dpr);
        const y1 = clamp(yBase, 16 * dpr, height - 26 * dpr);
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = text;
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = `700 ${Math.round(12 * dpr)}px ui-sans-serif, system-ui`;
        ctx.fillText(label, x, y1);
        ctx.restore();

        if (sub) {
          const y2 = clamp(y1 + 16 * dpr, 22 * dpr, height - 10 * dpr);
          ctx.save();
          ctx.globalAlpha = 0.92;
          ctx.fillStyle = muted;
          ctx.textAlign = "center";
          ctx.font = `${Math.round(11 * dpr)}px ui-sans-serif, system-ui`;
          ctx.fillText(sub, x, y2);
          ctx.restore();
        }
      }
    }

    type Hit = { kind: "root" | "macro" | "leaf"; x: number; y: number; r: number; title: string; sub?: string };
    const hits: Hit[] = [];

    function draw(progress: number) {
      ctx.clearRect(0, 0, width, height);

      // Slight tint / depth (uses current theme)
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = panel;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Header (kept inside canvas)
      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = text;
      ctx.textAlign = "left";
      ctx.font = `800 ${Math.round(13 * dpr)}px ui-sans-serif, system-ui`;
      ctx.fillText("Árbol de tendencias", 16 * dpr, 24 * dpr);
      ctx.restore();

      hits.length = 0;

      // Keep last progress for gesture-based redraws
      lastProgressRef.current = progress;

      // Zoom drawing around the center (header/background stay stable)
      const z = zoomRef.current;
      const zx = width / 2;
      const zy = height / 2;
      ctx.save();
      ctx.translate(zx, zy);
      ctx.scale(z, z);
      ctx.translate(-zx, -zy);

      // Root (global)
      const avg = macroValues.length ? macroValues.reduce((a, b) => a + b, 0) / macroValues.length : 0;
      const rootColor = readVar("--profile-accent", "#c7a45a");

      // Root -> macros edges (curved)
      xs.forEach((x, idx) => {
        const w = weights[idx] ?? 0;
        const lw = (1.3 + w * 4.4) * dpr;
        const c = PROFILE_COLORS[labels[idx]] ?? rootColor;
        drawEdge(root.x, root.y, rootR, x, row1, (12 + 8 * w) * dpr, c, lw, 0.55 * progress);
      });

      drawNode({
        x: root.x,
        y: root.y,
        r: rootR,
        color: rootColor,
        ringPct: clamp(avg / Math.max(1, max), 0, 1) * progress,
        centerText: `${avg.toFixed(1)}/${max}`,
        label: "Perfil global",
        labelMode: "above",
      });

      hits.push({ kind: "root", x: root.x, y: root.y, r: rootR, title: "Perfil global", sub: `Promedio: ${avg.toFixed(1)}/${max}` });

      // Macro nodes + leaves
      labels.forEach((label, idx) => {
        const x = xs[idx];
        const w = weights[idx] ?? 0;
        const c = PROFILE_COLORS[label] ?? rootColor;
        const macroR = (12 + 8 * w) * dpr;
        const val = macroValues[idx] ?? 0;

        // Leaves data (top 2)
        const bucket = evidence[idx];
        const total = Array.from(bucket.values()).reduce((a, b) => a + b, 0) || 1;
        const entries = Array.from(bucket.entries()).sort((a, b) => b[1] - a[1]).slice(0, 2);

        // Macro node
        drawNode({
          x,
          y: row1,
          r: macroR,
          color: c,
          ringPct: clamp(val / Math.max(1, max), 0, 1) * progress,
          centerText: `${val.toFixed(1)}`,
          label,
          labelMode: "below",
        });

        hits.push({ kind: "macro", x, y: row1, r: macroR, title: label, sub: `Peso: ${(w * 100).toFixed(0)}% · Valor: ${val.toFixed(1)}/${max}` });

        // Leaves (micro evidence) — se ubican dentro de la "columna" del macro
        // para evitar que se salgan o se monten cuando el canvas se estrecha.
        entries.forEach(([value, count], j) => {
          const pct = clamp(count / total, 0, 1);
          const leafR = (11 + 8 * pct) * dpr;

          const slotLeft = idx === 0 ? mSide : (xs[idx - 1] + x) / 2;
          const slotRight = idx === labels.length - 1 ? width - mSide : (x + xs[idx + 1]) / 2;
          const slotW = Math.max(1, slotRight - slotLeft);
          const baseOff = clamp(slotW * 0.38, 48 * dpr, 110 * dpr);

          const dir = j === 0 ? -1 : 1;
          let lx = x + dir * baseOff;
          // Mantener dentro del slot y respetar radios
          lx = clamp(lx, slotLeft + leafR + 4 * dpr, slotRight - leafR - 4 * dpr);
          // Asegurar separación mínima con el macro
          const minSep = macroR + leafR + 22 * dpr;
          if (Math.abs(lx - x) < minSep) {
            lx = clamp(x + dir * minSep, slotLeft + leafR + 4 * dpr, slotRight - leafR - 4 * dpr);
          }

          const ly = row2 + (j === 0 ? -30 * dpr : 30 * dpr);
          const rawLabel = String(value ?? "");
          // Edge macro -> leaf
          drawEdge(x, row1, macroR, lx, ly, leafR, c, (1.2 + pct * 3.6) * dpr, 0.50 * progress);

          // Leaf node (ring shows pct). El detalle de conteo se deja para tooltip/hover.
          drawNode({
            x: lx,
            y: ly,
            r: leafR,
            color: c,
            ringPct: pct * progress,
            centerText: `${Math.round(pct * 100)}%`,
          });

          hits.push({ kind: "leaf", x: lx, y: ly, r: leafR, title: `${label} · ${rawLabel}`, sub: `Evidencias: ${count} · ${(pct * 100).toFixed(0)}% del total (${total})` });
        });
      });

      ctx.restore();

      // Store hits in dataset for pointer events (lightweight: attach to canvas)
      (canvas as any).__hits = hits;
    }

    // Allow external (gesture) redraws with the most recent progress
    drawRef.current = (progress: number = 1) => draw(progress);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const t0 = performance.now();
    const duration = prefersReduced ? 1 : 320;
    const tick = (now: number) => {
      const t = duration === 1 ? 1 : Math.min(1, (now - t0) / duration);
      const p = 1 - Math.pow(1 - t, 3);
      draw(p);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [labels, files, macroValues, max, theme, resizeTick]);

  function onMove(e: React.MouseEvent) {
    const canvas = treeRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / Math.max(1, rect.width);
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;
    // Invert zoom transform for hit-testing (we zoom the drawing around center).
    const z = Math.max(0.001, zoomRef.current);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const bx = (x - cx) / z + cx;
    const by = (y - cy) / z + cy;
    const hits: any[] = (canvas as any).__hits ?? [];
    const hit = hits.find((h) => {
      const dx = bx - h.x;
      const dy = by - h.y;
      const tol = (8 * scale) / z;
      return Math.hypot(dx, dy) <= h.r + tol;
    });

    if (!hit) {
      setTip(null);
      return;
    }
    const wrapRect = wrap.getBoundingClientRect();
    setTip({
      x: e.clientX - wrapRect.left + 14,
      y: e.clientY - wrapRect.top + 12,
      title: hit.title,
      sub: hit.sub,
    });
  }

  return (
    <div className="trendWrap" ref={wrapRef}>
      <canvas
        ref={treeRef}
        className="trendCanvas treeCanvas"
        aria-label="Árbol de tendencias"
        onMouseMove={onMove}
        onMouseLeave={() => setTip(null)}
      />
      {tip ? (
        <div className="chartTip" style={{ left: tip.x, top: tip.y }}>
          <div className="tTitle">{tip.title}</div>
          {tip.sub ? <div className="tSub">{tip.sub}</div> : null}
        </div>
      ) : null}
    </div>
  );
}

function Modal({
  title,
  subtitle,
  children,
  onClose,
  fullScreen = false,
  closeVariant = "button",
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  fullScreen?: boolean;
  closeVariant?: "button" | "icon";
}) {
  const hasHeaderText = Boolean(title || subtitle);
  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className={`modal ${fullScreen ? "modalFullScreen" : ""}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className={`modalHeader ${!hasHeaderText ? "isCompact" : ""}`}>
          {hasHeaderText ? (
            <div>
              {title ? <h3>{title}</h3> : null}
              {subtitle ? <p>{subtitle}</p> : null}
            </div>
          ) : <div />}
          {closeVariant === "icon" ? (
            <button className="modalCloseX" onClick={onClose} aria-label="Cerrar">✕</button>
          ) : (
            <button className="pillBtn" onClick={onClose} aria-label="Cerrar">Cerrar</button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

function ConsentSignaturePad({
  label,
  value,
  onChange,
  error,
  rootRef,
}: {
  label: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  error?: string;
  rootRef?: (el: HTMLDivElement | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const strokeRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#111";

    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        strokeRef.current = true;
      };
      img.src = value;
    } else {
      strokeRef.current = false;
    }
  }, [value]);

  function getPos(clientX: number, clientY: number, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function startStroke(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawingRef.current = true;
    const p = getPos(clientX, clientY, canvas);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function moveStroke(clientX: number, clientY: number) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const p = getPos(clientX, clientY, canvas);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    strokeRef.current = true;
  }

  function endStroke() {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!strokeRef.current) return;
    onChange(canvas.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    strokeRef.current = false;
    onChange(null);
  }

  return (
    <div className="field" ref={rootRef}>
      <div className="label">{label}</div>
      <div className={`consentSignatureBox ${error ? "err" : ""}`}>
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: 140, display: "block", touchAction: "none", borderRadius: 8 }}
          tabIndex={0}
          onPointerDown={(e) => {
            try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
            startStroke(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => moveStroke(e.clientX, e.clientY)}
          onPointerUp={(e) => {
            try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
            endStroke();
          }}
          onPointerCancel={endStroke}
          onMouseDown={(e) => startStroke(e.clientX, e.clientY)}
          onMouseMove={(e) => moveStroke(e.clientX, e.clientY)}
          onMouseUp={endStroke}
          onMouseLeave={endStroke}
          onTouchStart={(e) => {
            const t = e.touches[0];
            if (t) startStroke(t.clientX, t.clientY);
          }}
          onTouchMove={(e) => {
            const t = e.touches[0];
            if (t) moveStroke(t.clientX, t.clientY);
          }}
          onTouchEnd={endStroke}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span className="miniHelp">{value ? "Firma capturada" : "Dibuja la firma con mouse o táctil"}</span>
        <button type="button" className="pillBtn" onClick={clear}>Limpiar firma</button>
      </div>
      {error ? <div className="consentErrorText">{error}</div> : null}
    </div>
  );
}


function formatConsentDate(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return iso;
  }
}



async function generateConsentPdf(value: ConsentData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 42;
  const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = margin;

  const ensureSpace = (needed = 18) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const addBlock = (text: string, size = 11, bold = false, gapAfter = 8) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    const lineHeight = Math.max(14, size + 4);
    ensureSpace(lines.length * lineHeight + gapAfter);
    doc.text(lines, margin, y);
    y += lines.length * lineHeight + gapAfter;
  };

  const addTitle = (text: string) => addBlock(text, 14, true, 10);
  const addHeading = (text: string) => addBlock(text, 12, true, 6);
  const field = (v?: string | null) => (v && v.trim() ? v.trim() : "________________");

  const solicitudInforme = value.informe_solicitud === "verbal"
    ? "Verbal"
    : value.informe_solicitud === "escrita"
      ? "Escrita"
      : "Ambas";

  const medioEntrega = value.informe_medio === "otro"
    ? `Otro (${field(value.informe_medio_otro)})`
    : value.informe_medio === "impreso"
      ? "Impreso"
      : "PDF";

  addTitle("Consentimiento informado");
  addBlock(`Fecha: ${formatConsentDate(value.created_at)}`, 10, false, 12);
  addBlock("Este consentimiento informado es para el uso del aplicativo durante las citas. Los campos subrayados se completan en el momento de la atención.", 10, false, 12);

  addHeading("1. Identificación del profesional y datos de la atención");
  addBlock(`Psicólogo(a): ${field(value.psicologo_nombre)}`);
  addBlock(`Documento: ${field(value.psicologo_documento)}`);
  addBlock(`T.P: ${field(value.psicologo_tp)}`);
  addBlock(`Correo: ${field(value.psicologo_correo)}`);
  addBlock(`Teléfono: ${field(value.psicologo_telefono)}`);
  addBlock(`Ciudad / Dirección: ${field(value.psicologo_ciudad_direccion)}`);
  addBlock(`Modalidad de atención: ${value.modalidad_atencion === "virtual" ? "Virtual" : "Presencial"}`);
  addBlock(`Lugar / plataforma: ${field(value.lugar_plataforma)}`);

  addHeading("2. Objeto del consentimiento (qué autoriza usted)");
  addBlock("1) El uso de una aplicación como herramienta de apoyo clínico durante su proceso terapéutico.");
  addBlock("2) La grabación de audio de las sesiones (ver sección 5), como parte del funcionamiento de la aplicación.");
  addBlock("3) El tratamiento de sus datos personales, incluidos datos sensibles relacionados con su salud mental, únicamente para fines terapéuticos y administrativos asociados a su atención (ver sección 6).");

  addHeading("3. Descripción del proceso terapéutico (alcance general)");
  addBlock("El proceso consistirá en sesiones acordadas entre usted y el profesional, con objetivos terapéuticos definidos y revisables. Durante las sesiones pueden utilizarse métodos y técnicas propias de la psicología (entrevista clínica, psicoeducación, ejercicios terapéuticos, escalas/cuestionarios, seguimiento y tareas entre sesiones).");
  addBlock("• No es posible garantizar resultados específicos.");
  addBlock("• El progreso depende de múltiples factores, incluyendo su participación y continuidad.");

  addHeading("4. Uso de la aplicación (qué hace y qué NO hace)");
  addBlock("La aplicación se utiliza para registrar y organizar información clínica relevante, aplicar y guardar resultados de cuestionarios/escalas, llevar seguimiento de avances, tareas y evolución, y generar reportes clínicos cuando el paciente lo solicite (ver sección 9).");
  addBlock("La aplicación es de uso exclusivo del profesional. El paciente no tendrá usuario/contraseña de acceso ni administración del sistema. La información no se comparte con terceros sin autorización expresa, salvo excepciones legales (ver sección 7).");

  addHeading("5. Grabación obligatoria de audio (condición para usar la aplicación)");
  addBlock("Se grabará audio de la sesión con fines estrictamente clínicos: fidelidad del registro, apoyo al análisis profesional, y elaboración de informes clínicos cuando usted los solicite.");
  addBlock("Si usted NO ACEPTA la grabación de audio, el profesional continuará su atención por metodología alternativa, y no se realizará registro en la aplicación.");

  addHeading("6. Tratamiento de datos personales y sensibles");
  addBlock("Sus datos serán tratados bajo principios de finalidad, confidencialidad y seguridad, con acceso restringido al profesional tratante. Se conservarán durante el tiempo necesario para la atención y obligaciones legales aplicables.");

  addHeading("7. Confidencialidad y excepciones legales");
  addBlock("La información clínica es privada y reservada. La confidencialidad puede levantarse únicamente en eventos permitidos por la ley (riesgo grave e inminente, requerimiento legal u orden de autoridad competente), limitándose a lo estrictamente necesario.");

  addHeading("8. Derechos del paciente sobre sus datos");
  addBlock(`Canal para ejercer derechos (correo): ${field(value.canal_derechos_correo)}`);
  addBlock(`Canal para ejercer derechos (teléfono): ${field(value.canal_derechos_telefono)}`);

  addHeading("9. Derecho a solicitar informe del proceso terapéutico");
  addBlock(`Solicitud del informe: ${solicitudInforme}`);
  addBlock(`Plazo de entrega (días hábiles): ${field(value.informe_plazo_dias)}`);
  addBlock(`Medio de entrega: ${medioEntrega}`);
  addBlock(`Costo (si aplica): ${field(value.informe_costo)}`);

  addHeading("10. Voluntariedad");
  addBlock("Usted puede aceptar el uso de la aplicación y el audio, o rechazarlo y continuar con metodología alternativa informándolo verbalmente al terapeuta.");

  addHeading("DECLARACIÓN Y FIRMA DE ACEPTACIÓN");
  addBlock(`Yo, ${field(value.paciente_nombre)}, identificado(a) con cédula ${field(value.paciente_documento)}, declaro que he leído y comprendido este consentimiento informado y que pude realizar preguntas.`);
  addBlock(`Decisión (marcar): ${value.decision === "acepto" ? "ACEPTO - Uso de la aplicación + grabación de audio." : "NO ACEPTO - No autorizo audio y no seré registrado(a) en la app."}`);

  const drawSignature = (label: string, dataUrl: string | null) => {
    ensureSpace(90);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(label, margin, y);
    y += 8;
    doc.setDrawColor(180);
    doc.rect(margin, y, 240, 64);
    if (dataUrl) {
      try {
        const fmt = dataUrl.includes("image/jpeg") ? "JPEG" : "PNG";
        doc.addImage(dataUrl, fmt, margin + 6, y + 6, 228, 52, undefined, "FAST");
      } catch {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("No se pudo insertar la firma.", margin + 8, y + 34);
      }
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("Sin firma", margin + 8, y + 34);
    }
    y += 74;
  };

  drawSignature("Firma del paciente", value.firma_paciente_data_url);
  drawSignature("Firma del psicólogo(a)", value.firma_psicologo_data_url);

  addBlock("NAJU · Documento de apoyo para la atención psicológica · Custodia profesional", 9, false, 0);

  const safeName = field(value.paciente_nombre).replace(/[^a-z0-9_-]+/gi, "_").replace(/^_+|_+$/g, "") || "paciente";
  doc.save(`consentimiento_${safeName}_${formatConsentDate(value.created_at).replace(/\//g, "-")}.pdf`);
}

function ConsentInline({
  value,
  onChange,
  placeholder,
  widthCh,
  ariaLabel,
  inputRef,
  hasError,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  widthCh?: number;
  ariaLabel: string;
  inputRef?: (el: HTMLInputElement | null) => void;
  hasError?: boolean;
}) {
  const style: React.CSSProperties = widthCh ? { width: `${widthCh}ch` } : {};
  if (!onChange) {
    return <span className="consentInlineValue" style={style}>{value?.trim() ? value : "________________"}</span>;
  }
  return (
    <input
      ref={inputRef}
      className={`consentInlineInput ${hasError ? "err" : ""}`}
      style={style}
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function ConsentInlineSelect<T extends string>({
  value,
  onChange,
  ariaLabel,
  options,
}: {
  value: T;
  onChange?: (v: T) => void;
  ariaLabel: string;
  options: { value: T; label: string }[];
}) {
  if (!onChange) {
    const found = options.find((o) => o.value === value);
    return <span className="consentInlineValue">{found ? found.label : value}</span>;
  }
  return (
    <select className="consentInlineSelect" value={value} aria-label={ariaLabel} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function ConsentCheck({
  checked,
  label,
  onClick,
}: {
  checked: boolean;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button type="button" className={`consentCheck ${checked ? "on" : ""}`} onClick={onClick} disabled={!onClick}>
      <span className="box" aria-hidden="true">{checked ? "☑" : "☐"}</span>
      <span className="txt">{label}</span>
    </button>
  );
}

function ConsentChoiceCard({
  active,
  title,
  subtitle,
  onClick,
  tone,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  onClick?: () => void;
  tone?: "ok" | "warn";
}) {
  return (
    <button
      type="button"
      className={`consentChoice ${active ? "on" : ""} ${tone === "warn" ? "warn" : ""}`}
      onClick={onClick}
      disabled={!onClick}
    >
      <div className="t">{title}</div>
      <div className="s">{subtitle}</div>
    </button>
  );
}

type ConsentFieldKey =
  | "psicologo_nombre"
  | "psicologo_documento"
  | "psicologo_tp"
  | "psicologo_correo"
  | "psicologo_telefono"
  | "paciente_nombre"
  | "paciente_documento"
  | "decision"
  | "firma_paciente_data_url"
  | "firma_psicologo_data_url";

type ConsentErrors = Partial<Record<ConsentFieldKey, string>>;

function validateConsent(v: ConsentData): ConsentErrors {
  const e: ConsentErrors = {};
  if (!v.psicologo_nombre.trim()) e.psicologo_nombre = "Completa el nombre del profesional.";
  if (!v.psicologo_documento.trim()) e.psicologo_documento = "Completa el documento del profesional.";
  if (!v.psicologo_tp.trim()) e.psicologo_tp = "Completa la T.P del profesional.";
  if (!v.psicologo_correo.trim()) e.psicologo_correo = "Completa el correo del profesional.";
  if (!v.psicologo_telefono.trim()) e.psicologo_telefono = "Completa el teléfono del profesional.";
  if (!v.paciente_nombre.trim()) e.paciente_nombre = "Completa el nombre del paciente.";
  if (!v.paciente_documento.trim()) e.paciente_documento = "Completa el documento del paciente.";
  if (v.decision !== "acepto") e.decision = "Debes seleccionar ACEPTO para continuar.";
  if (!v.firma_paciente_data_url) e.firma_paciente_data_url = "La firma del paciente es obligatoria.";
  if (!v.firma_psicologo_data_url) e.firma_psicologo_data_url = "La firma del profesional es obligatoria.";
  return e;
}

function ConsentDocument({
  value,
  set,
  errors,
  bindField,
}: {
  value: ConsentData;
  set?: <K extends keyof ConsentData>(k: K, v: ConsentData[K]) => void;
  errors?: ConsentErrors;
  bindField?: (name: ConsentFieldKey) => (el: HTMLElement | null) => void;
}) {
  const editable = Boolean(set);

  return (
    <div className="consentPaper" role="document" aria-label="Consentimiento informado">
      <div className="consentMetaDate">{formatConsentDate(value.created_at)}</div>

      <div className="consentLead">
        Este consentimiento informado es para el uso del aplicativo durante las citas. Los campos subrayados se completan en el momento de la atención.
      </div>

      <h3 className="consentH">1. Identificación del profesional y datos de la atención</h3>

      <div className="consentGrid2">
        <div className="consentField" ref={bindField?.("psicologo_nombre")}>
          <div className={`k ${errors?.psicologo_nombre ? "errLabel" : ""}`}>Psicólogo(a) *</div>
          <ConsentInline ariaLabel="Psicólogo(a)" value={value.psicologo_nombre} onChange={editable ? (x) => set!("psicologo_nombre", x) : undefined} placeholder="Nombre completo" hasError={Boolean(errors?.psicologo_nombre)} inputRef={(el) => bindField?.("psicologo_nombre")(el)} />
          {errors?.psicologo_nombre ? <div className="consentErrorText">{errors.psicologo_nombre}</div> : null}
        </div>
        <div className="consentField" ref={bindField?.("psicologo_documento")}>
          <div className={`k ${errors?.psicologo_documento ? "errLabel" : ""}`}>Documento *</div>
          <ConsentInline ariaLabel="Documento profesional" value={value.psicologo_documento} onChange={editable ? (x) => set!("psicologo_documento", x) : undefined} placeholder="C.C / ID" widthCh={18} hasError={Boolean(errors?.psicologo_documento)} inputRef={(el) => bindField?.("psicologo_documento")(el)} />
          {errors?.psicologo_documento ? <div className="consentErrorText">{errors.psicologo_documento}</div> : null}
        </div>
        <div className="consentField" ref={bindField?.("psicologo_tp")}>
          <div className={`k ${errors?.psicologo_tp ? "errLabel" : ""}`}>T.P *</div>
          <ConsentInline ariaLabel="Tarjeta profesional" value={value.psicologo_tp} onChange={editable ? (x) => set!("psicologo_tp", x) : undefined} placeholder="T.P" widthCh={18} hasError={Boolean(errors?.psicologo_tp)} inputRef={(el) => bindField?.("psicologo_tp")(el)} />
          {errors?.psicologo_tp ? <div className="consentErrorText">{errors.psicologo_tp}</div> : null}
        </div>
        <div className="consentField" ref={bindField?.("psicologo_correo")}>
          <div className={`k ${errors?.psicologo_correo ? "errLabel" : ""}`}>Correo *</div>
          <ConsentInline ariaLabel="Correo profesional" value={value.psicologo_correo} onChange={editable ? (x) => set!("psicologo_correo", x) : undefined} placeholder="correo@" hasError={Boolean(errors?.psicologo_correo)} inputRef={(el) => bindField?.("psicologo_correo")(el)} />
          {errors?.psicologo_correo ? <div className="consentErrorText">{errors.psicologo_correo}</div> : null}
        </div>
        <div className="consentField" ref={bindField?.("psicologo_telefono")}>
          <div className={`k ${errors?.psicologo_telefono ? "errLabel" : ""}`}>Teléfono *</div>
          <ConsentInline ariaLabel="Teléfono profesional" value={value.psicologo_telefono} onChange={editable ? (x) => set!("psicologo_telefono", x) : undefined} placeholder="+57" widthCh={16} hasError={Boolean(errors?.psicologo_telefono)} inputRef={(el) => bindField?.("psicologo_telefono")(el)} />
          {errors?.psicologo_telefono ? <div className="consentErrorText">{errors.psicologo_telefono}</div> : null}
        </div>
        <div className="consentField" style={{ gridColumn: "1 / -1" }}>
          <div className="k">Ciudad / Dirección</div>
          <ConsentInline ariaLabel="Ciudad y dirección" value={value.psicologo_ciudad_direccion} onChange={editable ? (x) => set!("psicologo_ciudad_direccion", x) : undefined} placeholder="Ciudad, dirección" />
        </div>
      </div>

      <div className="consentRow">
        <div className="k">Modalidad de atención</div>
        <div className="consentChecks">
          <ConsentCheck checked={value.modalidad_atencion === "presencial"} label="Presencial" onClick={editable ? () => set!("modalidad_atencion", "presencial") : undefined} />
          <ConsentCheck checked={value.modalidad_atencion === "virtual"} label="Virtual" onClick={editable ? () => set!("modalidad_atencion", "virtual") : undefined} />
        </div>
      </div>

      <div className="consentRow">
        <div className="k">Lugar / plataforma</div>
        <div className="v">
          <ConsentInline ariaLabel="Lugar o plataforma" value={value.lugar_plataforma} onChange={editable ? (x) => set!("lugar_plataforma", x) : undefined} placeholder="Consultorio / Meet / Zoom…" />
        </div>
      </div>

      <h3 className="consentH">2. Objeto del consentimiento (qué autoriza usted)</h3>
      <ol className="consentList">
        <li>El uso de una aplicación como herramienta de apoyo clínico durante su proceso terapéutico.</li>
        <li>La grabación de audio de las sesiones (ver sección 5), como parte del funcionamiento de la aplicación.</li>
        <li>El tratamiento de sus datos personales, incluidos datos sensibles relacionados con su salud mental, únicamente para fines terapéuticos y administrativos asociados a su atención (ver sección 6).</li>
      </ol>

      <h3 className="consentH">3. Descripción del proceso terapéutico (alcance general)</h3>
      <div className="consentP">
        El proceso consistirá en sesiones acordadas entre usted y el profesional, con objetivos terapéuticos definidos y revisables. Durante las sesiones pueden utilizarse métodos y técnicas propias de la psicología (entrevista clínica, psicoeducación, ejercicios terapéuticos, escalas/cuestionarios, seguimiento y tareas entre sesiones).
      </div>
      <ul className="consentList">
        <li>No es posible garantizar resultados específicos.</li>
        <li>El progreso depende de múltiples factores, incluyendo su participación y continuidad.</li>
      </ul>

      <h3 className="consentH">4. Uso de la aplicación (qué hace y qué NO hace)</h3>
      <div className="consentP">La aplicación se utiliza para registrar y organizar información clínica relevante, aplicar y guardar resultados de cuestionarios/escalas, llevar seguimiento de avances, tareas y evolución, y generar reportes clínicos cuando el paciente lo solicite (ver sección 9).</div>
      <div className="consentP">La aplicación es de uso exclusivo del profesional. El paciente no tendrá usuario/contraseña de acceso ni administración del sistema. La información no se comparte con terceros sin autorización expresa, salvo excepciones legales (ver sección 7).</div>

      <h3 className="consentH">5. Grabación obligatoria de audio (condición para usar la aplicación)</h3>
      <div className="consentP">Se grabará audio de la sesión con fines estrictamente clínicos: fidelidad del registro, apoyo al análisis profesional, y elaboración de informes clínicos cuando usted los solicite.</div>

      <div className={`consentCallout ${value.decision === "no_acepto" ? "err" : ""}`}>
        Si usted NO ACEPTA la grabación de audio, el profesional continuará su atención por metodología alternativa, y no se realizará registro en la aplicación.
      </div>

      <h3 className="consentH">6. Tratamiento de datos personales y sensibles</h3>
      <div className="consentP">Sus datos serán tratados bajo principios de finalidad, confidencialidad y seguridad, con acceso restringido al profesional tratante. Se conservarán durante el tiempo necesario para la atención y obligaciones legales aplicables.</div>

      <h3 className="consentH">7. Confidencialidad y excepciones legales</h3>
      <div className="consentP">La información clínica es privada y reservada. La confidencialidad puede levantarse únicamente en eventos permitidos por la ley (riesgo grave e inminente, requerimiento legal u orden de autoridad competente), limitándose a lo estrictamente necesario.</div>

      <h3 className="consentH">8. Derechos del paciente sobre sus datos</h3>
      <div className="consentP">Canal para ejercer derechos (correo/teléfono):</div>
      <div className="consentGrid2">
        <div className="consentField">
          <div className="k">Correo</div>
          <ConsentInline ariaLabel="Canal derechos correo" value={value.canal_derechos_correo} onChange={editable ? (x) => set!("canal_derechos_correo", x) : undefined} placeholder="correo@" />
        </div>
        <div className="consentField">
          <div className="k">Teléfono</div>
          <ConsentInline ariaLabel="Canal derechos teléfono" value={value.canal_derechos_telefono} onChange={editable ? (x) => set!("canal_derechos_telefono", x) : undefined} placeholder="+57" widthCh={16} />
        </div>
      </div>

      <h3 className="consentH">9. Derecho a solicitar informe del proceso terapéutico</h3>
      <div className="consentRow">
        <div className="k">Solicitud del informe</div>
        <div className="v">
          <ConsentInlineSelect ariaLabel="Solicitud del informe" value={value.informe_solicitud} onChange={editable ? (x) => set!("informe_solicitud", x) : undefined} options={[{ value: "verbal", label: "Verbal" }, { value: "escrita", label: "Escrita" }, { value: "ambas", label: "Ambas" }]} />
        </div>
      </div>
      <div className="consentGrid2">
        <div className="consentField">
          <div className="k">Plazo de entrega (días hábiles)</div>
          <ConsentInline ariaLabel="Plazo informe" value={value.informe_plazo_dias} onChange={editable ? (x) => set!("informe_plazo_dias", x) : undefined} placeholder="Ej: 5" widthCh={8} />
        </div>
      </div>
      {value.informe_medio === "otro" ? (
        <div className="consentRow">
          <div className="k">Medio (otro)</div>
          <div className="v">
            <ConsentInline ariaLabel="Medio otro" value={value.informe_medio_otro} onChange={editable ? (x) => set!("informe_medio_otro", x) : undefined} placeholder="Describe el medio" />
          </div>
        </div>
      ) : null}
      <div className="consentRow">
        <div className="k">Costo (si aplica)</div>
        <div className="v">
          <ConsentInline ariaLabel="Costo informe" value={value.informe_costo} onChange={editable ? (x) => set!("informe_costo", x) : undefined} placeholder="$" widthCh={14} />
        </div>
      </div>

      <h3 className="consentH">10. Voluntariedad</h3>
      <div className="consentP">Usted puede aceptar el uso de la aplicación y el audio, o rechazarlo y continuar con metodología alternativa informándolo verbalmente al terapeuta.</div>

      <div className="consentFoot">NAJU · Documento de apoyo para la atención psicológica · Custodia profesional</div>
    </div>
  );
}

function ConsentIntroModal({ onClose, onContinue }: { onClose: () => void; onContinue: () => void }) {
  return (
    <Modal title="Antes de crear el paciente" onClose={onClose}>
      <div className="modalBody">
        <div className="consentIntroBox">
          Para registrar un paciente en NAJU, es obligatorio aceptar el consentimiento informado. Este consentimiento aplica al uso del aplicativo durante las citas.
        </div>
        <div className="consentIntroActions">
          <button className="pillBtn primary" onClick={onContinue}>Continuar</button>
          <button type="button" className="consentLinkBtn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </Modal>
  );
}

function ConsentModal({
  onClose,
  onAccept,
  professionalProfile,
}: {
  onClose: () => void;
  onAccept: (consent: ConsentData) => void;
  professionalProfile: ProfessionalProfile;
}) {
  const [v, setV] = useState<ConsentData>(() => createConsentDraft(professionalProfile));
  const [errors, setErrors] = useState<ConsentErrors>({});
  const [openSection, setOpenSection] = useState<"pro" | "pac">("pro");
  const fieldRefs = useRef<Partial<Record<ConsentFieldKey, HTMLElement | null>>>({});

  function set<K extends keyof ConsentData>(k: K, value: ConsentData[K]) {
    setV((p) => ({ ...p, [k]: value }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  }

  function bindField(name: ConsentFieldKey) {
    return (el: HTMLElement | null) => {
      fieldRefs.current[name] = el;
    };
  }

  function scrollToField(name: ConsentFieldKey) {
    const el = fieldRefs.current[name];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    if ("focus" in el && typeof (el as any).focus === "function") {
      try { (el as any).focus(); } catch { /* ignore */ }
    }
  }

  function submitConsent() {
    const nextErrors = validateConsent(v);
    setErrors(nextErrors);
    const first = Object.keys(nextErrors)[0] as ConsentFieldKey | undefined;
    if (first) {
      setOpenSection(["psicologo_nombre", "psicologo_documento", "psicologo_tp", "psicologo_correo", "psicologo_telefono"].includes(first) ? "pro" : "pac");
      setTimeout(() => scrollToField(first), 40);
      return;
    }
    onAccept(v);
  }

  return (
    <div className="consentFullscreenBackdrop" onMouseDown={onClose}>
      <div className="consentFullscreen" onMouseDown={(e) => e.stopPropagation()}>
        <div className="consentFullscreenHead">
          <h2 className="consentMainTitle">Consentimiento informado</h2>
          <button className="consentCloseX" onClick={onClose} aria-label="Cerrar consentimiento">✕</button>
        </div>

        <div className="consentTopOption">
          <button
            type="button"
            className="pillBtn primary"
            onClick={async () => {
              try {
                await generateConsentPdf(v);
              } catch (e) {
                alert(`No se pudo generar el PDF: ${errMsg(e)}`);
              }
            }}
          >
            Generar PDF
          </button>
        </div>

        <div className="consentAccordionWrap">
          <div className="consentAccordion">
            <button className="consentAccordionHead" onClick={() => setOpenSection("pro")}>Datos del profesional</button>
            {openSection === "pro" ? <ConsentDocument value={v} set={set} errors={errors} bindField={bindField} /> : null}
          </div>

          <div className="consentAccordion">
            <button className="consentAccordionHead" onClick={() => setOpenSection("pac")}>Datos del paciente</button>
            {openSection === "pac" ? (
              <div className="consentPaper">
                <h3 className="consentH">DECLARACIÓN Y FIRMA DE ACEPTACIÓN</h3>
                <div className="consentP" ref={bindField("paciente_nombre")}>
                  Yo, <ConsentInline ariaLabel="Nombre del paciente" value={v.paciente_nombre} onChange={(x) => set("paciente_nombre", x)} placeholder="Nombre completo" widthCh={28} hasError={Boolean(errors.paciente_nombre)} inputRef={(el) => bindField("paciente_nombre")(el)} />, identificado(a) con cédula <ConsentInline ariaLabel="Documento del paciente" value={v.paciente_documento} onChange={(x) => set("paciente_documento", x)} placeholder="C.C" widthCh={18} hasError={Boolean(errors.paciente_documento)} inputRef={(el) => bindField("paciente_documento")(el)} />, declaro que he leído y comprendido este consentimiento informado y que pude realizar preguntas.
                </div>
                {errors.paciente_nombre ? <div className="consentErrorText">{errors.paciente_nombre}</div> : null}
                {errors.paciente_documento ? <div className="consentErrorText">{errors.paciente_documento}</div> : null}

                <div className="consentP"><b>Decisión (marcar):</b></div>
                <div className="consentChoiceGrid" style={{ marginTop: 6 }} ref={bindField("decision")}>
                  <ConsentChoiceCard active={v.decision === "acepto"} title="ACEPTO" subtitle="Uso de la aplicación + grabación de audio." onClick={() => set("decision", "acepto")} />
                  <ConsentChoiceCard active={v.decision === "no_acepto"} title="NO ACEPTO" subtitle="No autorizo audio y no seré registrado(a) en la app." onClick={() => set("decision", "no_acepto")} tone="warn" />
                </div>
                {errors.decision ? <div className="consentErrorText">{errors.decision}</div> : null}

                <div className="consentSignGrid">
                  <div>
                    <div className={`consentSignLabel ${errors.firma_paciente_data_url ? "errLabel" : ""}`}>Firma del paciente *</div>
                    <ConsentSignaturePad label="" value={v.firma_paciente_data_url} onChange={(x) => set("firma_paciente_data_url", x)} error={errors.firma_paciente_data_url} rootRef={bindField("firma_paciente_data_url")} />
                  </div>
                  <div>
                    <div className={`consentSignLabel ${errors.firma_psicologo_data_url ? "errLabel" : ""}`}>Firma del psicólogo(a) *</div>
                    <ConsentSignaturePad label="" value={v.firma_psicologo_data_url} onChange={(x) => set("firma_psicologo_data_url", x)} error={errors.firma_psicologo_data_url} rootRef={bindField("firma_psicologo_data_url")} />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="consentFooterCta">
          <button className="pillBtn primary" onClick={submitConsent}>Guardar y continuar</button>
        </div>
      </div>
    </div>
  );
}

function InitialAssessmentModal({
  patient,
  file,
  onClose,
  onSave,
}: {
  patient: Patient;
  file: PatientFile | null;
  onClose: () => void;
  onSave: (payload: { date: string; time: string; body: string }) => Promise<void>;
}) {
  const parsed = file ? parseMetaJson(file) : null;
  const now = new Date();
  const defaultDate = now.toLocaleDateString("es-CO");
  const defaultTime = now.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  const [date, setDate] = useState<string>(typeof parsed?.valoracion_fecha === "string" ? parsed.valoracion_fecha : defaultDate);
  const [time, setTime] = useState<string>(typeof parsed?.valoracion_hora === "string" ? parsed.valoracion_hora : defaultTime);
  const [body, setBody] = useState<string>(typeof parsed?.valoracion_cuerpo === "string" ? parsed.valoracion_cuerpo : buildInitialAssessmentBodyTemplate());
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await onSave({ date: date.trim() || defaultDate, time: time.trim() || defaultTime, body });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose} fullScreen closeVariant="icon">
      <div className="modalBody" style={{ gap: 14 }}>
        <div className="card initialAssessmentHero">
          <div className="initialAssessmentName">{patient.name.toUpperCase()}</div>
          <div className="initialAssessmentDateRow">
            <label className="field" style={{ margin: 0 }}>
              <div className="label">Fecha</div>
              <input className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="field" style={{ margin: 0 }}>
              <div className="label">Hora</div>
              <input className="input" value={time} onChange={(e) => setTime(e.target.value)} />
            </label>
          </div>
        </div>

        <label className="field" style={{ margin: 0 }}>
          <div className="label">Valoración inicial (editable)</div>
          <textarea className="textarea" style={{ minHeight: "55vh", lineHeight: 1.55 }} value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
      </div>
      <div className="modalFooter">
        <button className="pillBtn" onClick={onClose} disabled={busy}>Cancelar</button>
        <button className="pillBtn primary pulseGlow" onClick={submit} disabled={busy}>{busy ? "Guardando..." : "Guardar valoración inicial"}</button>
      </div>
    </Modal>
  );
}

function PatientForm({
  initial,
  onSave,
  onCancel,
  saveLabel,
  extraRight,
}: {
  initial: PatientInput;
  onSave: (v: PatientInput) => Promise<void>;
  onCancel: () => void;
  saveLabel: string;
  extraRight?: React.ReactNode;
}) {
  const [v, setV] = useState<PatientInput>(initial);
  const [busy, setBusy] = useState(false);
  const antecedentsText = v.personal_history ?? "";
  function set<K extends keyof PatientInput>(k: K, value: PatientInput[K]) {
    setV((p) => ({ ...p, [k]: value }));
  }


  async function submit() {
    if (!v.name?.trim()) return;
    setBusy(true);
    try {
      await onSave({
        name: v.name.trim(),
        doc_type: v.doc_type ?? null,
        doc_number: v.doc_number ?? null,
        insurer: v.insurer ?? null,
        birth_date: v.birth_date ?? null,
        sex: v.sex ?? null,
        phone: v.phone ?? null,
        email: v.email ?? null,
        address: v.address ?? null,
        emergency_contact: v.emergency_contact ?? null,
        notes: null,
        personal_history: antecedentsText.trim() || null,
        antecedents_tags: v.antecedents_tags ?? null,
        antecedents_reviewed_at: v.antecedents_reviewed_at ?? null,
        personal_social_situation: null,
        medical_psych_history: null,
        family_history: null,
        work_academic_situation: null,
        judicial_situation: null,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="modalBody">
        <div className="formGrid">
          <div className="field">
            <div className="label">Nombre *</div>
            <input
              className="input"
              value={v.name ?? ""}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Ej: Luis Pérez"
            />
          </div>

          <div className="field">
            <div className="label">Aseguradora / EPS</div>
            <input
              className="input"
              value={v.insurer ?? ""}
              onChange={(e) => set("insurer", e.target.value)}
              placeholder="Ej: Sura"
            />
          </div>

          <div className="field">
            <div className="label">Tipo de documento</div>
            <select
              className="select"
              value={v.doc_type ?? ""}
              onChange={(e) => set("doc_type", e.target.value || null)}
            >
              <option value="">—</option>
              <option value="CC">CC</option>
              <option value="TI">TI</option>
              <option value="CE">CE</option>
              <option value="PP">Pasaporte</option>
            </select>
          </div>

          <div className="field">
            <div className="label">Número de documento</div>
            <input
              className="input"
              value={v.doc_number ?? ""}
              onChange={(e) => set("doc_number", e.target.value)}
              placeholder="Ej: xxxxxxx"
            />
          </div>

          <div className="field">
            <div className="label">Fecha de nacimiento</div>
            <input
              type="date"
              className="input"
              value={v.birth_date ?? ""}
              onChange={(e) => set("birth_date", e.target.value || null)}
            />
          </div>

          <div className="field">
            <div className="label">Sexo</div>
            <select
              className="select"
              value={v.sex ?? ""}
              onChange={(e) => set("sex", e.target.value || null)}
            >
              <option value="">—</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="O">Otro</option>
            </select>
          </div>

          <div className="field">
            <div className="label">Teléfono</div>
            <input
              className="input"
              value={v.phone ?? ""}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="Ej: +57 3xx xxx xxxx"
            />
          </div>

          <div className="field">
            <div className="label">Email</div>
            <input
              className="input"
              value={v.email ?? ""}
              onChange={(e) => set("email", e.target.value)}
              placeholder="Ej: correo@dominio.com"
            />
          </div>

          <div className="field">
            <div className="label">Dirección</div>
            <input
              className="input"
              value={v.address ?? ""}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Ej: Cali, Valle"
            />
          </div>

          <div className="field">
            <div className="label">Contacto de emergencia</div>
            <input
              className="input"
              value={v.emergency_contact ?? ""}
              onChange={(e) => set("emergency_contact", e.target.value)}
              placeholder="Ej: María (Madre) - 300..."
            />
          </div>
        </div>

      </div>
      <div className="modalFooter">
        <button className="pillBtn" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
        {extraRight}
        <button className="pillBtn primary" onClick={submit} disabled={busy || !v.name?.trim()}>
          {busy ? "Guardando..." : saveLabel}
        </button>
      </div>
    </>
  );
}

function MentalExamModal({
  patient,
  consultaTipoDefault,
  onClose,
  onCreated,
}: {
  patient: Patient;
  consultaTipoDefault: ConsultaTipo;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  const [fecha, setFecha] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [motivo, setMotivo] = useState("");
  const [lugarEntrevista, setLugarEntrevista] = useState("");
  const [acompanante, setAcompanante] = useState("");
  const [edadAparente, setEdadAparente] = useState("");
  const [contextura, setContextura] = useState("");
  const [etnia, setEtnia] = useState("");
  const [estaturaEdad, setEstaturaEdad] = useState("");
  const [arregloPersonal, setArregloPersonal] = useState("Adecuado");

  const [contactoVisual, setContactoVisual] = useState("Intermitente");
  const [contactoVerbal, setContactoVerbal] = useState("Normal");
  const [actitud, setActitud] = useState("Colaboradora");

  const [actividadCuant, setActividadCuant] = useState("Euquinético");
  const [tonoMuscular, setTonoMuscular] = useState("Normotónico");
  const [posicion, setPosicion] = useState("Postura habitual");
  const [movimientos, setMovimientos] = useState("Adaptativos");

  const [lenguaje, setLenguaje] = useState("Normal");
  const [animo, setAnimo] = useState("Eutímico");
  const [afecto, setAfecto] = useState("Congruente");
  const [cursoPens, setCursoPens] = useState("Lógico/Coherente");
  const [nexosAsociativos, setNexosAsociativos] = useState("Coherentes");
  const [relevanciaPens, setRelevanciaPens] = useState("Relevante");
  const [contPens, setContPens] = useState("");
  const [percepcion, setPercepcion] = useState("Sin alteraciones");
  const [orientacion, setOrientacion] = useState("Orientado");
  const [sensorio, setSensorio] = useState("Alerta");
  const [atencion, setAtencion] = useState("Conservada");
  const [memoria, setMemoria] = useState("Conservada");
  const [calculo, setCalculo] = useState("Eucalculia");
  const [abstraccion, setAbstraccion] = useState("Abstrae");
  const [juicio, setJuicio] = useState("Conservado");
  const [insight, setInsight] = useState("Presente");
  const [riesgo, setRiesgo] = useState("Sin riesgo aparente");
  const [obs, setObs] = useState("");
  const [consultaTipo, setConsultaTipo] = useState<ConsultaTipo>(consultaTipoDefault);

  async function create() {
    setBusy(true);
    try {
      const payload = {
        type: "examen_mental",
        fecha,
        motivo_consulta: motivo || null,

        lugar_entrevista: lugarEntrevista || null,
        acompanante: acompanante || null,
        edad_aparente: edadAparente || null,
        contextura_fisica: contextura || null,
        caracteristicas_etnicas: etnia || null,
        estatura_para_la_edad: estaturaEdad || null,
        arreglo_personal: arregloPersonal,

        contacto_visual: contactoVisual,
        contacto_verbal: contactoVerbal,
        actitud: actitud,

        actividad_motora_cuantitativa: actividadCuant,
        tono_muscular: tonoMuscular,
        posicion: posicion,
        movimientos: movimientos,

        lenguaje,
        estado_de_animo: animo,
        afecto,

        pensamiento_curso: cursoPens,
        pensamiento_nexos_asociativos: nexosAsociativos,
        pensamiento_relevancia: relevanciaPens,
        pensamiento_contenido: contPens || null,

        percepcion,
        orientacion,
        sensorio,
        atencion,
        memoria,
        calculo,
        abstraccion,
        juicio,
        insight,
        riesgo,
        observaciones: obs || null,
        consulta_tipo: consultaTipo,

        patient_snapshot: {
          id: patient.id,
          name: patient.name,
          doc_type: patient.doc_type,
          doc_number: patient.doc_number,
        },
      };

      await createMentalExam(patient.id, payload);
      await onCreated();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      fullScreen
      closeVariant="icon"
    >
      <div className="modalBody">
        <div className="formGrid">
          <div className="field">
            <div className="label">Fecha</div>
            <input type="date" className="input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>

          <div className="field">
            <div className="label">Motivo de consulta</div>
            <input
              className="input"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: ansiedad, insomnio, duelo…"
            />
          </div>

          <div className="field">
            <div className="label">Tipo de consulta</div>
            <select className="select" value={consultaTipo} onChange={(e) => setConsultaTipo(normalizeConsultaTipo(e.target.value))}>
              <option value="presencial">Presencial</option>
              <option value="virtual">Virtual</option>
            </select>
          </div>
        </div>

        <div className="card">
          <div className="formGrid">
            <div className="field">
              <div className="label">Lugar de la entrevista</div>
              <input
                className="input"
                value={lugarEntrevista}
                onChange={(e) => setLugarEntrevista(e.target.value)}
                placeholder="Consultorio, domicilio, hospital..."
              />
            </div>

            <div className="field">
              <div className="label">Acompañante</div>
              <input
                className="input"
                value={acompanante}
                onChange={(e) => setAcompanante(e.target.value)}
                placeholder="Ej: Familiar, amigo, ninguno"
              />
            </div>

            <div className="field">
              <div className="label">Edad aparente</div>
              <input
                className="input"
                value={edadAparente}
                onChange={(e) => setEdadAparente(e.target.value)}
                placeholder="Ej: acorde a la edad, menor..."
              />
            </div>

            <div className="field">
              <div className="label">Contextura física</div>
              <input
                className="input"
                value={contextura}
                onChange={(e) => setContextura(e.target.value)}
                placeholder="Ej: delgado, atlético..."
              />
            </div>

            <div className="field">
              <div className="label">Características étnicas</div>
              <input
                className="input"
                value={etnia}
                onChange={(e) => setEtnia(e.target.value)}
                placeholder="Describe si es relevante"
              />
            </div>

            <div className="field">
              <div className="label">Estatura para la edad</div>
              <input
                className="input"
                value={estaturaEdad}
                onChange={(e) => setEstaturaEdad(e.target.value)}
                placeholder="Ej: acorde, baja, alta"
              />
            </div>

            <div className="field">
              <div className="label">Arreglo personal</div>
              <select className="select" value={arregloPersonal} onChange={(e) => setArregloPersonal(e.target.value)}>
                <option>Adecuado</option>
                <option>Descuidado</option>
                <option>Hipercuidado</option>
                <option>Desaliñado</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="formGrid">
            <div className="field">
              <div className="label">Contacto visual</div>
              <select className="select" value={contactoVisual} onChange={(e) => setContactoVisual(e.target.value)}>
                <option>Intermitente</option>
                <option>Sostenido</option>
                <option>Mirada perpleja</option>
                <option>Evitativo</option>
              </select>
            </div>

            <div className="field">
              <div className="label">Contacto verbal</div>
              <select className="select" value={contactoVerbal} onChange={(e) => setContactoVerbal(e.target.value)}>
                <option>Normal</option>
                <option>Escaso</option>
                <option>Esporádico</option>
                <option>Abundante</option>
              </select>
            </div>

            <div className="field">
              <div className="label">Actitud hacia el examinador</div>
              <select className="select" value={actitud} onChange={(e) => setActitud(e.target.value)}>
                <option>Colaboradora</option>
                <option>Hostil</option>
                <option>Indiferente</option>
                <option>Desdeñoso</option>
                <option>Evasivo</option>
                <option>Altivo</option>
                <option>Hiperfamiliar</option>
                <option>Intrusivo</option>
                <option>Suspicaz</option>
                <option>Congraciante</option>
                <option>Seductora</option>
                <option>Hipersexual</option>
              </select>
            </div>

            <div className="field">
              <div className="label">Lenguaje</div>
              <select className="select" value={lenguaje} onChange={(e) => setLenguaje(e.target.value)}>
                <option>Normal</option>
                <option>Hipoproductivo</option>
                <option>Taquifemia</option>
                <option>Incoherente</option>
              </select>
            </div>

            <div className="field">
              <div className="label">Estado de ánimo</div>
              <select className="select" value={animo} onChange={(e) => setAnimo(e.target.value)}>
                <option>Eutímico</option>
                <option>Ansioso</option>
                <option>Deprimido</option>
                <option>Irritable</option>
                <option>Expansivo</option>
              </select>
            </div>

            <div className="field">
              <div className="label">Afecto</div>
              <select className="select" value={afecto} onChange={(e) => setAfecto(e.target.value)}>
                <option>Congruente</option>
                <option>Lábil</option>
                <option>Aplanado</option>
                <option>Inapropiado</option>
                <option>Ambivalente</option>
                <option>Incongruente</option>
              </select>
            </div>

            <div className="field">
              <div className="label">Curso del pensamiento</div>
              <select className="select" value={cursoPens} onChange={(e) => setCursoPens(e.target.value)}>
                <option>Lógico/Coherente</option>
                <option>Tangencial</option>
                <option>Disgregado</option>
                <option>Fuga de ideas</option>
              </select>
            </div>

            <div className="field">
              <div className="label">Nexos asociativos</div>
              <select className="select" value={nexosAsociativos} onChange={(e) => setNexosAsociativos(e.target.value)}>
                <option>Coherentes</option>
                <option>Incoherentes</option>
                <option>Asíndesis</option>
              </select>
            </div>

            <div className="field">
              <div className="label">Relevancia</div>
              <select className="select" value={relevanciaPens} onChange={(e) => setRelevanciaPens(e.target.value)}>
                <option>Relevante</option>
                <option>Irrelevante</option>
                <option>Circunstancial</option>
                <option>Tangencial</option>
              </select>
            </div>

            <div className="field">
              <div className="label">Percepción</div>
              <select className="select" value={percepcion} onChange={(e) => setPercepcion(e.target.value)}>
                <option>Sin alteraciones</option>
                <option>Alucinaciones</option>
                <option>Ilusiones</option>
                <option>Despersonalización</option>
                <option>Pseudoalucinaciones</option>
                <option>Alucinosis</option>
              </select>
            </div>
          </div>

          <div className="field" style={{ marginTop: 10 }}>
            <div className="label">Contenido del pensamiento</div>
            <textarea
              className="textarea"
              value={contPens}
              onChange={(e) => setContPens(e.target.value)}
              placeholder="Ideas obsesivas, rumiación, delirios, preocupación, etc…"
            />
          </div>
        </div>

        <div className="card">
          <div className="formGrid">
            <div className="field">
              <div className="label">Orientación</div>
              <select className="select" value={orientacion} onChange={(e) => setOrientacion(e.target.value)}>
                <option>Orientado</option>
                <option>Parcialmente orientado</option>
                <option>Desorientado</option>
              </select>
            </div>

            <div className="field">
              <div className="label">Sensorio</div>
              <select className="select" value={sensorio} onChange={(e) => setSensorio(e.target.value)}>
                <option>Alerta</option>
                <option>Somnoliento</option>
                <option>Estuporoso</option>
                <option>Coma</option>
              </select>
            </div>

            <div className="field">
              <div className="label">Atención</div>
              <select className="select" value={atencion} onChange={(e) => setAtencion(e.target.value)}>
                <option>Conservada</option>
                <option>Disminuida</option>
                <option>Fluctuante</option>
              </select>
            </div>

            <div className="field">
              <div className="label">Memoria</div>
              <select className="select" value={memoria} onChange={(e) => setMemoria(e.target.value)}>
                <option>Conservada</option>
                <option>Alterada</option>
              </select>
            </div>

            <div className="field">
              <div className="label">Cálculo</div>
              <select className="select" value={calculo} onChange={(e) => setCalculo(e.target.value)}>
                <option>Eucalculia</option>
                <option>Discalculia</option>
              </select>
            </div>

            <div className="field">
              <div className="label">Abstracción</div>
              <select className="select" value={abstraccion} onChange={(e) => setAbstraccion(e.target.value)}>
                <option>Abstrae</option>
                <option>Concreto</option>
              </select>
            </div>

            <div className="field">
              <div className="label">Juicio</div>
              <select className="select" value={juicio} onChange={(e) => setJuicio(e.target.value)}>
                <option>Conservado</option>
                <option>Parcial</option>
                <option>Comprometido</option>
              </select>
            </div>

            <div className="field">
              <div className="label">Insight</div>
              <select className="select" value={insight} onChange={(e) => setInsight(e.target.value)}>
                <option>Presente</option>
                <option>Parcial</option>
                <option>Ausente</option>
              </select>
            </div>

            <div className="field">
              <div className="label">Riesgo</div>
              <select className="select" value={riesgo} onChange={(e) => setRiesgo(e.target.value)}>
                <option>Sin riesgo aparente</option>
                <option>Riesgo bajo</option>
                <option>Riesgo moderado</option>
                <option>Riesgo alto</option>
              </select>
            </div>
          </div>

          <div className="field" style={{ marginTop: 10 }}>
            <div className="label">Observaciones</div>
            <textarea
              className="textarea"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Observaciones clínicas adicionales (sensorio, juicio, riesgo, etc.)…"
            />
          </div>
        </div>

        <div className="card">
          <div className="formGrid">
            <div className="field">
              <div className="label">Índice de actividad motora (cuantitativo)</div>
              <select className="select" value={actividadCuant} onChange={(e) => setActividadCuant(e.target.value)}>
                <option>Euquinético</option>
                <option>Hiperquinético</option>
                <option>Hipoquinético</option>
              </select>
            </div>

            <div className="field">
              <div className="label">Tono muscular</div>
              <select className="select" value={tonoMuscular} onChange={(e) => setTonoMuscular(e.target.value)}>
                <option>Normotónico</option>
                <option>Hipertónico</option>
                <option>Hipotónico</option>
              </select>
            </div>

            <div className="field">
              <div className="label">Posición / postura</div>
              <select className="select" value={posicion} onChange={(e) => setPosicion(e.target.value)}>
                <option>Postura habitual</option>
                <option>Posturas estereotipadas</option>
                <option>Inhibida</option>
              </select>
            </div>

            <div className="field">
              <div className="label">Movimientos</div>
              <select className="select" value={movimientos} onChange={(e) => setMovimientos(e.target.value)}>
                <option>Adaptativos</option>
                <option>Tics</option>
                <option>Temblores</option>
                <option>Estereotipias</option>
                <option>Gesticulaciones</option>
                <option>Manierismos</option>
                <option>Convulsiones</option>
                <option>Bloqueo motriz</option>
                <option>Parálisis</option>
                <option>Compulsión</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="modalFooter">
        <button className="pillBtn" onClick={onClose} disabled={busy}>
          Cancelar
        </button>
        <button className="pillBtn primary" onClick={create} disabled={busy}>
          {busy ? "Guardando..." : "Crear examen"}
        </button>
      </div>
    </Modal>
  );
}

function NoteModal({
  patient,
  consultaTipoDefault,
  onClose,
  onCreated,
}: {
  patient: Patient;
  consultaTipoDefault: ConsultaTipo;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  // --- QR share (LAN) ---
  const [netIps, setNetIps] = useState<string[]>([]);
  const [netPort, setNetPort] = useState<string>(() => {
    const p = String(window.location.port || "").trim();
    return p || "1420";
  });
  const [netError, setNetError] = useState<string | null>(null);
  const [hostIp, setHostIp] = useState<string>("");
  const [consultaTipo, setConsultaTipo] = useState<ConsultaTipo>(consultaTipoDefault);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setNetError(null);
        const r = await fetch("/__naju_netinfo", { cache: "no-store" as any });
        const j = await r.json();
        const ips = Array.isArray(j?.ips) ? j.ips.map((x: any) => String(x)).filter(Boolean) : [];
        const port = String(j?.port ?? "").trim();
        if (!alive) return;
        setNetIps(ips);
        if (port) setNetPort(port);
        if (!hostIp && ips[0]) setHostIp(ips[0]);
      } catch {
        if (!alive) return;
        setNetError("No se pudo detectar la IP LAN (revisa firewall o red). Puedes escribirla manualmente.");
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hostIp && netIps[0]) setHostIp(netIps[0]);
  }, [netIps, hostIp]);

  const hostValidationError = useMemo(() => {
    if (consultaTipo === "virtual") return null;
    const typed = (hostIp || "").trim();
    if (!typed) return "Selecciona una IP LAN del PC para generar el QR.";
    const onlyHost = typed.includes(":") ? typed.split(":")[0].trim() : typed;
    if (netIps.length > 0 && !netIps.includes(onlyHost)) {
      return "La IP no corresponde a este PC. Elige una IP de la lista detectada.";
    }
    return null;
  }, [consultaTipo, hostIp, netIps]);

  const shareUrl = useMemo(() => {
    if (consultaTipo === "virtual") return "";
    if (hostValidationError) return "";

    let host = (hostIp || "").trim();
    let port = String(netPort || window.location.port || "1420").trim();

    if (host.includes(":")) {
      const [rawHost, rawPort] = host.split(":");
      host = rawHost.trim();
      if (rawPort?.trim()) port = rawPort.trim();
    }

    if (!host) return "";
    const safePort = /^\d{2,5}$/.test(port) ? port : "1420";
    const shortPid = encodeURIComponent(patient.id);
    const tipo = encodeURIComponent(consultaTipo);
    return `http://${host}:${safePort}/?open=note&patientId=${shortPid}&consulta_tipo=${tipo}`;
  }, [consultaTipo, hostIp, netPort, patient.id, hostValidationError]);

  const qrDataUrl = useMemo(() => {
    if (!shareUrl) return "";
    try {
      return makeQrSvgDataUrl(shareUrl);
    } catch {
      return "";
    }
  }, [shareUrl]);

  async function copyShareUrl() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = shareUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      } catch {
        // ignore
      }
    }
  }

  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  const [transcribing, setTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  const [fecha, setFecha] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [animo, setAnimo] = useState("Eutímico");
  const [riesgo, setRiesgo] = useState("Sin riesgo");
  const [texto, setTexto] = useState("");
  const [continuidad, setContinuidad] = useState("");
  const [transcripcion, setTranscripcion] = useState("");

  useEffect(() => {
    return () => {
      if (audioUrl && audioUrl.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(audioUrl);
        } catch {
          /* ignore */
        }
      }
    };
  }, [audioUrl]);

  async function readBlobAsDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("No se pudo leer el audio"));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(blob);
    });
  }

  function actionPickAudio() {
    audioInputRef.current?.click();
  }

  function clearAudioSelection() {
    setAudioError(null);
    setTranscribeError(null);
    setAudioFile(null);
    setAudioUrl(null);
    try {
      if (audioInputRef.current) audioInputRef.current.value = "";
    } catch {
      /* ignore */
    }
  }

  function onAudioSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setAudioError(null);
    setTranscribeError(null);
    setAudioFile(file);
    try {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
    } catch {
      // fallback: if object URL fails, keep it null (we can still save/transcribe)
      setAudioUrl(null);
    }
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }

    try {
      setAudioError(null);
      setTranscribeError(null);

      let stream: MediaStream | null = null;
      if (consultaTipo === "presencial") {
        if (!navigator.mediaDevices?.getUserMedia) {
          setAudioError("Grabación no disponible en este navegador.");
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          setAudioError("Este navegador no permite capturar audio del sistema.");
          return;
        }
        const display = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
        const hasAudio = display.getAudioTracks().length > 0;
        if (!hasAudio) {
          display.getTracks().forEach((track) => track.stop());
          setAudioError("Para consulta virtual debes activar 'Compartir audio' al seleccionar la pantalla.");
          return;
        }
        stream = new MediaStream(display.getAudioTracks());
      }

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream?.getTracks().forEach((track) => track.stop());

        try {
          const ext = "webm";
          const file = new File([blob], `grabacion-${consultaTipo}-${fecha}-${Date.now()}.${ext}`, {
            type: blob.type || "audio/webm",
          });

          setAudioFile(file);
          try {
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
          } catch {
            const dataUrl = await readBlobAsDataUrl(blob);
            setAudioUrl(dataUrl);
          }
        } catch (err) {
          setAudioError(err instanceof Error ? err.message : "No se pudo procesar el audio.");
        }
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      setAudioError(`No se pudo iniciar la grabación: ${errMsg(err)}`);
    }
  }

  async function transcribeAudio() {
    if (!audioFile) {
      setTranscribeError("Primero selecciona o graba un audio.");
      return;
    }

    setTranscribing(true);
    setTranscribeError(null);

    try {
      const audio = await decodeAudioToMono16k(audioFile);
      const asr = await getAsrPipeline();

      const out = await asr(audio, {
        // Nota: chunking ayuda con audios medianos/largos
        chunk_length_s: 30,
        stride_length_s: 5,
        // Whisper suele inferir idioma; pero intentamos guiarlo
        language: "spanish",
        task: "transcribe",
      });

      const txt = typeof out === "string" ? out : out?.text;
      if (!txt || !String(txt).trim()) {
        setTranscribeError("No se obtuvo texto de la transcripción.");
        return;
      }

      setTranscripcion(String(txt).trim());
    } catch (err) {
      setTranscribeError(errMsg(err));
    } finally {
      setTranscribing(false);
    }
  }

  async function create() {
    setBusy(true);
    try {
      let audioRef: string | null = null;
      if (audioFile) {
        // Prefer: guardar como archivo real (dev). Fallback: incrustar como DataURL.
        const savedPath = await trySaveAudioAsset(patient.id, audioFile);
        audioRef = savedPath || (await readBlobAsDataUrl(audioFile));
      }

      const payload = {
        type: "nota",
        fecha,
        estado_animo: animo,
        riesgo,
        texto: texto.trim() ? texto.trim() : null,
        continuidad: continuidad.trim() ? continuidad.trim() : null,
        transcripcion: transcripcion.trim() ? transcripcion.trim() : null,
        audio_data_url: audioRef,
        consulta_tipo: consultaTipo,
        patient_snapshot: {
          id: patient.id,
          name: patient.name,
          doc_type: patient.doc_type,
          doc_number: patient.doc_number,
        },
      };

      await createPatientNote(patient.id, payload);
      await onCreated();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const canSave = Boolean(texto.trim() || transcripcion.trim() || audioFile);

  return (
    <Modal onClose={onClose} fullScreen closeVariant="icon">
      <div className="modalBody">
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          onChange={onAudioSelected}
          style={{ display: "none" }}
        />

        {consultaTipo === "presencial" ? (
        <div className="percent-panel qrCard">
          <div className="qrHeader">
            <div>
              <div className="qrTitle">Captura rápida (otro dispositivo)</div>
              <div className="qrSub">
                Escanea el QR desde otro celular/tablet en la misma red Wi‑Fi para abrir NAJU directamente en este formulario.
              </div>
            </div>
</div>

          <div className="qrGrid">
            <div className="qrBox">
              {qrDataUrl ? (
                <img className="qrImg" src={qrDataUrl} alt="QR para abrir NAJU" />
              ) : (
                <div className="qrFallback">
                  <div style={{ fontWeight: 800 }}>QR no disponible</div>
                  <div style={{ marginTop: 6, color: "var(--muted)" }}>
                    Selecciona o escribe una IP LAN para generar el enlace.
                  </div>
                </div>
              )}
            </div>

            <div className="qrControls">
              <div className="field">
                <div className="label">IP del PC (LAN)</div>
                <div className="qrRow">
                  <select className="select" value={hostIp} onChange={(e) => setHostIp(e.target.value)}>
                    <option value="">Seleccionar…</option>
                    {netIps.map((ip) => (
                      <option key={ip} value={ip}>
                        {ip}
                      </option>
                    ))}
                  </select>
                  <input
                    className="input"
                    value={hostIp}
                    onChange={(e) => setHostIp(e.target.value)}
                    placeholder="Ej: 192.168.1.10"
                  />
                </div>
                <div className="qrRow" style={{ marginTop: 8 }}>
                  <input
                    className="input"
                    value={netPort}
                    onChange={(e) => setNetPort(e.target.value.replace(/[^\d]/g, "").slice(0, 5))}
                    placeholder="Puerto (ej: 1420)"
                  />
                </div>
                {shareUrl ? <div className="miniHelp" style={{ marginTop: 10 }}>{shareUrl}</div> : null}
                {netError || hostValidationError ? <div className="qrHint err">{netError || hostValidationError}</div> : <div className="qrHint">Usa la IP de este PC (no la del router). Si no abre, verifica firewall/puerto {netPort || "1420"} permitido en la red local.</div>}
              </div>

              {netIps.length > 1 ? (
                <div className="qrHint" style={{ marginTop: 8 }}>
                  Detecté varias interfaces de red. Si el QR no abre, cambia la IP seleccionada y vuelve a probar.
                </div>
              ) : null}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a className="pillBtn" href={shareUrl || "#"} target="_blank" rel="noreferrer" onClick={(e) => !shareUrl && e.preventDefault()}>
                  Abrir enlace
                </a>
                <button className="pillBtn primary" type="button" onClick={copyShareUrl} disabled={!shareUrl}>
                  Copiar enlace
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="percent-panel qrCard">
          <div className="qrTitle">QR no aplica en consulta virtual</div>
          <div className="qrSub">En consultas virtuales se oculta el QR porque no requiere acceso por red local.</div>
        </div>
      )}

        <div className="formGrid">
          <div className="field">
            <div className="label">Fecha</div>
            <input type="date" className="input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>

          <div className="field">
            <div className="label">Estado de ánimo</div>
            <select className="select" value={animo} onChange={(e) => setAnimo(e.target.value)}>
              <option>Eutímico</option>
              <option>Ansioso</option>
              <option>Deprimido</option>
              <option>Irritable</option>
              <option>Expansivo</option>
            </select>
          </div>

          <div className="field">
            <div className="label">Riesgo</div>
            <select className="select" value={riesgo} onChange={(e) => setRiesgo(e.target.value)}>
              <option>Sin riesgo</option>
              <option>Bajo</option>
              <option>Moderado</option>
              <option>Alto</option>
            </select>
          </div>

          <div className="field">
            <div className="label">Tipo de consulta</div>
            <select className="select" value={consultaTipo} onChange={(e) => setConsultaTipo(normalizeConsultaTipo(e.target.value))}>
              <option value="presencial">Presencial</option>
              <option value="virtual">Virtual</option>
            </select>
          </div>
        </div>

        <div className="field">
          <div className="label">Nota clínica</div>
          <textarea
            className="textarea"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Describe el seguimiento, cambios y observaciones..."
          />
        </div>

        <div className="field">
          <div className="label">Continuidad (plan de trabajo)</div>
          <textarea
            className="textarea"
            value={continuidad}
            onChange={(e) => setContinuidad(e.target.value)}
            placeholder="Describa el plan de trabajo o continuidad clínica..."
          />
        </div>

        <div className="field">
          <div className="label">Transcripción (opcional)</div>
          <textarea
            className="textarea"
            value={transcripcion}
            onChange={(e) => setTranscripcion(e.target.value)}
            placeholder="Pega aquí una transcripción o usa el botón de transcribir."
          />
        </div>

        <div className="audioRow">
          <button className="pillBtn" onClick={actionPickAudio} type="button" disabled={busy || transcribing || recording}>
            Cargar audio
          </button>
          <button className={`pillBtn ${recording ? "danger" : ""}`} onClick={toggleRecording} type="button" disabled={busy || transcribing}>
            {recording ? "Detener grabación" : consultaTipo === "virtual" ? "Grabar audio del equipo" : "Grabar audio (micrófono)"}
          </button>
          <button className="pillBtn primary" onClick={transcribeAudio} type="button" disabled={!audioFile || busy || transcribing}>
            {transcribing ? "Transcribiendo..." : "Transcribir audio"}
          </button>
          {audioFile ? <span className="audioStatus">Audio seleccionado: {audioFile.name}</span> : null}
          {audioError ? <span className="audioError">{audioError}</span> : null}
          {transcribeError ? <span className="audioError">{transcribeError}</span> : null}
          {audioFile ? (
            <button className="pillBtn" type="button" onClick={clearAudioSelection} disabled={busy || transcribing || recording}>
              Quitar audio
            </button>
          ) : null}
        </div>

        {audioUrl ? <audio controls src={audioUrl} style={{ width: "100%" }} /> : null}
      </div>

      <div className="modalFooter">
        <button className="pillBtn" onClick={onClose} disabled={busy}>
          Cancelar
        </button>
        <button className="pillBtn primary" onClick={create} disabled={busy || !canSave}>
          {busy ? "Guardando..." : "Guardar nota"}
        </button>
      </div>
    </Modal>
  );
}

function FilePreviewModal({
  file,
  onClose,
}: {
  file: PatientFile;
  onClose: () => void;
}) {
  const meta = parseMetaJson(file);
  const isImageFile = file.kind === "attachment" && isImage(file.path);
  const isPdfFile = file.kind === "attachment" && isPdf(file.path);

  return (
    <Modal
      title={file.filename}
      subtitle={isoToNice(file.created_at)}
      onClose={onClose}
    >
      <div className="modalBody">
        {file.kind === "attachment" ? (
          <div className="previewBody">
            {isImageFile ? (
              <img className="previewImage" src={file.path} alt={`Vista previa de ${file.filename}`} />
            ) : isPdfFile ? (
              <object className="previewPdf" data={file.path} type="application/pdf">
                <p>Vista previa no disponible.</p>
              </object>
            ) : (
              <div className="previewEmpty">
                <div style={{ fontWeight: 700 }}>Archivo adjunto</div>
                <div style={{ color: "var(--muted)" }}>Descarga para abrir este tipo de archivo.</div>
              </div>
            )}
            <a className="pillBtn" href={file.path} download={file.filename}>
              Descargar
            </a>
          </div>
        ) : file.kind === "exam" ? (
          <div className="previewBody">
            <div className="previewTitle">Examen mental formal</div>
            <div className="kv">
              <div className="k">Fecha</div>
              <div className="v">{meta?.fecha ?? "—"}</div>
            </div>
            <div className="kv">
              <div className="k">Motivo</div>
              <div className="v">{meta?.motivo_consulta ?? "—"}</div>
            </div>
            <div className="kv">
              <div className="k">Tipo consulta</div>
              <div className="v">{consultaTipoLabel(normalizeConsultaTipo(meta?.consulta_tipo))}</div>
            </div>
            <div className="previewGrid">
              {[
                ["Apariencia", meta?.apariencia_aspecto_personal],
                ["Conducta", meta?.conducta_psicomotora],
                ["Actitud", meta?.actitud],
                ["Lenguaje", meta?.lenguaje],
                ["Ánimo", meta?.estado_de_animo],
                ["Afecto", meta?.afecto],
                ["Curso pensamiento", meta?.pensamiento_curso],
                ["Percepción", meta?.percepcion],
                ["Orientación", meta?.orientacion],
                ["Atención", meta?.atencion],
                ["Memoria", meta?.memoria],
                ["Juicio", meta?.juicio],
                ["Insight", meta?.insight],
                ["Riesgo", meta?.riesgo],
              ].map(([label, value]) => (
                <div key={label} className="previewItem">
                  <div className="k">{label}</div>
                  <div className="v">{value ?? "—"}</div>
                </div>
              ))}
            </div>
            <div className="previewNote">{meta?.observaciones ?? "Sin observaciones adicionales."}</div>
          </div>
        ) : (
          <div className="previewBody">
            <div className="previewTitle">Nota de seguimiento</div>
            <div className="kv">
              <div className="k">Fecha</div>
              <div className="v">{meta?.fecha ?? "—"}</div>
            </div>
            <div className="previewGrid">
              {[
                ["Estado de ánimo", meta?.estado_animo],
                ["Riesgo", meta?.riesgo],
                ["Plan de trabajo", meta?.continuidad],
              ].map(([label, value]) => (
                <div key={label} className="previewItem">
                  <div className="k">{label}</div>
                  <div className="v">{value ?? "—"}</div>
                </div>
              ))}
            </div>
            <div className="previewNote">{meta?.texto ?? "Sin texto adicional."}</div>
            {meta?.transcripcion ? (
              <div className="previewNote">
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Transcripción</div>
                <div>{meta.transcripcion}</div>
              </div>
            ) : null}
            {meta?.audio_data_url ? (
              <audio controls src={meta.audio_data_url} style={{ width: "100%" }} />
            ) : null}
          </div>
        )}
      </div>
    </Modal>
  );
}


type AgendaViewProps = {
  appointments: Appointment[];
  patients: Patient[];
  monthCursor: Date;
  setMonthCursor: (d: Date) => void;
  dayKey: string | null;
  setDayKey: (k: string | null) => void;
  onJumpToPatient: (patientId: string) => void;
  onExportAll: () => void;
  onExportAllCsv: () => void;
};

function toDayKeyLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function monthLabel(d: Date) {
  try {
    return d.toLocaleString(undefined, { month: "long", year: "numeric" });
  } catch {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
}

function buildMonthGrid(monthCursor: Date) {
  const first = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const start = new Date(first);
  const dow = (start.getDay() + 6) % 7; // monday=0
  start.setDate(start.getDate() - dow);

  const last = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0);
  const end = new Date(last);
  const dowEnd = (end.getDay() + 6) % 7;
  end.setDate(end.getDate() + (6 - dowEnd));

  const days: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return { days };
}

function AgendaView(props: AgendaViewProps) {
  const { appointments, patients, monthCursor, setMonthCursor, dayKey, setDayKey, onJumpToPatient, onExportAll, onExportAllCsv } = props;

  const patientName: Record<string, string> = useMemo(() => {
    const m: Record<string, string> = {};
    patients.forEach((p) => (m[p.id] = p.name));
    return m;
  }, [patients]);

  const apptByDay = useMemo(() => {
    const m: Record<string, Appointment[]> = {};
    appointments.forEach((a) => {
      const d = new Date(a.start_iso);
      if (Number.isNaN(d.getTime())) return;
      const k = toDayKeyLocal(d);
      (m[k] ||= []).push(a);
    });
    Object.keys(m).forEach((k) => m[k].sort((x, y) => Date.parse(x.start_iso) - Date.parse(y.start_iso)));
    return m;
  }, [appointments]);

  const { days } = useMemo(() => buildMonthGrid(monthCursor), [monthCursor]);

  const selectedList = useMemo(() => {
    if (!dayKey) return [];
    return (apptByDay[dayKey] || []).slice();
  }, [apptByDay, dayKey]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return appointments
      .filter((a) => Date.parse(a.end_iso) >= now - 2 * 60 * 60 * 1000)
      .slice()
      .sort((x, y) => Date.parse(x.start_iso) - Date.parse(y.start_iso))
      .slice(0, 30);
  }, [appointments]);

  function fmt(iso: string) {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  return (
    <div className="grid2">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 900 }}>Calendario</div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>Clic en un día para ver sus citas.</div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button className="pillBtn" onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}>
              ◀
            </button>
            <div className="najuMonthPill">{monthLabel(monthCursor)}</div>
            <button className="pillBtn" onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}>
              ▶
            </button>
            <button className="pillBtn primary" onClick={onExportAll}>
              Exportar .ics
            </button>
            <button className="pillBtn" onClick={onExportAllCsv}>
              Exportar CSV
            </button>
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div className="najuCalHead">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
            <div key={d} className="najuCalDow">
              {d}
            </div>
          ))}
        </div>

        <div className="najuCalGrid">
          {days.map((d) => {
            const k = toDayKeyLocal(d);
            const count = (apptByDay[k] || []).length;
            const inMonth = d.getMonth() === monthCursor.getMonth();
            const isSel = dayKey === k;
            return (
              <button
                key={k}
                className={"najuCalCell " + (inMonth ? "" : "isDim ") + (isSel ? "isSel" : "")}
                onClick={() => setDayKey(isSel ? null : k)}
                title={k}
              >
                <div className="najuCalNum">{d.getDate()}</div>
                {count ? <div className="najuCalCount">{count}</div> : null}
              </button>
            );
          })}
        </div>

        {dayKey ? (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 900 }}>Citas del {dayKey}</div>
              <button className="pillBtn" onClick={() => setDayKey(null)}>
                Cerrar
              </button>
            </div>
            <div style={{ height: 10 }} />
            {selectedList.length === 0 ? (
              <div style={{ color: "var(--muted)" }}>Sin citas.</div>
            ) : (
              <div className="list">
                {selectedList.map((a) => (
                  <div key={a.id} className="fileRow">
                    <div className="fileIcon">📅</div>
                    <div className="fileMeta">
                      <div className="fileName">
                        {a.title} · {patientName[a.patient_id] || "Paciente"}
                      </div>
                      <div className="fileSub">
                        {fmt(a.start_iso)} → {fmt(a.end_iso)} · {appointmentModalityLabel(a.modality)}
                      </div>
                      {a.notes ? <div className="fileSub">📝 {a.notes}</div> : null}
                    </div>
                    <button className="smallBtn" onClick={() => onJumpToPatient(a.patient_id)}>
                      Ir
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 900 }}>Próximas citas</div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>Lista rápida (máximo 30).</div>
          </div>
        </div>

        <div style={{ height: 12 }} />

        {upcoming.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>Aún no hay citas.</div>
        ) : (
          <div className="list">
            {upcoming.map((a) => (
              <div key={a.id} className="fileRow">
                <div className="fileIcon">🗓️</div>
                <div className="fileMeta">
                  <div className="fileName">
                    {a.title} · {patientName[a.patient_id] || "Paciente"}
                  </div>
                  <div className="fileSub">
                    {fmt(a.start_iso)} → {fmt(a.end_iso)} · {appointmentModalityLabel(a.modality)}
                  </div>
                  {a.notes ? <div className="fileSub">📝 {a.notes}</div> : null}
                </div>
                <button className="smallBtn" onClick={() => onJumpToPatient(a.patient_id)}>
                  Ir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type CitasSectionProps = {
  patient: Patient;
  psychologistName: string;
  appointments: Appointment[];
  onCreate: (input: AppointmentInput) => void | Promise<void>;
  onDelete: (appointmentId: number) => void | Promise<void>;
  onExportPatient: () => void;
  onExportPatientCsv: () => void;
};

function CitasSection(props: CitasSectionProps) {
  const { patient, psychologistName, appointments, onCreate, onDelete, onExportPatient, onExportPatientCsv } = props;

  const [startLocal, setStartLocal] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  });
  const [minutes, setMinutes] = useState("60");
  const [title, setTitle] = useState("");
  const [modality, setModality] = useState<ConsultaTipo>("presencial");
  const [notes, setNotes] = useState("");

  function fmt(iso: string) {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  function parseLocalDateTime(value: string) {
    const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!m) return null;
    const [, y, mo, d, h, mi] = m;
    const dt = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), 0, 0);
    if (Number.isNaN(dt.getTime())) return null;
    return dt;
  }

  async function submit() {
    const s = startLocal.trim();
    if (!s) return;
    const mins = Math.max(5, Number(minutes || "60") || 60);
    const start = parseLocalDateTime(s);
    if (!start) return;
    const end = new Date(start.getTime() + mins * 60 * 1000);

    const virtualLink = modality === "virtual" ? buildVirtualSessionLink(patient.name, start.toISOString()) : null;

    await onCreate({
      patient_id: patient.id,
      title: (title || "").trim() || `Cita - ${patient.name}`,
      modality,
      virtual_link: virtualLink,
      start_iso: start.toISOString(),
      end_iso: end.toISOString(),
      notes: notes.trim() ? notes.trim() : null,
    });

    setStartLocal("");
    setMinutes("60");
    setTitle("");
    setModality("presencial");
    setNotes("");
  }

  return (
    <div className="grid2">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900 }}>Nueva cita</div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>Se guarda en NAJU y luego puedes exportarla.</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button className="pillBtn primary" onClick={onExportPatient}>
              Exportar .ics
            </button>
            <button className="pillBtn" onClick={onExportPatientCsv}>
              Exportar CSV
            </button>
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div style={{ display: "grid", gap: 10 }}>
          <div className="grid2" style={{ gridTemplateColumns: "1fr 140px" }}>
            <label className="field">
              <div className="label">Inicio</div>
              <input className="input" type="datetime-local" value={startLocal} onChange={(e) => setStartLocal(e.target.value)} />
            </label>

            <label className="field">
              <div className="label">Minutos</div>
              <input className="input" type="number" min={5} step={5} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            </label>
          </div>

          <label className="field">
            <div className="label">Título</div>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Cita - ${patient.name}`} />
          </label>

          <label className="field">
            <div className="label">Modalidad</div>
            <select className="select" value={modality} onChange={(e) => setModality(normalizeConsultaTipo(e.target.value))}>
              <option value="presencial">Presencial</option>
              <option value="virtual">Virtual</option>
            </select>
          </label>

          <label className="field">
            <div className="label">Notas</div>
            <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Motivo, acuerdos, etc." />
          </label>

          <button className="pillBtn primary" onClick={submit}>
            Guardar cita
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900 }}>Citas del paciente</div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>{appointments.length} registradas.</div>
          </div>
        </div>

        <div style={{ height: 12 }} />

        {appointments.length === 0 ? (
          <div style={{ color: "var(--muted)" }}>Aún no hay citas.</div>
        ) : (
          <div className="list">
            {appointments.map((a) => {
              const isVirtual = a.modality === "virtual";
              const linkMsg = isVirtual ? buildVirtualLinkMessage(patient.name, a.virtual_link || "") : "";
              const reminderPatient = buildPatientReminderMessage(patient.name, a.start_iso);
              const reminderPsych = buildPsychReminderMessage(psychologistName, patient.name, a.start_iso, a.modality, a.virtual_link);
              return (
              <div key={a.id} className="fileRow" style={{ alignItems: "flex-start" }}>
                <div className="fileIcon">📅</div>
                <div className="fileMeta">
                  <div className="fileName">{a.title}</div>
                  <div className="fileSub">
                    {fmt(a.start_iso)} → {fmt(a.end_iso)} · {appointmentModalityLabel(a.modality)}
                  </div>
                  {a.notes ? <div className="fileSub" style={{ marginTop: 4 }}>📝 {a.notes}</div> : null}
                  {isVirtual && a.virtual_link ? (
                    <div className="fileSub" style={{ marginTop: 4 }}>
                      🔗 <a href={a.virtual_link} target="_blank" rel="noreferrer">{a.virtual_link}</a>
                    </div>
                  ) : null}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                    {isVirtual && a.virtual_link ? (
                      <button className="smallBtn" onClick={() => navigator.clipboard.writeText(linkMsg)}>
                        Copiar mensaje link
                      </button>
                    ) : null}
                    <button className="smallBtn" onClick={() => navigator.clipboard.writeText(reminderPatient)}>
                      Recordatorio paciente (24h)
                    </button>
                    <button className="smallBtn" onClick={() => navigator.clipboard.writeText(reminderPsych)}>
                      Notificación psicólogo (24h)
                    </button>
                  </div>
                </div>
                <button className="smallBtn danger" onClick={() => onDelete(a.id)}>
                  Eliminar
                </button>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}


function hexToRgb(hex: string) {
  const h = hex.replace("#", "").trim();
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

async function tintPng(baseUrl: string, size: number, primary: string, accent: string) {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = baseUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return baseUrl;

  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, 0, 0, size, size);

  const p = hexToRgb(primary);
  const a = hexToRgb(accent);
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, `rgba(${p.r},${p.g},${p.b},0.95)`);
  g.addColorStop(1, `rgba(${a.r},${a.g},${a.b},0.95)`);
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = "source-over";

  return canvas.toDataURL("image/png");
}


export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem("naju_theme");
      if (saved === "light" || saved === "dark") return saved;
    } catch {
      // ignore
    }
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
    return prefersDark ? "dark" : "light";
  });
  const [colorTheme, setColorTheme] = useState<keyof typeof APP_PALETTES>(() => {
    try {
      const saved = localStorage.getItem("naju_color_theme") as keyof typeof APP_PALETTES | null;
      if (saved && APP_PALETTES[saved]) return saved;
    } catch {
      // ignore
    }
    return "original";
  });
  const [logoColorMode, setLogoColorMode] = useState<"theme" | "original">(() => {
    try {
      const saved = localStorage.getItem("naju_logo_color_mode");
      return saved === "original" ? "original" : "theme";
    } catch {
      return "theme";
    }
  });
  const [logoSrc, setLogoSrc] = useState("/naju-icon-512.png");

  const activePalette = APP_PALETTES[colorTheme]?.[theme] ?? APP_PALETTES.original[theme];

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    (document.documentElement.style as any).colorScheme = theme;

    const palette = activePalette;
    const root = document.documentElement.style;
    root.setProperty("--bg", palette.background);
    root.setProperty("--bg2", palette.surface);
    root.setProperty("--panel", palette.surface);
    root.setProperty("--panel2", palette.surface);
    root.setProperty("--text", palette.text);
    root.setProperty("--muted", palette.text);
    root.setProperty("--muted2", palette.primary);
    root.setProperty("--border", palette.accent);
    root.setProperty("--gold", palette.primary);
    root.setProperty("--gold2", palette.surface);
    root.setProperty("--earth", palette.primary);
    root.setProperty("--green", palette.accent);
    root.setProperty("--green2", palette.surface);
    root.setProperty("--profile-accent", palette.accent);

    try {
      localStorage.setItem("naju_theme", theme);
      localStorage.setItem("naju_color_theme", colorTheme);
    } catch {
      // ignore
    }
  }, [theme, colorTheme, activePalette]);

  useEffect(() => {
    let cancelled = false;
    let manifestObjectUrl: string | null = null;

    async function applyBrandAssets() {
      const useOriginal = logoColorMode === "original";
      const primary = useOriginal ? "#1a5158" : activePalette.primary;
      const accent = useOriginal ? "#59e2e4" : activePalette.accent;
      const icon512 = useOriginal
        ? "/naju-icon-512.png"
        : await tintPng("/naju-icon-512.png", 512, primary, accent);
      const icon192 = useOriginal
        ? "/naju-icon-192.png"
        : await tintPng("/naju-icon-512.png", 192, primary, accent);

      if (cancelled) return;
      setLogoSrc(icon512);

      const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (favicon) favicon.href = icon192;

      const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      if (manifest) {
        const dynamicManifest = {
          name: "NAJU",
          short_name: "NAJU",
          description: "NAJU — apoyo clínico para psicólogos y pacientes.",
          start_url: "/",
          display: "standalone",
          background_color: activePalette.background,
          theme_color: activePalette.primary,
          icons: [
            { src: icon192, sizes: "192x192", type: "image/png" },
            { src: icon512, sizes: "512x512", type: "image/png" }
          ]
        };
        manifestObjectUrl = URL.createObjectURL(new Blob([JSON.stringify(dynamicManifest)], { type: "application/manifest+json" }));
        manifest.href = manifestObjectUrl;
      }

      const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
      if (themeMeta) themeMeta.content = activePalette.primary;

      try {
        localStorage.setItem("naju_logo_color_mode", logoColorMode);
      } catch {
        // ignore
      }
    }

    applyBrandAssets();

    return () => {
      cancelled = true;
      if (manifestObjectUrl) URL.revokeObjectURL(manifestObjectUrl);
    };
  }, [activePalette, logoColorMode]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFESSIONAL_PROFILE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ProfessionalProfile>;
      setProfessionalProfile({ ...defaultProfessionalProfile(), ...parsed });
    } catch {
      // ignore malformed storage
    }
  }, []);

  function saveProfessionalProfile(next: ProfessionalProfile) {
    setProfessionalProfile(next);
    try {
      localStorage.setItem(PROFESSIONAL_PROFILE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore persistence errors
    }
  }

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  function beginCreatePatient() {
    setShowConsentIntro(true);
  }

  const [patients, setPatients] = useState<Patient[]>([]);
  const [query] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [files, setFiles] = useState<PatientFile[]>([]);
  const [allFiles, setAllFiles] = useState<PatientFile[]>([]);
  const [page, setPage] = useState<"home" | "pacientes" | "agenda" | "errores">("home");
  const [section, setSection] = useState<Section>("resumen");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [errorReports, setErrorReports] = useState<ErrorReport[]>([]);

  const [agendaMonthCursor, setAgendaMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [agendaDayKey, setAgendaDayKey] = useState<string | null>(null);

  const [toast, setToast] = useState<Toast>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [showConsentIntro, setShowConsentIntro] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [pendingConsent, setPendingConsent] = useState<ConsentData | null>(null);
  const [professionalProfile, setProfessionalProfile] = useState<ProfessionalProfile>(() => defaultProfessionalProfile());
  const [showEdit, setShowEdit] = useState(false);
  const [showExam, setShowExam] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showInitialAssessment, setShowInitialAssessment] = useState(false);
  const [previewFile, setPreviewFile] = useState<PatientFile | null>(null);
  const [consentPreview, setConsentPreview] = useState<ConsentData | null>(null);

  // --- Update (GitHub) ---
  const [updateBusy, setUpdateBusy] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [consultaTipoDefault, setConsultaTipoDefault] = useState<ConsultaTipo>("presencial");
  const [notesFilterTipo, setNotesFilterTipo] = useState<"all" | ConsultaTipo>("all");
  const [examsFilterTipo, setExamsFilterTipo] = useState<"all" | ConsultaTipo>("all");

  // Deep-link support (used by the QR flow): /?open=note&patientId=... or /n/<patientId>
  const [pendingOpen, setPendingOpen] = useState<{ kind: "note"; patientId: string; consultaTipo: ConsultaTipo } | null>(() => {
    try {
      const url = new URL(window.location.href);
      const open = (url.searchParams.get("open") || "").toLowerCase();
      const patientId = (url.searchParams.get("patientId") || "").trim();
      if (open === "note" && patientId) return { kind: "note", patientId, consultaTipo: normalizeConsultaTipo(url.searchParams.get("consulta_tipo")) };

      const m = url.pathname.match(/^\/n\/([^/]+)$/i);
      if (m?.[1]) {
        return { kind: "note", patientId: decodeURIComponent(m[1]), consultaTipo: "presencial" };
      }
    } catch {
      /* ignore */
    }
    return null;
  });
  const pendingOpenHandledRef = useRef(false);

  const toastTimer = useRef<number | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function pushToast(t: Toast) {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }

  async function checkForUpdates(silent = true) {
    const res = await fetch("/__naju_update_check", { cache: "no-store" });
    const info = await res.json();
    if (!info?.ok) throw new Error(info?.error || "No se pudo verificar");

    const available = Boolean(info.behind && info.canUpdate);
    setUpdateAvailable(available);

    if (!silent && !available) {
      pushToast({ type: "ok", msg: "Ya estás en la última versión ✅" });
    }

    return info;
  }

  async function handleUpdateClick() {
    setUpdateBusy(true);
    try {
      const info = await checkForUpdates(false);
      if (!info.behind) return;
      await applyUpdate();
    } catch (e) {
      pushToast({ type: "err", msg: `Actualización no disponible: ${errMsg(e)}` });
    } finally {
      setUpdateBusy(false);
    }
  }

  async function applyUpdate() {
    const res = await fetch("/__naju_update_apply", { method: "POST" });
    const out = await res.json();
    if (!out?.ok) throw new Error(out?.error || out?.detail || "No se pudo actualizar");

    setUpdateAvailable(false);
    pushToast({ type: "ok", msg: out?.message || (out?.updated ? "Actualizado ✅" : "Sin cambios") });

    // El proceso de dev se cerrará y el launcher lo reiniciará automáticamente.
    window.setTimeout(() => window.location.reload(), 1500);
  }

  const selected = useMemo(
    () => patients.find((p) => p.id === selectedId) ?? null,
    [patients, selectedId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => {
      const hay = `${p.name} ${p.doc_type ?? ""} ${p.doc_number ?? ""} ${p.insurer ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [patients, query]);

  const fileGroups = useMemo(() => {
    const attachments = files.filter((f) => f.kind === "attachment");
    const exams = files.filter((f) => f.kind === "exam");
    const notes = files.filter((f) => f.kind === "note");
    const photos = files.filter((f) => f.kind === "photo");
    return { attachments, exams, notes, photos };
  }, [files]);

  const filteredNotes = useMemo(() => {
    if (notesFilterTipo === "all") return fileGroups.notes;
    return fileGroups.notes.filter((f) => normalizeConsultaTipo(parseMetaJson(f)?.consulta_tipo) === notesFilterTipo);
  }, [fileGroups.notes, notesFilterTipo]);

  const initialAssessmentFile = useMemo(() => {
    const candidates = fileGroups.notes.filter((f) => parseMetaJson(f)?.type === "valoracion_inicial");
    return candidates.sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
  }, [fileGroups.notes]);

  const filteredExams = useMemo(() => {
    if (examsFilterTipo === "all") return fileGroups.exams;
    return fileGroups.exams.filter((f) => normalizeConsultaTipo(parseMetaJson(f)?.consulta_tipo) === examsFilterTipo);
  }, [fileGroups.exams, examsFilterTipo]);

  const [timePreset, setTimePreset] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [includeExams, setIncludeExams] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [calcMode, setCalcMode] = useState("aggregate");
  const [focusRecord, setFocusRecord] = useState("");
  const [scale, setScale] = useState("10");

  const dateRange = useMemo(() => {
    if (timePreset === "custom") {
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;
      return { from, to };
    }
    if (timePreset === "30d" || timePreset === "90d") {
      const days = timePreset === "30d" ? 30 : 90;
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - days);
      return { from, to };
    }
    return { from: null, to: null };
  }, [timePreset, dateFrom, dateTo]);

  const trendFiles = useMemo(() => {
    const selectedFiles: PatientFile[] = [];
    if (includeExams) selectedFiles.push(...fileGroups.exams);
    if (includeNotes) selectedFiles.push(...fileGroups.notes);
    const filtered = selectedFiles.filter((file) => {
      const created = new Date(file.created_at);
      if (Number.isNaN(created.getTime())) return true;
      if (dateRange.from && created < dateRange.from) return false;
      if (dateRange.to && created > dateRange.to) return false;
      return true;
    });
    return filtered.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [includeExams, includeNotes, fileGroups.exams, fileGroups.notes, dateRange]);

  const radarRawValues = useMemo(
    () => scoreAxisValues(trendFiles, calcMode as "aggregate" | "avg3" | "latest"),
    [trendFiles, calcMode]
  );
  const scaleMax = Number(scale);
  const radarValues = useMemo(
    () => radarRawValues.map((value) => (value / 3) * scaleMax),
    [radarRawValues, scaleMax]
  );
  const radarSum = useMemo(() => radarValues.reduce((acc, val) => acc + val, 0), [radarValues]);
  const dominantMacro = useMemo(() => {
    if (!radarValues.length) return null;
    const ranked = radarValues
      .map((value, idx) => ({ value, idx }))
      .sort((a, b) => b.value - a.value);

    const [first, second] = ranked;
    if (!first || first.value <= 0) return null;

    // Si las dos categorías más altas están muy cerca, se considera perfil mixto.
    if (second && Math.abs(first.value - second.value) < 0.25) {
      return {
        label: "Perfil mixto",
        value: first.value,
        pct: radarSum ? (first.value / radarSum) * 100 : 0,
      };
    }

    return {
      label: AXES[first.idx].label,
      value: first.value,
      pct: radarSum ? (first.value / radarSum) * 100 : 0,
    };
  }, [radarValues, radarSum]);

  const emotionCounts = useMemo(() => buildEmotionCounts(trendFiles), [trendFiles]);

  const focusOptions = useMemo(
    () =>
      trendFiles.map((file) => ({
        value: String(file.id),
        label: `${file.kind === "exam" ? "Examen" : "Nota"} · ${file.filename} · ${isoToShortDate(
          file.created_at
        )}`,
      })),
    [trendFiles]
  );

  const focusRadarValues = useMemo(() => {
    if (!focusRecord) return null;
    const file = trendFiles.find((f) => String(f.id) === focusRecord);
    if (!file) return null;
    const meta = parseMetaJson(file);
    if (!meta) return null;
    const raw = AXES.map((axis) => {
      const v = meta[axis.key] ?? (axis.noteKey ? meta[axis.noteKey] : undefined);
      if (!v) return 0;
      return scoreLookup(v, axis.map);
    });
    return raw.map((value) => (value / 3) * scaleMax);
  }, [focusRecord, trendFiles, scaleMax]);

  const profileByPatientMap = useMemo(
    () => buildProfileMap(patients, allFiles, getAxisValues, PROFILE_COLORS),
    [patients, allFiles]
  );

  async function refreshPatients() {
    const list = await listPatients("");
    setPatients(list);
    // Si el seleccionado ya no existe, lo limpiamos
    if (selectedId && !list.some((p) => p.id === selectedId)) {
      setSelectedId(null);
      setFiles([]);
      setSection("resumen");
    }
  }

  async function refreshFiles(pid: string) {
    const f = await listPatientFiles(pid);
    setFiles(f);
  }

  async function refreshAllFiles() {
    const f = await listAllFiles();
    setAllFiles(f);
  }

  async function refreshAppointments() {
    const a = await listAppointments();
    setAppointments(a);
  }


  async function refreshErrorReports() {
    const list = await listErrorReports();
    setErrorReports(list);
  }


  useEffect(() => {
    (async () => {
      try {
        await refreshPatients();
        await refreshAllFiles();
        await refreshAppointments();
        await refreshErrorReports();
      } catch (e: any) {
        pushToast({ type: "err", msg: `Error cargando pacientes: ${errMsg(e)}` });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const info = await checkForUpdates(true);
        if (!alive) return;
        if (info?.behind && info?.canUpdate) {
          pushToast({ type: "ok", msg: "Actualización detectada. Aplicando cambios…" });
          setUpdateBusy(true);
          await applyUpdate();
        }
      } catch {
        // Silencioso al iniciar: no bloquea el uso de la app.
      } finally {
        if (alive) setUpdateBusy(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle QR deep-link after patients load
  useEffect(() => {
    if (pendingOpenHandledRef.current) return;
    if (!pendingOpen) return;
    if (!patients.length) return;

    const p = patients.find((x) => x.id === pendingOpen.patientId) || null;
    pendingOpenHandledRef.current = true;
    setPendingOpen(null);

    try {
      // Remove query params so it doesn't re-trigger on navigation
      window.history.replaceState(null, "", "/");
    } catch {
      /* ignore */
    }

    if (!p) {
      pushToast({ type: "err", msg: "No encontré el paciente del enlace QR." });
      return;
    }

    startVT(() => {
      setPage("pacientes");
      setSelectedId(p.id);
      setSection("notas");
      setConsultaTipoDefault(pendingOpen.consultaTipo);
      setShowNote(true);
    });
  }, [pendingOpen, patients]);

  useEffect(() => {
    (async () => {
      if (!selectedId) return;
      try {
        await refreshFiles(selectedId);
      } catch (e: any) {
        pushToast({ type: "err", msg: `Error cargando archivos: ${errMsg(e)}` });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  function pickPatient(id: string, sec: Section = "resumen") {
    startVT(() => {
      setPage("pacientes");
      setSelectedId(id);
      setSection(sec);
    });
  }

  async function onCreatePatient(input: PatientInput) {
    try {
      const payload: PatientInput = {
        ...input,
        consent_json: pendingConsent ? JSON.stringify(pendingConsent) : null,
      };
      const p = await createPatient(payload);

      const draftDate = new Date().toLocaleDateString("es-CO");
      const draftTime = new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
      const draftBody = buildInitialAssessmentBodyTemplate();
      const initialAssessmentPayload = {
        type: "valoracion_inicial",
        fecha: new Date().toISOString().slice(0, 10),
        estado_animo: "Eutímico",
        riesgo: "Sin riesgo aparente",
        texto: buildInitialAssessmentNoteText(p.name, draftDate, draftTime, draftBody),
        valoracion_fecha: draftDate,
        valoracion_hora: draftTime,
        valoracion_cuerpo: draftBody,
        continuidad: null,
        transcripcion: null,
        audio_data_url: null,
        consulta_tipo: "presencial" as const,
        patient_snapshot: {
          id: p.id,
          name: p.name,
          doc_type: p.doc_type,
          doc_number: p.doc_number,
        },
      };
      await createPatientNote(p.id, initialAssessmentPayload);

      await refreshPatients();
      await refreshAllFiles();
      await refreshFiles(p.id);
      startVT(() => {
        setSelectedId(p.id);
        setSection("archivos");
      });
      pushToast({ type: "ok", msg: "Paciente creado ✅ (con valoración inicial)" });
      setShowCreate(false);
      setPendingConsent(null);
    } catch (e: any) {
      pushToast({ type: "err", msg: `No se pudo crear: ${errMsg(e)}` });
    }
  }

  async function onUpdatePatient(input: PatientInput) {
    if (!selected) return;
    try {
      const p = await updatePatient(selected.id, input);
      await refreshPatients();
      await refreshAllFiles();
      startVT(() => setSelectedId(p.id));
      pushToast({ type: "ok", msg: "Paciente actualizado ✅" });
      setShowEdit(false);
    } catch (e: any) {
      pushToast({ type: "err", msg: `No se pudo actualizar: ${errMsg(e)}` });
    }
  }

  async function actionPickPhoto() {
    if (!selected) return;
    photoInputRef.current?.click();
  }

  async function actionAttachFiles() {
    if (!selected) return;
    fileInputRef.current?.click();
  }

  function actionOpenInitialAssessment() {
    if (!selected) return;
    setShowInitialAssessment(true);
  }

  async function saveInitialAssessment(payload: { date: string; time: string; body: string }) {
    if (!selected) return;
    const notePayload = {
      type: "valoracion_inicial",
      fecha: new Date().toISOString().slice(0, 10),
      estado_animo: "Eutímico",
      riesgo: "Sin riesgo aparente",
      texto: buildInitialAssessmentNoteText(selected.name, payload.date, payload.time, payload.body),
      valoracion_fecha: payload.date,
      valoracion_hora: payload.time,
      valoracion_cuerpo: payload.body,
      continuidad: null,
      transcripcion: null,
      audio_data_url: null,
      consulta_tipo: "presencial" as const,
      patient_snapshot: {
        id: selected.id,
        name: selected.name,
        doc_type: selected.doc_type,
        doc_number: selected.doc_number,
      },
    };

    if (initialAssessmentFile) await updatePatientNote(initialAssessmentFile.id, notePayload);
    else await createPatientNote(selected.id, notePayload);

    await refreshFiles(selected.id);
    await refreshAllFiles();
    pushToast({ type: "ok", msg: initialAssessmentFile ? "Valoración inicial actualizada ✅" : "Valoración inicial creada ✅" });
  }

  async function actionOpenFile(file: PatientFile) {
    setPreviewFile(file);
  }

  async function onPhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selected) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await setPatientPhoto(selected.id, file);
      await refreshPatients();
      await refreshAllFiles();
      pushToast({ type: "ok", msg: "Foto actualizada ✅" });
    } catch (err: any) {
      pushToast({ type: "err", msg: `Error foto: ${errMsg(err)}` });
    } finally {
      e.target.value = "";
    }
  }

  async function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selected) return;
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    try {
      await importFiles(selected.id, files);
      await refreshFiles(selected.id);
      await refreshAllFiles();
      pushToast({ type: "ok", msg: "Archivos adjuntados ✅" });
      startVT(() => setSection("archivos"));
    } catch (err: any) {
      pushToast({ type: "err", msg: `Error adjuntar: ${errMsg(err)}` });
    } finally {
      e.target.value = "";
    }
  }

  function resetTrendFilters() {
    setTimePreset("all");
    setDateFrom("");
    setDateTo("");
    setIncludeExams(true);
    setIncludeNotes(true);
    setCalcMode("aggregate");
    setFocusRecord("");
    setScale("10");
  }

  async function actionDeleteSelected() {
    if (!selected) return;
    const ok = confirm(`¿Eliminar a "${selected.name}"? Se eliminarán los datos locales guardados en este navegador.`);
    if (!ok) return;
    try {
      await deletePatient(selected.id);
      await refreshPatients();
      await refreshAllFiles();
      pushToast({ type: "ok", msg: "Paciente eliminado ✅" });
    } catch (e: any) {
      pushToast({ type: "err", msg: `No se pudo eliminar: ${errMsg(e)}` });
    }
  }

  const selectedPhotoSrc = useMemo(() => {
    if (!selected?.photo_path) return null;
    return selected.photo_path;
  }, [selected?.photo_path]);

  const selectedProfile = useMemo(() => {
    if (!selected) return null;
    return profileByPatientMap.get(selected.id) ?? { values: AXES.map(() => 0), accent: "#c7a45a", label: null };
  }, [profileByPatientMap, selected]);
  const profileLabels = useMemo(() => AXES.map((axis) => axis.label), []);
  const radarAxisSubtitles = useMemo(() => {
    const evidence = buildEvidence(trendFiles, profileLabels);
    return evidence.map((bucket) => topItemSubtitleFromBucket(bucket));
  }, [trendFiles, profileLabels]);
  const emotionColors = useMemo(() => {
    const palette: Record<string, string> = {};
    emotionCounts.labels.forEach((label, idx) => {
      palette[label] = `hsla(${(idx * 70) % 360}, 85%, 62%, .95)`;
    });
    return palette;
  }, [emotionCounts.labels]);
  const emotionDominant = useMemo(() => {
    if (!emotionCounts.values.length) return null;
    const max = Math.max(...emotionCounts.values);
    const idx = emotionCounts.values.findIndex((value) => value === max);
    if (idx === -1) return null;
    const pct = emotionCounts.values.reduce((acc, val) => acc + val, 0)
      ? (emotionCounts.values[idx] / emotionCounts.values.reduce((acc, val) => acc + val, 0)) * 100
      : 0;
    return { label: emotionCounts.labels[idx], pct };
  }, [emotionCounts]);

  return (
    <div
      className="app"
      style={{ "--profile-accent": selectedProfile?.accent ?? "#c7a45a" } as React.CSSProperties}
    >
      <input
        ref={photoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={onPhotoSelected}
        style={{ display: "none" }}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={onFilesSelected}
        style={{ display: "none" }}
      />

      {/* Global animated background (does not affect layout) */}
      <OceanBackground />

      <div className="shell">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebarTop">
            <div className="brandRow">
              <div className="brand">
                <button
                  type="button"
                  className="brandLogoBtn"
                  title={logoColorMode === "original" ? "Usar color del tema" : "Volver al color original"}
                  onClick={() => setLogoColorMode((m) => (m === "original" ? "theme" : "original"))}
                >
                  <img src={logoSrc} alt="Logo NAJU" className="brandLogo" />
                </button>
                <div>
                  <div className="title">
                    <span>NAJU</span>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>Gestor web</span>
                  </div>
                  <div className="subtitle">Pacientes · Exámenes · Archivos (Web)</div>
                </div>
              </div>

              <div className="pillRow" />
            </div>
          </div>

          <div className="patientList">
            {filtered.length === 0 ? (
              <div className="card">
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Sin resultados</div>
                <div style={{ color: "var(--muted)", fontSize: 13 }}>
                  Prueba otro texto de búsqueda o crea un paciente.
                </div>
              </div>
            ) : null}

            {filtered.map((p) => {
              const age = calcAge(p.birth_date);
              const img = p.photo_path ?? null;
              const profile = profileByPatientMap.get(p.id);

              return (
                <div
                  key={p.id}
                  className="pCard"
                  role="button"
                  tabIndex={0}
                  aria-current={p.id === selectedId ? "true" : "false"}
                  onClick={() => pickPatient(p.id)}
                  onKeyDown={(e) => (e.key === "Enter" ? pickPatient(p.id) : null)}
                >
                  <span className="profileDot" style={{ background: profile?.accent ?? "#c7a45a" }} />
                  <div className="avatar">
                    {img ? <img src={img} alt="Foto paciente" /> : <div className="initials">{initials(p.name)}</div>}
                  </div>

                  <div className="pMeta">
                    <div className="pName">{p.name}</div>
                    <div className="pSub">
                      {valOrDash(p.doc_type)} {valOrDash(p.doc_number)} · {valOrDash(p.insurer)}
                    </div>
                    <div className="badges">
                      <span className="badge gold">{age === null ? "Edad —" : `${age} años`}</span>
                      {p.phone ? <span className="badge">{p.phone}</span> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main */}
        <main className="main">
          <div className="mainTop">
            {page === "home" ? null : page === "errores" ? (
              <div className="mainTitle">
                <h2>Errores</h2>
                <p className="hint">Registra incidencias y exporta para soporte.</p>
              </div>
            ) : page === "agenda" ? (
              <div className="mainTitle">
                <h2>Agenda</h2>
                <p className="hint">Citas locales de NAJU (exportables a Google Calendar).</p>
              </div>
            ) : !selected ? (
              <div className="mainTitle">
                <h2>Pacientes</h2>
                <p className="hint">Selecciona un paciente para ver su perfil, exámenes, citas y archivos.</p>
              </div>
            ) : (
              <div className="mainTitle">
                <h2 style={{ display: "flex", gap: 10, alignItems: "center", margin: 0 }}>
                  {selectedPhotoSrc ? (
                    <span className="avatar" style={{ width: 42, height: 42, borderRadius: 16 }}>
                      <img src={selectedPhotoSrc} alt="Foto" />
                    </span>
                  ) : (
                    <span className="avatar" style={{ width: 42, height: 42, borderRadius: 16 }}>
                      <span className="initials">{initials(selected.name)}</span>
                    </span>
                  )}
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {selected.name}
                  </span>
                </h2>
                <p className="hint" style={{ margin: 0 }}>
                  {valOrDash(selected.doc_type)} {valOrDash(selected.doc_number)} · {valOrDash(selected.insurer)}
                </p>
              </div>
            )}

            {page === "pacientes" && selected ? (
              <div className="actionRow">
                <button className="iconBtn" disabled={!selected} onClick={() => setShowEdit(true)}>
                  ✏️ Editar
                </button>

                {section === "resumen" ? (
                  <button className="iconBtn" disabled={!selected} onClick={actionPickPhoto}>
                    📷 Foto
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          {page === "pacientes" && selected ? (
            <div className="segWrap">
              <div className="segmented" role="navigation" aria-label="Secciones del paciente">
                <button className="segBtn" aria-current={section === "resumen"} onClick={() => startVT(() => setSection("resumen"))}>
                  Resumen
                </button>
                <button className="segBtn" aria-current={section === "examenes"} onClick={() => startVT(() => setSection("examenes"))}>
                  Exámenes
                </button>
                <button className="segBtn" aria-current={section === "notas"} onClick={() => startVT(() => setSection("notas"))}>
                  Notas
                </button>
                <button className="segBtn" aria-current={section === "citas"} onClick={() => startVT(() => setSection("citas"))}>
                  Citas
                </button>
                <button className="segBtn" aria-current={section === "archivos"} onClick={() => startVT(() => setSection("archivos"))}>
                  Archivos
                </button>
              </div>
            </div>
          ) : null}

          <div className="content">
            {page === "home" ? (
              <HomeDashboard
                patients={patients}
                allFiles={allFiles}
                appointments={appointments}
                profileByPatientMap={profileByPatientMap}
                onAddPatient={beginCreatePatient}
                professionalProfile={professionalProfile}
                onSaveProfessionalProfile={saveProfessionalProfile}
              />
            ) : page === "errores" ? (
              <ErrorCenter
                reports={errorReports}
                patients={patients}
                onRefresh={refreshErrorReports}
                onCreate={async (input) => {
                  await createErrorReport(input);
                  await refreshErrorReports();
                }}
                onDelete={async (id) => {
                  await deleteErrorReport(id);
                  await refreshErrorReports();
                }}
              />
            ) : page === "agenda" ? (
              <AgendaView
                appointments={appointments}
                patients={patients}
                monthCursor={agendaMonthCursor}
                setMonthCursor={setAgendaMonthCursor}
                dayKey={agendaDayKey}
                setDayKey={setAgendaDayKey}
                onJumpToPatient={(pid) => {
                  pickPatient(pid);
                  startVT(() => setSection("citas"));
                }}
                onExportAll={() => {
                  const map: Record<string, string> = {};
                  patients.forEach((p) => (map[p.id] = p.name));
                  const ics = appointmentsToIcs(appointments, map);
                  downloadTextFile("naju_citas.ics", "text/calendar;charset=utf-8", ics);
                }}
                onExportAllCsv={() => {
                  const map: Record<string, string> = {};
                  patients.forEach((p) => (map[p.id] = p.name));
                  const csv = appointmentsToCsv(appointments, map);
                  downloadTextFile("naju_citas.csv", "text/csv;charset=utf-8", csv);
                }}
              />
            ) : !selected ? (
              <div className="emptyState">
                <div className="hero">
                  <h1>NAJU</h1>
                  <p>
                    Selecciona un paciente del panel izquierdo o crea uno nuevo.
                    El detalle siempre se muestra aquí (sin sub-pestañas).
                  </p>
                </div>
              </div>
            ) : section === "resumen" ? (
              <>
                <div className="resumenSplit resumenSplit--stacked">
                  <div className="card profileCard resumenRadarCard">
                    <div className="profileHeader">
                      <div style={{ fontWeight: 800 }}>Resumen de tendencias Macro</div>
                      <span className="profileBadge">
                        {dominantMacro ? `Dominante: ${dominantMacro.label}` : "Perfil estable"}
                      </span>
                    </div>
                    <div className="profileBody">
                      <div className="panel" style={{ gridColumn: "1 / -1" }}>
                        <div className="bd">
                          <div className="trendWrap">
                            <TrendCanvas labels={profileLabels} files={trendFiles} macroValues={radarValues} max={scaleMax} theme={theme} />
                          </div>
                        </div>
                      </div>

                      <details className="filtersDropdown" open>
                        <summary>Filtros del gráfico</summary>
                        <div className="percent-panel">
                          <div className="field">
                            <label className="label" htmlFor="timePreset">
                              Rango de fechas
                            </label>
                            <select
                              id="timePreset"
                              value={timePreset}
                              onChange={(e) => setTimePreset(e.target.value)}
                              className="select"
                            >
                              <option value="all">Histórico (todo)</option>
                              <option value="30d">Últimos 30 días</option>
                              <option value="90d">Últimos 90 días</option>
                              <option value="custom">Personalizado</option>
                            </select>
                          </div>

                          <div className="row2" style={{ display: timePreset === "custom" ? "grid" : "none" }}>
                            <div className="field">
                              <label className="label" htmlFor="dateFrom">
                                Desde
                              </label>
                              <input
                                id="dateFrom"
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="input"
                              />
                            </div>
                            <div className="field">
                              <label className="label" htmlFor="dateTo">
                                Hasta
                              </label>
                              <input
                                id="dateTo"
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="input"
                              />
                            </div>
                          </div>

                          <div className="checks">
                            <label>
                              <input
                                type="checkbox"
                                checked={includeExams}
                                onChange={(e) => setIncludeExams(e.target.checked)}
                              />{" "}
                              Exámenes
                            </label>
                            <label>
                              <input
                                type="checkbox"
                                checked={includeNotes}
                                onChange={(e) => setIncludeNotes(e.target.checked)}
                              />{" "}
                              Notas
                            </label>
                          </div>

                          <div className="field">
                            <label className="label" htmlFor="calcMode">
                              Cálculo del radar
                            </label>
                            <select
                              id="calcMode"
                              value={calcMode}
                              onChange={(e) => setCalcMode(e.target.value)}
                              className="select"
                            >
                              <option value="aggregate">Agregado (promedio del filtro)</option>
                              <option value="avg3">Promedio últimos 3 (del filtro)</option>
                              <option value="latest">Último registro (del filtro)</option>
                            </select>
                          </div>

                          <div className="field">
                            <label className="label" htmlFor="focusRecord">
                              Comparar con un registro (archivo)
                            </label>
                            <select
                              id="focusRecord"
                              value={focusRecord}
                              onChange={(e) => setFocusRecord(e.target.value)}
                              className="select"
                            >
                              <option value="">(sin comparación)</option>
                              {focusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="field">
                            <label className="label" htmlFor="scale">
                              Escala
                            </label>
                            <select
                              id="scale"
                              value={scale}
                              onChange={(e) => setScale(e.target.value)}
                              className="select"
                            >
                              <option value="10">0 a 10</option>
                              <option value="5">0 a 5</option>
                            </select>
                          </div>

                          <button className="pillBtn" onClick={resetTrendFilters} style={{ width: "100%" }}>
                            reset filtros
                          </button>
                        </div>
                      </details>

                    </div>
                  </div>

                  <div className="card resumenDataCard">
                    <div className="resumenDataTopBanner">
                      <div className="radarCanvasWrap resumenDataRadar">
                        <RadarChart
                          labels={profileLabels}
                          values={radarValues}
                          compareValues={focusRadarValues}
                          axisSubtitles={radarAxisSubtitles}
                          accent={selectedProfile?.accent ?? "#c7a45a"}
                          max={scaleMax}
                          theme={theme}
                        />
                      </div>
                      <div className="resumenDataStats">
                        <ProgressDashes
                          title="Peso relativo (macro)"
                          labels={profileLabels}
                          values={radarValues}
                          max={scaleMax}
                          colors={PROFILE_COLORS}
                        />
                        <div className="trendPillRow">
                          <span className="pill">
                            {dominantMacro
                              ? `Dominante: ${dominantMacro.label} (${dominantMacro.pct.toFixed(0)}%)`
                              : "Dominante: --"}
                          </span>
                          <span className="pill">Suma: {radarSum.toFixed(1)} (macro)</span>
                        </div>

                        {emotionDominant ? (
                          <div className="trendPillRow">
                            <span className="pill">
                              Predomina: {emotionDominant.label} ({emotionDominant.pct.toFixed(0)}%)
                            </span>
                          </div>
                        ) : null}
                        {emotionCounts.labels.length ? (
                          <ProgressDashes
                            title="Emoción predominante (tipo)"
                            labels={emotionCounts.labels}
                            values={emotionCounts.values}
                            max={100}
                            colors={emotionColors}
                            showScale={false}
                          />
                        ) : (
                          <div className="percent-panel">
                            <h4>Emoción predominante (tipo)</h4>
                            <div className="percent-subtitle">Ítem mayor: --</div>
                            <div className="emptyHint">Sin datos de emoción en el filtro.</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ fontWeight: 800, marginBottom: 6 }}>Datos</div>

                    <div className="kv">
                      <div className="k">Nombre</div>
                      <div className="v">{selected.name}</div>
                    </div>
                    <div className="kv">
                      <div className="k">Documento</div>
                      <div className="v">
                        {valOrDash(selected.doc_type)} {valOrDash(selected.doc_number)}
                      </div>
                    </div>
                    <div className="kv">
                      <div className="k">EPS</div>
                      <div className="v">{valOrDash(selected.insurer)}</div>
                    </div>
                    <div className="kv">
                      <div className="k">Nacimiento</div>
                      <div className="v">{valOrDash(selected.birth_date)}</div>
                    </div>
                    <div className="kv">
                      <div className="k">Sexo</div>
                      <div className="v">{valOrDash(selected.sex)}</div>
                    </div>
                    <div className="kv">
                      <div className="k">Teléfono</div>
                      <div className="v">{valOrDash(selected.phone)}</div>
                    </div>
                    <div className="kv">
                      <div className="k">Email</div>
                      <div className="v">{valOrDash(selected.email)}</div>
                    </div>
                    <div className="kv">
                      <div className="k">Dirección</div>
                      <div className="v">{valOrDash(selected.address)}</div>
                    </div>
                    <div className="kv">
                      <div className="k">Contacto de emergencia</div>
                      <div className="v">{valOrDash(selected.emergency_contact)}</div>
                    </div>

                    <div className="actionRow" style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                      <button
                        className="pillBtn"
                        onClick={() => {
                          const parsed = parseConsentJson(selected.consent_json);
                          if (!parsed) {
                            pushToast({ type: "err", msg: "Este paciente aún no tiene consentimiento registrado." });
                            return;
                          }
                          setConsentPreview(parsed);
                        }}
                      >
                        Ver consentimiento
                      </button>
                      <button className="pillBtn danger" onClick={actionDeleteSelected}>
                        eliminar paciente
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : section === "examenes" ? (
              <div className="card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>Exámenes</div>
                    <div style={{ color: "var(--muted)", fontSize: 13 }}>Examen mental y otros (guardados como JSON).</div>
                  </div>
                  <button className="pillBtn primary" onClick={() => { setConsultaTipoDefault("presencial"); setShowExam(true); }}>
                    + examen mental
                  </button>
                </div>

                <div style={{ height: 12 }} />

                <div className="field" style={{ maxWidth: 280 }}>
                  <div className="label">Filtro tipo de consulta</div>
                  <select className="select" value={examsFilterTipo} onChange={(e) => setExamsFilterTipo((e.target.value as any) || "all")}>
                    <option value="all">Todas</option>
                    <option value="presencial">Presencial</option>
                    <option value="virtual">Virtual</option>
                  </select>
                </div>

                <div className="list">
                  {filteredExams.length === 0 ? (
                    <div style={{ color: "var(--muted)" }}>Aún no hay exámenes.</div>
                  ) : (
                    filteredExams.map((f) => (
                      <div key={f.id} className="fileRow">
                        <div className="fileIcon">{fileIcon(f)}</div>
                        <div className="fileMeta">
                          <div className="fileName">{f.filename}</div>
                          <div className="fileSub">{isoToNice(f.created_at)}</div>
                        </div>
                        <button className="smallBtn" onClick={() => actionOpenFile(f)}>
                          Abrir
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : section === "citas" ? (
              <CitasSection
                patient={selected}
                psychologistName={professionalProfile.psicologo_nombre}
                appointments={appointments
                  .filter((a) => a.patient_id === selected.id)
                  .slice()
                  .sort((x, y) => Date.parse(x.start_iso) - Date.parse(y.start_iso))}
                onCreate={async (payload) => {
                  try {
                    await createAppointment(payload);
                    await refreshAppointments();
                    pushToast({ type: "ok", msg: "Cita creada" });
                  } catch (e: any) {
                    pushToast({ type: "err", msg: `No se pudo crear la cita: ${errMsg(e)}` });
                  }
                }}
                onDelete={async (id) => {
                  try {
                    await deleteAppointment(id);
                    await refreshAppointments();
                    pushToast({ type: "ok", msg: "Cita eliminada" });
                  } catch (e: any) {
                    pushToast({ type: "err", msg: `No se pudo eliminar: ${errMsg(e)}` });
                  }
                }}
                onExportPatient={() => {
                  const map: Record<string, string> = {};
                  patients.forEach((p) => (map[p.id] = p.name));
                  const subset = appointments.filter((a) => a.patient_id === selected.id);
                  const ics = appointmentsToIcs(subset, map);
                  downloadTextFile(`citas_${selected.id}.ics`, "text/calendar;charset=utf-8", ics);
                }}
                onExportPatientCsv={() => {
                  const map: Record<string, string> = {};
                  patients.forEach((p) => (map[p.id] = p.name));
                  const subset = appointments.filter((a) => a.patient_id === selected.id);
                  const csv = appointmentsToCsv(subset, map);
                  downloadTextFile(`citas_${selected.id}.csv`, "text/csv;charset=utf-8", csv);
                }}
              />
            ) : section === "notas" ? (
              <div className="card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>Notas</div>
                    <div style={{ color: "var(--muted)", fontSize: 13 }}>Seguimiento clínico rápido con estado y riesgo.</div>
                  </div>
                  <button className="pillBtn primary" onClick={() => { setConsultaTipoDefault("presencial"); setShowNote(true); }}>
                    + Nueva nota
                  </button>
                </div>

                <div style={{ height: 12 }} />

                <div className="field" style={{ maxWidth: 280 }}>
                  <div className="label">Filtro tipo de consulta</div>
                  <select className="select" value={notesFilterTipo} onChange={(e) => setNotesFilterTipo((e.target.value as any) || "all")}>
                    <option value="all">Todas</option>
                    <option value="presencial">Presencial</option>
                    <option value="virtual">Virtual</option>
                  </select>
                </div>

                <div className="list">
                  {filteredNotes.length === 0 ? (
                    <div style={{ color: "var(--muted)" }}>Aún no hay notas.</div>
                  ) : (
                    filteredNotes.map((f) => (
                      <div key={f.id} className="fileRow">
                        <div className="fileIcon">{fileIcon(f)}</div>
                        <div className="fileMeta">
                          <div className="fileName">{f.filename}</div>
                          <div className="fileSub">{isoToNice(f.created_at)}</div>
                        </div>
                        <button className="smallBtn" onClick={() => actionOpenFile(f)}>
                          Abrir
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>Archivos</div>
                    <div style={{ color: "var(--muted)", fontSize: 13 }}>Adjuntos del paciente (PDF, imágenes, etc.).</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <button className={`pillBtn primary ${!initialAssessmentFile ? "pulseGlow" : ""}`} onClick={actionOpenInitialAssessment}>
                      {initialAssessmentFile ? "Editar valoración inicial" : "✨ Crear valoración inicial"}
                    </button>
                    <button className="pillBtn primary" onClick={actionAttachFiles}>
                      + Adjuntar
                    </button>
                  </div>
                </div>

                <div style={{ height: 12 }} />

                <div className="list">
                  {initialAssessmentFile ? (
                    <div className="fileRow initialAssessmentRow pulseGlowSoft">
                      <div className="fileIcon">🧾</div>
                      <div className="fileMeta">
                        <div className="fileName">Valoración inicial (editable)</div>
                        <div className="fileSub">{isoToNice(initialAssessmentFile.created_at)} · Se mantiene fija arriba</div>
                      </div>
                      <button className="smallBtn" onClick={actionOpenInitialAssessment}>Editar</button>
                    </div>
                  ) : null}

                  {fileGroups.attachments.length === 0 ? (
                    <div style={{ color: "var(--muted)" }}>Aún no hay archivos adjuntos.</div>
                  ) : (
                    fileGroups.attachments.map((f) => (
                      <div key={f.id} className="fileRow">
                        <div className="fileIcon">{fileIcon(f)}</div>
                        <div className="fileMeta">
                          <div className="fileName">{f.filename}</div>
                          <div className="fileSub">{isoToNice(f.created_at)}</div>
                        </div>
                        <button className="smallBtn" onClick={() => actionOpenFile(f)}>
                          Abrir
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
{/* Modals */}
      {showConsentIntro ? (
        <ConsentIntroModal
          onClose={() => setShowConsentIntro(false)}
          onContinue={() => {
            setShowConsentIntro(false);
            setShowConsent(true);
          }}
        />
      ) : null}

      {showConsent ? (
        <ConsentModal
          onClose={() => setShowConsent(false)}
          professionalProfile={professionalProfile}
          onAccept={(consent) => {
            saveProfessionalProfile(professionalProfileFromConsent(consent));
            setPendingConsent(consent);
            setShowConsent(false);
            setShowCreate(true);
          }}
        />
      ) : null}

      {showCreate ? (
        <Modal onClose={() => { setShowCreate(false); setPendingConsent(null); }}>
          <PatientForm
            initial={{ name: "", doc_type: null, doc_number: null, insurer: null, birth_date: null, sex: null, phone: null, email: null, address: null, emergency_contact: null, notes: null, personal_history: null, antecedents_tags: null, antecedents_reviewed_at: null, personal_social_situation: null, medical_psych_history: null, family_history: null, work_academic_situation: null, judicial_situation: null }}
            onSave={onCreatePatient}
            onCancel={() => { setShowCreate(false); setPendingConsent(null); }}
            saveLabel="Crear paciente"
          />
        </Modal>
      ) : null}

      {showEdit && selected ? (
        <Modal title="Editar paciente" subtitle="Actualiza los datos del perfil." onClose={() => setShowEdit(false)}>
          <PatientForm
            initial={{
              name: selected.name,
              doc_type: selected.doc_type,
              doc_number: selected.doc_number,
              insurer: selected.insurer,
              birth_date: selected.birth_date,
              sex: selected.sex,
              phone: selected.phone,
              email: selected.email,
              address: selected.address,
              emergency_contact: selected.emergency_contact,
              notes: selected.notes,
              personal_history: selected.personal_history,
              antecedents_tags: selected.antecedents_tags,
              antecedents_reviewed_at: selected.antecedents_reviewed_at,
              personal_social_situation: selected.personal_social_situation,
              medical_psych_history: selected.medical_psych_history,
              family_history: selected.family_history,
              work_academic_situation: selected.work_academic_situation,
              judicial_situation: selected.judicial_situation,
            }}
            onSave={onUpdatePatient}
            onCancel={() => setShowEdit(false)}
            saveLabel="Guardar cambios"
          />
        </Modal>
      ) : null}

      {showExam && selected ? (
        <MentalExamModal
          patient={selected}
          consultaTipoDefault={consultaTipoDefault}
          onClose={() => setShowExam(false)}
          onCreated={async () => {
            await refreshFiles(selected.id);
            await refreshAllFiles();
            await refreshAppointments();
            pushToast({ type: "ok", msg: "Examen creado ✅" });
            startVT(() => setSection("examenes"));
          }}
        />
      ) : null}

      {showNote && selected ? (
        <NoteModal
          patient={selected}
          consultaTipoDefault={consultaTipoDefault}
          onClose={() => setShowNote(false)}
          onCreated={async () => {
            await refreshFiles(selected.id);
            await refreshAllFiles();
            await refreshAppointments();
            pushToast({ type: "ok", msg: "Nota creada ✅" });
            startVT(() => setSection("notas"));
          }}
        />
      ) : null}

      {showInitialAssessment && selected ? (
        <InitialAssessmentModal
          patient={selected}
          file={initialAssessmentFile}
          onClose={() => setShowInitialAssessment(false)}
          onSave={saveInitialAssessment}
        />
      ) : null}

      {previewFile ? <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} /> : null}

      {consentPreview ? (
        <Modal title="Consentimiento informado" subtitle="Registro asociado al paciente" onClose={() => setConsentPreview(null)}>
          <div className="modalBody">
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
              <button
                type="button"
                className="pillBtn primary"
                onClick={async () => {
                  try {
                    await generateConsentPdf(consentPreview);
                    pushToast({ type: "ok", msg: "PDF del consentimiento generado ✅" });
                  } catch (e) {
                    pushToast({ type: "err", msg: `No se pudo generar PDF: ${errMsg(e)}` });
                  }
                }}
              >
                Generar PDF
              </button>
            </div>
            <ConsentDocument value={consentPreview} />
            <div className="consentSignGrid">
              <div>
                <div className="consentSignLabel">Firma del paciente</div>
                {consentPreview.firma_paciente_data_url ? (
                  <img src={consentPreview.firma_paciente_data_url} alt="Firma paciente" className="consentSignImg" />
                ) : (
                  <div className="consentSignEmpty">Sin firma</div>
                )}
              </div>
              <div>
                <div className="consentSignLabel">Firma del psicólogo(a)</div>
                {consentPreview.firma_psicologo_data_url ? (
                  <img src={consentPreview.firma_psicologo_data_url} alt="Firma profesional" className="consentSignImg" />
                ) : (
                  <div className="consentSignEmpty">Sin firma</div>
                )}
              </div>
            </div>
          </div>
        </Modal>
      ) : null}


      <button
        className="floatingMenuBtn"
        type="button"
        onClick={() => setShowMenu(true)}
        aria-label="Abrir menú"
        title="Menú"
      >
        <span />
        <span />
        <span />
      </button>

      <button
        className="floatingMenuBtn"
        type="button"
        onClick={() => setShowMenu(true)}
        aria-label="Abrir menú"
        title="Menú"
      >
        <span />
        <span />
        <span />
      </button>

      {showMenu ? (
        <div className="menuGlassOverlay" onClick={() => setShowMenu(false)}>
          <section className="menuGlassPanel" onClick={(e) => e.stopPropagation()} aria-label="Menú principal">
            <header className="menuGlassHead">
              <div>
                <h3>Menú</h3>
                <p>Acciones principales de NAJU</p>
              </div>
              <button className="menuGlassClose" type="button" onClick={() => setShowMenu(false)} aria-label="Cerrar menú">✕</button>
            </header>

            <div className="menuGlassSection">
              <div className="menuSectionTitle">Acciones rápidas</div>
              <button className="menuQuickBtn" onClick={() => { beginCreatePatient(); setShowMenu(false); }}>
                <span className="menuIcon" aria-hidden="true">👤＋</span>
                <span>Nuevo paciente</span>
              </button>
            </div>

            <div className="menuGlassSection">
              <div className="menuSectionTitle">Navegación</div>
              <div className="menuNavList">
                {[
                  { key: "home", label: "Inicio" },
                  { key: "pacientes", label: "Pacientes" },
                  { key: "errores", label: "Errores" },
                  { key: "agenda", label: "Agenda / Citas" },
                ].map((item) => (
                  <button
                    key={item.key}
                    className={`menuNavItem ${page === item.key ? "isActive" : ""}`}
                    onClick={() => {
                      setPage(item.key as "home" | "pacientes" | "errores" | "agenda");
                      setShowMenu(false);
                    }}
                  >
                    <svg className="menuNavSvg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      {item.key === "home" ? <path d="M3 11.5L12 4l9 7.5v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /> : null}
                      {item.key === "pacientes" ? <><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M3.5 19c.8-3 2.8-4.5 5.5-4.5S13.7 16 14.5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M16 11h5M18.5 8.5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></> : null}
                      {item.key === "errores" ? <><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="16.5" r="1" fill="currentColor"/></> : null}
                      {item.key === "agenda" ? <><rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 3.8v2.8M16 3.8v2.8M4 10h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></> : null}
                    </svg>
                    <span>{item.label}</span>
                    {page === item.key ? <span className="menuNavCheck">✓</span> : null}
                  </button>
                ))}
              </div>
            </div>

            <div className="menuGlassSection">
              <div className="menuSectionTitle">Preferencias</div>
              <div className="menuPrefRow">
                <span>Tema oscuro / claro</span>
                <button className="menuToggle" type="button" onClick={toggleTheme} aria-label="Cambiar tema">
                  <span className={`menuToggleKnob ${theme === "dark" ? "isDark" : ""}`} />
                </button>
              </div>
              <div className="menuPaletteRow" aria-label="Cambiar tema de color">
                {Object.entries(APP_PALETTES).map(([key, palette]) => (
                  <button
                    key={key}
                    className={`menuPaletteDot ${colorTheme === key ? "isActive" : ""}`}
                    style={{ background: palette[theme].primary }}
                    onClick={() => setColorTheme(key as keyof typeof APP_PALETTES)}
                    aria-label={`Tema ${palette.name}`}
                    title={palette.name}
                  />
                ))}
              </div>
            </div>

            <div className="menuGlassSection">
              <div className="menuSectionTitle">Soporte</div>
              {updateAvailable ? (
                <button className="menuSupportBtn" onClick={() => { handleUpdateClick(); }} disabled={updateBusy}>{updateBusy ? "Actualizando…" : "Buscar actualización"}</button>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {/* Toast simple */}
      {toast ? (
        <div className={`toast ${toast.type === "err" ? "toastErr" : ""}`} role="status" aria-live="polite">
          <div className="toastTitle">{toast.type === "err" ? "Error" : "Listo"}</div>
          <div className="toastMsg">{toast.msg}</div>
        </div>
      ) : null}
    </div>
  );
}
