import { useEffect, useState, useRef } from "react";
import { Lock, Send, CheckCircle, XCircle, Bot, RotateCcw, Plus, X, Shield, Sparkles, ChevronRight, Loader2, Activity, ChevronDown } from "lucide-react";
import { supabase } from "../supabaseClient";
import { BulkTesting } from "./BulkTesting";

const CHAT_WEBHOOK = "https://rosegoldprojectai3.app.n8n.cloud/webhook/9503fe0e-e0b1-448a-b062-5b33a88bbd57";
const CRITERIA_WEBHOOK = "https://rosegoldprojectai3.app.n8n.cloud/webhook/656e3432-f8bd-4dd9-aa0f-551b872b63db";
const BULK_WEBHOOK = "https://rosegoldprojectai3.app.n8n.cloud/webhook/69e2536c-9bfe-4bcc-b6cf-d28aaec6865d";

interface AgentPrompt {
  id: string;
  user_id: string;
  prompt_text: string;
  score: number;
  status: string;
  scoring_report: any;
  attempt: number;
  created_at?: string;
}

interface Message {
  role: "user" | "agent";
  content: string;
  time: string;
}

interface Criteria {
  id: string;
  text: string;
  type: "universal" | "ai" | "custom";
  selected: boolean;
}

interface ScenarioResult {
  id: string;
  scenario_id: string;
  criteria_id: string | null;
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
}

function getNow() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function fetchPrompt(userId: string): Promise<AgentPrompt | null> {
  const { data } = await supabase
    .from("generated_prompts")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

function GlassCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "linear-gradient(145deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.45) 100%)",
      backdropFilter: "blur(32px) saturate(180%)",
      WebkitBackdropFilter: "blur(32px) saturate(180%)",
      border: "1px solid rgba(255,255,255,0.75)",
      borderRadius: 20,
      boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(255,255,255,0.08), 0 4px 32px rgba(99,102,241,0.08), 0 1px 4px rgba(0,0,0,0.04)`,
      ...style,
    }}>
      {children}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 80 ? "#059669" : score >= 60 ? "#D97706" : "#DC2626";
  return (
    <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 50 50)" style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 10, color: "rgba(99,102,241,0.6)" }}>/100</span>
      </div>
    </div>
  );
}

function PassBadge({ pass }: { pass: boolean }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, flexShrink: 0,
      background: pass ? "rgba(5,150,105,0.1)" : "rgba(220,38,38,0.08)",
      color: pass ? "#059669" : "#DC2626",
      border: `1px solid ${pass ? "rgba(5,150,105,0.2)" : "rgba(220,38,38,0.15)"}`,
    }}>
      {pass ? <CheckCircle size={10} /> : <XCircle size={10} />}
      {pass ? "Pass" : "Fail"}
    </span>
  );
}

function LockedState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.1))",
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20,
        border: "1px solid rgba(139,92,246,0.2)",
      }}>
        <Lock size={24} strokeWidth={1.5} color="#7C3AED" />
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Your agent isn't ready yet</div>
      <div style={{ fontSize: 13, color: "rgba(99,102,241,0.6)", maxWidth: 320, lineHeight: 1.6 }}>
        Complete your onboarding to generate your AI agent. Once approved, you'll be able to test it and view the full quality report here.
      </div>
    </div>
  );
}

function CheckCard({ label, note, pass }: { label: string; note: string; pass: boolean }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.62)", backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.82)",
      borderRadius: 16, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 10,
      boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.95), 0 2px 12px rgba(99,102,241,0.04)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: pass ? "rgba(5,150,105,0.07)" : "rgba(220,38,38,0.06)",
          border: `1px solid ${pass ? "rgba(5,150,105,0.15)" : "rgba(220,38,38,0.12)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {pass ? <CheckCircle size={15} color="rgba(5,150,105,0.7)" strokeWidth={1.8}/> : <XCircle size={15} color="rgba(220,38,38,0.7)" strokeWidth={1.8}/>}
        </div>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, letterSpacing: "0.4px",
          background: pass ? "rgba(5,150,105,0.07)" : "rgba(220,38,38,0.06)",
          color: pass ? "#059669" : "#DC2626",
          border: `1px solid ${pass ? "rgba(5,150,105,0.15)" : "rgba(220,38,38,0.12)"}`,
        }}>{pass ? "Pass" : "Fail"}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1916", lineHeight: 1.35 }}>
        {label.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
      </div>
      <div style={{ fontSize: 11, color: "rgba(60,40,120,0.5)", lineHeight: 1.55 }}>{note}</div>
    </div>
  );
}

function FullReport({ prompt }: { prompt: AgentPrompt }) {
  const report = typeof prompt.scoring_report === "string"
    ? JSON.parse(prompt.scoring_report)
    : prompt.scoring_report;
  const color = prompt.score >= 80 ? "#059669" : "#D97706";
  const summaryItems = [
    { label: "IOE Structure", value: report?.summary?.ioe_structure ?? "—" },
    { label: "Pitfalls", value: report?.summary?.pitfalls ?? "—" },
    { label: "Principles", value: report?.summary?.principles ?? "—" },
    { label: "Levels", value: report?.summary?.levels ?? "—" },
  ];
  const sections = [
    { title: "Pitfalls Check", data: report?.pitfalls_check?.results, score: report?.pitfalls_check?.score, max: 25 },
    { title: "IOE Structure", data: report?.ioe_check?.results, score: report?.ioe_check?.score, max: 25 },
    { title: "Principles", data: report?.principles_check?.results, score: report?.principles_check?.score, max: 25 },
    { title: "Levels", data: report?.levels_check?.results, score: report?.levels_check?.score, max: 25 },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <GlassCard style={{ padding: 24, display: "flex", alignItems: "center", gap: 28 }}>
        <ScoreRing score={prompt.score} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" as const }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>{report?.headline ?? "Quality Report"}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
              background: prompt.status === "approved" ? "rgba(5,150,105,0.1)" : "rgba(220,38,38,0.08)",
              color: prompt.status === "approved" ? "#059669" : "#DC2626",
              border: `1px solid ${prompt.status === "approved" ? "rgba(5,150,105,0.25)" : "rgba(220,38,38,0.2)"}`,
            }}>
              {prompt.status === "approved" ? "✓ Approved" : "✗ Rejected"}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {summaryItems.map((s, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)",
                borderRadius: 12, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.8)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
              }}>
                <div style={{ fontSize: 9, color: "rgba(99,102,241,0.55)", textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 4, fontWeight: 700 }}>{s.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {sections.map((section, i) => section.data ? (
        <GlassCard key={i} style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.5)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{section.title}</div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
              background: "rgba(99,102,241,0.08)", color: "#4F46E5", border: "1px solid rgba(99,102,241,0.15)",
            }}>{section.score}/{section.max}</span>
          </div>
          <div>
            {Object.entries(section.data).map(([key, val]: [string, any], j, arr) => (
              <div key={j} style={{
                display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 20px",
                borderBottom: j < arr.length - 1 ? "1px solid rgba(255,255,255,0.5)" : "none",
                background: j % 2 === 0 ? "rgba(255,255,255,0.2)" : "transparent",
              }}>
                <PassBadge pass={val?.pass ?? false} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#111827", fontWeight: 700, marginBottom: 2 }}>
                    {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(60,40,120,0.6)", lineHeight: 1.5 }}>{val?.note ?? ""}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      ) : null)}

      {report?.fixes?.length > 0 && (
        <GlassCard style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.5)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Recommended Fixes</div>
            <div style={{ fontSize: 11, color: "rgba(99,102,241,0.55)", marginTop: 2 }}>Ordered by priority</div>
          </div>
          <div>
            {report.fixes.map((fix: any, i: number) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 20px",
                borderBottom: i < report.fixes.length - 1 ? "1px solid rgba(255,255,255,0.5)" : "none",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.1))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: "#4F46E5", flexShrink: 0,
                  border: "1px solid rgba(99,102,241,0.2)",
                }}>
                  {fix.priority}
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#111827", fontWeight: 700, marginBottom: 2 }}>{fix.issue}</div>
                  <div style={{ fontSize: 11, color: "rgba(60,40,120,0.6)", lineHeight: 1.5 }}>{fix.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 12 }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.1))",
          border: "1px solid rgba(139,92,246,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginRight: 8, flexShrink: 0, alignSelf: "flex-end",
        }}>
          <Bot size={13} color="#7C3AED" />
        </div>
      )}
      <div style={{ maxWidth: "68%" }}>
        <div style={{
          padding: "10px 14px",
          borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isUser ? "linear-gradient(135deg, #6D28D9, #4F46E5)" : "rgba(255,255,255,0.75)",
          backdropFilter: isUser ? "none" : "blur(20px)",
          border: isUser ? "none" : "1px solid rgba(255,255,255,0.8)",
          boxShadow: isUser ? "0 2px 12px rgba(99,102,241,0.25)" : "inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(0,0,0,0.04)",
          fontSize: 13, fontWeight: isUser ? 500 : 400,
          color: isUser ? "#fff" : "#111827", lineHeight: 1.55, whiteSpace: "pre-wrap" as const,
        }}>
          {msg.content}
        </div>
        <div style={{ fontSize: 9, color: "rgba(99,102,241,0.5)", marginTop: 4, textAlign: isUser ? "right" as const : "left" as const }}>{msg.time}</div>
      </div>
    </div>
  );
}

const AGENT_TYPES = [
  { id: "booking", label: "Booking Agent" },
  { id: "followup", label: "Follow Up Agent" },
] as const;

function TestAgent({ prompt, userId, messages, setMessages }: {
  prompt: AgentPrompt; userId: string;
  messages: Message[]; setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState<"booking" | "followup">("booking");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Message = { role: "user", content: text, time: getNow() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
      const res = await fetch(CHAT_WEBHOOK, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, message: text, history, agent_type: activeAgent }),
      });
      const data = await res.json();
      const reply = data?.message ?? data?.output ?? "...";
      setMessages(prev => [...prev, { role: "agent", content: reply, time: getNow() }]);
    } catch {
      setMessages(prev => [...prev, { role: "agent", content: "Something went wrong. Please try again.", time: getNow() }]);
    } finally { setLoading(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 580, position: "relative" }}>
      <div style={{ flex: 1, overflowY: "auto" as const, padding: "10px 0 20px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center" as const, padding: "80px 20px 0" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%", margin: "0 auto 16px",
              background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.08))",
              border: "1px solid rgba(139,92,246,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Bot size={20} color="#7C3AED" />
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1916", marginBottom: 6 }}>
              {activeAgent === "booking" ? "Booking Agent" : "Follow Up Agent"} ready
            </div>
            <div style={{ fontSize: 13, color: "rgba(99,102,241,0.55)", lineHeight: 1.7 }}>
              Send a message to start testing.<br />
              Try: <span style={{ color: "#4F46E5", fontWeight: 600, cursor: "pointer" }}
                onClick={() => { setInput("Hey I saw your post"); inputRef.current?.focus(); }}>
                "Hey I saw your post"
              </span>
            </div>
          </div>
        )}
        {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingLeft: 4 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(139,92,246,0.18), rgba(99,102,241,0.1))",
              border: "1px solid rgba(139,92,246,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Bot size={13} color="#7C3AED" />
            </div>
            <div style={{
              padding: "10px 14px", background: "rgba(255,255,255,0.75)", backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.85)", borderRadius: "16px 16px 16px 4px",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
            }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(99,102,241,0.35)", animation: `agentbounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ paddingBottom: 8, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{
          width: "100%", background: "rgba(255,255,255,0.58)", backdropFilter: "blur(40px) saturate(200%)",
          WebkitBackdropFilter: "blur(40px) saturate(200%)", border: "1px solid rgba(255,255,255,0.85)",
          borderRadius: 18, boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.98), 0 8px 32px rgba(99,102,241,0.08)`,
          display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
        }}>
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Type a message..."
            style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, color: "#1A1916", outline: "none", fontFamily: "'DM Sans',sans-serif" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {messages.length > 0 && (
              <button onClick={() => { setMessages([]); setInput(""); }} style={{
                display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600,
                color: "rgba(99,102,241,0.5)", background: "transparent", border: "none", cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif", padding: "4px 6px",
              }}>
                <RotateCcw size={10} /> Reset
              </button>
            )}
            <button onClick={send} disabled={!input.trim() || loading} style={{
              width: 32, height: 32, borderRadius: 10,
              background: input.trim() && !loading ? "linear-gradient(135deg, #6D28D9, #4F46E5)" : "rgba(99,102,241,0.08)",
              border: `1px solid ${input.trim() && !loading ? "transparent" : "rgba(99,102,241,0.15)"}`,
              cursor: input.trim() && !loading ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s",
              boxShadow: input.trim() && !loading ? "0 4px 12px rgba(99,102,241,0.3)" : "none",
            }}>
              <Send size={13} color={input.trim() && !loading ? "#fff" : "rgba(99,102,241,0.3)"} />
            </button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {AGENT_TYPES.map(agent => {
            const isActive = activeAgent === agent.id;
            return (
              <button key={agent.id} onClick={() => { setActiveAgent(agent.id as "booking" | "followup"); setMessages([]); }} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 20, cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, transition: "all 0.2s", border: "1px solid",
                background: isActive ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.25)",
                backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                borderColor: isActive ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.5)",
                color: isActive ? "#4F46E5" : "rgba(60,40,120,0.45)",
                boxShadow: isActive ? "inset 0 1px 0 rgba(255,255,255,0.95), 0 4px 14px rgba(99,102,241,0.12)" : "inset 0 1px 0 rgba(255,255,255,0.7)",
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "#4F46E5" : "rgba(99,102,241,0.25)", transition: "background 0.2s" }} />
                {agent.label}
              </button>
            );
          })}
          <div style={{ fontSize: 10, color: "rgba(99,102,241,0.35)", marginLeft: 4 }}>Score {prompt.score}/100</div>
        </div>
      </div>
    </div>
  );
}

function CriteriaCard({ criteria, onToggle, onRemove }: {
  criteria: Criteria; onToggle: (id: string) => void; onRemove?: (id: string) => void;
}) {
  const isUniversal = criteria.type === "universal";
  const isAI = criteria.type === "ai";
  const iconMap = {
    universal: <Shield size={16} color="#7C3AED" />,
    ai: <Sparkles size={16} color="#0891B2" />,
    custom: <Plus size={16} color="#059669" />,
  };
  const colorMap = {
    universal: { bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)", label: "Universal", labelColor: "#7C3AED", labelBg: "rgba(139,92,246,0.1)" },
    ai: { bg: "rgba(8,145,178,0.06)", border: "rgba(8,145,178,0.18)", label: "AI Generated", labelColor: "#0891B2", labelBg: "rgba(8,145,178,0.08)" },
    custom: { bg: "rgba(5,150,105,0.06)", border: "rgba(5,150,105,0.18)", label: "Custom", labelColor: "#059669", labelBg: "rgba(5,150,105,0.08)" },
  };
  const c = colorMap[criteria.type];
  return (
    <div style={{
      background: criteria.selected ? "linear-gradient(145deg, rgba(255,255,255,0.82), rgba(255,255,255,0.6))" : "rgba(255,255,255,0.35)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      border: `1px solid ${criteria.selected ? c.border : "rgba(255,255,255,0.5)"}`,
      borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 10,
      boxShadow: criteria.selected ? `inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 16px ${c.bg}` : "inset 0 1px 0 rgba(255,255,255,0.7)",
      opacity: criteria.selected ? 1 : 0.65, transition: "all 0.2s",
      cursor: isUniversal ? "default" : "pointer", position: "relative" as const,
    }} onClick={() => !isUniversal && onToggle(criteria.id)}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: c.bg, border: `1px solid ${c.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {iconMap[criteria.type]}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
            background: c.labelBg, color: c.labelColor, border: `1px solid ${c.border}`, letterSpacing: "0.5px",
          }}>{c.label}</span>
          {isUniversal && (
            <div style={{
              width: 16, height: 16, borderRadius: "50%",
              background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Lock size={8} color="#7C3AED" />
            </div>
          )}
          {!isUniversal && onRemove && (
            <div onClick={e => { e.stopPropagation(); onRemove(criteria.id); }} style={{
              width: 18, height: 18, borderRadius: "50%", cursor: "pointer",
              background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <X size={9} color="#DC2626" />
            </div>
          )}
        </div>
      </div>
      <div style={{ fontSize: 12, color: "#1A1916", fontWeight: 500, lineHeight: 1.5 }}>{criteria.text}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{
          width: 14, height: 14, borderRadius: 4,
          background: criteria.selected ? (isUniversal ? "rgba(139,92,246,0.8)" : isAI ? "rgba(8,145,178,0.8)" : "rgba(5,150,105,0.8)") : "rgba(255,255,255,0.5)",
          border: `1.5px solid ${criteria.selected ? c.border : "rgba(200,200,200,0.5)"}`,
          display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
        }}>
          {criteria.selected && <CheckCircle size={8} color="#fff" />}
        </div>
        <span style={{ fontSize: 10, color: "rgba(60,40,120,0.5)", fontWeight: 400 }}>
          {isUniversal ? "Always tested" : criteria.selected ? "Will be tested" : "Skipped"}
        </span>
      </div>
    </div>
  );
}

// ─── Expandable Scenario Result Row ───
function ScenarioResultRow({ result, index }: { result: ScenarioResult; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const score = result.final_score ?? 0;
  const passed = result.status === "pass";
  const scoreColor = score >= 80 ? "#059669" : score >= 60 ? "#D97706" : "#DC2626";
  const issues: string[] = Array.isArray(result.issues) ? result.issues : [];
  const memorySnapshot = result as any;

  return (
    <div style={{
      borderBottom: "1px solid rgba(255,255,255,0.5)",
      background: index % 2 === 0 ? "rgba(255,255,255,0.2)" : "transparent",
      animation: "fadeInRow 0.4s ease both",
    }}>
      {/* Main row */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 20px", cursor: "pointer" }}
      >
        {/* Score circle */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            border: `2.5px solid ${scoreColor}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `${scoreColor}12`,
          }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: scoreColor }}>{Math.round(score)}</span>
          </div>
          <span style={{ fontSize: 9, color: scoreColor, fontWeight: 700 }}>{passed ? "Pass" : "Fail"}</span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" as const }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#111827" }}>Scenario {index + 1}</span>
            <span style={{
              fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 20,
              background: "rgba(99,102,241,0.07)", color: "#4F46E5", border: "1px solid rgba(99,102,241,0.15)",
            }}>Content {Math.round(result.content_score ?? 0)}</span>
            <span style={{
              fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 20,
              background: "rgba(8,145,178,0.06)", color: "#0891B2", border: "1px solid rgba(8,145,178,0.15)",
            }}>Behavior {Math.round(result.behavior_score ?? 0)}</span>
          </div>

          {/* Summary */}
          {result.summary && (
            <div style={{ fontSize: 11, color: "rgba(60,40,120,0.65)", lineHeight: 1.55, marginBottom: 5 }}>
              {result.summary}
            </div>
          )}

          {/* Issues */}
          {issues.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
              {issues.map((issue, i) => (
                <span key={i} style={{
                  fontSize: 9, fontWeight: 600, padding: "2px 8px", borderRadius: 20,
                  background: "rgba(220,38,38,0.06)", color: "#DC2626", border: "1px solid rgba(220,38,38,0.15)",
                }}>{issue}</span>
              ))}
            </div>
          )}
        </div>

        {/* Expand toggle */}
        <div style={{ flexShrink: 0, transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
          <ChevronDown size={14} color="rgba(99,102,241,0.4)" />
        </div>
      </div>

      {/* Expanded log */}
      {expanded && (
        <div style={{ padding: "0 20px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Lead message */}
          {result.input_message && (
            <div style={{
              background: "rgba(99,102,241,0.05)", borderRadius: 10, padding: "10px 14px",
              border: "1px solid rgba(99,102,241,0.12)",
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#4F46E5", textTransform: "uppercase" as const, letterSpacing: "0.6px", marginBottom: 5 }}>
                📩 Lead Message
              </div>
              <div style={{ fontSize: 12, color: "#111827", lineHeight: 1.55 }}>{result.input_message}</div>
            </div>
          )}

          {/* Agent response */}
          {result.agent_response && (
            <div style={{
              background: "rgba(5,150,105,0.04)", borderRadius: 10, padding: "10px 14px",
              border: "1px solid rgba(5,150,105,0.12)",
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#059669", textTransform: "uppercase" as const, letterSpacing: "0.6px", marginBottom: 5 }}>
                🤖 Agent Response
              </div>
              <div style={{ fontSize: 12, color: "#111827", lineHeight: 1.55 }}>{result.agent_response}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Step label helper ───
function getStepLabel(testRun: TestRun | null, resultsCount: number, total: number): string {
  if (!testRun) return "Initializing...";
  if (testRun.status === "complete") return "All done!";
  switch (testRun.current_step) {
    case "generating_scenarios": return "Generating test scenarios...";
    case "running_scenarios": return `Running scenarios (${resultsCount}/${total})...`;
    case "scoring": return `Scoring responses (${resultsCount}/${total})...`;
    default: return "Initializing...";
  }
}

// ─── Bulk Testing tab ───
function BulkTesting({ userId, prompt }: { userId: string; prompt: AgentPrompt }) {
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);
  const [loadingCriteria, setLoadingCriteria] = useState(true);
  const [running, setRunning] = useState(false);
  const [runStatus, setRunStatus] = useState<"idle" | "running" | "done" | "error">("idle");

  const [activeTestRunId, setActiveTestRunId] = useState<string | null>(null);
  const [results, setResults] = useState<ScenarioResult[]>([]);
  const [totalScenarios, setTotalScenarios] = useState(0);
  const [testRun, setTestRun] = useState<TestRun | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const criteriaLoadedRef = useRef(false);

  // ── Load universal criteria once ──
  useEffect(() => {
    if (criteriaLoadedRef.current) return;
    criteriaLoadedRef.current = true;

    async function loadUniversal() {
      const { data, error } = await supabase
        .from("universal_criteria")
        .select("id, criteria_text")
        .order("created_at", { ascending: true });

      if (!error && data) {
        setCriteria(data.map(row => ({
          id: row.id, text: row.criteria_text, type: "universal" as const, selected: true,
        })));
      }
      setLoadingCriteria(false);
    }
    loadUniversal();
  }, []);

  // ── Poll test_run status + scenario_results while running ──
  useEffect(() => {
    if (!activeTestRunId) return;

    async function poll() {
      // Poll test_run for current_step + status
      const { data: runData } = await supabase
        .from("test_runs")
        .select("id, status, current_step, final_score")
        .eq("id", activeTestRunId)
        .single();

      if (runData) setTestRun(runData as TestRun);

      // Poll scenario_results
      const { data: resultsData } = await supabase
        .from("scenario_results")
        .select("*")
        .eq("test_run_id", activeTestRunId)
        .order("created_at", { ascending: true });

      if (resultsData) setResults(resultsData as ScenarioResult[]);

      // Stop polling when complete
      if (runData?.current_step === "complete") {
        // Do one final fetch to make sure we have ALL results
        const { data: finalResults } = await supabase
          .from("scenario_results")
          .select("*")
          .eq("test_run_id", activeTestRunId)
          .order("created_at", { ascending: true });

        if (finalResults) setResults(finalResults as ScenarioResult[]);

        clearInterval(pollRef.current!);
        pollRef.current = null;
        setRunning(false);
        setRunStatus("done");
      }
    }

    pollRef.current = setInterval(poll, 3000);
    poll();

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeTestRunId]);

  function toggleCriteria(id: string) {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, selected: !c.selected } : c));
  }

  function removeCriteria(id: string) {
    setCriteria(prev => prev.filter(c => c.id !== id));
  }

  function addCustom() {
    const text = customInput.trim();
    if (!text) return;
    setCriteria(prev => [...prev, { id: `custom_${Date.now()}`, text, type: "custom", selected: true }]);
    setCustomInput("");
    setAddingCustom(false);
  }

  async function runBulkTest() {
    const selected = criteria.filter(c => c.selected);
    if (selected.length === 0) return;

    setRunning(true);
    setRunStatus("running");
    setResults([]);
    setTestRun(null);

    try {
      const { data: runData, error: runError } = await supabase
        .from("test_runs")
        .insert({
          workspace_id: userId, agent_id: prompt.id, agent_type: "booking",
          status: "running", attempt_number: 1,
        })
        .select("id").single();

      if (runError || !runData) throw new Error("Failed to create test run");

      const testRunId = runData.id;

      const criteriaRows = selected.map(c => ({
        test_run_id: testRunId, workspace_id: userId, type: c.type, criteria_text: c.text,
      }));

      await supabase.from("selected_criteria").insert(criteriaRows);

      setTotalScenarios(selected.length * 2);
      setActiveTestRunId(testRunId);

      await fetch(BULK_WEBHOOK, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId, agent_id: prompt.id, test_run_id: testRunId,
          criteria: selected.map(c => ({ id: c.id, text: c.text, type: c.type })),
        }),
      });

    } catch {
      setRunStatus("error");
      setRunning(false);
    }
  }

  const finalScore = testRun?.final_score ?? null;
  const selectedCount = criteria.filter(c => c.selected).length;
  const stepLabel = getStepLabel(testRun, results.length, totalScenarios);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <GlassCard style={{ padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <FlaskConical size={18} color="#7C3AED" />
            <span style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>Bulk Testing</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(60,40,120,0.55)", lineHeight: 1.5 }}>
            Select criteria to test. Your agent will be automatically evaluated against each one.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{
            padding: "6px 14px", borderRadius: 20,
            background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)",
            fontSize: 12, fontWeight: 700, color: "#4F46E5",
          }}>
            {selectedCount} selected
          </div>
          <button onClick={runBulkTest} disabled={running || selectedCount === 0} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 12, border: "none",
            background: selectedCount > 0 && !running ? "linear-gradient(135deg, #6D28D9, #4F46E5)" : "rgba(255,255,255,0.4)",
            color: selectedCount > 0 && !running ? "#fff" : "rgba(99,102,241,0.4)",
            fontSize: 13, fontWeight: 700, cursor: selectedCount > 0 && !running ? "pointer" : "default",
            fontFamily: "'DM Sans',sans-serif",
            boxShadow: selectedCount > 0 && !running ? "0 4px 16px rgba(99,102,241,0.3)" : "none",
            transition: "all 0.2s",
          }}>
            {running ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <ChevronRight size={14} />}
            {running ? "Running..." : "Run Test"}
          </button>
        </div>
      </GlassCard>

      {/* Running status banner */}
      {runStatus === "running" && (
        <GlassCard style={{ padding: "14px 20px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Activity size={16} color="#4F46E5" style={{ animation: "pulse 1.5s ease-in-out infinite" }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#4F46E5" }}>{stepLabel}</span>
          </div>
          {/* Progress bar */}
          <div style={{ height: 4, borderRadius: 4, background: "rgba(99,102,241,0.12)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 4,
              background: "linear-gradient(90deg, #6D28D9, #4F46E5)",
              width: testRun?.current_step === "generating_scenarios"
                ? "15%"
                : testRun?.current_step === "running_scenarios" && totalScenarios > 0
                ? `${Math.min(15 + (results.length / totalScenarios) * 75, 90)}%`
                : "5%",
              transition: "width 0.6s ease",
            }} />
          </div>
        </GlassCard>
      )}

      {/* Done verdict */}
      {runStatus === "done" && finalScore !== null && (
        <GlassCard style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
            border: `3px solid ${finalScore >= 80 ? "#059669" : finalScore >= 60 ? "#D97706" : "#DC2626"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `${finalScore >= 80 ? "#059669" : finalScore >= 60 ? "#D97706" : "#DC2626"}12`,
          }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: finalScore >= 80 ? "#059669" : finalScore >= 60 ? "#D97706" : "#DC2626" }}>
              {Math.round(finalScore)}
            </span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 3 }}>
              {testRun?.status === "approved" ? "✓ Agent approved — ready to publish" 
                : testRun?.status === "needs_improvement" ? "⚠ Needs improvement — review issues below" 
                : "✗ Agent blocked — significant issues found"}
            </div>
            <div style={{ fontSize: 11, color: "rgba(60,40,120,0.5)" }}>
              {results.length} scenarios tested · Average score {Math.round(finalScore)}/100
            </div>
          </div>
        </GlassCard>
      )}

      {runStatus === "error" && (
        <GlassCard style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)" }}>
          <XCircle size={16} color="#DC2626" />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#DC2626" }}>Something went wrong. Please try again.</span>
        </GlassCard>
      )}

      {/* Loading criteria */}
      {loadingCriteria && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
          <Loader2 size={14} color="rgba(99,102,241,0.5)" style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 12, color: "rgba(99,102,241,0.5)" }}>Loading criteria...</span>
        </div>
      )}

      {/* Criteria grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {criteria.map(c => (
          <CriteriaCard key={c.id} criteria={c} onToggle={toggleCriteria} onRemove={c.type !== "universal" ? removeCriteria : undefined} />
        ))}
        {addingCustom ? (
          <div style={{
            background: "rgba(255,255,255,0.6)", backdropFilter: "blur(20px)",
            border: "1.5px solid rgba(5,150,105,0.3)", borderRadius: 16, padding: 16,
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            <textarea autoFocus value={customInput} onChange={e => setCustomInput(e.target.value)}
              placeholder="Describe your custom criteria..."
              style={{
                border: "1px solid rgba(255,255,255,0.7)", borderRadius: 10, padding: "8px 10px",
                fontSize: 12, color: "#111827", outline: "none", fontFamily: "'DM Sans',sans-serif",
                background: "rgba(255,255,255,0.7)", resize: "none", minHeight: 72,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={addCustom} style={{
                flex: 1, padding: "7px 0", borderRadius: 8, border: "none",
                background: "linear-gradient(135deg, #059669, #0D9488)",
                color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
              }}>Add</button>
              <button onClick={() => { setAddingCustom(false); setCustomInput(""); }} style={{
                flex: 1, padding: "7px 0", borderRadius: 8, border: "1px solid rgba(255,255,255,0.7)",
                background: "rgba(255,255,255,0.5)", color: "rgba(60,40,120,0.6)",
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
              }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div onClick={() => setAddingCustom(true)} style={{
            background: "rgba(255,255,255,0.25)", backdropFilter: "blur(12px)",
            border: "1.5px dashed rgba(99,102,241,0.25)", borderRadius: 16, padding: 16,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 8, cursor: "pointer", minHeight: 120, transition: "all 0.2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.45)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Plus size={16} color="#4F46E5" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(60,40,120,0.55)" }}>Add custom criteria</span>
          </div>
        )}
      </div>

      {/* Live results */}
      {results.length > 0 && (
        <GlassCard style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Live Results</div>
              <div style={{ fontSize: 11, color: "rgba(99,102,241,0.55)", marginTop: 2 }}>
                Click any row to see the full conversation log
              </div>
            </div>
            {running && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4F46E5", animation: "pulse 1.2s ease-in-out infinite" }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#4F46E5" }}>Live</span>
              </div>
            )}
          </div>
          <div>
            {results.map((result, i) => (
              <ScenarioResultRow key={result.id} result={result} index={i} />
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

// ─── Main screen ───
export function MyAgentScreen({ userId }: { userId: string }) {
  const [tab, setTab] = useState<"test" | "report" | "bulk">("test");
  const [prompt, setPrompt] = useState<AgentPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [universalCriteria, setUniversalCriteria] = useState<any[]>([]);

  useEffect(() => {
    fetchPrompt(userId).then(p => { setPrompt(p); setLoading(false); });

    // Load universal criteria once at top level
    supabase
      .from("universal_criteria")
      .select("id, criteria_text")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setUniversalCriteria(data.map(row => ({
            id: row.id, text: row.criteria_text, type: "universal" as const, selected: true,
          })));
        }
      });
  }, [userId]);

  const hr = new Date().getHours();
  const greeting = hr < 12 ? "morning" : hr < 18 ? "afternoon" : "evening";

  const tabs = [
    { id: "test", label: "Test Agent" },
    { id: "report", label: "Prompt Score" },
    { id: "bulk", label: "Bulk Testing" },
  ] as const;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
        @keyframes agentbounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeInRow { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideInScenario { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeInScore { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
        @keyframes dotPulse { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
        @keyframes dotBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.2); border-radius: 4px; }
      `}</style>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -120, right: 80, width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.18), transparent 70%)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", top: "30%", left: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.14), transparent 70%)", filter: "blur(70px)" }} />
        <div style={{ position: "absolute", bottom: 60, right: -60, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(244,114,182,0.14), transparent 70%)", filter: "blur(70px)" }} />
        <div style={{ position: "absolute", bottom: -80, left: 120, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.12), transparent 70%)", filter: "blur(60px)" }} />
      </div>

      <div style={{
        padding: "36px 40px", width: "100%", fontFamily: "'DM Sans', sans-serif",
        background: "linear-gradient(135deg, #EEF0FA 0%, #F0F1F8 40%, #EBF0FF 100%)",
        minHeight: "100vh", position: "relative", zIndex: 1,
      }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px", marginBottom: 4 }}>
            Good <span style={{ color: "#4F46E5" }}>{greeting}</span>
          </h1>
          <p style={{ fontSize: 13, color: "rgba(99,102,241,0.6)" }}>
            {prompt ? "Your agent is ready — test it or review its quality report." : "Complete onboarding to unlock your AI agent."}
          </p>
        </div>

        <div style={{
          display: "flex", gap: 4, marginBottom: 22,
          background: "rgba(255,255,255,0.35)", backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)", borderRadius: 12, padding: 4, width: "fit-content",
          border: "1px solid rgba(255,255,255,0.6)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
        }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "8px 22px", borderRadius: 9, border: "none", fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all .15s",
              background: tab === t.id ? "rgba(255,255,255,0.85)" : "transparent",
              color: tab === t.id ? "#3730a3" : "rgba(60,40,120,0.5)",
              boxShadow: tab === t.id ? "inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(99,102,241,0.1)" : "none",
              backdropFilter: tab === t.id ? "blur(12px)" : "none",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
            <div style={{ fontSize: 13, color: "rgba(99,102,241,0.5)" }}>Loading your agent...</div>
          </div>
        ) : !prompt ? (
          <GlassCard><LockedState /></GlassCard>
        ) : tab === "test" ? (
          <TestAgent prompt={prompt} userId={userId} messages={messages} setMessages={setMessages} />
        ) : tab === "report" ? (
          <FullReport prompt={prompt} />
        ) : (
          <BulkTesting userId={userId} prompt={prompt} universalCriteria={universalCriteria} />
        )}
      </div>
    </>
  );
}
