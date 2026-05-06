import { useEffect, useState, useRef } from "react";
import { Lock, Send, Bot, RotateCcw, ChevronRight, FlaskConical, MessageSquare, Sparkles, CheckCircle, ArrowRight, Clock, Wrench } from "lucide-react";
import { supabase } from "../supabaseClient";
import { BulkTesting } from "./BulkTesting";

const CHAT_WEBHOOK = "https://rosegoldprojectai3.app.n8n.cloud/webhook/9503fe0e-e0b1-448a-b062-5b33a88bbd57";

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
      boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.9), 0 4px 32px rgba(99,102,241,0.08)`,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Intro Screen ───
function IntroScreen({ onReady }: { onReady: () => void }) {
  const cards = [
    {
      icon: <FlaskConical size={22} color="#7C3AED" />,
      iconBg: "rgba(139,92,246,0.1)",
      iconBorder: "rgba(139,92,246,0.2)",
      tag: "Step 1 — Recommended",
      tagColor: "#7C3AED",
      tagBg: "rgba(139,92,246,0.08)",
      tagBorder: "rgba(139,92,246,0.15)",
      title: "Quality Test",
      subtitle: "Will my agent embarrass me in front of real clients?",
      description: "We automatically simulate dozens of real lead conversations — price objections, off-topic questions, edge cases — and score how your agent handles each one. You watch it happen live. By the end you'll know exactly where your agent is strong and where it needs work.",
      highlight: "You don't have to do anything. We run the test for you.",
      highlightColor: "#7C3AED",
      highlightBg: "rgba(139,92,246,0.06)",
      highlightBorder: "rgba(139,92,246,0.12)",
    },
    {
      icon: <MessageSquare size={22} color="#0891B2" />,
      iconBg: "rgba(8,145,178,0.08)",
      iconBorder: "rgba(8,145,178,0.18)",
      tag: "Step 2 — Optional",
      tagColor: "#0891B2",
      tagBg: "rgba(8,145,178,0.06)",
      tagBorder: "rgba(8,145,178,0.15)",
      title: "Test Yourself",
      subtitle: "Feel what your leads will experience.",
      description: "Talk to your agent directly like a real lead would. Try to confuse it, ask off-topic questions, push back on price. This gives you a personal feel for how conversations actually go before you go live.",
      highlight: "Best used after the Quality Test to confirm the results.",
      highlightColor: "#0891B2",
      highlightBg: "rgba(8,145,178,0.04)",
      highlightBorder: "rgba(8,145,178,0.1)",
    },
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "20px 0 40px", animation: "fadeInUp 0.6s ease both",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40, maxWidth: 560 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 16px", borderRadius: 20, marginBottom: 20,
          background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.15)",
        }}>
          <Sparkles size={12} color="#6366F1" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#4F46E5", letterSpacing: "0.5px" }}>YOUR AGENT IS READY</span>
        </div>
        <h2 style={{
          fontSize: 32, fontWeight: 900, color: "#111827",
          letterSpacing: "-0.8px", lineHeight: 1.15, marginBottom: 14,
        }}>
          Before you go live —<br />
          <span style={{ color: "#4F46E5" }}>let's make sure it's ready.</span>
        </h2>
        <p style={{
          fontSize: 14, color: "rgba(60,40,120,0.55)", lineHeight: 1.7, maxWidth: 480, margin: "0 auto",
        }}>
          Your agent was built from your business information. Now it's time to verify it actually behaves the way you expect — before a real lead experiences it.
        </p>
      </div>

      {/* Two cards */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
        width: "100%", maxWidth: 860, marginBottom: 36,
      }}>
        {cards.map((card, i) => (
          <div key={i} style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.78), rgba(255,255,255,0.52))",
            backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
            border: "1px solid rgba(255,255,255,0.8)", borderRadius: 22,
            padding: 24, display: "flex", flexDirection: "column", gap: 16,
            boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 40px rgba(99,102,241,0.06)",
            animation: `fadeInUp 0.6s ease ${i * 0.1 + 0.2}s both`,
          }}>
            {/* Icon + tag */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: card.iconBg, border: `1px solid ${card.iconBorder}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {card.icon}
              </div>
              <span style={{
                fontSize: 9, fontWeight: 800, padding: "4px 10px", borderRadius: 20,
                background: card.tagBg, color: card.tagColor, border: `1px solid ${card.tagBorder}`,
                letterSpacing: "0.3px",
              }}>{card.tag}</span>
            </div>

            {/* Title */}
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 5 }}>{card.title}</div>
              <div style={{ fontSize: 12, color: "rgba(60,40,120,0.5)", fontStyle: "italic", lineHeight: 1.5 }}>"{card.subtitle}"</div>
            </div>

            {/* Description */}
            <div style={{ fontSize: 12, color: "rgba(30,20,60,0.6)", lineHeight: 1.7 }}>
              {card.description}
            </div>

            {/* Highlight */}
            <div style={{
              padding: "10px 14px", borderRadius: 12,
              background: card.highlightBg, border: `1px solid ${card.highlightBorder}`,
              fontSize: 11, fontWeight: 600, color: card.highlightColor, lineHeight: 1.5,
            }}>
              💡 {card.highlight}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button onClick={onReady} style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "16px 36px", borderRadius: 16, border: "none",
        background: "linear-gradient(135deg, #6D28D9, #4F46E5)",
        color: "#fff", fontSize: 15, fontWeight: 800,
        cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
        boxShadow: "0 8px 32px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
        transition: "all 0.2s", letterSpacing: "-0.2px",
        animation: "fadeInUp 0.6s ease 0.4s both",
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(99,102,241,0.5), inset 0 1px 0 rgba(255,255,255,0.15)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.15)"; }}
      >
        I understand — let's test my agent
        <ArrowRight size={16} />
      </button>

      <div style={{ marginTop: 14, fontSize: 11, color: "rgba(99,102,241,0.4)" }}>
        Takes about 2 minutes · No setup required
      </div>
    </div>
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
        Complete your onboarding to generate your AI agent. Once approved, you'll be able to test it here.
      </div>
    </div>
  );
}

// ─── Prompt Report (unlocked after satisfaction) ───
function FullReport({ prompt, onBack }: { prompt: AgentPrompt; onBack: () => void }) {
  const report = typeof prompt.scoring_report === "string"
    ? JSON.parse(prompt.scoring_report)
    : prompt.scoring_report;

  const color = prompt.score >= 80 ? "#059669" : "#D97706";
  const r = 42; const circ = 2 * Math.PI * r; const fill = (prompt.score / 100) * circ;

  const sections = [
    { title: "Pitfalls Check", data: report?.pitfalls_check?.results, score: report?.pitfalls_check?.score, max: 25 },
    { title: "IOE Structure", data: report?.ioe_check?.results, score: report?.ioe_check?.score, max: 25 },
    { title: "Principles", data: report?.principles_check?.results, score: report?.principles_check?.score, max: 25 },
    { title: "Levels", data: report?.levels_check?.results, score: report?.levels_check?.score, max: 25 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeIn 0.5s ease both" }}>
      {/* Back */}
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
        cursor: "pointer", fontSize: 12, fontWeight: 600, color: "rgba(99,102,241,0.6)",
        fontFamily: "'DM Sans',sans-serif", padding: 0, width: "fit-content",
      }}>
        ← Back to results
      </button>

      <GlassCard style={{ padding: 24, display: "flex", alignItems: "center", gap: 28 }}>
        {/* Score ring */}
        <div style={{ position: "relative", width: 100, height: 100, flexShrink: 0 }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="8" />
            <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
              strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
              transform="rotate(-90 50 50)" style={{ transition: "stroke-dasharray 1s ease" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{prompt.score}</span>
            <span style={{ fontSize: 10, color: "rgba(99,102,241,0.6)" }}>/100</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 8 }}>
            {report?.headline ?? "Prompt Quality Report"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {[
              { label: "IOE Structure", value: report?.summary?.ioe_structure ?? "—" },
              { label: "Pitfalls", value: report?.summary?.pitfalls ?? "—" },
              { label: "Principles", value: report?.summary?.principles ?? "—" },
              { label: "Levels", value: report?.summary?.levels ?? "—" },
            ].map((s, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.6)", borderRadius: 12, padding: "10px 12px",
                border: "1px solid rgba(255,255,255,0.8)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
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
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: "rgba(99,102,241,0.08)", color: "#4F46E5", border: "1px solid rgba(99,102,241,0.15)" }}>{section.score}/{section.max}</span>
          </div>
          <div>
            {Object.entries(section.data).map(([key, val]: [string, any], j, arr) => (
              <div key={j} style={{
                display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 20px",
                borderBottom: j < arr.length - 1 ? "1px solid rgba(255,255,255,0.5)" : "none",
                background: j % 2 === 0 ? "rgba(255,255,255,0.2)" : "transparent",
              }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, flexShrink: 0,
                  background: val?.pass ? "rgba(5,150,105,0.1)" : "rgba(220,38,38,0.08)",
                  color: val?.pass ? "#059669" : "#DC2626",
                  border: `1px solid ${val?.pass ? "rgba(5,150,105,0.2)" : "rgba(220,38,38,0.15)"}`,
                }}>
                  {val?.pass ? <CheckCircle size={10} /> : "✗"}
                  {val?.pass ? "Pass" : "Fail"}
                </span>
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
    </div>
  );
}

// ─── Test Chat ───
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

  const AGENT_TYPES = [
    { id: "booking", label: "Booking Agent" },
    { id: "followup", label: "Follow Up Agent" },
  ] as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Info banner */}
      <div style={{
        padding: "14px 18px", borderRadius: 14,
        background: "rgba(8,145,178,0.05)", border: "1px solid rgba(8,145,178,0.15)",
        display: "flex", alignItems: "flex-start", gap: 12,
      }}>
        <MessageSquare size={16} color="#0891B2" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#0891B2", marginBottom: 3 }}>Test it yourself</div>
          <div style={{ fontSize: 11, color: "rgba(8,145,178,0.7)", lineHeight: 1.6 }}>
            Talk to your agent like a real lead. Try confusing it, pushing back on price, or asking off-topic questions. This confirms what the Quality Test already showed.
          </div>
        </div>
      </div>

      {/* Chat */}
      <GlassCard style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", flexDirection: "column", height: 480, position: "relative" }}>
          <div style={{ flex: 1, overflowY: "auto" as const, paddingBottom: 16 }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center" as const, padding: "60px 20px 0" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", margin: "0 auto 14px",
                  background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.08))",
                  border: "1px solid rgba(139,92,246,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Bot size={18} color="#7C3AED" />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1916", marginBottom: 6 }}>
                  {activeAgent === "booking" ? "Booking Agent" : "Follow Up Agent"} ready
                </div>
                <div style={{ fontSize: 12, color: "rgba(99,102,241,0.5)", lineHeight: 1.7 }}>
                  Send a message to begin.<br />
                  Try: <span style={{ color: "#4F46E5", fontWeight: 600, cursor: "pointer" }}
                    onClick={() => { setInput("Hey I saw your post"); inputRef.current?.focus(); }}>
                    "Hey I saw your post"
                  </span>
                </div>
              </div>
            )}
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 12 }}>
                  {!isUser && (
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.1))",
                      border: "1px solid rgba(139,92,246,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginRight: 8, flexShrink: 0, alignSelf: "flex-end",
                    }}>
                      <Bot size={12} color="#7C3AED" />
                    </div>
                  )}
                  <div style={{ maxWidth: "68%" }}>
                    <div style={{
                      padding: "10px 14px",
                      borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      background: isUser ? "linear-gradient(135deg, #6D28D9, #4F46E5)" : "rgba(255,255,255,0.8)",
                      border: isUser ? "none" : "1px solid rgba(255,255,255,0.85)",
                      boxShadow: isUser ? "0 2px 12px rgba(99,102,241,0.25)" : "inset 0 1px 0 rgba(255,255,255,0.9)",
                      fontSize: 13, color: isUser ? "#fff" : "#111827", lineHeight: 1.55,
                      whiteSpace: "pre-wrap" as const,
                    }}>
                      {msg.content}
                    </div>
                    <div style={{ fontSize: 9, color: "rgba(99,102,241,0.45)", marginTop: 4, textAlign: isUser ? "right" as const : "left" as const }}>{msg.time}</div>
                  </div>
                </div>
              );
            })}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(139,92,246,0.18), rgba(99,102,241,0.1))",
                  border: "1px solid rgba(139,92,246,0.22)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Bot size={12} color="#7C3AED" />
                </div>
                <div style={{
                  padding: "10px 14px", background: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(255,255,255,0.85)", borderRadius: "16px 16px 16px 4px",
                }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(99,102,241,0.35)", animation: `agentbounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            background: "rgba(255,255,255,0.65)", backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.85)", borderRadius: 16,
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
          }}>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Type as if you're a lead..."
              style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, color: "#1A1916", outline: "none", fontFamily: "'DM Sans',sans-serif" }}
            />
            {messages.length > 0 && (
              <button onClick={() => { setMessages([]); setInput(""); }} style={{
                display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600,
                color: "rgba(99,102,241,0.5)", background: "transparent", border: "none",
                cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
              }}>
                <RotateCcw size={10} /> Reset
              </button>
            )}
            <button onClick={send} disabled={!input.trim() || loading} style={{
              width: 32, height: 32, borderRadius: 10,
              background: input.trim() && !loading ? "linear-gradient(135deg, #6D28D9, #4F46E5)" : "rgba(99,102,241,0.08)",
              border: "none", cursor: input.trim() && !loading ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: input.trim() && !loading ? "0 4px 12px rgba(99,102,241,0.3)" : "none",
              transition: "all .2s",
            }}>
              <Send size={13} color={input.trim() && !loading ? "#fff" : "rgba(99,102,241,0.3)"} />
            </button>
          </div>
        </div>

        {/* Agent selector */}
        <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "center" }}>
          {AGENT_TYPES.map(agent => {
            const isActive = activeAgent === agent.id;
            return (
              <button key={agent.id} onClick={() => { setActiveAgent(agent.id as "booking" | "followup"); setMessages([]); }} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20,
                cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 600,
                transition: "all 0.2s", border: "1px solid",
                background: isActive ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)",
                borderColor: isActive ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.5)",
                color: isActive ? "#4F46E5" : "rgba(60,40,120,0.4)",
              }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: isActive ? "#4F46E5" : "rgba(99,102,241,0.2)" }} />
                {agent.label}
              </button>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Satisfaction Decision Screen ───
function SatisfactionScreen({ onSatisfied, onImprove, onLater }: {
  onSatisfied: () => void;
  onImprove: () => void;
  onLater: () => void;
}) {
  const options = [
    {
      icon: <CheckCircle size={20} color="#059669" />,
      iconBg: "rgba(5,150,105,0.1)",
      iconBorder: "rgba(5,150,105,0.2)",
      title: "I'm satisfied — show me the full report",
      subtitle: "Unlock the detailed prompt quality report and complete your workflow setup.",
      color: "#059669",
      border: "rgba(5,150,105,0.2)",
      bg: "rgba(5,150,105,0.04)",
      hoverBorder: "rgba(5,150,105,0.4)",
      onClick: onSatisfied,
      cta: "View Full Report →",
    },
    {
      icon: <Wrench size={20} color="#D97706" />,
      iconBg: "rgba(217,119,6,0.1)",
      iconBorder: "rgba(217,119,6,0.2)",
      title: "I'm not satisfied — improve my agent",
      subtitle: "Go back and refine your agent's prompt based on the test results.",
      color: "#D97706",
      border: "rgba(217,119,6,0.2)",
      bg: "rgba(217,119,6,0.03)",
      hoverBorder: "rgba(217,119,6,0.4)",
      onClick: onImprove,
      cta: "Improve Agent →",
    },
    {
      icon: <Clock size={20} color="#6366F1" />,
      iconBg: "rgba(99,102,241,0.08)",
      iconBorder: "rgba(99,102,241,0.18)",
      title: "I'll come back later",
      subtitle: "Your test results are saved. You can review them anytime.",
      color: "#4F46E5",
      border: "rgba(99,102,241,0.15)",
      bg: "rgba(99,102,241,0.03)",
      hoverBorder: "rgba(99,102,241,0.3)",
      onClick: onLater,
      cta: "Exit for now →",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeInUp 0.5s ease both", maxWidth: 640, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 6 }}>What would you like to do next?</div>
        <div style={{ fontSize: 13, color: "rgba(60,40,120,0.5)", lineHeight: 1.6 }}>
          Based on your test results, choose what makes sense for you right now.
        </div>
      </div>

      {options.map((opt, i) => (
        <div key={i} onClick={opt.onClick} style={{
          background: "linear-gradient(145deg, rgba(255,255,255,0.78), rgba(255,255,255,0.52))",
          backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
          border: `1px solid ${opt.border}`,
          borderRadius: 18, padding: "18px 20px",
          display: "flex", alignItems: "center", gap: 16,
          cursor: "pointer", transition: "all 0.2s",
          boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.9), 0 4px 20px rgba(0,0,0,0.04)",
          animation: `fadeInUp 0.5s ease ${i * 0.08}s both`,
        }}
          onMouseEnter={e => {
            e.currentTarget.style.border = `1px solid ${opt.hoverBorder}`;
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = `inset 0 1.5px 0 rgba(255,255,255,0.9), 0 8px 32px rgba(0,0,0,0.08)`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.border = `1px solid ${opt.border}`;
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "inset 0 1.5px 0 rgba(255,255,255,0.9), 0 4px 20px rgba(0,0,0,0.04)";
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
            background: opt.iconBg, border: `1px solid ${opt.iconBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {opt.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 3 }}>{opt.title}</div>
            <div style={{ fontSize: 12, color: "rgba(60,40,120,0.5)", lineHeight: 1.5 }}>{opt.subtitle}</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: opt.color, flexShrink: 0 }}>{opt.cta}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main screen ───
export function MyAgentScreen({ userId }: { userId: string }) {
  // "intro" → "main" → stays in main
  const [screen, setScreen] = useState<"intro" | "main">("intro");
  const [tab, setTab] = useState<"bulk" | "chat">("bulk");
  const [subScreen, setSubScreen] = useState<"default" | "satisfaction" | "report">("default");
  const [prompt, setPrompt] = useState<AgentPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [universalCriteria, setUniversalCriteria] = useState<any[]>([]);

  useEffect(() => {
    fetchPrompt(userId).then(p => { setPrompt(p); setLoading(false); });
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
    { id: "bulk", label: "Quality Test", icon: <FlaskConical size={13} /> },
    { id: "chat", label: "Test Yourself", icon: <MessageSquare size={13} /> },
  ] as const;

  // Called by BulkTesting when test finishes — show satisfaction screen
  function handleBulkComplete() {
    setSubScreen("satisfaction");
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes agentbounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideInRow { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideInScenario { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeInScore { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
        @keyframes dotPulse { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
        @keyframes dotBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.2); border-radius: 4px; }
      `}</style>

      {/* Background blobs */}
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
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px", marginBottom: 4 }}>
            Good <span style={{ color: "#4F46E5" }}>{greeting}</span>
          </h1>
          <p style={{ fontSize: 13, color: "rgba(99,102,241,0.6)" }}>
            {screen === "intro"
              ? "Your agent is built — now let's verify it's ready."
              : "Test your agent and make sure it's ready for real leads."}
          </p>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
            <div style={{ fontSize: 13, color: "rgba(99,102,241,0.5)" }}>Loading your agent...</div>
          </div>
        ) : !prompt ? (
          <GlassCard><LockedState /></GlassCard>
        ) : screen === "intro" ? (
          <IntroScreen onReady={() => setScreen("main")} />
        ) : subScreen === "satisfaction" ? (
          <SatisfactionScreen
            onSatisfied={() => setSubScreen("report")}
            onImprove={() => {
              // TODO: navigate to prompt builder tab when you're ready
              setSubScreen("default");
              setTab("bulk");
            }}
            onLater={() => {
              setScreen("intro");
              setSubScreen("default");
            }}
          />
        ) : subScreen === "report" ? (
          <FullReport prompt={prompt} onBack={() => setSubScreen("satisfaction")} />
        ) : (
          <>
            {/* Tabs */}
            <div style={{
              display: "flex", gap: 4, marginBottom: 22,
              background: "rgba(255,255,255,0.35)", backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)", borderRadius: 12, padding: 4, width: "fit-content",
              border: "1px solid rgba(255,255,255,0.6)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
            }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "8px 20px", borderRadius: 9, border: "none", fontSize: 12, fontWeight: 700,
                  cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all .15s",
                  background: tab === t.id ? "rgba(255,255,255,0.85)" : "transparent",
                  color: tab === t.id ? "#3730a3" : "rgba(60,40,120,0.5)",
                  boxShadow: tab === t.id ? "inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(99,102,241,0.1)" : "none",
                }}>
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            {tab === "bulk" ? (
              <BulkTesting
                userId={userId}
                prompt={prompt}
                universalCriteria={universalCriteria}
                onComplete={handleBulkComplete}
              />
            ) : (
              <TestAgent prompt={prompt} userId={userId} messages={messages} setMessages={setMessages} />
            )}
          </>
        )}
      </div>
    </>
  );
}
