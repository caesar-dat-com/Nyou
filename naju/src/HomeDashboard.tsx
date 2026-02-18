import { useMemo, useState } from "react";
import type { Appointment, Patient, PatientFile } from "./lib/api";

type ProfileMeta = { values: number[]; accent: string; label: string | null };

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

export default function HomeDashboard(props: {
  patients: Patient[];
  allFiles: PatientFile[];
  appointments: Appointment[];
  profileByPatientMap: Map<string, ProfileMeta>;
  onAddPatient: () => void;
}) {
  const { patients, allFiles, appointments, profileByPatientMap } = props;
  const [monthCursor, setMonthCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const now = Date.now();

  const normalizeConsultaTipo = (value: unknown): "presencial" | "virtual" =>
    value === "virtual" ? "virtual" : "presencial";

  const axisMetaFields: Array<{ label: string; key: string; noteKey?: string }> = [
    { label: "Ánimo", key: "estado_de_animo", noteKey: "estado_animo" },
    { label: "Afecto", key: "afecto" },
    { label: "Orientación", key: "orientacion" },
    { label: "Memoria", key: "memoria" },
    { label: "Juicio", key: "juicio" },
    { label: "Riesgo", key: "riesgo" },
  ];

  const kpis = useMemo(() => {
    const nPatients = patients.length;

    const byPatientFiles = new Map<string, number>();
    const byPatientNotes = new Map<string, number>();
    const byPatientExams = new Map<string, number>();
    allFiles.forEach((f) => {
      const k = f.patient_id;
      if (f.kind === "photo") return;
      byPatientFiles.set(k, (byPatientFiles.get(k) || 0) + 1);
      if (f.kind === "note") byPatientNotes.set(k, (byPatientNotes.get(k) || 0) + 1);
      if (f.kind === "exam") byPatientExams.set(k, (byPatientExams.get(k) || 0) + 1);
    });

    const totalFiles = Array.from(byPatientFiles.values()).reduce((a, b) => a + b, 0);
    const totalNotes = Array.from(byPatientNotes.values()).reduce((a, b) => a + b, 0);
    const totalExams = Array.from(byPatientExams.values()).reduce((a, b) => a + b, 0);

    let notesPresencial = 0;
    let notesVirtual = 0;
    let examsPresencial = 0;
    let examsVirtual = 0;
    allFiles.forEach((f) => {
      if (f.kind !== "note" && f.kind !== "exam") return;
      let meta: any = null;
      if (f.meta_json) {
        try {
          meta = JSON.parse(f.meta_json);
        } catch {
          meta = null;
        }
      }
      const tipo = normalizeConsultaTipo(meta?.consulta_tipo);
      if (f.kind === "note") {
        if (tipo === "virtual") notesVirtual++;
        else notesPresencial++;
      }
      if (f.kind === "exam") {
        if (tipo === "virtual") examsVirtual++;
        else examsPresencial++;
      }
    });

    const avgFiles = nPatients ? totalFiles / nPatients : 0;
    const avgNotes = nPatients ? totalNotes / nPatients : 0;
    const avgExams = nPatients ? totalExams / nPatients : 0;

    function sumHoursWithin(days: number) {
      const max = now + days * 24 * 60 * 60 * 1000;
      let ms = 0;
      appointments.forEach((a) => {
        const s = new Date(a.start_iso).getTime();
        const e = new Date(a.end_iso).getTime();
        if (Number.isNaN(s) || Number.isNaN(e)) return;
        if (s >= now && s <= max && e > s) ms += (e - s);
      });
      return ms / (1000 * 60 * 60);
    }

    const hours7 = sumHoursWithin(7);
    const hours30 = sumHoursWithin(30);

    const stateCounts = new Map<string, number>();
    profileByPatientMap.forEach((meta) => {
      if (!meta?.label) return;
      stateCounts.set(meta.label, (stateCounts.get(meta.label) || 0) + 1);
    });
    const topStates = Array.from(stateCounts.entries()).sort((a, b) => b[1] - a[1]);
    const principalState = topStates[0]?.[0] || "—";

    const principalAxis = axisMetaFields.find((axis) => axis.label === principalState);
    const principalSubStateCounts = new Map<string, number>();

    if (principalAxis) {
      allFiles.forEach((file) => {
        if (file.kind !== "exam" && file.kind !== "note") return;
        if (!file.meta_json) return;
        try {
          const meta = JSON.parse(file.meta_json);
          const raw = meta?.[principalAxis.key] ?? (principalAxis.noteKey ? meta?.[principalAxis.noteKey] : undefined);
          const value = typeof raw === "string" ? raw.trim() : "";
          if (!value) return;
          principalSubStateCounts.set(value, (principalSubStateCounts.get(value) ?? 0) + 1);
        } catch {
          // ignore malformed metadata
        }
      });
    }

    const topPrincipalSubStates = Array.from(principalSubStateCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      nPatients,
      hours7,
      hours30,
      avgFiles,
      avgNotes,
      avgExams,
      principalState,
      topStates: topStates.slice(0, 4),
      topPrincipalSubStates,
      notesPresencial,
      notesVirtual,
      examsPresencial,
      examsVirtual,
    };
  }, [patients, allFiles, appointments, profileByPatientMap, now]);

  const patientNameById = useMemo(() => {
    const m = new Map<string, string>();
    patients.forEach((p) => m.set(p.id, p.name));
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

  const selectedDayAppointments = useMemo(() => {
    if (!selectedDayKey) return [];
    return apptByDay[selectedDayKey] || [];
  }, [apptByDay, selectedDayKey]);

  const suggestedAvgFiles = 6; // guía simple (ajustable)

  function fmtHours(h: number) {
    if (!h || h < 0.01) return "0 h";
    if (h < 10) return `${h.toFixed(1)} h`;
    return `${Math.round(h)} h`;
  }

  function fmtAvg(n: number) {
    if (!n || n < 0.01) return "0";
    if (n < 10) return n.toFixed(1);
    return String(Math.round(n));
  }

  const progressPct = Math.max(0, Math.min(100, (kpis.avgFiles / suggestedAvgFiles) * 100));

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="pillBtn primary" onClick={props.onAddPatient}>+ Paciente</button>
      </div>

      <div className="grid2">
        <div className="hoursSoftCard" style={{ order: 2 }} role="region" aria-label="Horas ocupadas">
          <div className="hoursSoftTitlePill">Horas ocupadas</div>

          <div className="hoursSoftRows">
            <div className="hoursSoftRow">
              <span className="hoursSoftKey">Próx 7 días</span>
              <span className="hoursSoftVal">{fmtHours(kpis.hours7)}</span>
            </div>
            <div className="hoursSoftRow">
              <span className="hoursSoftKey">Próx 30 días</span>
              <span className="hoursSoftVal">{fmtHours(kpis.hours30)}</span>
            </div>
          </div>

          <div style={{ height: 10 }} />

          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800, fontSize: 13 }}>Calendario de agenda</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button className="pillBtn" onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}>
                ◀
              </button>
              <div className="najuMonthPill">{monthLabel(monthCursor)}</div>
              <button className="pillBtn" onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}>
                ▶
              </button>
            </div>
          </div>

          <div style={{ height: 8 }} />

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
              const isSel = selectedDayKey === k;
              return (
                <button
                  key={k}
                  className={"najuCalCell " + (inMonth ? "" : "isDim ") + (isSel ? "isSel" : "")}
                  onClick={() => setSelectedDayKey(isSel ? null : k)}
                  title={k}
                >
                  <div className="najuCalNum">{d.getDate()}</div>
                  {count ? <div className="najuCalCount">{count}</div> : null}
                </button>
              );
            })}
          </div>

          {selectedDayKey ? (
            <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <b style={{ fontSize: 13 }}>Citas del {selectedDayKey}</b>
                <button className="smallBtn" onClick={() => setSelectedDayKey(null)}>
                  Cerrar
                </button>
              </div>
              {selectedDayAppointments.length === 0 ? (
                <div style={{ color: "var(--muted)", fontSize: 13 }}>Sin citas.</div>
              ) : (
                <div className="list">
                  {selectedDayAppointments.map((a) => (
                    <div key={a.id} className="fileRow">
                      <div className="fileIcon">📅</div>
                      <div className="fileMeta">
                        <div className="fileName">{a.title} · {patientNameById.get(a.patient_id) || "Paciente"}</div>
                        <div className="fileSub">{new Date(a.start_iso).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="card" style={{ order: 1 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Resumen principal</div>

          <div style={{ borderTop: "1px solid var(--line)", margin: "2px 0 12px" }} />

          <div className="mainStateHead">
            <div style={{ fontWeight: 900 }}>Estado principal</div>
            {kpis.topPrincipalSubStates.length ? (
              <div className="mainStateTopSubList" aria-label="Subestados principales">
                {kpis.topPrincipalSubStates.map(([label, count]) => (
                  <div key={label} className="mainStateTopSubItem">
                    <span className="mainStateTopSubLabel">{label}</span>
                    <span className="mainStateTopSubCount">{count}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="kpiBig" style={{ fontSize: 34, lineHeight: 1.1 }}>{kpis.principalState}</div>
          <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>
            Etiqueta dominante más frecuente (según exámenes). A su lado verás los 3 subestados más frecuentes de este estado.
          </div>

          <div style={{ height: 10 }} />

          {kpis.topStates.length ? (
            <div style={{ display: "grid", gap: 8 }}>
              {kpis.topStates.map(([label, count]) => (
                <div key={label} className="stateRow">
                  <div className="stateName">{label}</div>
                  <div className="stateCount">{count}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "var(--muted)" }}>Aún no hay suficiente información de exámenes.</div>
          )}

          <div style={{ borderTop: "1px solid var(--line)", margin: "14px 0 12px" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
            <div style={{ fontWeight: 900 }}>Seguimiento</div>
            <div style={{ textAlign: "right" }}>
              <div className="kpiBig" style={{ lineHeight: 1 }}>{kpis.nPatients}</div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>Total registrados en NAJU.</div>
            </div>
          </div>

          <div className="kv">
            <div className="k">Promedio archivos / paciente</div>
            <div className="v">{fmtAvg(kpis.avgFiles)}</div>
          </div>
          <div className="progress" aria-label="Progreso de documentación">
            <div className="progressFill" style={{ width: `${progressPct}%` }} />
          </div>
          <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5, marginTop: 8 }}>
            Guía sugerida: {suggestedAvgFiles} archivos por paciente (notas, exámenes, adjuntos).
          </div>

          <div style={{ height: 10 }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="kpiBox">
              <div className="kpiLabel">Prom. notas</div>
              <div className="kpiValue">{fmtAvg(kpis.avgNotes)}</div>
            </div>
            <div className="kpiBox">
              <div className="kpiLabel">Prom. exámenes</div>
              <div className="kpiValue">{fmtAvg(kpis.avgExams)}</div>
            </div>
          </div>

          <div style={{ height: 10 }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="kpiBox">
              <div className="kpiLabel">Notas presenciales / virtuales</div>
              <div className="kpiValue">{kpis.notesPresencial} / {kpis.notesVirtual}</div>
            </div>
            <div className="kpiBox">
              <div className="kpiLabel">Exámenes presenciales / virtuales</div>
              <div className="kpiValue">{kpis.examsPresencial} / {kpis.examsVirtual}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Cómo registrar una sesión</div>
          <div className="helpSteps">
            <div className="helpStep">
              <div className="helpDot">1</div>
              <div><b>Crea o selecciona</b> un paciente.</div>
            </div>
            <div className="helpStep">
              <div className="helpDot">2</div>
              <div>En <b>Citas</b>, programa la próxima sesión (fecha, duración, notas).</div>
            </div>
            <div className="helpStep">
              <div className="helpDot">3</div>
              <div>En <b>Notas</b>, registra lo tratado y acuerdos (puedes transcribir audio).</div>
            </div>
            <div className="helpStep">
              <div className="helpDot">4</div>
              <div>En <b>Exámenes</b>, completa un examen mental cada 4–6 sesiones.</div>
            </div>
            <div className="helpStep">
              <div className="helpDot">5</div>
              <div>En <b>Archivos</b>, adjunta consentimientos, pruebas, reportes y soportes.</div>
            </div>
          </div>

          <div style={{ height: 12 }} />
          <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
            Consejo: prioriza consistencia. Una nota por sesión y exámenes periódicos mejoran el seguimiento.
          </div>
        </div>
      </div>
    </div>
  );
}
