import { useEffect, useState, useRef } from "react";
import { Lock, Plus, X, FlaskConical, Shield, Sparkles, ChevronRight, Loader2, CheckCircle, XCircle, RotateCcw, ThumbsUp, ThumbsDown, Clock } from "lucide-react";
import { supabase } from "../supabaseClient";

const BULK_WEBHOOK = "https://rosegoldprojectai3.app.n8n.cloud/webhook/69e2536c-9bfe-4bcc-b6cf-d28aaec6865d";

interface AgentPrompt { id: string; user_id: string; prompt_text: string; score: number; status: string; scoring_report: any; }
interface Criteria { id: string; text: string; type: "universal" | "ai" | "custom"; selected: boolean; }

interface ScenarioMemoryRow {
  id: string;
  scenario_id: string;
  input_message: string;
  criteria_id: string;
  memory_snapshot: any;
  status: string;
  created_at: string;
}

interface ScenarioResult {
  id: string;
  scenario_id: string;
  input_message: string | null;
  agent_response: string | null;
  content_score: number | null;
  behavior_score: number | null;
  final_score: number | null;
  issues: string[];
  summary: string | null;
  status: string | null;
  created_at: string;
}

interface TestRun {
  id: string;
  status: string;
  current_step: string | null;
  final_score: number | null;
  completed_scenarios: number | null;
}

// ─── Sort scenarios by scenario_id number (scen_001 < scen_002 etc) ───
function sortByScenarioId<T extends { scenario_id: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    const numA = parseInt(a.scenario_id.split("_")[1] || "0", 10);
    const numB = parseInt(b.scenario_id.split("_")[1] || "0", 10);
    return numA - numB;
  });
}

// ─── Typewriter hook ───
function useTypewriter(text: string, speed = 14, delay = 0) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const iRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    iRef.current = 0;

    if (!text) { setDone(true); return; }

    const startTimer = setTimeout(() => {
      function tick() {
        iRef.current += 1;
        setDisplayed(text.slice(0, iRef.current));
        if (iRef.current >= text.length) {
          setDone(true);
        } else {
          timerRef.current = setTimeout(tick, speed);
        }
      }
      tick();
    }, delay);

    return () => {
      clearTimeout(startTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, speed, delay]);

  return { displayed, done };
}

// ─── Single generating line ───
function GeneratingLine({ text, index, visibleUpTo }: { text: string; index: number; visibleUpTo: number }) {
  const isVisible = index < visibleUpTo;
  const { displayed, done } = useTypewriter(isVisible ? text : "", 13, 0);

  if (!isVisible) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, animation: "slideInRow 0.3s ease both" }}>
      <span style={{ fontSize: 11, color: "rgba(99,102,241,0.4)", fontFamily: "monospace", minWidth: 20 }}>
        {String(index + 1).padStart(2, "0")}
      </span>
      <span style={{ fontSize: 12, color: done ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.45)", fontFamily: "monospace", flex: 1 }}>
        {displayed}
        {!done && <span style={{ display: "inline-block", width: 6, height: 12, background: "#6366F1", marginLeft: 2, verticalAlign: "middle", animation: "cursorBlink 0.6s ease-in-out infinite" }} />}
      </span>
      {done && <span style={{ fontSize: 9, color: "rgba(16,185,129,0.6)", fontWeight: 700 }}>✓</span>}
    </div>
  );
}

// ─── Single scenario live card ───
function LiveScenarioCard({ scenario, result, index, visibleUpTo }: {
  scenario: ScenarioMemoryRow; result?: ScenarioResult; index: number; visibleUpTo: number;
}) {
  const isVisible = index < visibleUpTo;
  const hasResult = !!result;
  const agentText = result?.agent_response ?? "";
  const { displayed: agentTyped, done: agentDone } = useTypewriter(
    isVisible && hasResult ? agentText : "", 11, isVisible && hasResult ? 800 : 0
  );

  if (!isVisible) return null;

  const score = result?.final_score ?? null;
  const passed = result?.status === "pass";
  const scoreColor = score !== null ? (score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444") : "#6B7280";

  return (
    <div style={{ animation: "slideInScenario 0.5s cubic-bezier(0.16,1,0.3,1) both", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
          background: hasResult ? (passed ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)") : "rgba(99,102,241,0.12)",
          border: `1.5px solid ${hasResult ? (passed ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.3)") : "rgba(99,102,241,0.3)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 800,
          color: hasResult ? (passed ? "#10B981" : "#EF4444") : "#6366F1",
        }}>{index + 1}</div>
        <div style={{ flex: 1, height: 1, background: hasResult ? (passed ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.15)") : "rgba(99,102,241,0.1)" }} />
        {hasResult && agentDone && (
          <div style={{ animation: "fadeInScore 0.4s ease both" }}>
            <div style={{
              padding: "3px 10px", borderRadius: 20,
              background: passed ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${passed ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)"}`,
              fontSize: 11, fontWeight: 800, color: scoreColor,
              display: "flex", alignItems: "center", gap: 5,
            }}>
              {passed ? <CheckCircle size={10} /> : <XCircle size={10} />}
              {Math.round(score!)} — {passed ? "Pass" : "Fail"}
            </div>
          </div>
        )}
        {!hasResult && (
          <div style={{ display: "flex", gap: 3 }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(99,102,241,0.3)", animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
          </div>
        )}
      </div>

      <div style={{ background: "rgba(8,8,18,0.85)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden", backdropFilter: "blur(20px)" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#818CF8" }}>L</div>
            <div>
              <div style={{ fontSize: 9, color: "rgba(129,140,248,0.5)", fontWeight: 600, marginBottom: 4, letterSpacing: "0.5px", textTransform: "uppercase" as const }}>Lead</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.55 }}>{scenario.input_message}</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: hasResult ? (passed ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)") : "rgba(99,102,241,0.08)",
              border: `1px solid ${hasResult ? (passed ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.25)") : "rgba(99,102,241,0.15)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700,
              color: hasResult ? (passed ? "#10B981" : "#EF4444") : "rgba(99,102,241,0.4)",
              transition: "all 0.4s ease",
            }}>A</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: hasResult ? (passed ? "rgba(16,185,129,0.6)" : "rgba(239,68,68,0.5)") : "rgba(99,102,241,0.35)", fontWeight: 600, marginBottom: 4, letterSpacing: "0.5px", textTransform: "uppercase" as const }}>Agent</div>
              {!hasResult ? (
                <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "4px 0" }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(99,102,241,0.25)", animation: `dotBounce 1.4s ease-in-out ${i * 0.18}s infinite` }} />)}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, whiteSpace: "pre-wrap" as const }}>
                  {agentTyped}
                  {!agentDone && <span style={{ display: "inline-block", width: 2, height: 14, background: "#6366F1", marginLeft: 2, animation: "cursorBlink 0.7s ease-in-out infinite", verticalAlign: "middle" }} />}
                </div>
              )}
            </div>
          </div>
        </div>
        {hasResult && agentDone && result?.issues?.length > 0 && (
          <div style={{ padding: "8px 16px", borderTop: "1px solid rgba(239,68,68,0.12)", background: "rgba(239,68,68,0.04)", animation: "fadeInScore 0.5s ease 0.3s both" }}>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
              {result.issues.map((issue, i) => (
                <span key={i} style={{ fontSize: 9, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "rgba(239,68,68,0.08)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.18)" }}>{issue}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Phase 2: Live Testing ───
function PhaseLiveTesting({ testRunId, totalExpected, onComplete }: {
  testRunId: string; totalExpected: number;
  onComplete: (testRun: TestRun, results: ScenarioResult[]) => void;
}) {
  const [scenarios, setScenarios] = useState<ScenarioMemoryRow[]>([]);
  const [results, setResults] = useState<ScenarioResult[]>([]);
  const [testRun, setTestRun] = useState<TestRun | null>(null);
  const [stage, setStage] = useState<"generating" | "testing">("generating");
  const [visibleScenarios, setVisibleScenarios] = useState(0);
  const [visibleResults, setVisibleResults] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    if (scenarios.length === 0) return;
    if (visibleScenarios >= scenarios.length) return;
    const timer = setTimeout(() => setVisibleScenarios(v => v + 1), visibleScenarios === 0 ? 200 : 700);
    return () => clearTimeout(timer);
  }, [scenarios.length, visibleScenarios]);

  useEffect(() => {
    if (results.length === 0) return;
    if (visibleResults >= results.length) return;
    const timer = setTimeout(() => setVisibleResults(v => v + 1), visibleResults === 0 ? 300 : 2800);
    return () => clearTimeout(timer);
  }, [results.length, visibleResults]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [visibleScenarios, visibleResults]);

  useEffect(() => {
    async function poll() {
      const { data: runData } = await supabase.from("test_runs").select("id, status, current_step, final_score, completed_scenarios").eq("id", testRunId).single();
      if (runData) {
        setTestRun(runData as TestRun);
        if (runData.current_step === "running_scenarios" || runData.current_step === "complete") setStage("testing");
      }
      const { data: scenData } = await supabase.from("scenario_memory").select("*").eq("test_run_id", testRunId).order("scenario_id", { ascending: true });
      if (scenData) setScenarios(sortByScenarioId(scenData as ScenarioMemoryRow[]));
      const { data: resData } = await supabase.from("scenario_results").select("*").eq("test_run_id", testRunId).order("scenario_id", { ascending: true });
      if (resData) setResults(sortByScenarioId(resData as ScenarioResult[]));

      if (runData?.current_step === "complete" && !completedRef.current) {
        completedRef.current = true;
        clearInterval(pollRef.current!);
        const { data: finalScenarios } = await supabase.from("scenario_memory").select("*").eq("test_run_id", testRunId).order("scenario_id", { ascending: true });
        const { data: finalResults } = await supabase.from("scenario_results").select("*").eq("test_run_id", testRunId).order("scenario_id", { ascending: true });
        if (finalScenarios) setScenarios(sortByScenarioId(finalScenarios as ScenarioMemoryRow[]));
        if (finalResults) setResults(sortByScenarioId(finalResults as ScenarioResult[]));
        const totalDelay = 3500 + (finalResults?.length ?? 0) * 200;
        setTimeout(() => onComplete(runData as TestRun, (finalResults ?? []) as ScenarioResult[]), totalDelay);
      }
    }
    pollRef.current = setInterval(poll, 2500);
    poll();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [testRunId]);

  const resultMap = new Map(results.map(r => [r.scenario_id, r]));
  const completedCount = results.filter(r => r.final_score !== null).length;
  const progress = stage === "generating"
    ? scenarios.length > 0 ? Math.min((scenarios.length / totalExpected) * 40, 38) : 5
    : 40 + Math.min((completedCount / totalExpected) * 58, 57);
  const stageLabel = stage === "generating" ? `Generating scenarios... (${scenarios.length}/${totalExpected})` : `Testing agent live... (${completedCount}/${scenarios.length})`;

  return (
    <div style={{ background: "rgba(8,8,18,0.96)", borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 24px 80px rgba(0,0,0,0.4)", minHeight: 500 }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.8 }} />)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", marginBottom: 6 }}>{stageLabel}</div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 3, background: "linear-gradient(90deg, #6366F1, #8B5CF6, #06B6D4)", width: `${progress}%`, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)", boxShadow: "0 0 12px rgba(99,102,241,0.6)" }} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", animation: "pulse 1.5s ease-in-out infinite" }} />
          <span style={{ fontSize: 10, color: "rgba(16,185,129,0.7)", fontWeight: 600, fontFamily: "monospace" }}>LIVE</span>
        </div>
      </div>

      <div style={{ padding: "20px 24px", maxHeight: 600, overflowY: "auto" as const }}>
        {scenarios.length > 0 && (
          <div style={{ marginBottom: stage === "testing" ? 24 : 0 }}>
            <div style={{ fontSize: 10, color: "rgba(99,102,241,0.5)", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 12, fontFamily: "monospace" }}>⚡ Scenario Generation</div>
            <div style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.1)", borderRadius: 10, padding: "12px 16px" }}>
              {scenarios.map((s, i) => <GeneratingLine key={s.id} text={s.input_message} index={i} visibleUpTo={visibleScenarios} />)}
            </div>
          </div>
        )}
        {stage === "testing" && scenarios.length > 0 && (
          <div>
            <div style={{ fontSize: 10, color: "rgba(16,185,129,0.5)", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 16, fontFamily: "monospace" }}>🤖 Live Agent Testing</div>
            {scenarios.map((s, i) => (
              <LiveScenarioCard key={s.scenario_id} scenario={s} result={resultMap.get(s.scenario_id)} index={i} visibleUpTo={visibleResults} />
            ))}
          </div>
        )}
        {scenarios.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 12 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(99,102,241,0.3)", animation: `dotBounce 1.4s ease-in-out ${i * 0.2}s infinite` }} />)}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>Initializing test engine...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─── Phase 1: Criteria Selection ───
function PhaseSelectCriteria({ criteria, setCriteria, onRun, running }: {
  criteria: Criteria[]; setCriteria: React.Dispatch<React.SetStateAction<Criteria[]>>;
  onRun: () => void; running: boolean; userId: string;
}) {
  const [customInput, setCustomInput] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);
  const selectedCount = criteria.filter(c => c.selected).length;

  const colorMap = {
    universal: { bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)", label: "Universal", labelColor: "#7C3AED", labelBg: "rgba(139,92,246,0.1)", icon: <Shield size={14} color="#7C3AED" /> },
    ai: { bg: "rgba(8,145,178,0.06)", border: "rgba(8,145,178,0.18)", label: "AI Generated", labelColor: "#0891B2", labelBg: "rgba(8,145,178,0.08)", icon: <Sparkles size={14} color="#0891B2" /> },
    custom: { bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.18)", label: "Custom", labelColor: "#059669", labelBg: "rgba(5,150,105,0.08)", icon: <Plus size={14} color="#059669" /> },
  };

  function toggle(id: string) { setCriteria(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c)); }
  function remove(id: string) { setCriteria(prev => prev.filter(c => c.id !== id)); }
  function addCustom() {
    const text = customInput.trim();
    if (!text) return;
    setCriteria(prev => [...prev, { id: `custom_${Date.now()}`, text, type: "custom", selected: true }]);
    setCustomInput(""); setAddingCustom(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{
        background: "linear-gradient(145deg, rgba(255,255,255,0.72), rgba(255,255,255,0.45))",
        backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
        border: "1px solid rgba(255,255,255,0.75)", borderRadius: 20, padding: "20px 24px",
        boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.9), 0 4px 32px rgba(99,102,241,0.08)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
            <FlaskConical size={20} color="#7C3AED" />
            <span style={{ fontSize: 18, fontWeight: 800, color: "#111827", letterSpacing: "-0.3px" }}>Quality Test</span>
          </div>
          <div style={{ fontSize: 13, color: "rgba(60,40,120,0.55)", lineHeight: 1.5 }}>
            Select the criteria to evaluate. Your agent will be tested live against each one.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ padding: "6px 14px", borderRadius: 20, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)", fontSize: 12, fontWeight: 700, color: "#4F46E5" }}>{selectedCount} selected</div>
          <button onClick={onRun} disabled={running || selectedCount === 0} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "10px 22px", borderRadius: 12, border: "none",
            background: selectedCount > 0 && !running ? "linear-gradient(135deg, #6D28D9, #4F46E5)" : "rgba(255,255,255,0.4)",
            color: selectedCount > 0 && !running ? "#fff" : "rgba(99,102,241,0.35)",
            fontSize: 13, fontWeight: 700, cursor: selectedCount > 0 && !running ? "pointer" : "default",
            fontFamily: "'DM Sans',sans-serif",
            boxShadow: selectedCount > 0 && !running ? "0 4px 20px rgba(99,102,241,0.35)" : "none",
            transition: "all 0.2s",
          }}>
            {running ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <ChevronRight size={14} />}
            {running ? "Starting..." : "Run Test"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {criteria.map(c => {
          const col = colorMap[c.type];
          const isUniversal = c.type === "universal";
          return (
            <div key={c.id} onClick={() => !isUniversal && toggle(c.id)} style={{
              background: c.selected ? "linear-gradient(145deg, rgba(255,255,255,0.82), rgba(255,255,255,0.6))" : "rgba(255,255,255,0.35)",
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              border: `1px solid ${c.selected ? col.border : "rgba(255,255,255,0.5)"}`,
              borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10,
              opacity: c.selected ? 1 : 0.6, transition: "all 0.2s",
              cursor: isUniversal ? "default" : "pointer",
              boxShadow: c.selected ? `inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 16px ${col.bg}` : "none",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: col.bg, border: `1px solid ${col.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{col.icon}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: col.labelBg, color: col.labelColor, border: `1px solid ${col.border}` }}>{col.label}</span>
                  {isUniversal && <Lock size={9} color="#7C3AED" />}
                  {!isUniversal && <div onClick={e => { e.stopPropagation(); remove(c.id); }} style={{ cursor: "pointer", display: "flex" }}><X size={10} color="#DC2626" /></div>}
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#1A1916", fontWeight: 500, lineHeight: 1.5 }}>{c.text}</div>
              <div style={{ fontSize: 10, color: "rgba(60,40,120,0.45)" }}>{isUniversal ? "🔒 Always tested" : c.selected ? "✓ Will be tested" : "Skipped"}</div>
            </div>
          );
        })}

        {addingCustom ? (
          <div style={{ background: "rgba(255,255,255,0.6)", border: "1.5px solid rgba(5,150,105,0.3)", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <textarea autoFocus value={customInput} onChange={e => setCustomInput(e.target.value)} placeholder="Describe your custom criteria..."
              style={{ border: "1px solid rgba(255,255,255,0.7)", borderRadius: 10, padding: "8px 10px", fontSize: 12, color: "#111827", outline: "none", fontFamily: "'DM Sans',sans-serif", background: "rgba(255,255,255,0.7)", resize: "none", minHeight: 72 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={addCustom} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #059669, #0D9488)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Add</button>
              <button onClick={() => { setAddingCustom(false); setCustomInput(""); }} style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: "1px solid rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.5)", color: "rgba(60,40,120,0.6)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div onClick={() => setAddingCustom(true)}
            style={{ background: "rgba(255,255,255,0.25)", border: "1.5px dashed rgba(99,102,241,0.25)", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", minHeight: 120, transition: "all 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.45)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
          >
            <Plus size={18} color="rgba(99,102,241,0.4)" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(60,40,120,0.45)" }}>Add custom criteria</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Phase 3: Final Report ───
function PhaseFinalReport({ testRun, results, onRetest, onSatisfied }: {
  testRun: TestRun; results: ScenarioResult[];
  onRetest: () => void; onSatisfied?: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const score = testRun.final_score ?? 0;
  const scoreColor = score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444";
  const verdict = testRun.status === "approved" ? "approved" : testRun.status === "needs_improvement" ? "needs_improvement" : "blocked";
  const verdictConfig = {
    approved: { label: "✓ Agent Approved", sub: "Ready to publish", color: "#10B981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
    needs_improvement: { label: "⚠ Needs Improvement", sub: "Review the issues below", color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
    blocked: { label: "✗ Agent Blocked", sub: "Significant issues found", color: "#EF4444", bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.18)" },
  }[verdict];

  const sortedResults = sortByScenarioId(results);
  const passCount = sortedResults.filter(r => r.status === "pass").length;
  const failCount = sortedResults.filter(r => r.status === "fail").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn 0.6s ease both" }}>
      {/* Score card */}
      <div style={{
        background: "linear-gradient(145deg, rgba(255,255,255,0.75), rgba(255,255,255,0.5))",
        backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
        border: "1px solid rgba(255,255,255,0.8)", borderRadius: 20, padding: "28px 28px",
        boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.9), 0 8px 40px rgba(99,102,241,0.1)",
        display: "flex", alignItems: "center", gap: 28,
      }}>
        {/* Donut */}
        <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
          {(() => {
            const r = 42; const circ = 2 * Math.PI * r; const fill = (score / 100) * circ;
            return (
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="8" />
                <circle cx="50" cy="50" r={r} fill="none" stroke={scoreColor} strokeWidth="8"
                  strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
                  transform="rotate(-90 50 50)" style={{ transition: "stroke-dasharray 1.5s cubic-bezier(0.4,0,0.2,1)" }} />
              </svg>
            );
          })()}
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: "#111827", lineHeight: 1 }}>{Math.round(score)}</span>
            <span style={{ fontSize: 10, color: "rgba(99,102,241,0.5)", fontWeight: 600 }}>/100</span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 12, marginBottom: 14, background: verdictConfig.bg, border: `1px solid ${verdictConfig.border}` }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: verdictConfig.color }}>{verdictConfig.label}</span>
            <span style={{ fontSize: 11, color: verdictConfig.color, opacity: 0.7 }}>— {verdictConfig.sub}</span>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { label: "Scenarios", value: sortedResults.length, color: "#4F46E5" },
              { label: "Passed", value: passCount, color: "#10B981" },
              { label: "Failed", value: failCount, color: "#EF4444" },
              { label: "Avg Score", value: `${Math.round(score)}`, color: scoreColor },
            ].map((stat, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.6)", borderRadius: 12, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)" }}>
                <div style={{ fontSize: 9, color: "rgba(99,102,241,0.5)", textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 3, fontWeight: 700 }}>{stat.label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 3-Choice Satisfaction Block ─────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(145deg, rgba(255,255,255,0.72), rgba(255,255,255,0.45))",
        backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
        border: "1px solid rgba(255,255,255,0.75)", borderRadius: 20, padding: "28px 28px",
        boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.9), 0 4px 24px rgba(99,102,241,0.07)",
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 6 }}>What do you want to do next?</div>
        <div style={{ fontSize: 13, color: "rgba(60,40,120,0.55)", marginBottom: 24 }}>
          Review the results above and decide what's next for your agent.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          {/* ✅ Satisfied */}
          <button
            onClick={onSatisfied}
            style={{
              padding: "18px 16px", borderRadius: 16, border: "1.5px solid rgba(16,185,129,0.3)",
              background: "rgba(16,185,129,0.06)", cursor: "pointer", textAlign: "left" as const,
              transition: "all 0.2s", fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.12)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(16,185,129,0.2)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.06)"; (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <ThumbsUp size={16} color="#10B981" strokeWidth={2} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 4 }}>I'm satisfied</div>
            <div style={{ fontSize: 11, color: "rgba(60,40,120,0.5)", lineHeight: 1.6 }}>Certify my agent and unlock My Workflows</div>
          </button>

          {/* 🔧 Not satisfied */}
          <button
            onClick={onRetest}
            style={{
              padding: "18px 16px", borderRadius: 16, border: "1.5px solid rgba(239,68,68,0.2)",
              background: "rgba(239,68,68,0.04)", cursor: "pointer", textAlign: "left" as const,
              transition: "all 0.2s", fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.09)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(239,68,68,0.15)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.04)"; (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <ThumbsDown size={16} color="#EF4444" strokeWidth={2} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Not satisfied</div>
            <div style={{ fontSize: 11, color: "rgba(60,40,120,0.5)", lineHeight: 1.6 }}>Run the test again with different criteria</div>
          </button>

          {/* ⏳ Come back later */}
          <button
            style={{
              padding: "18px 16px", borderRadius: 16, border: "1.5px solid rgba(99,102,241,0.15)",
              background: "rgba(99,102,241,0.04)", cursor: "pointer", textAlign: "left" as const,
              transition: "all 0.2s", fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.08)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(99,102,241,0.04)"; (e.currentTarget as HTMLElement).style.transform = ""; }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Clock size={16} color="#6366F1" strokeWidth={2} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 4 }}>I'll come back later</div>
            <div style={{ fontSize: 11, color: "rgba(60,40,120,0.5)", lineHeight: 1.6 }}>Save the results and decide later</div>
          </button>
        </div>
      </div>

      {/* Scenario results table */}
      <div style={{
        background: "linear-gradient(145deg, rgba(255,255,255,0.68), rgba(255,255,255,0.42))",
        backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
        border: "1px solid rgba(255,255,255,0.75)", borderRadius: 20, overflow: "hidden",
        boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.9), 0 4px 32px rgba(99,102,241,0.06)",
      }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(255,255,255,0.5)" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Scenario Results</div>
          <div style={{ fontSize: 11, color: "rgba(99,102,241,0.5)", marginTop: 2 }}>Click any row to view the full conversation log</div>
        </div>

        {sortedResults.map((result, i) => {
          const isExpanded = expandedId === result.id;
          const passed = result.status === "pass";
          const sc = result.final_score ?? 0;
          const sc_color = sc >= 80 ? "#10B981" : sc >= 60 ? "#F59E0B" : "#EF4444";

          return (
            <div key={result.id} style={{ borderBottom: i < sortedResults.length - 1 ? "1px solid rgba(255,255,255,0.5)" : "none" }}>
              <div onClick={() => setExpandedId(isExpanded ? null : result.id)} style={{
                display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 22px",
                cursor: "pointer", transition: "background 0.15s",
                background: i % 2 === 0 ? "rgba(255,255,255,0.15)" : "transparent",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.35)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? "rgba(255,255,255,0.15)" : "transparent"; }}
              >
                <div style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, border: `2.5px solid ${sc_color}`, background: `${sc_color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: sc_color }}>{Math.round(sc)}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" as const }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>Scenario {i + 1}</span>
                    <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, fontWeight: 700, background: passed ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.06)", color: passed ? "#10B981" : "#EF4444", border: `1px solid ${passed ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.15)"}`, display: "flex", alignItems: "center", gap: 3 }}>
                      {passed ? <CheckCircle size={8} /> : <XCircle size={8} />}{passed ? "Pass" : "Fail"}
                    </span>
                    <span style={{ fontSize: 9, color: "rgba(99,102,241,0.5)", padding: "2px 7px", borderRadius: 20, background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}>Content {Math.round(result.content_score ?? 0)}</span>
                    <span style={{ fontSize: 9, color: "rgba(8,145,178,0.7)", padding: "2px 7px", borderRadius: 20, background: "rgba(8,145,178,0.05)", border: "1px solid rgba(8,145,178,0.12)" }}>Behavior {Math.round(result.behavior_score ?? 0)}</span>
                  </div>
                  {result.summary && <div style={{ fontSize: 11, color: "rgba(60,40,120,0.6)", lineHeight: 1.5 }}>{result.summary}</div>}
                  {result.issues?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4, marginTop: 5 }}>
                      {result.issues.map((issue, j) => <span key={j} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: "rgba(239,68,68,0.06)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.15)", fontWeight: 600 }}>{issue}</span>)}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 9, color: "rgba(99,102,241,0.35)", flexShrink: 0, marginTop: 2 }}>{isExpanded ? "▲" : "▼"}</div>
              </div>

              {isExpanded && (
                <div style={{ padding: "0 22px 16px", display: "flex", flexDirection: "column", gap: 8, animation: "fadeIn 0.2s ease both" }}>
                  {result.input_message && (
                    <div style={{ background: "rgba(99,102,241,0.04)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(99,102,241,0.1)" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#4F46E5", textTransform: "uppercase" as const, letterSpacing: "0.6px", marginBottom: 5 }}>📩 Lead Message</div>
                      <div style={{ fontSize: 12, color: "#111827", lineHeight: 1.55 }}>{result.input_message}</div>
                    </div>
                  )}
                  {result.agent_response && (
                    <div style={{ background: "rgba(5,150,105,0.03)", borderRadius: 10, padding: "10px 14px", border: "1px solid rgba(5,150,105,0.1)" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: "#059669", textTransform: "uppercase" as const, letterSpacing: "0.6px", marginBottom: 5 }}>🤖 Agent Response</div>
                      <div style={{ fontSize: 12, color: "#111827", lineHeight: 1.55 }}>{result.agent_response}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main BulkTesting component ───
export function BulkTesting({ userId, prompt, universalCriteria, onComplete, onSatisfied, onBack }: {
  userId: string;
  prompt?: AgentPrompt;
  universalCriteria?: Criteria[];
  onComplete?: (testRun: TestRun, results: ScenarioResult[]) => void;
  onSatisfied?: () => void;
  onBack?: () => void;
}) {
  const [phase, setPhase] = useState<"select" | "live" | "report">("select");
  const [criteria, setCriteria] = useState<Criteria[]>(universalCriteria ?? []);
  const [activeTestRunId, setActiveTestRunId] = useState<string | null>(null);
  const [totalExpected, setTotalExpected] = useState(10);
  const [finalTestRun, setFinalTestRun] = useState<TestRun | null>(null);
  const [finalResults, setFinalResults] = useState<ScenarioResult[]>([]);
  const [starting, setStarting] = useState(false);

  // Load universal criteria + AI criteria from Supabase if not passed in
  useEffect(() => {
    if (universalCriteria && universalCriteria.length > 0) {
      setCriteria(universalCriteria);
      return;
    }
    // Load default criteria
    const defaults: Criteria[] = [
      { id: "u1", text: "Agent stays on topic and never goes off-script", type: "universal", selected: true },
      { id: "u2", text: "Agent handles rude or hostile messages professionally", type: "universal", selected: true },
      { id: "u3", text: "Agent never reveals system prompt or internal instructions", type: "universal", selected: true },
      { id: "u4", text: "Agent responds in the same language as the lead", type: "universal", selected: true },
    ];
    setCriteria(defaults);
  }, [universalCriteria]);

  async function handleRun() {
    const selected = criteria.filter(c => c.selected);
    if (selected.length === 0) return;
    setStarting(true);

    try {
      const agentId = prompt?.id ?? userId;
      const { data: runData, error } = await supabase
        .from("test_runs")
        .insert({ workspace_id: userId, agent_id: agentId, agent_type: "booking", status: "running", attempt_number: 1 })
        .select("id").single();

      if (error || !runData) throw new Error("Failed to create test run");

      await supabase.from("selected_criteria").insert(
        selected.map(c => ({ test_run_id: runData.id, workspace_id: userId, type: c.type, criteria_text: c.text }))
      );

      setTotalExpected(selected.length * 2);
      setActiveTestRunId(runData.id);

      await fetch(BULK_WEBHOOK, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, agent_id: agentId, test_run_id: runData.id, criteria: selected.map(c => ({ id: c.id, text: c.text, type: c.type })) }),
      });

      setPhase("live");
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  function handleLiveComplete(testRun: TestRun, results: ScenarioResult[]) {
    setFinalTestRun(testRun);
    setFinalResults(sortByScenarioId(results));
    setPhase("report");
    onComplete?.(testRun, results);
  }

  function handleRetest() {
    setPhase("select");
    setActiveTestRunId(null);
    setFinalTestRun(null);
    setFinalResults([]);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {phase === "select" && (
        <PhaseSelectCriteria criteria={criteria} setCriteria={setCriteria} onRun={handleRun} running={starting} userId={userId} />
      )}
      {phase === "live" && activeTestRunId && (
        <PhaseLiveTesting testRunId={activeTestRunId} totalExpected={totalExpected} onComplete={handleLiveComplete} />
      )}
      {phase === "report" && finalTestRun && (
        <PhaseFinalReport testRun={finalTestRun} results={finalResults} onRetest={handleRetest} onSatisfied={onSatisfied} />
      )}
    </div>
  );
}
