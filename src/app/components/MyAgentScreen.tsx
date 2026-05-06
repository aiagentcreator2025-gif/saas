import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bot, ChevronRight, ArrowLeft, Sparkles, FlaskConical,
  MessageSquare, CheckCircle, Settings, Loader2, Check,
  Zap, Shield, Star, Lock, Calendar, Brain
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { BulkTesting } from "./BulkTesting";

// ─── Types ────────────────────────────────────────────────────────────────────
type View =
  | "intro"
  | "choose-type"
  | "preview-booking"
  | "preview-followup"
  | "build"
  | "test-intro"
  | "testing"
  | "satisfied";

interface AgentConfig {
  agent_name: string;
  writing_style: string;
  agent_personality: string;
  primary_service: string;
  target_audience: string;
  main_goal: string;
}

const WRITING_STYLES = [
  { id: "professional", label: "Professional", desc: "Formal, trustworthy, structured" },
  { id: "friendly", label: "Friendly & Warm", desc: "Casual, human, approachable" },
  { id: "persuasive", label: "Persuasive", desc: "Sales-driven, confident, direct" },
  { id: "educational", label: "Educational", desc: "Informative, clear, step-by-step" },
];

const EMPTY_CONFIG: AgentConfig = {
  agent_name: "",
  writing_style: "friendly",
  agent_personality: "",
  primary_service: "",
  target_audience: "",
  main_goal: "",
};

// ─── Global Styles ────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  .ma-root { font-family: 'Plus Jakarta Sans', sans-serif; min-height: 100vh; background: #F4F5FA; }
  .ma-btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 13px 28px; border-radius: 12px; border: none; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.2s; box-shadow: 0 4px 16px rgba(79,70,229,0.35); }
  .ma-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(79,70,229,0.45); }
  .ma-btn-secondary { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; border-radius: 10px; border: 1.5px solid #E5E7EB; background: #fff; color: #6B7280; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.15s; }
  .ma-btn-secondary:hover { background: #F9FAFB; color: #111827; border-color: #D1D5DB; }
  .ma-input { width: 100%; padding: 10px 14px; border: 1.5px solid #E5E7EB; border-radius: 10px; font-size: 13px; color: #111827; background: #fff; outline: none; font-family: 'Plus Jakarta Sans', sans-serif; transition: border-color 0.15s; }
  .ma-input:focus { border-color: #4F46E5; box-shadow: 0 0 0 3px rgba(79,70,229,0.08); }
  .ma-textarea { width: 100%; padding: 10px 14px; border: 1.5px solid #E5E7EB; border-radius: 10px; font-size: 13px; color: #111827; background: #fff; outline: none; font-family: 'Plus Jakarta Sans', sans-serif; resize: none; line-height: 1.7; transition: border-color 0.15s; }
  .ma-textarea:focus { border-color: #4F46E5; box-shadow: 0 0 0 3px rgba(79,70,229,0.08); }
  .ma-label { display: block; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; }
  .ma-style-opt { padding: 12px 14px; border-radius: 10px; cursor: pointer; border: 1.5px solid #E5E7EB; background: #FAFAFA; margin-bottom: 8px; transition: all 0.15s; }
  .ma-style-opt:hover { border-color: #A5B4FC; background: #F5F3FF; }
  .ma-style-opt.selected { border-color: #4F46E5; background: #EEF2FF; }
  .ma-node { border-radius: 14px; padding: 16px 18px; border: 1.5px solid; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.18s; background: #fff; }
  .ma-node:hover { transform: translateX(3px); box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
  .ma-node.active { box-shadow: 0 0 0 3px rgba(79,70,229,0.15); }
  .ma-connector { display: flex; flex-direction: column; align-items: center; margin: 4px 0; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes successPop { 0% { transform: scale(0.8); opacity: 0; } 60% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
  .ma-fade-up { animation: fadeUp 0.4s ease forwards; }
  .ma-fade-up-1 { animation: fadeUp 0.4s ease 0.08s forwards; opacity: 0; }
  .ma-fade-up-2 { animation: fadeUp 0.4s ease 0.16s forwards; opacity: 0; }
  .ma-fade-up-3 { animation: fadeUp 0.4s ease 0.24s forwards; opacity: 0; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
`;

// ─── Agent Steps (brain only) ─────────────────────────────────────────────────
const AGENT_STEPS = [
  { id: "identity", label: "Agent Identity", sublabel: "Name & personality", color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE", icon: <Bot size={15} strokeWidth={1.5} /> },
  { id: "style", label: "Writing Style", sublabel: "How your agent communicates", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", icon: <MessageSquare size={15} strokeWidth={1.5} /> },
  { id: "knowledge", label: "Agent Knowledge", sublabel: "Service & audience context", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", icon: <Brain size={15} strokeWidth={1.5} /> },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  userId: string;
  onAgentCertified: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function MyAgentScreen({ userId, onAgentCertified }: Props) {
  const [view, setView] = useState<View>("intro");
  const [agentType, setAgentType] = useState<"booking" | "followup" | null>(null);
  const [config, setConfig] = useState<AgentConfig>(EMPTY_CONFIG);
  const [activeStep, setActiveStep] = useState("identity");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load existing config from Supabase on mount
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("accounts_leadflow")
      .select("business_name, service, target_audience, main_goal")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setConfig(prev => ({
            ...prev,
            primary_service: data.service || "",
            target_audience: data.target_audience || "",
            main_goal: data.main_goal || "",
          }));
        }
      });
  }, [userId]);

  const onChange = (field: keyof AgentConfig, val: string) => {
    setConfig(prev => ({ ...prev, [field]: val }));
    setSaved(false);
  };

  const onSave = async () => {
    setSaving(true);
    await supabase.from("generated_prompts").upsert({
      user_id: userId,
      agent_type: agentType,
      agent_config: config,
      status: "draft",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const onPublish = async () => {
    setPublishing(true);
    await onSave();
    // Fire n8n to generate the prompt
    try {
      await fetch("https://rosegoldprojectai2.app.n8n.cloud/webhook/generate-agent-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, agent_type: agentType, config }),
      });
    } catch (e) { console.error(e); }
    await supabase.from("generated_prompts").upsert({
      user_id: userId,
      agent_type: agentType,
      agent_config: config,
      status: "approved",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    setPublishing(false);
    setPublished(true);
    setTimeout(() => setView("test-intro"), 1200);
  };

  const handleSatisfied = async () => {
    await supabase
      .from("generated_prompts")
      .update({ agent_certified: true })
      .eq("user_id", userId)
      .eq("status", "approved");
    setShowSuccess(true);
    setTimeout(() => {
      onAgentCertified();
    }, 2200);
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="ma-root" style={{ flex: 1, height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* Success overlay */}
        {showSuccess && <SuccessOverlay />}

        {view === "intro" && <IntroScreen onContinue={() => setView("choose-type")} />}
        {view === "choose-type" && (
          <ChooseTypeScreen
            onSelect={(type) => { setAgentType(type); setView(type === "booking" ? "preview-booking" : "preview-followup"); }}
            onBack={() => setView("intro")}
          />
        )}
        {view === "preview-booking" && (
          <PreviewScreen
            type="booking"
            onStart={() => setView("build")}
            onBack={() => setView("choose-type")}
          />
        )}
        {view === "preview-followup" && (
          <PreviewScreen
            type="followup"
            onStart={() => setView("build")}
            onBack={() => setView("choose-type")}
          />
        )}
        {view === "build" && (
          <BuildScreen
            agentType={agentType!}
            config={config}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            onChange={onChange}
            onSave={onSave}
            onPublish={onPublish}
            saving={saving}
            saved={saved}
            publishing={publishing}
            published={published}
            onBack={() => setView(agentType === "booking" ? "preview-booking" : "preview-followup")}
          />
        )}
        {view === "test-intro" && (
          <TestIntroScreen
            onContinue={() => setView("testing")}
            onBack={() => setView("build")}
          />
        )}
        {view === "testing" && (
          <BulkTesting
            userId={userId}
            onComplete={(testRun, results) => {
              // BulkTesting handles satisfaction internally, we wire the callback
            }}
            onSatisfied={handleSatisfied}
            onBack={() => setView("test-intro")}
          />
        )}
      </div>
    </>
  );
}

// ─── Intro Screen ─────────────────────────────────────────────────────────────
function IntroScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #f0f4ff 0%, #e8eaf6 40%, #f5f0ff 100%)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -200, left: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -150, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div className="ma-fade-up" style={{
        position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: 64,
        maxWidth: 1000, width: "90%", padding: "56px 60px",
        background: "rgba(255,255,255,0.5)", backdropFilter: "blur(32px) saturate(180%)",
        WebkitBackdropFilter: "blur(32px) saturate(180%)",
        borderRadius: 32, border: "1px solid rgba(255,255,255,0.75)",
        boxShadow: "0 8px 40px rgba(79,70,229,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}>
        {/* Left */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px",
            borderRadius: 100, background: "rgba(79,70,229,0.08)", border: "1px solid rgba(79,70,229,0.15)",
            fontSize: 11, fontWeight: 700, color: "#4F46E5", letterSpacing: "0.6px",
            textTransform: "uppercase" as const, marginBottom: 20,
          }}>
            <Bot size={10} strokeWidth={2.5} /> Build Your AI Employee
          </div>

          <div style={{ fontSize: 42, fontWeight: 800, color: "#0f1117", lineHeight: 1.1, letterSpacing: "-1.2px", marginBottom: 16 }}>
            Meet your new<br />
            <span style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              AI employee.
            </span>
          </div>

          <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.75, marginBottom: 32, maxWidth: 380 }}>
            You're about to build an AI agent that handles your leads 24/7 — qualifying them, answering questions, and booking calls. Like a real employee, but never sleeps.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
            {[
              { icon: <Brain size={14} strokeWidth={2} />, label: "Build the brain", desc: "Configure your agent's identity, tone & knowledge" },
              { icon: <FlaskConical size={14} strokeWidth={2} />, label: "Stress test it", desc: "Run 10 real scenarios to see if it's ready" },
              { icon: <CheckCircle size={14} strokeWidth={2} />, label: "Certify & deploy", desc: "Once satisfied, unlock the full workspace" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(79,70,229,0.08)", border: "1px solid rgba(79,70,229,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#4F46E5", flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{item.label}</span>
                  <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: 8 }}>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <button className="ma-btn-primary" onClick={onContinue} style={{ fontSize: 15, padding: "14px 32px" }}>
            Let's build my agent <ChevronRight size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Right illustration */}
        <div style={{ width: 320, height: 320, flexShrink: 0, position: "relative" }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 24, background: "linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)", border: "1px solid rgba(79,70,229,0.12)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <img
              src="https://raw.githubusercontent.com/aiagentcreator2025-gif/saas/main/public/wholeteam2.png"
              alt="AI Agent"
             style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center center" }}
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                el.style.display = "none";
                const fb = el.nextSibling as HTMLElement;
                if (fb) fb.style.display = "flex";
              }}
            />
            <div style={{ display: "none", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: "linear-gradient(135deg, #4F46E5, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bot size={40} color="#fff" strokeWidth={1.5} />
              </div>
              <span style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 500 }}>Your AI Agent</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Choose Type Screen ───────────────────────────────────────────────────────
function ChooseTypeScreen({ onSelect, onBack }: { onSelect: (t: "booking" | "followup") => void; onBack: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0f4ff 0%, #F4F5FA 50%, #f5f0ff 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div className="ma-fade-up" style={{ maxWidth: 800, width: "100%" }}>
        <button className="ma-btn-secondary" onClick={onBack} style={{ marginBottom: 32 }}>
          <ArrowLeft size={13} strokeWidth={1.8} /> Back
        </button>

        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#0f1117", letterSpacing: "-0.8px", marginBottom: 12 }}>
            What kind of agent do you need?
          </div>
          <p style={{ fontSize: 15, color: "#6B7280", maxWidth: 480, margin: "0 auto" }}>
            Pick the type that matches your business goal. You can always build the other one later.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {[
            {
              type: "booking" as const,
              icon: <img src="https://raw.githubusercontent.com/aiagentcreator2025-gif/saas/main/public/bookingflow.png" style={{ width: 40, height: 40, objectFit: "cover" }} />,
              label: "Booking Agent",
              tagline: "Qualifies leads & books calls",
              desc: "Your agent greets every lead, qualifies them with your script, delivers your lead magnet, and books a call — all automatically.",
              bullets: ["Welcome & qualify leads", "Send your lead magnet", "Book discovery calls", "24/7 on WhatsApp"],
              color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE",
            },
            {
              type: "followup" as const,
              icon: <img src="https://raw.githubusercontent.com/aiagentcreator2025-gif/saas/main/public/followupagent3.png" style={{ width: 40, height: 40, objectFit: "cover" }} />,
              label: "Follow-Up Agent",
              tagline: "Re-engages cold leads",
              desc: "Your agent automatically follows up with leads who didn't respond — bringing them back into the conversation at the right moment.",
              bullets: ["Scheduled follow-ups", "Re-engage cold leads", "AI continues the convo", "Never lose a lead again"],
              color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE",
            },
          ].map((card) => (
            <div
              key={card.type}
              onClick={() => onSelect(card.type)}
              style={{
                background: "#fff", borderRadius: 20, border: `1.5px solid ${card.border}`,
                padding: "32px 28px", cursor: "pointer", transition: "all 0.2s",
                boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 40px ${card.color}25`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)"; }}
            >
              <div style={{ width: 80, height: 80, borderRadius: 20, overflow: "hidden", marginBottom: 20 }}>
  {card.icon}
</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 4 }}>{card.label}</div>
              <div style={{ fontSize: 12, color: card.color, fontWeight: 600, marginBottom: 14 }}>{card.tagline}</div>
              <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7, marginBottom: 20 }}>{card.desc}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {card.bullets.map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#374151", fontWeight: 500 }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: card.bg, border: `1px solid ${card.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Check size={9} strokeWidth={2.5} color={card.color} />
                    </div>
                    {b}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: card.color }}>
                Choose this agent <ChevronRight size={14} strokeWidth={2.5} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Preview Screen ───────────────────────────────────────────────────────────
function PreviewScreen({ type, onStart, onBack }: { type: "booking" | "followup"; onStart: () => void; onBack: () => void }) {
  const isBooking = type === "booking";
  const color = isBooking ? "#4F46E5" : "#7C3AED";
  const bg = isBooking ? "#EEF2FF" : "#F5F3FF";
  const border = isBooking ? "#C7D2FE" : "#DDD6FE";

  const features = isBooking ? [
    { icon: <Zap size={14} strokeWidth={2} />, title: "Instant response", desc: "Replies to every lead within seconds, day or night" },
    { icon: <Shield size={14} strokeWidth={2} />, title: "Stays on script", desc: "Never goes off-topic, always follows your qualification flow" },
    { icon: <Star size={14} strokeWidth={2} />, title: "Books for you", desc: "Guides every qualified lead to book a discovery call" },
  ] : [
    { icon: <Zap size={14} strokeWidth={2} />, title: "Perfect timing", desc: "Sends follow-ups at exactly the right moment" },
    { icon: <Shield size={14} strokeWidth={2} />, title: "Never annoying", desc: "Natural, human follow-up that doesn't feel like spam" },
    { icon: <Star size={14} strokeWidth={2} />, title: "Recovers leads", desc: "Turns cold leads back into active conversations" },
  ];

  const headerImg = isBooking
    ? "https://raw.githubusercontent.com/aiagentcreator2025-gif/saas/main/public/facebooking1.png"
    : "https://raw.githubusercontent.com/aiagentcreator2025-gif/saas/main/public/facefollowupagent.png";

  return (
    <div style={{ minHeight: "100vh", background: "#F4F5FA", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div className="ma-fade-up" style={{ maxWidth: 720, width: "100%", background: "#fff", borderRadius: 28, border: `1px solid ${border}`, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        {/* Header */}
        <div style={{ padding: "32px 36px", background: `linear-gradient(135deg, ${bg} 0%, #fff 100%)`, borderBottom: `1px solid ${border}` }}>
          <button className="ma-btn-secondary" onClick={onBack} style={{ marginBottom: 24 }}>
            <ArrowLeft size={13} strokeWidth={1.8} /> Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, overflow: "hidden", flexShrink: 0, background: bg, border: `1px solid ${border}` }}>
              <img src={headerImg} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#111827", letterSpacing: "-0.4px" }}>
                {isBooking ? "Booking Agent" : "Follow-Up Agent"}
              </div>
              <div style={{ fontSize: 13, color, fontWeight: 600, marginTop: 2 }}>
                {isBooking ? "Your 24/7 lead qualification & booking machine" : "Never lose a lead to silence again"}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "32px 36px" }}>
          <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.8, marginBottom: 28 }}>
            {isBooking
              ? "This agent will handle every new WhatsApp lead from start to finish. It introduces itself, qualifies the lead using your script, sends your lead magnet, follows up, and guides them to book a discovery call — without you lifting a finger."
              : "This agent automatically reaches out to leads who went quiet. It sends perfectly timed, human-sounding follow-up messages and, when they reply, jumps back into the conversation to guide them toward booking a call."}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 32 }}>
            {features.map((f, i) => (
              <div key={i} style={{ padding: "16px", background: bg, borderRadius: 12, border: `1px solid ${border}` }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color, marginBottom: 10 }}>
                  {f.icon}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: "16px 20px", background: "#F9FAFB", borderRadius: 12, border: "1px solid #E5E7EB", marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 12 }}>What you'll configure</div>
            <div style={{ display: "flex", gap: 12 }}>
              {AGENT_STEPS.map((step) => (
                <div key={step.id} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, background: step.bg, border: `1px solid ${step.border}` }}>
                  <div style={{ color: step.color, display: "flex" }}>{step.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>{step.label}</div>
                </div>
              ))}
            </div>
          </div>

          <button className="ma-btn-primary" onClick={onStart} style={{ width: "100%", justifyContent: "center", fontSize: 15, padding: "14px" }}>
            Configure my agent <ChevronRight size={15} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Build Screen ─────────────────────────────────────────────────────────────
function BuildScreen({ agentType, config, activeStep, setActiveStep, onChange, onSave, onPublish, saving, saved, publishing, published, onBack }: {
  agentType: "booking" | "followup"; config: AgentConfig; activeStep: string;
  setActiveStep: (s: string) => void; onChange: (f: keyof AgentConfig, v: string) => void;
  onSave: () => void; onPublish: () => void; saving: boolean; saved: boolean;
  publishing: boolean; published: boolean; onBack: () => void;
}) {
  const color = agentType === "booking" ? "#4F46E5" : "#7C3AED";

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Left — Flow nodes */}
      <div style={{ width: 300, background: "#fff", borderRight: "1px solid #E5E7EB", display: "flex", flexDirection: "column", padding: "24px 16px", overflowY: "auto" }}>
        <button className="ma-btn-secondary" onClick={onBack} style={{ marginBottom: 24, alignSelf: "flex-start" }}>
          <ArrowLeft size={13} strokeWidth={1.8} /> Back
        </button>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Agent Configuration</div>
        <div style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic", marginBottom: 24 }}>
          {agentType === "booking" ? "Booking Agent" : "Follow-Up Agent"}
        </div>

        {/* Steps */}
        {AGENT_STEPS.map((step, i) => (
          <div key={step.id}>
            <div
              className={`ma-node ${activeStep === step.id ? "active" : ""}`}
              onClick={() => setActiveStep(step.id)}
              style={{ borderColor: activeStep === step.id ? step.color : step.border, background: activeStep === step.id ? step.bg : "#fff" }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 10, background: step.bg, border: `1px solid ${step.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: step.color, flexShrink: 0 }}>
                {step.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{step.label}</div>
                <div style={{ fontSize: 10, color: "#9CA3AF", fontStyle: "italic" }}>{step.sublabel}</div>
              </div>
              {activeStep === step.id && <Settings size={13} color={step.color} strokeWidth={1.5} />}
            </div>
            {i < AGENT_STEPS.length - 1 && (
              <div className="ma-connector">
                <div style={{ width: 1.5, height: 16, background: "#E5E7EB" }} />
                <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "6px solid #E5E7EB" }} />
              </div>
            )}
          </div>
        ))}

        {/* Publish */}
        <div style={{ marginTop: "auto", paddingTop: 24 }}>
          <button
            onClick={onPublish}
            disabled={publishing || published}
            style={{
              width: "100%", padding: "12px", borderRadius: 12, border: "none",
              background: published ? "#059669" : `linear-gradient(135deg, ${color} 0%, #7C3AED 100%)`,
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: publishing || published ? "not-allowed" : "pointer",
              fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 7, transition: "all 0.2s",
              boxShadow: published ? "0 4px 12px rgba(5,150,105,0.3)" : `0 4px 16px ${color}40`,
              opacity: publishing ? 0.8 : 1,
            }}
          >
            {publishing ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating...</>
              : published ? <><CheckCircle size={14} /> Agent Ready!</>
              : <><Sparkles size={14} /> Build my agent</>}
          </button>
          <button onClick={onSave} disabled={saving} style={{ width: "100%", marginTop: 8, padding: "9px", borderRadius: 10, border: "1.5px solid #E5E7EB", background: saved ? "#ECFDF5" : "#fff", color: saved ? "#059669" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.15s" }}>
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save draft"}
          </button>
        </div>
      </div>

      {/* Right — Config panel */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px", background: "#F9FAFB" }}>
        <div style={{ maxWidth: 560 }}>
          {activeStep === "identity" && <IdentityPanel config={config} onChange={onChange} color={color} />}
          {activeStep === "style" && <StylePanel config={config} onChange={onChange} color={color} />}
          {activeStep === "knowledge" && <KnowledgePanel config={config} onChange={onChange} color={color} />}
        </div>
      </div>
    </div>
  );
}

// ─── Config Panels ────────────────────────────────────────────────────────────
function IdentityPanel({ config, onChange, color }: { config: AgentConfig; onChange: (f: keyof AgentConfig, v: string) => void; color: string }) {
  return (
    <div className="ma-fade-up">
      <PanelHeader title="Agent Identity" desc="Give your agent a name and a personality. This is how your leads will experience them." color={color} />
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label className="ma-label">Agent Name</label>
          <input className="ma-input" value={config.agent_name} onChange={e => onChange("agent_name", e.target.value)} placeholder="e.g. Sara, Adam, Alex..." />
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 5 }}>This name will appear in WhatsApp conversations with your leads.</div>
        </div>
        <div>
          <label className="ma-label">Personality Description</label>
          <textarea className="ma-textarea" rows={4} value={config.agent_personality} onChange={e => onChange("agent_personality", e.target.value)} placeholder="e.g. Warm and professional. Always addresses leads by name. Never pushy, asks questions before pitching..." />
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 5 }}>Describe how your agent behaves. Be specific — the more detail, the better it performs.</div>
        </div>
      </div>
    </div>
  );
}

function StylePanel({ config, onChange, color }: { config: AgentConfig; onChange: (f: keyof AgentConfig, v: string) => void; color: string }) {
  return (
    <div className="ma-fade-up">
      <PanelHeader title="Writing Style" desc="How does your agent communicate? Choose the tone that matches your brand and audience." color={color} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {WRITING_STYLES.map(style => (
          <div
            key={style.id}
            className={`ma-style-opt ${config.writing_style === style.id ? "selected" : ""}`}
            onClick={() => onChange("writing_style", style.id)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {config.writing_style === style.id && (
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Check size={10} color="#fff" strokeWidth={3} />
                </div>
              )}
              {config.writing_style !== style.id && (
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: "1.5px solid #D1D5DB", flexShrink: 0 }} />
              )}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{style.label}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>{style.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KnowledgePanel({ config, onChange, color }: { config: AgentConfig; onChange: (f: keyof AgentConfig, v: string) => void; color: string }) {
  return (
    <div className="ma-fade-up">
      <PanelHeader title="Agent Knowledge" desc="Tell your agent about your business. This is what it uses to answer questions and qualify leads." color={color} />
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label className="ma-label">Primary Service or Offer</label>
          <input className="ma-input" value={config.primary_service} onChange={e => onChange("primary_service", e.target.value)} placeholder="e.g. 1-on-1 business coaching for freelancers..." />
        </div>
        <div>
          <label className="ma-label">Target Audience</label>
          <input className="ma-input" value={config.target_audience} onChange={e => onChange("target_audience", e.target.value)} placeholder="e.g. Freelancers earning under $3k/month who want to scale..." />
        </div>
        <div>
          <label className="ma-label">Main Goal of the Conversation</label>
          <input className="ma-input" value={config.main_goal} onChange={e => onChange("main_goal", e.target.value)} placeholder="e.g. Book a free 30-minute discovery call..." />
        </div>
      </div>
    </div>
  );
}

function PanelHeader({ title, desc, color }: { title: string; desc: string; color: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-0.4px", marginBottom: 8 }}>{title}</div>
      <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7, margin: 0 }}>{desc}</p>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${color} 0%, transparent 100%)`, borderRadius: 2, marginTop: 16, width: 48 }} />
    </div>
  );
}

// ─── Test Intro Screen ────────────────────────────────────────────────────────
function TestIntroScreen({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0f4ff 0%, #F4F5FA 50%, #f5f0ff 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div className="ma-fade-up" style={{
        maxWidth: 800, width: "100%", background: "rgba(255,255,255,0.55)",
        backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
        borderRadius: 28, border: "1px solid rgba(255,255,255,0.75)",
        padding: "52px 56px", boxShadow: "0 8px 40px rgba(79,70,229,0.08)",
      }}>
        <button className="ma-btn-secondary" onClick={onBack} style={{ marginBottom: 32 }}>
          <ArrowLeft size={13} strokeWidth={1.8} /> Back to configuration
        </button>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 100, background: "rgba(79,70,229,0.08)", border: "1px solid rgba(79,70,229,0.15)", fontSize: 11, fontWeight: 700, color: "#4F46E5", letterSpacing: "0.6px", textTransform: "uppercase" as const, marginBottom: 20 }}>
          <FlaskConical size={10} strokeWidth={2.5} /> Quality Check
        </div>

        <div style={{ fontSize: 38, fontWeight: 800, color: "#0f1117", lineHeight: 1.1, letterSpacing: "-1px", marginBottom: 16 }}>
          Will your agent embarrass<br />
          <span style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            you in front of clients?
          </span>
        </div>

        <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.75, marginBottom: 36, maxWidth: 500 }}>
          Before your agent talks to real leads, we simulate 10 real conversations — testing how it handles tough questions, edge cases, and off-topic leads. You'll see every single exchange live.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40 }}>
          {[
            { icon: <FlaskConical size={16} strokeWidth={1.8} />, label: "Quality Test", title: "Simulate 10 real scenarios", desc: "We automatically test your agent against real lead situations and score every response. You watch it live." },
            { icon: <MessageSquare size={16} strokeWidth={1.8} />, label: "Test Yourself", title: "Chat with your own agent", desc: "Talk to your agent like a real lead would. Feel the experience before your clients do." },
          ].map((card, i) => (
            <div key={i} style={{ padding: "20px", background: i === 0 ? "#EEF2FF" : "#F5F3FF", borderRadius: 16, border: `1px solid ${i === 0 ? "#C7D2FE" : "#DDD6FE"}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ color: i === 0 ? "#4F46E5" : "#7C3AED" }}>{card.icon}</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: i === 0 ? "#4F46E5" : "#7C3AED", textTransform: "uppercase" as const, letterSpacing: "0.6px" }}>{card.label}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 6 }}>{card.title}</div>
              <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.6 }}>{card.desc}</div>
            </div>
          ))}
        </div>

        <button className="ma-btn-primary" onClick={onContinue} style={{ fontSize: 15, padding: "14px 36px" }}>
          I understand — test my agent <ChevronRight size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

// ─── Success Overlay ──────────────────────────────────────────────────────────
function SuccessOverlay() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fff", borderRadius: 24, padding: "48px 56px",
        textAlign: "center", animation: "successPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
        boxShadow: "0 24px 64px rgba(0,0,0,0.15)", maxWidth: 420,
      }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #059669, #10B981)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <CheckCircle size={36} color="#fff" strokeWidth={2} />
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Agent Certified! 🎉</div>
        <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>
          Your agent passed the quality test. My Workflows is now unlocked — let's set up his workspace.
        </p>
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, color: "#9CA3AF" }}>
          <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Redirecting to My Workflows...
        </div>
      </div>
    </div>
  );
}
