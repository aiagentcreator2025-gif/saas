import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bot, ChevronRight, ArrowLeft, Sparkles, FlaskConical,
  MessageSquare, CheckCircle, Settings, Loader2, Check,
  Zap, Shield, Star, Lock, Calendar, Brain, Activity, Link
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { BulkTesting } from "./BulkTesting";

// ─── Types ────────────────────────────────────────────────────────────────────
type AppState = "loading" | "no-agents" | "one-agent" | "both-agents";

type View =
  | "intro"
  | "choose-type"
  | "preview-booking"
  | "preview-followup"
  | "build"
  | "test-intro"
  | "testing"
  | "agent-show";

interface AgentConfig {
  // existing
  agent_name: string;
  writing_style: string;
  agent_personality: string;
  primary_service: string;
  target_audience: string;
  main_goal: string;
  // NEW — Scripts (Booking Agent only)
  script1_service: string;
  script1_end_result: string;
  script1_category: string;
  script1_deliverable: string;
  script1_outcome: string;
  script2_price: string;
  script2_training_day: string;
  script2_call_duration: string;
  script2_conditions: string;
  // NEW — Links
  lead_magnet_link: string;
  script2_booking_link: string;
}

interface AgentRow {
  id: string;
  agent_type: "booking" | "followup";
  agent_name: string | null;
  status: string;
  certified: boolean;
  prompt: string | null;
  agent_config: AgentConfig | null;
}

interface AnalyticsRow {
  agent_id: string;
  leads_treated: number;
  leads_booked: number;
  leads_pending: number;
  health_score: number;
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
  // NEW
  script1_service: "",
  script1_end_result: "",
  script1_category: "",
  script1_deliverable: "",
  script1_outcome: "",
  script2_price: "",
  script2_training_day: "",
  script2_call_duration: "",
  script2_conditions: "",
  lead_magnet_link: "",
  script2_booking_link: "",
};

const BASE = "https://raw.githubusercontent.com/aiagentcreator2025-gif/saas/main/public/";

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
  .ma-hint { font-size: 11px; color: #9CA3AF; margin-top: 5px; }
  .ma-style-opt { padding: 12px 14px; border-radius: 10px; cursor: pointer; border: 1.5px solid #E5E7EB; background: #FAFAFA; margin-bottom: 8px; transition: all 0.15s; }
  .ma-style-opt:hover { border-color: #A5B4FC; background: #F5F3FF; }
  .ma-style-opt.selected { border-color: #4F46E5; background: #EEF2FF; }
  .ma-node { border-radius: 14px; padding: 16px 18px; border: 1.5px solid; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.18s; background: #fff; }
  .ma-node:hover { transform: translateX(3px); box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
  .ma-node.active { box-shadow: 0 0 0 3px rgba(79,70,229,0.15); }
  .ma-connector { display: flex; flex-direction: column; align-items: center; margin: 4px 0; }
  .ma-agent-card { border-radius: 20px; border: 1.5px solid #E5E7EB; background: #fff; padding: 24px; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
  .ma-agent-card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(79,70,229,0.12); }
  .ma-script-tag { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; background: #F0FDF4; border: 1px solid #A7F3D0; font-size: 10px; font-weight: 700; color: #059669; font-family: 'Plus Jakarta Sans', sans-serif; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes successPop { 0% { transform: scale(0.8); opacity: 0; } 60% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
  @keyframes livePulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(0.85); } }
  .ma-fade-up { animation: fadeUp 0.4s ease forwards; }
  .ma-fade-up-1 { animation: fadeUp 0.4s ease 0.08s forwards; opacity: 0; }
  .ma-fade-up-2 { animation: fadeUp 0.4s ease 0.16s forwards; opacity: 0; }
  .ma-fade-up-3 { animation: fadeUp 0.4s ease 0.24s forwards; opacity: 0; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
`;

// ─── Agent Steps (Booking Agent only gets Scripts & Links) ────────────────────
const AGENT_STEPS = [
  { id: "identity", label: "Agent Identity", sublabel: "Name & personality", color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE", icon: <Bot size={15} strokeWidth={1.5} /> },
  { id: "style", label: "Writing Style", sublabel: "How your agent communicates", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", icon: <MessageSquare size={15} strokeWidth={1.5} /> },
  { id: "knowledge", label: "Agent Knowledge", sublabel: "Service & audience context", color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", icon: <Brain size={15} strokeWidth={1.5} /> },
  { id: "scripts", label: "Scripts", sublabel: "Script 1 & 2 configuration", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", icon: <MessageSquare size={15} strokeWidth={1.5} /> },
  { id: "links", label: "Links & Booking", sublabel: "Where to send your leads", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: <Calendar size={15} strokeWidth={1.5} /> },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  userId: string;
  onAgentCertified: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function MyAgentScreen({ userId, onAgentCertified }: Props) {
  const [appState, setAppState] = useState<AppState>("loading");
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
  const [view, setView] = useState<View>("intro");
  const [agentType, setAgentType] = useState<"booking" | "followup" | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentRow | null>(null);
  const [config, setConfig] = useState<AgentConfig>(EMPTY_CONFIG);
  const [activeStep, setActiveStep] = useState("identity");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // ─── State Detection ───────────────────────────────────────────────────────
  const detectState = useCallback(async () => {
    if (!userId) return;

    const { data: agentRows } = await supabase
      .from("agents")
      .select("*")
      .eq("user_id", userId);

    const rows = (agentRows || []) as AgentRow[];
    setAgents(rows);

    if (rows.length > 0) {
      const agentIds = rows.map(a => a.id);
      const { data: analyticsRows } = await supabase
        .from("agent_analytics")
        .select("*")
        .in("agent_id", agentIds);
      setAnalytics((analyticsRows || []) as AnalyticsRow[]);
    }

    const certifiedCount = rows.filter(a => a.certified).length;

    if (rows.length === 0) {
      setAppState("no-agents");
      setView("intro");
    } else if (certifiedCount < 2) {
      setAppState("one-agent");
      setView("intro");
    } else {
      setAppState("both-agents");
      setView("intro");
    }
  }, [userId]);

  useEffect(() => {
    detectState();
  }, [detectState]);

  // Load business data for config prefill
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("accounts_leadflow")
      .select("service, target_audience, main_goal")
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

  const totalLeads = analytics.reduce((sum, a) => sum + (a.leads_treated || 0), 0);

  const onChange = (field: keyof AgentConfig, val: string) => {
    setConfig(prev => ({ ...prev, [field]: val }));
    setSaved(false);
  };

  // ─── Save ───────────────────────────────────────────────────────────────────
  const onSave = async () => {
    setSaving(true);

    // Save full config to agents table
    await supabase.from("agents").upsert({
      user_id: userId,
      agent_type: agentType,
      agent_config: config,
      agent_name: config.agent_name,
      status: "draft",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,agent_type" });

    // Save script + link fields to account_leadflow_automations (only for booking agent)
    if (agentType === "booking") {
      await supabase.from("account_leadflow_automations").upsert({
        user_id: userId,
        script1_service: config.script1_service,
        script1_end_result: config.script1_end_result,
        script1_category: config.script1_category,
        script1_deliverable: config.script1_deliverable,
        script1_outcome: config.script1_outcome,
        script2_price: config.script2_price,
        script2_training_day: config.script2_training_day,
        script2_call_duration: config.script2_call_duration,
        script2_conditions: config.script2_conditions,
        lead_magnet_link: config.lead_magnet_link,
        script2_booking_link: config.script2_booking_link,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ─── Publish ───────────────────────────────────────────────────────────────
  const onPublish = async () => {
    setPublishing(true);
    await onSave();

    const { data: onboarding } = await supabase
      .from("accounts_leadflow")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: automation } = await supabase
      .from("account_leadflow_automations")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    await supabase.from("agents").upsert({
      user_id: userId,
      agent_type: agentType,
      agent_config: config,
      agent_name: config.agent_name,
      status: "building",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,agent_type" });

    try {
      await fetch("https://rosegoldprojectai3.app.n8n.cloud/webhook/ea72ec64-9444-495a-ae04-babcb9e90cdd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          agent_type: agentType,
          config,
          onboarding: onboarding || {},
          automation: automation || {},
        }),
      });
    } catch (e) {
      console.error(e);
      await supabase.from("agents").upsert({
        user_id: userId,
        agent_type: agentType,
        status: "error",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,agent_type" });
      setPublishing(false);
      return;
    }

    setPublishing(false);
    setPublished(true);
    setTimeout(() => setView("test-intro"), 1200);
  };

  const handleSatisfied = useCallback(async () => {
    await supabase.from("agents").upsert({
      user_id: userId,
      agent_type: agentType,
      certified: true,
      status: "certified",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,agent_type" });
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onAgentCertified();
    }, 2500);
  }, [userId, agentType, onAgentCertified]);

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (appState === "loading") {
    return (
      <>
        <style>{STYLES}</style>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F4F5FA" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <Loader2 size={32} color="#4F46E5" style={{ animation: "spin 1s linear infinite" }} />
            <div style={{ fontSize: 13, color: "#9CA3AF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Loading your agents...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="ma-root" style={{ flex: 1, height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {showSuccess && <SuccessOverlay />}

        {/* ── STATE 1: NO AGENTS ── */}
        {appState === "no-agents" && (
          <>
            {view === "intro" && <IntroScreen state="no-agents" agents={[]} totalLeads={0} onContinue={() => setView("choose-type")} />}
            {view === "choose-type" && (
              <ChooseTypeScreen
                agents={[]}
                onSelect={(type) => { setAgentType(type); setView(type === "booking" ? "preview-booking" : "preview-followup"); }}
                onBack={() => setView("intro")}
              />
            )}
            {view === "preview-booking" && <PreviewScreen type="booking" onStart={() => setView("build")} onBack={() => setView("choose-type")} />}
            {view === "preview-followup" && <PreviewScreen type="followup" onStart={() => setView("build")} onBack={() => setView("choose-type")} />}
            {view === "build" && (
              <BuildScreen agentType={agentType!} config={config} activeStep={activeStep}
                setActiveStep={setActiveStep} onChange={onChange} onSave={onSave} onPublish={onPublish}
                saving={saving} saved={saved} publishing={publishing} published={published}
                onBack={() => setView(agentType === "booking" ? "preview-booking" : "preview-followup")} />
            )}
            {view === "test-intro" && <TestIntroScreen onContinue={() => setView("testing")} onBack={() => setView("build")} />}
            {view === "testing" && (
              <BulkTesting userId={userId} onComplete={() => {}} onSatisfied={handleSatisfied} onBack={() => setView("test-intro")} />
            )}
          </>
        )}

        {/* ── STATE 2: ONE AGENT BUILT ── */}
        {appState === "one-agent" && (
          <>
            {view === "intro" && <IntroScreen state="one-agent" agents={agents} totalLeads={totalLeads} onContinue={() => setView("choose-type")} />}
            {view === "choose-type" && (
              <ChooseTypeScreen
                agents={agents}
                onSelect={(type) => {
                  const existing = agents.find(a => a.agent_type === type);
                  if (existing && existing.certified) {
                    setSelectedAgent(existing);
                    setView("agent-show");
                  } else {
                    setAgentType(type);
                    setView(type === "booking" ? "preview-booking" : "preview-followup");
                  }
                }}
                onBack={() => setView("intro")}
              />
            )}
            {view === "preview-booking" && <PreviewScreen type="booking" onStart={() => setView("build")} onBack={() => setView("choose-type")} />}
            {view === "preview-followup" && <PreviewScreen type="followup" onStart={() => setView("build")} onBack={() => setView("choose-type")} />}
            {view === "build" && (
              <BuildScreen agentType={agentType!} config={config} activeStep={activeStep}
                setActiveStep={setActiveStep} onChange={onChange} onSave={onSave} onPublish={onPublish}
                saving={saving} saved={saved} publishing={publishing} published={published}
                onBack={() => setView(agentType === "booking" ? "preview-booking" : "preview-followup")} />
            )}
            {view === "test-intro" && <TestIntroScreen onContinue={() => setView("testing")} onBack={() => setView("build")} />}
            {view === "testing" && (
              <BulkTesting userId={userId} onComplete={() => {}} onSatisfied={handleSatisfied} onBack={() => setView("test-intro")} />
            )}
            {view === "agent-show" && selectedAgent && (
              <AgentShowScreen
                agent={selectedAgent}
                analytics={analytics.find(a => a.agent_id === selectedAgent.id) || null}
                userId={userId}
                onBack={() => setView("choose-type")}
                onSatisfied={handleSatisfied}
              />
            )}
          </>
        )}

        {/* ── STATE 3: BOTH AGENTS BUILT ── */}
        {appState === "both-agents" && (
          <>
            {view === "intro" && <IntroScreen state="both-agents" agents={agents} totalLeads={totalLeads} onContinue={() => setView("choose-type")} />}
            {view === "choose-type" && (
              <ChooseTypeScreen
                agents={agents}
                onSelect={(type) => {
                  const existing = agents.find(a => a.agent_type === type);
                  if (existing) {
                    setSelectedAgent(existing);
                    setView("agent-show");
                  }
                }}
                onBack={() => setView("intro")}
              />
            )}
            {view === "agent-show" && selectedAgent && (
              <AgentShowScreen
                agent={selectedAgent}
                analytics={analytics.find(a => a.agent_id === selectedAgent.id) || null}
                userId={userId}
                onBack={() => setView("choose-type")}
                onSatisfied={handleSatisfied}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}

// ─── Intro Screen ─────────────────────────────────────────────────────────────
function IntroScreen({ state, agents, totalLeads, onContinue }: {
  state: AppState; agents: AgentRow[]; totalLeads: number; onContinue: () => void;
}) {
  const certifiedAgent = agents.find(a => a.certified);

  const content = {
    "no-agents": {
      badge: "Build Your AI Employee",
      title: <>Meet your new<br /><span style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>AI employee.</span></>,
      desc: "You're about to build an AI agent that handles your leads 24/7 — qualifying them, answering questions, and booking calls. Like a real employee, but never sleeps.",
      cta: "Let's build my agent",
      steps: [
        { icon: <Brain size={14} strokeWidth={2} />, label: "Build the brain", desc: "Configure your agent's identity, tone & knowledge" },
        { icon: <FlaskConical size={14} strokeWidth={2} />, label: "Stress test it", desc: "Run 10 real scenarios to see if it's ready" },
        { icon: <CheckCircle size={14} strokeWidth={2} />, label: "Certify & deploy", desc: "Once satisfied, unlock the full workspace" },
      ],
    },
    "one-agent": {
      badge: "Your AI Team",
      title: <>Your first employee<br /><span style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>is live. 🎉</span></>,
      desc: `${certifiedAgent?.agent_name || "Your agent"} is certified and working. But your team has one open spot — hire your second AI employee and double your capacity.`,
      cta: "Manage my team",
      steps: [
        { icon: <CheckCircle size={14} strokeWidth={2} />, label: `${certifiedAgent?.agent_name || "Agent"} is live`, desc: "Certified and ready to handle leads" },
        { icon: <Bot size={14} strokeWidth={2} />, label: "One spot left", desc: "Build your second agent and complete the team" },
        { icon: <Zap size={14} strokeWidth={2} />, label: "Double your capacity", desc: "Two agents, twice the leads handled" },
      ],
    },
    "both-agents": {
      badge: "Your AI Team",
      title: <>{totalLeads > 0 ? <>Your team has treated<br /><span style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{totalLeads} leads. 🔥</span></> : <>Your whole team<br /><span style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>is working hard.</span></>}</>,
      desc: totalLeads > 0
        ? "Your AI employees are live and already handling leads. Check on them, run a quality test, or review their performance."
        : "Your agents are certified and waiting for your first clients. Make sure they're in top shape — run a quality check anytime.",
      cta: "Check on my team",
      steps: [
        { icon: <Activity size={14} strokeWidth={2} />, label: "All agents live", desc: "Your full team is certified and deployed" },
        { icon: <FlaskConical size={14} strokeWidth={2} />, label: "Quality check anytime", desc: "Keep your agents sharp with regular tests" },
        { icon: <Zap size={14} strokeWidth={2} />, label: totalLeads > 0 ? `${totalLeads} leads treated` : "Waiting for clients", desc: totalLeads > 0 ? "Your team is already working" : "Promote your business to start getting leads" },
      ],
    },
    "loading": { badge: "", title: <></>, desc: "", cta: "", steps: [] },
  }[state];

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f0f4ff 0%, #e8eaf6 40%, #f5f0ff 100%)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -200, left: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -150, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div className="ma-fade-up" style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: 64, maxWidth: 1000, width: "90%", padding: "56px 60px", background: "rgba(255,255,255,0.5)", backdropFilter: "blur(32px) saturate(180%)", WebkitBackdropFilter: "blur(32px) saturate(180%)", borderRadius: 32, border: "1px solid rgba(255,255,255,0.75)", boxShadow: "0 8px 40px rgba(79,70,229,0.08), inset 0 1px 0 rgba(255,255,255,0.9)" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 100, background: "rgba(79,70,229,0.08)", border: "1px solid rgba(79,70,229,0.15)", fontSize: 11, fontWeight: 700, color: "#4F46E5", letterSpacing: "0.6px", textTransform: "uppercase" as const, marginBottom: 20 }}>
            <Bot size={10} strokeWidth={2.5} /> {content.badge}
          </div>
          <div style={{ fontSize: 42, fontWeight: 800, color: "#0f1117", lineHeight: 1.1, letterSpacing: "-1.2px", marginBottom: 16 }}>{content.title}</div>
          <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.75, marginBottom: 32, maxWidth: 380 }}>{content.desc}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
            {content.steps.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(79,70,229,0.08)", border: "1px solid rgba(79,70,229,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#4F46E5", flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{item.label}</span>
                  <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: 8 }}>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="ma-btn-primary" onClick={onContinue} style={{ fontSize: 15, padding: "14px 32px" }}>{content.cta} <ChevronRight size={15} strokeWidth={2.5} /></button>
        </div>
        <div style={{ width: 320, height: 320, flexShrink: 0 }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 24, background: "linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)", border: "1px solid rgba(79,70,229,0.12)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            <img src={`${BASE}wholeteam2.png`} alt="AI Team" style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center center" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Choose Type Screen ───────────────────────────────────────────────────────
function ChooseTypeScreen({ agents, onSelect, onBack }: { agents: AgentRow[]; onSelect: (t: "booking" | "followup") => void; onBack: () => void }) {
  const bookingAgent = agents.find(a => a.agent_type === "booking");
  const followupAgent = agents.find(a => a.agent_type === "followup");
  const hasAny = agents.length > 0;

  const heading = !hasAny ? "What kind of agent do you need?"
    : bookingAgent?.certified && !followupAgent?.certified ? `${bookingAgent.agent_name || "Your booking agent"} is jealous 👀`
    : followupAgent?.certified && !bookingAgent?.certified ? `${followupAgent.agent_name || "Your follow-up agent"} is jealous 👀`
    : "Your agents are live — check on them";

  const subheading = !hasAny ? "Pick the type that matches your business goal. You can always build the other one later."
    : hasAny && agents.filter(a => a.certified).length < 2 ? "One agent is already working hard. Hire the second one and complete your team."
    : "Both agents are certified and live. Select one to check its health or run a quality test.";

  const cards = [
    { type: "booking" as const, imgUrl: `${BASE}bookingflow.png`, label: "Booking Agent", tagline: "Qualifies leads & books calls", desc: "Your agent greets every lead, qualifies them with your script, delivers your lead magnet, and books a call — all automatically.", bullets: ["Welcome & qualify leads", "Send your lead magnet", "Book discovery calls", "24/7 on WhatsApp"], color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE", agentRow: bookingAgent },
    { type: "followup" as const, imgUrl: `${BASE}followupagent3.png`, label: "Follow-Up Agent", tagline: "Re-engages cold leads", desc: "Your agent automatically follows up with leads who didn't respond — bringing them back into the conversation at the right moment.", bullets: ["Scheduled follow-ups", "Re-engage cold leads", "AI continues the convo", "Never lose a lead again"], color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", agentRow: followupAgent },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0f4ff 0%, #F4F5FA 50%, #f5f0ff 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div className="ma-fade-up" style={{ maxWidth: 800, width: "100%" }}>
        <button className="ma-btn-secondary" onClick={onBack} style={{ marginBottom: 32 }}><ArrowLeft size={13} strokeWidth={1.8} /> Back</button>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#0f1117", letterSpacing: "-0.8px", marginBottom: 12 }}>{heading}</div>
          <p style={{ fontSize: 15, color: "#6B7280", maxWidth: 480, margin: "0 auto" }}>{subheading}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {cards.map((card) => {
            const isLive = card.agentRow?.certified;
            const isBuilding = card.agentRow && !card.agentRow.certified;
            return (
              <div key={card.type} onClick={() => onSelect(card.type)} style={{ background: "#fff", borderRadius: 20, border: `1.5px solid ${isLive ? card.color : card.border}`, padding: "32px 28px", cursor: "pointer", transition: "all 0.2s", boxShadow: isLive ? `0 4px 24px ${card.color}20` : "0 2px 12px rgba(0,0,0,0.05)", position: "relative", overflow: "hidden" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 40px ${card.color}25`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = isLive ? `0 4px 24px ${card.color}20` : "0 2px 12px rgba(0,0,0,0.05)"; }}>
                {isLive && <div style={{ position: "absolute", top: 16, right: 16, display: "flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, color: "#059669", background: "#DCFCE7", border: "1px solid #A7F3D0", padding: "4px 10px", borderRadius: 20 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669", display: "inline-block", animation: "livePulse 1.5s ease infinite" }} />LIVE</div>}
                {isBuilding && <div style={{ position: "absolute", top: 16, right: 16, fontSize: 10, fontWeight: 700, color: "#D97706", background: "#FEF3C7", border: "1px solid #FDE68A", padding: "4px 10px", borderRadius: 20 }}>IN PROGRESS</div>}
                <div style={{ width: 80, height: 80, borderRadius: 20, overflow: "hidden", marginBottom: 20 }}><img src={card.imgUrl} alt={card.label} style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 4 }}>{card.label}</div>
                <div style={{ fontSize: 12, color: card.color, fontWeight: 600, marginBottom: 14 }}>{isLive ? `${card.agentRow?.agent_name || card.label} is live` : card.tagline}</div>
                <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7, marginBottom: 20 }}>{card.desc}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {card.bullets.map((b, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#374151", fontWeight: 500 }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: card.bg, border: `1px solid ${card.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Check size={9} strokeWidth={2.5} color={card.color} /></div>
                      {b}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: card.color }}>{isLive ? "View agent" : isBuilding ? "Continue building" : "Choose this agent"} <ChevronRight size={14} strokeWidth={2.5} /></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Agent Show Screen ────────────────────────────────────────────────────────
function AgentShowScreen({ agent, analytics, userId, onBack, onSatisfied }: { agent: AgentRow; analytics: AnalyticsRow | null; userId: string; onBack: () => void; onSatisfied: () => void }) {
  const [tab, setTab] = useState<"overview" | "bulk-test">("overview");
  const color = agent.agent_type === "booking" ? "#4F46E5" : "#7C3AED";
  const bg = agent.agent_type === "booking" ? "#EEF2FF" : "#F5F3FF";
  const border = agent.agent_type === "booking" ? "#C7D2FE" : "#DDD6FE";
  const imgUrl = agent.agent_type === "booking" ? `${BASE}bookingflow.png` : `${BASE}followupagent3.png`;

  return (
    <div style={{ minHeight: "100vh", background: "#F4F5FA", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "20px 32px", display: "flex", alignItems: "center", gap: 16 }}>
        <button className="ma-btn-secondary" onClick={onBack}><ArrowLeft size={13} strokeWidth={1.8} /> Back</button>
        <div style={{ width: 48, height: 48, borderRadius: 14, overflow: "hidden", border: `1px solid ${border}`, background: bg }}><img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>{agent.agent_name || (agent.agent_type === "booking" ? "Booking Agent" : "Follow-Up Agent")}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#059669", fontWeight: 600 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669", display: "inline-block", animation: "livePulse 1.5s ease infinite" }} />Certified & Live</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => setTab("overview")} style={{ padding: "8px 16px", borderRadius: 10, border: tab === "overview" ? `1.5px solid ${color}` : "1.5px solid #E5E7EB", background: tab === "overview" ? bg : "#fff", color: tab === "overview" ? color : "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>Overview</button>
          <button onClick={() => setTab("bulk-test")} style={{ padding: "8px 16px", borderRadius: 10, border: tab === "bulk-test" ? `1.5px solid ${color}` : "1.5px solid #E5E7EB", background: tab === "bulk-test" ? bg : "#fff", color: tab === "bulk-test" ? color : "#6B7280", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}><FlaskConical size={13} strokeWidth={1.8} style={{ display: "inline", marginRight: 5 }} />Quality Test</button>
        </div>
      </div>
      {tab === "overview" && (
        <div style={{ flex: 1, padding: "32px", maxWidth: 900, margin: "0 auto", width: "100%" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
            {[{ label: "Leads Treated", value: analytics?.leads_treated ?? 0, color: "#4F46E5" }, { label: "Leads Booked", value: analytics?.leads_booked ?? 0, color: "#059669" }, { label: "Pending", value: analytics?.leads_pending ?? 0, color: "#D97706" }, { label: "Health Score", value: analytics?.health_score ? `${analytics.health_score}/100` : "—", color: "#7C3AED" }].map((stat, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.6px" }}>{stat.label}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E5E7EB", padding: "28px 32px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 20 }}>Agent Status</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[{ label: "Prompt", status: "Built", ok: true }, { label: "Certification", status: "Certified ✓", ok: true }, { label: "Workspace", status: "Active", ok: true }].map((row, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#F9FAFB", borderRadius: 10, border: "1px solid #F3F4F6" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: row.ok ? "#059669" : "#DC2626", background: row.ok ? "#DCFCE7" : "#FEF2F2", padding: "3px 10px", borderRadius: 20 }}>{row.status}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #F3F4F6" }}>
              <button onClick={() => setTab("bulk-test")} className="ma-btn-primary" style={{ fontSize: 13, padding: "10px 20px" }}><FlaskConical size={13} strokeWidth={2} /> Run Quality Test</button>
            </div>
          </div>
        </div>
      )}
      {tab === "bulk-test" && (
        <div style={{ flex: 1, overflow: "hidden" }}>
          <BulkTesting userId={userId} onComplete={() => {}} onSatisfied={onSatisfied} onBack={() => setTab("overview")} />
        </div>
      )}
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
  const headerImg = isBooking ? `${BASE}bookingflow.png` : `${BASE}followupagent3.png`;

  // Only show Scripts & Links steps for Booking Agent
  const stepsToShow = isBooking ? AGENT_STEPS : AGENT_STEPS.filter(s => s.id !== "scripts" && s.id !== "links");

  return (
    <div style={{ minHeight: "100vh", background: "#F4F5FA", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div className="ma-fade-up" style={{ maxWidth: 720, width: "100%", background: "#fff", borderRadius: 28, border: `1px solid ${border}`, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <div style={{ padding: "32px 36px", background: `linear-gradient(135deg, ${bg} 0%, #fff 100%)`, borderBottom: `1px solid ${border}` }}>
          <button className="ma-btn-secondary" onClick={onBack} style={{ marginBottom: 24 }}><ArrowLeft size={13} strokeWidth={1.8} /> Back</button>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: 20, overflow: "hidden", flexShrink: 0, background: bg, border: `1px solid ${border}` }}><img src={headerImg} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#111827", letterSpacing: "-0.4px" }}>{isBooking ? "Booking Agent" : "Follow-Up Agent"}</div>
              <div style={{ fontSize: 13, color, fontWeight: 600, marginTop: 2 }}>{isBooking ? "Your 24/7 lead qualification & booking machine" : "Never lose a lead to silence again"}</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "32px 36px" }}>
          <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.8, marginBottom: 28 }}>{isBooking ? "This agent will handle every new WhatsApp lead from start to finish. It introduces itself, qualifies the lead using your script, sends your lead magnet, follows up, and guides them to book a discovery call — without you lifting a finger." : "This agent automatically reaches out to leads who went quiet. It sends perfectly timed, human-sounding follow-up messages and, when they reply, jumps back into the conversation to guide them toward booking a call."}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 32 }}>
            {features.map((f, i) => (
              <div key={i} style={{ padding: "16px", background: bg, borderRadius: 12, border: `1px solid ${border}` }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{f.title}</div>
                <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "16px 20px", background: "#F9FAFB", borderRadius: 12, border: "1px solid #E5E7EB", marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 12 }}>What you'll configure</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {stepsToShow.map((step) => (
                <div key={step.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, background: step.bg, border: `1px solid ${step.border}` }}>
                  <div style={{ color: step.color, display: "flex" }}>{step.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#111827" }}>{step.label}</div>
                </div>
              ))}
            </div>
          </div>
          <button className="ma-btn-primary" onClick={onStart} style={{ width: "100%", justifyContent: "center", fontSize: 15, padding: "14px" }}>Configure my agent <ChevronRight size={15} strokeWidth={2.5} /></button>
        </div>
      </div>
    </div>
  );
}

// ─── Build Screen (with conditional steps) ──────────────────────────────────────
function BuildScreen({ agentType, config, activeStep, setActiveStep, onChange, onSave, onPublish, saving, saved, publishing, published, onBack }: {
  agentType: "booking" | "followup"; config: AgentConfig; activeStep: string;
  setActiveStep: (s: string) => void; onChange: (f: keyof AgentConfig, v: string) => void;
  onSave: () => void; onPublish: () => void; saving: boolean; saved: boolean;
  publishing: boolean; published: boolean; onBack: () => void;
}) {
  const color = agentType === "booking" ? "#4F46E5" : "#7C3AED";
  
  // For followup agents, exclude Scripts & Links steps
  const stepsToShow = agentType === "booking" 
    ? AGENT_STEPS 
    : AGENT_STEPS.filter(s => s.id !== "scripts" && s.id !== "links");

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: 300, background: "#fff", borderRight: "1px solid #E5E7EB", display: "flex", flexDirection: "column", padding: "24px 16px", overflowY: "auto" }}>
        <button className="ma-btn-secondary" onClick={onBack} style={{ marginBottom: 24, alignSelf: "flex-start" }}><ArrowLeft size={13} strokeWidth={1.8} /> Back</button>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Agent Configuration</div>
        <div style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic", marginBottom: 24 }}>{agentType === "booking" ? "Booking Agent" : "Follow-Up Agent"}</div>

        {stepsToShow.map((step, i) => (
          <div key={step.id}>
            <div className={`ma-node ${activeStep === step.id ? "active" : ""}`} onClick={() => setActiveStep(step.id)} style={{ borderColor: activeStep === step.id ? step.color : step.border, background: activeStep === step.id ? step.bg : "#fff" }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: step.bg, border: `1px solid ${step.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: step.color, flexShrink: 0 }}>{step.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{step.label}</div>
                <div style={{ fontSize: 10, color: "#9CA3AF", fontStyle: "italic" }}>{step.sublabel}</div>
              </div>
              {activeStep === step.id && <Settings size={13} color={step.color} strokeWidth={1.5} />}
            </div>
            {i < stepsToShow.length - 1 && (
              <div className="ma-connector">
                <div style={{ width: 1.5, height: 16, background: "#E5E7EB" }} />
                <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "6px solid #E5E7EB" }} />
              </div>
            )}
          </div>
        ))}

        <div style={{ marginTop: "auto", paddingTop: 24 }}>
          <button onClick={onPublish} disabled={publishing || published} style={{ width: "100%", padding: "12px", borderRadius: 12, border: "none", background: published ? "#059669" : `linear-gradient(135deg, ${color} 0%, #7C3AED 100%)`, color: "#fff", fontSize: 13, fontWeight: 700, cursor: publishing || published ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "all 0.2s", boxShadow: published ? "0 4px 12px rgba(5,150,105,0.3)" : `0 4px 16px ${color}40`, opacity: publishing ? 0.8 : 1 }}>
            {publishing ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating...</> : published ? <><CheckCircle size={14} /> Agent Ready!</> : <><Sparkles size={14} /> Build my agent</>}
          </button>
          <button onClick={onSave} disabled={saving} style={{ width: "100%", marginTop: 8, padding: "9px", borderRadius: 10, border: "1.5px solid #E5E7EB", background: saved ? "#ECFDF5" : "#fff", color: saved ? "#059669" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.15s" }}>
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save draft"}
          </button>
        </div>
      </div>

      {/* Main panel */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px", background: "#F9FAFB" }}>
        <div style={{ maxWidth: 560 }}>
          {activeStep === "identity"  && <IdentityPanel  config={config} onChange={onChange} color={color} />}
          {activeStep === "style"     && <StylePanel     config={config} onChange={onChange} color={color} />}
          {activeStep === "knowledge" && <KnowledgePanel config={config} onChange={onChange} color={color} />}
          {activeStep === "scripts"   && agentType === "booking" && <ScriptsPanel   config={config} onChange={onChange} color={color} />}
          {activeStep === "links"     && agentType === "booking" && <LinksPanel     config={config} onChange={onChange} color={color} />}
        </div>
      </div>
    </div>
  );
}

// ─── Panel Header ─────────────────────────────────────────────────────────────
function PanelHeader({ title, desc, color }: { title: string; desc: string; color: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-0.4px", marginBottom: 8 }}>{title}</div>
      <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7, margin: 0 }}>{desc}</p>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${color} 0%, transparent 100%)`, borderRadius: 2, marginTop: 16, width: 48 }} />
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
          <div className="ma-hint">This name will appear in WhatsApp conversations with your leads.</div>
        </div>
        <div>
          <label className="ma-label">Personality Description</label>
          <textarea className="ma-textarea" rows={4} value={config.agent_personality} onChange={e => onChange("agent_personality", e.target.value)} placeholder="e.g. Warm and professional. Always addresses leads by name. Never pushy, asks questions before pitching..." />
          <div className="ma-hint">Describe how your agent behaves. Be specific — the more detail, the better it performs.</div>
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
          <div key={style.id} className={`ma-style-opt ${config.writing_style === style.id ? "selected" : ""}`} onClick={() => onChange("writing_style", style.id)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {config.writing_style === style.id
                ? <div style={{ width: 18, height: 18, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Check size={10} color="#fff" strokeWidth={3} /></div>
                : <div style={{ width: 18, height: 18, borderRadius: "50%", border: "1.5px solid #D1D5DB", flexShrink: 0 }} />}
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

// ─── NEW: Scripts Panel (Booking Agent only) ──────────────────────────────────
function ScriptsPanel({ config, onChange, color }: { config: AgentConfig; onChange: (f: keyof AgentConfig, v: string) => void; color: string }) {
  const script1Fields: { key: keyof AgentConfig; label: string; placeholder: string; hint: string; tag: string }[] = [
    {
      key: "script1_service",
      label: "Your Service (short)",
      placeholder: "e.g. business coaching",
      hint: "A short version of what you offer — 2 to 4 words max.",
      tag: "[SERVICE]",
    },
    {
      key: "script1_end_result",
      label: "The Result They Want",
      placeholder: "e.g. make money from home",
      hint: "What outcome does your lead actually want? Keep it conversational.",
      tag: "[DESIRED END RESULT]",
    },
    {
      key: "script1_category",
      label: "Your Category",
      placeholder: "e.g. business coaching",
      hint: "The broader category your offer falls into.",
      tag: "[CATEGORY]",
    },
    {
      key: "script1_deliverable",
      label: "Lead Magnet Name",
      placeholder: "e.g. Business for employees",
      hint: "The exact name of your free guide, checklist, or resource.",
      tag: "[DELIVERABLE]",
    },
    {
      key: "script1_outcome",
      label: "What They'll Learn",
      placeholder: "e.g. how to get started today",
      hint: "What will they understand after reading your lead magnet?",
      tag: "[OUTCOME]",
    },
  ];

  const script2Fields: { key: keyof AgentConfig; label: string; placeholder: string; hint: string }[] = [
    {
      key: "script2_price",
      label: "Training Price",
      placeholder: "e.g. $15",
      hint: "The price you'll offer in script 2 (e.g., normal price, or discounted price for early action)",
    },
    {
      key: "script2_training_day",
      label: "Training Day/Date",
      placeholder: "e.g. This Saturday",
      hint: "When is the training happening? (e.g. 'This Saturday', 'Next Tuesday')",
    },
    {
      key: "script2_call_duration",
      label: "Call Duration",
      placeholder: "e.g. 30 minutes",
      hint: "How long is your discovery/call? Used in: 'Let's get on a short [X] call'",
    },
    {
      key: "script2_conditions",
      label: "3 Conditions (comma-separated)",
      placeholder: "e.g. You actually apply, you give feedback, you leave a review",
      hint: "The 3 conditions for the discounted price. Separate each with a comma.",
    },
  ];

  // Helper: render Script 1 full text
  const renderScript1 = () => {
    const service = config.script1_service || "[SERVICE]";
    const endResult = config.script1_end_result || "[DESIRED END RESULT]";
    const deliverable = config.script1_deliverable || "[DELIVERABLE]";
    const outcome = config.script1_outcome || "[OUTCOME]";

    return `Wa alaykoum salam 👋 Just to confirm — you came from TikTok because you want to start making money from home, right?

(Lead replies)

Perfect 😊 Before I send your guide, what's your name?

(Lead replies)

Nice to meet you, (NAME) 👍

Quick question so I send you the right thing — Have you ever made money online before, or not yet?

(Lead replies)

And do you understand how it works fully, or are you just starting?

(Lead replies)

Great so this is the right thing for you!

I'll send you your guide now. In 5 minutes, you'll understand how simple it is to get paid online.

Then if you like it, we'll talk about what you should do next to make your first sale as fast as possible insha'Allah

Sounds good to you?

(Lead replies)

Perfect so here's your guide: (LINK)

Take 5 minutes to read it now 👍

When you finish, send me "done" and I'll show you the next step

Ah and don't skip page 14…👀`;
  };

  // Helper: render Script 2 full text
  const renderScript2 = () => {
    const price = config.script2_price || "$X";
    const day = config.script2_training_day || "[DAY]";
    const duration = config.script2_call_duration || "[DURATION]";
    const conditions = config.script2_conditions 
      ? config.script2_conditions.split(",").map((c, i) => `${i + 1} — ${c.trim()}`) 
      : ["1 — [Condition 1]", "2 — [Condition 2]", "3 — [Condition 3]"];

    return `(4 minutes after they start reading)

Salam my friend 👋

Sorry I didn't verify earlier — did the link for the guide work?

(Lead replies)

Perfect 👍

And did you have time to go through it or not yet?

[IF NOT COMPLETE]: No worries at all 👍 Go finish it first, it'll make everything much clearer for you. Message me after

[IF COMPLETE]:

Nice — I'm curious, how did you find it?

Did it help you understand how making money online actually works?

(Lead replies)

I'm glad it helped 🙏

Quick question — I didn't get to ask you earlier: What made you want to read it in the first place?

Are you more just curious or actually looking to make money from home?

(Lead replies)

Ok I see 👍

So you're actually serious about this

And why does that matter to you? Why do you want to make money from home?

Is it more like: extra income on the side or you want to eventually replace your income?

(Lead replies)

Got it 👍

And if that actually works out for you… what would that change in your life?

Take your time — I'm curious

(Lead replies)

That's powerful

Now be honest with me… If nothing changes, and you stay exactly where you are right now… how would you feel in a few months knowing you could've done more?

(Lead replies)

Yeah… I understand

And that's exactly the problem most people face

They understand the basics… but they don't have a clear plan to follow

Because the truth is — making money online isn't complicated but without knowing what to do step by step, people just stay stuck

So let me ask you this: Do you feel like you could figure everything out alone… or would it be better to have some guidance and a clear plan to follow?

(Lead replies)

That makes sense 👍

And honestly, I can see you're serious about this

So here's what I can do for you:

This ${day}, I'm doing a live training where I show step by step how to start from zero

Nothing complicated, just simple and clear

On the call, I'll show you 2 important things:

1 — How to offer something people actually want to pay for, even if you have no experience

2 — How to use TikTok to bring people to you every day, even if you're starting from scratch

And at the end, I'll give you a simple 7-day action plan so you know exactly what to do to make your first $100 online

No guessing, no confusion

Does that sound like something you'd want to join?

(Lead replies)

Perfect 👍

So normally, access to this is $18

But since you actually took action and went through the guide, I can let you in for just ${price}

So you save 50%

But under 3 simple conditions:

${conditions.join("\n")}

Fair?

And just so you feel comfortable — if after the call you're not 100% clear on what to do to make your first $100, I'll send you your money back

So there's no risk for you 👍

Does that sound good?

(Lead replies)

Perfect 👍

I have 4 sessions this ${day}:

6pm
7pm
8pm
9pm

Which one works best for you?

(Lead replies)

Perfect 👍

Here's the link to save your spot 👇

[PAYMENT LINK]

Once you're in, send me a screenshot 👍`;
  };

  return (
    <div className="ma-fade-up">
      <PanelHeader title="Scripts" desc="Configure your Script 1 (lead qualification & magnet delivery) and Script 2 (paid offer close). See the full scripts below as you fill in your details." color={color} />

      {/* Script 1 Config & Preview */}
      <div style={{ marginBottom: 40 }}>
        {/* Script 1 Banner */}
        <div style={{ background: "#F0FDF4", border: "1px solid #A7F3D0", borderRadius: 12, padding: "12px 16px", marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontSize: 16, marginTop: 1 }}>📝</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#059669", marginBottom: 2 }}>Script 1: Lead Qualification & Delivery</div>
            <div style={{ fontSize: 11, color: "#065F46", lineHeight: 1.6 }}>
              Your agent opens with a greeting, qualifies the lead, delivers your guide, and sets up Script 2. Fill in these 5 fields:
            </div>
          </div>
        </div>

        {/* Script 1 Config Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #E5E7EB" }}>
          {script1Fields.map(({ key, label, placeholder, hint, tag }) => (
            <div key={key}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <label className="ma-label" style={{ margin: 0 }}>{label}</label>
                <span className="ma-script-tag">{tag}</span>
              </div>
              <input
                className="ma-input"
                value={config[key] as string}
                onChange={e => onChange(key, e.target.value)}
                placeholder={placeholder}
              />
              <div className="ma-hint">{hint}</div>
            </div>
          ))}
        </div>

        {/* Script 1 Full Preview */}
        <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 14, padding: "20px", marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>📋 Script 1 Preview</div>
          <pre style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap", wordWrap: "break-word", margin: 0, fontFamily: "'Plus Jakarta Sans', monospace" }}>
            {renderScript1()}
          </pre>
        </div>
      </div>

      {/* Script 2 Config & Preview */}
      <div>
        {/* Script 2 Banner */}
        <div style={{ background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 12, padding: "12px 16px", marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ fontSize: 16, marginTop: 1 }}>💰</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#4F46E5", marginBottom: 2 }}>Script 2: Paid Offer Close</div>
            <div style={{ fontSize: 11, color: "#312E81", lineHeight: 1.6 }}>
              After they read the guide and engage, your agent presents the paid training with price, timing, and 3 conditions. This is where leads become customers.
            </div>
          </div>
        </div>

        {/* Script 2 Config Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #E5E7EB" }}>
          {script2Fields.map(({ key, label, placeholder, hint }) => (
            <div key={key}>
              <label className="ma-label">{label}</label>
              <input
                className="ma-input"
                value={config[key] as string}
                onChange={e => onChange(key, e.target.value)}
                placeholder={placeholder}
              />
              <div className="ma-hint">{hint}</div>
            </div>
          ))}
        </div>

        {/* Script 2 Full Preview */}
        <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 14, padding: "20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 12 }}>📋 Script 2 Preview</div>
          <pre style={{ fontSize: 12, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap", wordWrap: "break-word", margin: 0, fontFamily: "'Plus Jakarta Sans', monospace" }}>
            {renderScript2()}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ─── NEW: Links Panel (Booking Agent only) ───────────────────────────────────
function LinksPanel({ config, onChange, color }: { config: AgentConfig; onChange: (f: keyof AgentConfig, v: string) => void; color: string }) {
  return (
    <div className="ma-fade-up">
      <PanelHeader title="Links & Booking" desc="These are the links your agent will send during conversations. Get them right — they're the last step before a lead becomes a booking." color={color} />

      {/* Context banner */}
      <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "12px 16px", marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{ fontSize: 16, marginTop: 1 }}>🔗</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#D97706", marginBottom: 2 }}>These links go directly to leads</div>
          <div style={{ fontSize: 11, color: "#92400E", lineHeight: 1.6 }}>
            Your agent sends the lead magnet link first (Script 1), then — after they read it — sends the booking link for the paid training (Script 2). Double-check both URLs before building.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Lead magnet link */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <label className="ma-label" style={{ margin: 0 }}>Lead Magnet URL</label>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: "#ECFDF5", border: "1px solid #A7F3D0", fontSize: 10, fontWeight: 700, color: "#059669" }}>Script 1</span>
          </div>
          <input
            className="ma-input"
            value={config.lead_magnet_link}
            onChange={e => onChange("lead_magnet_link", e.target.value)}
            placeholder="https://yourdomain.com/free-guide"
          />
          <div className="ma-hint">The link to your free guide, checklist, or resource. Sent after lead qualification in Script 1.</div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px dashed #E5E7EB" }} />

        {/* Booking link */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <label className="ma-label" style={{ margin: 0 }}>Training/Booking Page URL</label>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: "#EEF2FF", border: "1px solid #C7D2FE", fontSize: 10, fontWeight: 700, color: "#4F46E5" }}>Script 2</span>
          </div>
          <input
            className="ma-input"
            value={config.script2_booking_link}
            onChange={e => onChange("script2_booking_link", e.target.value)}
            placeholder="https://payment.example.com/training"
          />
          <div className="ma-hint">Your payment/booking page for the paid training. Sent at the end of Script 2 when the lead is ready to buy.</div>
        </div>

      </div>
    </div>
  );
}

// ─── Test Intro Screen ────────────────────────────────────────────────────────
function TestIntroScreen({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0f4ff 0%, #F4F5FA 50%, #f5f0ff 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div className="ma-fade-up" style={{ maxWidth: 800, width: "100%", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)", borderRadius: 28, border: "1px solid rgba(255,255,255,0.75)", padding: "52px 56px", boxShadow: "0 8px 40px rgba(79,70,229,0.08)" }}>
        <button className="ma-btn-secondary" onClick={onBack} style={{ marginBottom: 32 }}><ArrowLeft size={13} strokeWidth={1.8} /> Back to configuration</button>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 100, background: "rgba(79,70,229,0.08)", border: "1px solid rgba(79,70,229,0.15)", fontSize: 11, fontWeight: 700, color: "#4F46E5", letterSpacing: "0.6px", textTransform: "uppercase" as const, marginBottom: 20 }}>
          <FlaskConical size={10} strokeWidth={2.5} /> Quality Check
        </div>
        <div style={{ fontSize: 38, fontWeight: 800, color: "#0f1117", lineHeight: 1.1, letterSpacing: "-1px", marginBottom: 16 }}>
          Will your agent embarrass<br />
          <span style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>you in front of clients?</span>
        </div>
        <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.75, marginBottom: 36, maxWidth: 500 }}>Before your agent talks to real leads, we simulate 10 real conversations — testing how it handles tough questions, edge cases, and off-topic leads. You'll see every single exchange live.</p>
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
        <button className="ma-btn-primary" onClick={onContinue} style={{ fontSize: 15, padding: "14px 36px" }}>I understand — test my agent <ChevronRight size={15} strokeWidth={2.5} /></button>
      </div>
    </div>
  );
}

// ─── Success Overlay ──────────────────────────────────────────────────────────
function SuccessOverlay() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: "48px 56px", textAlign: "center", animation: "successPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards", boxShadow: "0 24px 64px rgba(0,0,0,0.15)", maxWidth: 420 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, #059669, #10B981)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <CheckCircle size={36} color="#fff" strokeWidth={2} />
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Agent Certified! 🎉</div>
        <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>Your agent passed the quality test. My Workflows is now unlocked — let's set up his workspace.</p>
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, color: "#9CA3AF" }}>
          <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Redirecting to My Workflows...
        </div>
      </div>
    </div>
  );
}
