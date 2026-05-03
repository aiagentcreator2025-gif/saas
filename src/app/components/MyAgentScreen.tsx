import { useEffect, useState, useRef } from "react";
import { Lock, Send, CheckCircle, XCircle, Bot, RotateCcw } from "lucide-react";
import { supabase } from "../supabaseClient";

const WEBHOOK_URL = "https://rosegoldprojectai2.app.n8n.cloud/webhook/9d8cb518-ca82-48b8-b31d-c6ce4011d9a3";

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

function ScoreRing({ score }: { score: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 90 ? "#059669" : score >= 70 ? "#D97706" : "#DC2626";
  return (
    <div style={{ position:"relative", width:100, height:100, flexShrink:0 }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#E5E7EB" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 50 50)" style={{ transition:"stroke-dasharray 1s ease" }} />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontSize:22, fontWeight:800, color:"#111827", lineHeight:1 }}>{score}</span>
        <span style={{ fontSize:10, color:"#9CA3AF" }}>/100</span>
      </div>
    </div>
  );
}

function PassBadge({ pass }: { pass: boolean }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20, flexShrink:0, background: pass ? "#ECFDF5" : "#FEF2F2", color: pass ? "#059669" : "#DC2626" }}>
      {pass ? <CheckCircle size={10} /> : <XCircle size={10} />}
      {pass ? "Pass" : "Fail"}
    </span>
  );
}

function LockedState() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 24px", textAlign:"center" }}>
      <div style={{ width:64, height:64, borderRadius:"50%", background:"#EEF2FF", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20 }}>
        <Lock size={24} strokeWidth={1.5} color="#4F46E5" />
      </div>
      <div style={{ fontSize:18, fontWeight:800, color:"#111827", marginBottom:8 }}>Your agent isn't ready yet</div>
      <div style={{ fontSize:13, color:"#9CA3AF", maxWidth:320, lineHeight:1.6 }}>
        Complete your onboarding to generate your AI agent. Once approved, you'll be able to test it and view the full quality report here.
      </div>
    </div>
  );
}

function FullReport({ prompt }: { prompt: AgentPrompt }) {
  const report = typeof prompt.scoring_report === "string"
    ? JSON.parse(prompt.scoring_report)
    : prompt.scoring_report;
  const color = prompt.score >= 90 ? "#059669" : "#D97706";
  const summaryItems = [
    { label:"IOE Structure", value: report?.summary?.ioe_structure ?? "—" },
    { label:"Pitfalls",      value: report?.summary?.pitfalls ?? "—" },
    { label:"Principles",    value: report?.summary?.principles ?? "—" },
    { label:"Levels",        value: report?.summary?.levels ?? "—" },
  ];
  const sections = [
    { title:"Pitfalls Check", data: report?.pitfalls_check?.results,  score: report?.pitfalls_check?.score,  max:25 },
    { title:"IOE Structure",  data: report?.ioe_check?.results,       score: report?.ioe_check?.score,       max:25 },
    { title:"Principles",     data: report?.principles_check?.results, score: report?.principles_check?.score, max:25 },
    { title:"Levels",         data: report?.levels_check?.results,    score: report?.levels_check?.score,    max:25 },
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ background:"#FFFFFF", border:"1px solid #E5E7EB", borderRadius:16, padding:24, display:"flex", alignItems:"center", gap:28, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
        <ScoreRing score={prompt.score} />
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12, flexWrap:"wrap" as const }}>
            <span style={{ fontSize:16, fontWeight:800, color:"#111827" }}>{report?.headline ?? "Quality Report"}</span>
            <span style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:20, background: prompt.status === "approved" ? "#ECFDF5" : "#FEF2F2", color: prompt.status === "approved" ? "#059669" : "#DC2626" }}>
              {prompt.status === "approved" ? "✓ Approved" : "✗ Rejected"}
            </span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
            {summaryItems.map((s, i) => (
              <div key={i} style={{ background:"#F9FAFB", borderRadius:10, padding:"10px 12px", border:"1px solid #F3F4F6" }}>
                <div style={{ fontSize:9, color:"#9CA3AF", textTransform:"uppercase" as const, letterSpacing:"0.8px", marginBottom:4, fontWeight:700 }}>{s.label}</div>
                <div style={{ fontSize:12, fontWeight:700, color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {sections.map((section, i) => section.data ? (
        <div key={i} style={{ background:"#FFFFFF", border:"1px solid #E5E7EB", borderRadius:16, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px", borderBottom:"1px solid #F3F4F6" }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#111827" }}>{section.title}</div>
            <span style={{ fontSize:11, fontWeight:600, color:"#9CA3AF" }}>{section.score}/{section.max}</span>
          </div>
          <div>
            {Object.entries(section.data).map(([key, val]: [string, any], j, arr) => (
              <div key={j} style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"12px 20px", borderBottom: j < arr.length-1 ? "1px solid #F9FAFB" : "none" }}>
                <PassBadge pass={val?.pass ?? false} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:"#111827", fontWeight:700, marginBottom:2 }}>
                    {key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  <div style={{ fontSize:11, color:"#6B7280", lineHeight:1.5 }}>{val?.note ?? ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null)}

      {report?.fixes?.length > 0 && (
        <div style={{ background:"#FFFFFF", border:"1px solid #E5E7EB", borderRadius:16, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          <div style={{ padding:"14px 20px", borderBottom:"1px solid #F3F4F6" }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#111827" }}>Recommended Fixes</div>
            <div style={{ fontSize:11, color:"#9CA3AF", marginTop:2 }}>Ordered by priority</div>
          </div>
          <div>
            {report.fixes.map((fix: any, i: number) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:14, padding:"12px 20px", borderBottom: i < report.fixes.length-1 ? "1px solid #F9FAFB" : "none" }}>
                <div style={{ width:22, height:22, borderRadius:"50%", background:"#EEF2FF", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#4F46E5", flexShrink:0 }}>
                  {fix.priority}
                </div>
                <div>
                  <div style={{ fontSize:12, color:"#111827", fontWeight:700, marginBottom:2 }}>{fix.issue}</div>
                  <div style={{ fontSize:11, color:"#6B7280", lineHeight:1.5 }}>{fix.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display:"flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom:12 }}>
      {!isUser && (
        <div style={{ width:28, height:28, borderRadius:"50%", background:"#EEF2FF", display:"flex", alignItems:"center", justifyContent:"center", marginRight:8, flexShrink:0, alignSelf:"flex-end" }}>
          <Bot size={13} color="#4F46E5" />
        </div>
      )}
      <div style={{ maxWidth:"68%" }}>
        <div style={{ padding:"10px 14px", borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: isUser ? "#4F46E5" : "#FFFFFF", border: isUser ? "none" : "1px solid #E5E7EB", fontSize:13, fontWeight: isUser ? 500 : 400, color: isUser ? "#fff" : "#111827", lineHeight:1.55, whiteSpace:"pre-wrap" as const }}>
          {msg.content}
        </div>
        <div style={{ fontSize:9, color:"#9CA3AF", marginTop:4, textAlign: isUser ? "right" as const : "left" as const }}>{msg.time}</div>
      </div>
    </div>
  );
}

function TestAgent({ prompt, userId, messages, setMessages }: {
  prompt: AgentPrompt; userId: string;
  messages: Message[]; setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Message = { role:"user", content:text, time:getNow() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
      const res = await fetch(WEBHOOK_URL, {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ user_id:userId, message:text, history }),
      });
      const data = await res.json();
      const reply = data?.message ?? data?.output ?? "...";
      setMessages(prev => [...prev, { role:"agent", content:reply, time:getNow() }]);
    } catch {
      setMessages(prev => [...prev, { role:"agent", content:"Something went wrong. Please try again.", time:getNow() }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ background:"#FFFFFF", border:"1px solid #E5E7EB", borderRadius:16, overflow:"hidden", display:"flex", flexDirection:"column", height:560, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
      {/* Header */}
      <div style={{ padding:"14px 20px", borderBottom:"1px solid #F3F4F6", display:"flex", alignItems:"center", justifyContent:"space-between", background:"#FAFAFA" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:"50%", background:"#EEF2FF", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Bot size={15} color="#4F46E5" />
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#111827" }}>Your AI Agent</div>
            <div style={{ fontSize:10, color:"#059669", fontWeight:600 }}>● Live — Score {prompt.score}/100</div>
          </div>
        </div>
        <button onClick={() => { setMessages([]); setInput(""); }} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, fontWeight:600, color:"#6B7280", background:"#F3F4F6", border:"none", borderRadius:8, padding:"6px 12px", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          <RotateCcw size={11} /> Reset
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto" as const, padding:"20px 16px", background:"#F9FAFB" }}>
        {messages.length === 0 && (
          <div style={{ textAlign:"center" as const, padding:"40px 20px" }}>
            <div style={{ fontSize:13, color:"#9CA3AF", lineHeight:1.7 }}>
              Send a message to start testing your agent.<br />
              Try: <span style={{ color:"#4F46E5", fontWeight:600 }}>"Hey I saw your post"</span>
            </div>
          </div>
        )}
        {messages.map((msg, i) => <Bubble key={i} msg={msg} />)}
        {loading && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <div style={{ width:28, height:28, borderRadius:"50%", background:"#EEF2FF", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Bot size={13} color="#4F46E5" />
            </div>
            <div style={{ padding:"10px 14px", background:"#FFFFFF", border:"1px solid #E5E7EB", borderRadius:"16px 16px 16px 4px" }}>
              <div style={{ display:"flex", gap:4 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#D1D5DB", animation:`agentbounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding:"12px 16px", borderTop:"1px solid #F3F4F6", display:"flex", gap:10, background:"#FFFFFF" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Type a message..."
          style={{ flex:1, border:"1.5px solid #E5E7EB", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#111827", outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif", background:"#F9FAFB" }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          style={{ width:40, height:40, borderRadius:10, background: input.trim() && !loading ? "#4F46E5" : "#F3F4F6", border:"none", cursor: input.trim() && !loading ? "pointer" : "default", display:"flex", alignItems:"center", justifyContent:"center", transition:"background .15s", flexShrink:0 }}
        >
          <Send size={15} color={input.trim() && !loading ? "#fff" : "#9CA3AF"} />
        </button>
      </div>
    </div>
  );
}

export function MyAgentScreen({ userId }: { userId: string }) {
  const [tab, setTab] = useState<"test"|"report">("test");
  const [prompt, setPrompt] = useState<AgentPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    fetchPrompt(userId).then(p => { setPrompt(p); setLoading(false); });
  }, [userId]);

  const hr = new Date().getHours();
  const greeting = hr < 12 ? "morning" : hr < 18 ? "afternoon" : "evening";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes agentbounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
      `}</style>
      <div style={{ padding:"36px 40px", width:"100%", fontFamily:"'Plus Jakarta Sans',sans-serif", background:"#EDEEF5", minHeight:"100vh" }}>

        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:26, fontWeight:800, color:"#111827", letterSpacing:"-0.5px", marginBottom:4 }}>
            Good <span style={{ color:"#4F46E5" }}>{greeting}</span>
          </h1>
          <p style={{ fontSize:13, color:"#9CA3AF" }}>
            {prompt ? "Your agent is ready — test it or review its quality report." : "Complete onboarding to unlock your AI agent."}
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:4, marginBottom:20, background:"#E5E7EB", borderRadius:10, padding:4, width:"fit-content" }}>
          {(["test","report"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding:"8px 22px", borderRadius:8, border:"none", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all .15s", background: tab===t ? "#FFFFFF" : "transparent", color: tab===t ? "#111827" : "#9CA3AF", boxShadow: tab===t ? "0 1px 4px rgba(0,0,0,.08)" : "none" }}>
              {t === "test" ? "Test Agent" : "Full Report"}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:300 }}>
            <div style={{ fontSize:13, color:"#9CA3AF" }}>Loading your agent...</div>
          </div>
        ) : !prompt ? (
          <div style={{ background:"#FFFFFF", border:"1px solid #E5E7EB", borderRadius:16, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
            <LockedState />
          </div>
        ) : tab === "test" ? (
          <TestAgent prompt={prompt} userId={userId} messages={messages} setMessages={setMessages} />
        ) : (
          <FullReport prompt={prompt} />
        )}
      </div>
    </>
  );
}
