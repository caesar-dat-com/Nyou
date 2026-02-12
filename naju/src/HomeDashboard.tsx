import { useMemo } from "react";
import type { Appointment, Patient, PatientFile } from "./lib/api";

type ProfileMeta = { values: number[]; accent: string; label: string | null };

export default function HomeDashboard(props: {
  patients: Patient[];
  allFiles: PatientFile[];
  appointments: Appointment[];
  profileByPatientMap: Map<string, ProfileMeta>;
  onAddPatient: () => void;
  onGoAgenda: () => void;
}) {
  const { patients, allFiles, appointments, profileByPatientMap } = props;

  const now = Date.now();

  const normalizeConsultaTipo = (value: unknown): "presencial" | "virtual" =>
    value === "virtual" ? "virtual" : "presencial";

  const upcoming = useMemo(() => {
    const list = appointments
      .filter((a) => {
        const t = new Date(a.start_iso).getTime();
        return !Number.isNaN(t) && t >= now;
      })
      .slice()
      .sort((a, b) => a.start_iso.localeCompare(b.start_iso));
    return list.slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments.length]);

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

    return {
      nPatients,
      hours7,
      hours30,
      avgFiles,
      avgNotes,
      avgExams,
      principalState,
      topStates: topStates.slice(0, 4),
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
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Inicio</div>
            <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
              Panel del psicólogo: indicadores rápidos, agenda y acciones frecuentes.
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button className="pillBtn primary" onClick={props.onAddPatient}>+ Paciente</button>
            <button className="pillBtn" onClick={props.onGoAgenda}>📅 Agenda</button>
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Pacientes</div>
          <div className="kpiBig">{kpis.nPatients}</div>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>Total registrados en NAJU.</div>
        </div>

        <div className="card">
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Horas ocupadas</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="kpiBox">
              <div className="kpiLabel">Próximos 7 días</div>
              <div className="kpiValue">{fmtHours(kpis.hours7)}</div>
            </div>
            <div className="kpiBox">
              <div className="kpiLabel">Próximos 30 días</div>
              <div className="kpiValue">{fmtHours(kpis.hours30)}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Seguimiento</div>

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

        <div className="card">
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Estado principal</div>
          <div className="kpiBig">{kpis.principalState}</div>
          <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>
            Etiqueta dominante más frecuente (según exámenes).
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
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Próximas citas</div>
          {upcoming.length === 0 ? (
            <div style={{ color: "var(--muted)" }}>No hay citas programadas.</div>
          ) : (
            <div className="list">
              {upcoming.map((a) => (
                <div key={a.id} className="fileRow">
                  <div className="fileIcon">📅</div>
                  <div className="fileMeta">
                    <div className="fileName">
                      {a.title} · {patientNameById.get(a.patient_id) || "Paciente"}
                    </div>
                    <div className="fileSub">{new Date(a.start_iso).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

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
