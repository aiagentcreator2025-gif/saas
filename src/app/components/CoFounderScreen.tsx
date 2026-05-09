import { useState, useEffect, useRef } from "react";
import { Send, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "../supabaseClient";

const AGENT_META: Record<string, { label: string; role: string; initial: string; color: string; bg: string }> = {
  alex:   { label: "Alex",     role: "Ads Strategist",          initial: "A", color: "#c2400a", bg: "rgba(251,146,60,0.12)"  },
  maya:   { label: "Maya",     role: "Landing Page Architect",  initial: "M", color: "#b45309", bg: "rgba(245,158,11,0.12)"  },
  jordan: { label: "Jordan",   role: "Welcome Script",          initial: "J", color: "#047857", bg: "rgba(16,185,129,0.12)"  },
  sam:    { label: "Sam",      role: "Lead Magnet Strategist",  initial: "S", color: "#1d4ed8", bg: "rgba(59,130,246,0.12)"  },
  casey:  { label: "Casey",    role: "Booking Script",          initial: "C", color: "#6d28d9", bg: "rgba(139,92,246,0.12)"  },
  system: { label: "LeadFlow", role: "System",                  initial: "L", color: "#4A46B5", bg: "rgba(99,102,241,0.12)"  },
};

const FUNNEL_STEPS = ["Ads", "Landing Page", "Script 1", "Lead Magnet", "Script 2"];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  agentName?: string;
  isHandoff?: boolean;
}

export function CoFounderScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState("alex");
  const [currentStep, setCurrentStep] = useState(0);
  const [funnelComplete, setFunnelComplete] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [sessionId] = useState(() => {
    const k = "lf_cf_session";
    const stored = localStorage.getItem(k);
    if (stored) return stored;
    const id = `lf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(k, id);
    return id;
  });

  // Load user + onboarding data on mount
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      setUserId(session.user.id);

      const { data } = await supabase
        .from("accounts_leadflow")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (data) setOnboardingData(data);
    };
    load();
  }, []);

  useEffect(() => {
    setMessages([{
      role: "assistant",
      content: "Hey! I'm Alex, your Ads Strategist 👋\n\nI'm part of your LeadFlow co-founder team. Together we'll build your complete marketing funnel step by step — ads, landing page, welcome script, lead magnet, and booking sequence.\n\nLet's start simple: what's your business and what are you selling?",
      agentName: "alex",
    }]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading || funnelComplete) return;
    setInput("");
    setLoading(true);
    setMessages(prev => [...prev, { role: "user", content: text }]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
          user_id: userId,
          onboarding_data: onboardingData,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again.", agentName: currentAgent }]);
        return;
      }
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.message,
        agentName: data.agent_name,
        isHandoff: data.is_handoff,
      }]);
      if (data.is_handoff && data.next_agent) {
        setCurrentAgent(data.next_agent.name);
        setCurrentStep(s => Math.min(s + 1, 4));
      }
      if (data.funnel_complete) setFunnelComplete(true);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again.", agentName: currentAgent }]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const meta = AGENT_META[currentAgent] || AGENT_META.system;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'DM Sans', sans-serif", overflow: "hidden", padding: "12px 12px 12px 0" }}>
      <style>{`
        @keyframes dotPulse { 0%,80%,100%{transform:scale(0.8);opacity:0.4} 40%{transform:scale(1.2);opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes msgIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .cf-textarea:focus{outline:none}
        .cf-textarea::placeholder{color:rgba(60,40,120,0.35)}
        .cf-send:hover:not(:disabled){background:rgba(99,102,241,0.9)!important;transform:scale(1.05)}
        .cf-send:active:not(:disabled){transform:scale(0.96)}
        .cf-send:disabled{opacity:0.4;cursor:not-allowed}
        .msg-in{animation:msgIn 0.22s ease both}
      `}</style>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRadius: 24, overflow: "hidden", backdropFilter: "blur(48px) saturate(180%)", WebkitBackdropFilter: "blur(48px) saturate(180%)", background: "linear-gradient(145deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.1) 100%)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.85), 0 4px 24px rgba(0,0,0,0.05)" }}>

        {/* Header */}
        <div style={{ padding: "18px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.3)", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.bg, border: `1px solid ${meta.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: meta.color, transition: "all 0.35s ease", flexShrink: 0 }}>
                {meta.initial}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1916", lineHeight: 1.2 }}>{meta.label}</div>
                <div style={{ fontSize: 11, color: "rgba(60,40,120,0.5)", fontWeight: 400 }}>{meta.role}</div>
              </div>
            </div>
            {funnelComplete && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 600, color: "#047857" }}>
                <CheckCircle2 size={12} /> Funnel Complete
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {FUNNEL_STEPS.map((step, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={step} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <div style={{ width: "100%", height: 3, borderRadius: 2, background: done || active ? "linear-gradient(90deg, rgba(99,102,241,0.85), rgba(99,102,241,0.4))" : "rgba(255,255,255,0.4)", transition: "all 0.4s ease" }} />
                  <div style={{ fontSize: 9, fontWeight: active ? 600 : (done ? 500 : 400), textAlign: "center" as const, color: active ? "#3730a3" : (done ? "rgba(99,102,241,0.7)" : "rgba(60,40,120,0.3)"), transition: "all 0.3s" }}>
                    {done ? "✓ " : ""}{step}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          {messages.map((msg, i) => (
            <div key={i} className="msg-in">
              {msg.isHandoff && msg.role === "assistant" && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 14px" }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.5)" }} />
                  <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(99,102,241,0.6)", letterSpacing: "0.1em", textTransform: "uppercase" as const, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 20, padding: "3px 10px" }}>
                    Handing off →
                  </div>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.5)" }} />
                </div>
              )}
              {msg.role === "assistant" ? (
                <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, marginTop: 2, background: AGENT_META[msg.agentName || "alex"]?.bg || "rgba(99,102,241,0.1)", border: `1px solid ${AGENT_META[msg.agentName || "alex"]?.color || "#6366f1"}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: AGENT_META[msg.agentName || "alex"]?.color || "#4A46B5" }}>
                    {AGENT_META[msg.agentName || "alex"]?.initial || "L"}
                  </div>
                  <div style={{ maxWidth: "74%", display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ fontSize: 10, color: "rgba(60,40,120,0.5)", fontWeight: 500, marginLeft: 2 }}>
                      {AGENT_META[msg.agentName || "alex"]?.label || "Agent"}
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.75)", borderRadius: "4px 14px 14px 14px", padding: "11px 14px", fontSize: 13, lineHeight: 1.65, color: "#1A1916", boxShadow: "0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)", whiteSpace: "pre-wrap" as const }}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ maxWidth: "68%", background: "linear-gradient(135deg, rgba(99,102,241,0.82), rgba(67,56,202,0.88))", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "14px 4px 14px 14px", padding: "11px 14px", fontSize: 13, lineHeight: 1.65, color: "#fff", boxShadow: "0 2px 12px rgba(99,102,241,0.22)", whiteSpace: "pre-wrap" as const }}>
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: meta.bg, border: `1px solid ${meta.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: meta.color }}>
                {meta.initial}
              </div>
              <div style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.7)", borderRadius: "4px 14px 14px 14px", padding: "13px 16px", display: "flex", gap: 4, alignItems: "center" }}>
                {[0, 1, 2].map(j => (
                  <div key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(99,102,241,0.45)", animation: `dotPulse 1.2s ease-in-out ${j * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "14px 20px 18px", borderTop: "1px solid rgba(255,255,255,0.3)" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, background: "rgba(255,255,255,0.45)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.7)", borderRadius: 16, padding: "10px 12px 10px 16px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 8px rgba(0,0,0,0.04)" }}>
            <textarea
              ref={textareaRef}
              className="cf-textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={funnelComplete}
              placeholder={funnelComplete ? "Your funnel is complete 🎉" : "Type your message… (Enter to send)"}
              rows={1}
              style={{ flex: 1, background: "transparent", border: "none", resize: "none" as const, fontSize: 13, lineHeight: 1.5, color: "#1A1916", fontFamily: "'DM Sans', sans-serif", minHeight: 24, maxHeight: 120, overflowY: "auto" as const }}
            />
            <button
              className="cf-send"
              onClick={sendMessage}
              disabled={!input.trim() || loading || funnelComplete}
              style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: "rgba(99,102,241,0.75)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s", color: "#fff" }}
            >
              {loading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={15} />}
            </button>
          </div>
          <div style={{ textAlign: "center" as const, marginTop: 7, fontSize: 10, color: "rgba(60,40,120,0.3)" }}>
            Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}
