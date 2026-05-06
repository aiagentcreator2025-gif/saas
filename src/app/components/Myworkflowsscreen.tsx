import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Settings, Zap, MessageSquare, Gift, Phone,
  Calendar, ArrowLeft, Clock, Bot, MessageCircle, ChevronRight,
  Wifi, Type, Link, Check, Loader2, ZoomIn, ZoomOut, Move, ArrowRight, Lock,
} from "lucide-react";
import { supabase } from "../supabaseClient";

const N8N_WEBHOOK = "https://rosegoldprojectai2.app.n8n.cloud/webhook/ea72ec64-9444-495a-ae04-babcb9e90cdd";
const BASE = "https://raw.githubusercontent.com/aiagentcreator2025-gif/saas/main/public/";
const WORKFLOWS_IMG = "https://raw.githubusercontent.com/aiagentcreator2025-gif/saas/main/public/ChatGPT%20Image%206%20mai%202026%2C%2018_37_05.png";

type View =
  | "intro"
  | "home"
  | "booking-preview"
  | "booking-flow"
  | "followup-home"
  | "followup-automation-preview"
  | "followup-automation"
  | "followup-agent-preview"
  | "followup-agent";

export interface AutomationConfig {
  wa_client_id: string; wa_client_secret: string; wa_access_token: string;
  typing_duration: string; agent_name: string; writing_style: string;
  script1_text: string; script1_service: string; script1_end_result: string;
  script1_category: string; script1_deliverable: string; script1_outcome: string;
  lead_magnet_link: string; script2_text: string; script2_call_duration: string;
  script2_booking_link: string; booking_event_name: string; booking_host: string;
  booking_duration: string; booking_days: string[]; booking_hours_from: string;
  booking_hours_to: string; wa_business_account_id: string;
}

const EMPTY_CONFIG: AutomationConfig = {
  wa_client_id: "", wa_client_secret: "", wa_access_token: "", typing_duration: "2 seconds",
  agent_name: "", writing_style: "",
  script1_text: `Hey! 👋 Just to confirm — you reached out because you're interested in [SERVICE] to maybe get help with [DESIRED END RESULT], right?\n\n→ Perfect 😊 Before I send you anything, what's your name?\n\n→ Nice to meet you, [NAME] 👍\nQuick question so I can send you exactly the right thing — have you ever tried [CATEGORY] before, or is this your first time?\n\n→ And do you already have a clear idea of how it works, or are you still figuring things out?\n\n→ Perfect 👍\nI'll send you [DELIVERABLE] right now. Take a few minutes to go through it — by the end you'll have a clear picture of [OUTCOME]. And if it clicks and you want to go further, we can talk about the next step. Sound good?`,
  script1_service: "", script1_end_result: "", script1_category: "", script1_deliverable: "", script1_outcome: "",
  lead_magnet_link: "",
  script2_text: `Hey [NAME] 👋 Sorry — just wanted to double check, did the link work okay?\n\n→ Got it — did you have time to go through it or not yet?\n\nIf not complete: No worries, go finish it — I'll be here 😊\n\nIf complete:\n→ Nice! How did you find it? Did it give you a clearer picture?\n\n→ Really glad it helped 😊\nQuick question — what made you reach out in the first place?\n1 — Just exploring\n2 — Or actually looking to make a real change?\n\n→ Got it, so you're serious about this. What's driving that — what do you actually want to achieve?\n\n→ And if you actually got there — what would that mean for you personally?\n\n→ Be honest with me…\nIf nothing changes and you're in the exact same spot 3 months from now — how does that feel?\n\n→ I hear you. So here's where most people get stuck — they have the motivation but no clear path. Could you figure out the next steps completely alone, or would it help to have someone walk you through it?\n\n→ Perfect 👍\nLet's get on a short call — completely free. No selling, no pressure.\nIn [X] minutes I'll help you:\n1 — Get clear on where you are and where you want to go\n2 — Identify what's been holding you back\n3 — Give you a simple first step you can take right after the call\nDoes that sound useful?\n\n→ Perfect 👍 Here's the link: [BOOKING LINK]\nOnce you book send me a quick confirmation 🙏`,
  script2_call_duration: "", script2_booking_link: "",
  booking_event_name: "", booking_host: "", booking_duration: "30 minutes",
  booking_days: ["Mon","Tue","Wed","Thu","Fri"],
  booking_hours_from: "9:00", booking_hours_to: "18:00", wa_business_account_id: "",
};

interface FlowStep {
  id: string; label: string; sublabel: string; color: string; bg: string; border: string;
  icon: React.ReactNode; content: string; live: boolean;
  type?: "reply"|"trigger"|"typing"|"agent"|"script1"|"leadmagnet"|"script2"|"booking"|"replynode";
}

const BOOKING_STEPS: FlowStep[] = [
  { id:"1", label:"Trigger",          sublabel:"WhatsApp Connection",  color:"#4F46E5", bg:"#EEF2FF", border:"#C7D2FE", icon:<Wifi size={15} strokeWidth={1.5}/>,          content:"Connect LeadFlow to WhatsApp to receive messages",                    live:true,  type:"trigger"    },
  { id:"2", label:"Typing Animation", sublabel:"Human-like Behaviour", color:"#7C3AED", bg:"#F5F3FF", border:"#DDD6FE", icon:<Type size={15} strokeWidth={1.5}/>,           content:"Makes your AI agent appear human by showing typing in WhatsApp",      live:true,  type:"typing"     },
  { id:"3", label:"AI Agent",         sublabel:"Agent Identity",       color:"#2563EB", bg:"#EFF6FF", border:"#BFDBFE", icon:<Bot size={15} strokeWidth={1.5}/>,            content:"Configure your AI agent's name and writing style",                   live:true,  type:"agent"      },
  { id:"4", label:"Script 1",         sublabel:"Welcome & Qualify",    color:"#059669", bg:"#ECFDF5", border:"#A7F3D0", icon:<MessageSquare size={15} strokeWidth={1.5}/>, content:"Auto-filled from onboarding — confirm or adjust your welcome script", live:true,  type:"script1"    },
  { id:"5", label:"Lead Magnet",      sublabel:"Send Resource",        color:"#D97706", bg:"#FFFBEB", border:"#FDE68A", icon:<Gift size={15} strokeWidth={1.5}/>,           content:"Paste the link to your lead magnet (guide, video, PDF...)",           live:false, type:"leadmagnet" },
  { id:"6", label:"Script 2",         sublabel:"Follow-Up & Offer",    color:"#DC2626", bg:"#FEF2F2", border:"#FECACA", icon:<Phone size={15} strokeWidth={1.5}/>,          content:"Auto-filled from onboarding — confirm or adjust your follow-up script",live:false, type:"script2"    },
  { id:"7", label:"Booking",          sublabel:"Schedule Call",        color:"#4F46E5", bg:"#EEF2FF", border:"#C7D2FE", icon:<Calendar size={15} strokeWidth={1.5}/>,       content:"Customise your booking form — event name, host, availability",       live:false, type:"booking"    },
  { id:"8", label:"Reply Node",       sublabel:"WhatsApp Reply",       color:"#059669", bg:"#ECFDF5", border:"#A7F3D0", icon:<MessageCircle size={15} strokeWidth={1.5}/>, content:"Connect your WhatsApp to send messages to leads",                    live:false, type:"replynode"  },
];

const FOLLOWUP_AUTO_STEPS: FlowStep[] = [
  { id:"1", label:"Scheduled Trigger", sublabel:"Time-based Send", color:"#4F46E5", bg:"#EEF2FF", border:"#C7D2FE", icon:<Clock size={15} strokeWidth={1.5}/>,          content:"Send follow-up after: 1 day",                                                          live:true  },
  { id:"2", label:"Follow-Up Message", sublabel:"Re-engage Lead",  color:"#2563EB", bg:"#EFF6FF", border:"#BFDBFE", icon:<MessageSquare size={15} strokeWidth={1.5}/>, content:"Hey {name}, just checking in! Did you get a chance to look at what I sent?", live:false },
];

const FOLLOWUP_AGENT_STEPS: FlowStep[] = [
  { id:"1", label:"Trigger Agent", sublabel:"AI Reply Trigger", color:"#4F46E5", bg:"#EEF2FF", border:"#C7D2FE", icon:<Bot size={15} strokeWidth={1.5}/>,           content:"When lead replies, AI agent takes over the conversation",          live:true  },
  { id:"2", label:"Agent Reply",   sublabel:"WhatsApp Reply",   color:"#059669", bg:"#ECFDF5", border:"#A7F3D0", icon:<MessageCircle size={15} strokeWidth={1.5}/>, content:"AI responds based on lead's message to guide them toward booking",  live:false },
];

// ─── Global Styles ────────────────────────────────────────────────────────────
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .lf-root { font-family: 'Plus Jakarta Sans', sans-serif; background: #EDEEF5; min-height: 100vh; }
  .lf-back-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 10px; border: 1px solid #E5E7EB; background: #FFFFFF; font-size: 12px; font-weight: 600; color: #6B7280; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; margin-bottom: 24px; transition: all 0.15s; box-shadow: 0 1px 4px rgba(0,0,0,.05); }
  .lf-back-btn:hover { background: #F9FAFB; color: #111827; border-color: #D1D5DB; }
  .lf-preview-layout { display: flex; height: 100%; }
  .lf-preview-sidebar { width: 340px; background: #FFFFFF; border-right: 1px solid #E5E7EB; display: flex; flex-direction: column; overflow-y: auto; }
  .lf-preview-stat { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 10px; padding: 12px; text-align: center; }
  .lf-preview-stat-val { font-size: 18px; font-weight: 700; color: #4F46E5; margin-bottom: 2px; }
  .lf-preview-stat-label { font-size: 9px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.8px; }
  .lf-flow-node { border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: all 0.18s; position: relative; overflow: hidden; }
  .lf-flow-node:hover { transform: translateX(2px); }
  .lf-preview-node { border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; gap: 10px; transition: all 0.15s; }
  .lf-preview-node:hover { transform: translateX(2px); }
  .lf-connector { display: flex; flex-direction: column; align-items: center; margin: 3px 0; }
  .lf-right-panel { width: 380px; background: #FFFFFF; border-left: 1px solid #E5E7EB; padding: 24px; overflow-y: auto; flex-shrink: 0; }
  .lf-label { display: block; font-size: 11px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; }
  .lf-input { width: 100%; padding: 9px 12px; border: 1.5px solid #E5E7EB; border-radius: 8px; font-size: 13px; color: #111827; background: #FFFFFF; outline: none; font-family: 'Plus Jakarta Sans', sans-serif; transition: border-color 0.15s; }
  .lf-input:focus { border-color: #4F46E5; box-shadow: 0 0 0 3px rgba(79,70,229,0.08); }
  .lf-select { width: 100%; padding: 9px 12px; border: 1.5px solid #E5E7EB; border-radius: 8px; font-size: 13px; color: #111827; background: #FFFFFF; outline: none; font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer; }
  .lf-textarea { width: 100%; padding: 10px 12px; border: 1.5px solid #E5E7EB; border-radius: 8px; font-size: 12px; color: #111827; background: #F9FAFB; outline: none; resize: none; line-height: 1.7; font-family: 'Plus Jakarta Sans', sans-serif; }
  .lf-textarea:focus { border-color: #4F46E5; background: #FFFFFF; }
  .lf-info-banner { padding: 10px 14px; border-radius: 8px; background: #EEF2FF; border: 1px solid #C7D2FE; font-size: 12px; color: #4338CA; line-height: 1.6; margin-bottom: 18px; }
  .lf-save-btn { width: 100%; padding: 11px; border-radius: 9px; border: none; background: #4F46E5; color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 7px; }
  .lf-save-btn:hover { background: #4338CA; }
  .lf-save-btn.saved { background: #059669; }
  .lf-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .lf-publish-btn { padding: 9px 20px; border-radius: 9px; border: none; background: #4F46E5; font-size: 13px; font-weight: 700; color: #fff; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
  .lf-publish-btn:hover { background: #4338CA; }
  .lf-publish-btn.done { background: #059669; }
  .lf-test-btn { padding: 9px 16px; border-radius: 9px; border: 1.5px solid #E5E7EB; background: #FFFFFF; font-size: 13px; font-weight: 600; color: #6B7280; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.15s; }
  .lf-test-btn:hover { background: #F9FAFB; color: #111827; }
  .lf-start-btn { width: 100%; padding: 13px; border-radius: 12px; border: none; background: #4F46E5; color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .lf-start-btn:hover { background: #4338CA; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,70,229,0.3); }
  .lf-style-opt { padding: 12px 14px; border-radius: 10px; cursor: pointer; transition: all 0.15s; border: 1.5px solid #E5E7EB; background: #FAFAFA; margin-bottom: 8px; }
  .lf-style-opt:hover { border-color: #A5B4FC; }
  .lf-style-opt.selected { border-color: #4F46E5; background: #EEF2FF; }
  .lf-day { padding: 6px 12px; border-radius: 7px; border: 1.5px solid #E5E7EB; background: #FAFAFA; font-size: 12px; font-weight: 500; color: #6B7280; cursor: pointer; transition: all 0.15s; }
  .lf-day.selected { border-color: #4F46E5; background: #EEF2FF; color: #4F46E5; }
  .lf-add-step { margin-top: 14px; display: flex; align-items: center; gap: 8px; padding: 11px 20px; border-radius: 10px; border: 1.5px dashed #D1D5DB; background: #FFFFFF; font-size: 12px; font-weight: 500; color: #9CA3AF; cursor: pointer; width: 100%; justify-content: center; font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.15s; }
  .lf-add-step:hover { background: #F9FAFB; color: #6B7280; border-color: #9CA3AF; }
  .lf-flow-card { background: #FFFFFF; border-radius: 16px; border: 1px solid #E8E6E0; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,.05); overflow: hidden; display: flex; flex-direction: column; }
  .lf-flow-card:hover { transform: translateY(-3px); box-shadow: 0 12px 36px rgba(0,0,0,.10); }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes wfIntroFadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  .lf-animate { animation: fadeUp 0.35s ease forwards; }
  .lf-animate-delay-1 { animation: fadeUp 0.35s ease 0.08s forwards; opacity: 0; }
  .lf-animate-delay-2 { animation: fadeUp 0.35s ease 0.16s forwards; opacity: 0; }
`;

// ─── Images ───────────────────────────────────────────────────────────────────
const BookingAgent = ({ style }: { style?: React.CSSProperties }) => (
  <img src={`${BASE}bookingflow.png`} alt="Booking Flow" style={{ width:"100%", height:"100%", objectFit:"contain", objectPosition:"center bottom", ...style }} />
);
const FollowUpAutomation = ({ style }: { style?: React.CSSProperties }) => (
  <img src={`${BASE}followupautomation3.png`} alt="Follow Up Automation" style={{ width:"100%", height:"100%", objectFit:"contain", objectPosition:"center bottom", ...style }} />
);
const FollowUpAgent = ({ style }: { style?: React.CSSProperties }) => (
  <img src={`${BASE}followupagent3.png`} alt="Follow Up Agent" style={{ width:"100%", height:"100%", objectFit:"contain", objectPosition:"center bottom", ...style }} />
);

// ─── Intro Screen ─────────────────────────────────────────────────────────────
function WorkflowsIntroScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #f0f4ff 0%, #e8eaf6 40%, #f5f0ff 100%)",
      position: "relative", overflow: "hidden", fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {/* Background orbs */}
      <div style={{ position: "absolute", top: -200, left: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -150, right: -150, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{
        position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: 64,
        maxWidth: 1000, width: "90%", padding: "56px 60px",
        background: "rgba(255,255,255,0.45)", backdropFilter: "blur(32px) saturate(180%)",
        WebkitBackdropFilter: "blur(32px) saturate(180%)",
        borderRadius: 32, border: "1px solid rgba(255,255,255,0.7)",
        boxShadow: "0 8px 32px rgba(79,70,229,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
        animation: "wfIntroFadeUp 0.6s ease forwards",
      }}>
        {/* Left */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 14px", borderRadius: 100,
            background: "rgba(79,70,229,0.08)", border: "1px solid rgba(79,70,229,0.15)",
            fontSize: 11, fontWeight: 700, color: "#4F46E5", letterSpacing: "0.6px",
            textTransform: "uppercase" as const, marginBottom: 20, width: "fit-content",
          }}>
            <Zap size={10} strokeWidth={2.5} /> Your Agent's Workspace
          </div>

          <div style={{
            fontSize: 42, fontWeight: 800, color: "#0f1117",
            lineHeight: 1.1, letterSpacing: "-1.2px", marginBottom: 16,
          }}>
            Your agent is hired —<br />
            <span style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              now set up his workspace.
            </span>
          </div>

          <div style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.75, marginBottom: 36, maxWidth: 380 }}>
            Your AI agent is certified and ready. Now give him everything he needs to work — his WhatsApp line, his scripts, and his booking system.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 40 }}>
            {[
              "Connect your WhatsApp Business account",
              "Set up your booking flow from A to Z",
              "Configure follow-up automations",
              "Publish and go live in minutes",
            ].map((text, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 500, color: "#374151" }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Check size={11} color="#fff" strokeWidth={3} />
                </div>
                {text}
              </div>
            ))}
          </div>

          <button onClick={onContinue} style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "15px 32px", borderRadius: 16, border: "none",
            background: "linear-gradient(135deg, #4F46E5 0%, #6D28D9 100%)",
            color: "#fff", fontSize: 15, fontWeight: 700,
            fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: "pointer",
            boxShadow: "0 8px 24px rgba(79,70,229,0.3), 0 2px 8px rgba(79,70,229,0.2)",
            width: "fit-content", letterSpacing: "-0.2px", transition: "all 0.25s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 14px 36px rgba(79,70,229,0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 24px rgba(79,70,229,0.3)"; }}
          >
            Set up my workspace
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowRight size={14} strokeWidth={2.5} />
            </div>
          </button>
        </div>

        {/* Right — illustration */}
        <div style={{ flexShrink: 0, width: 420, height: 320, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <img src={WORKFLOWS_IMG} alt="Your workspace" style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center bottom" }} />
        </div>
      </div>
    </div>
  );
}

// ─── Locked State ─────────────────────────────────────────────────────────────
function LockedWorkflows() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #f0f4ff 0%, #e8eaf6 40%, #f5f0ff 100%)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{
        maxWidth: 480, width: "90%", textAlign: "center",
        padding: "56px 48px",
        background: "rgba(255,255,255,0.5)", backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        borderRadius: 28, border: "1px solid rgba(255,255,255,0.7)",
        boxShadow: "0 8px 32px rgba(79,70,229,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
        animation: "wfIntroFadeUp 0.5s ease forwards",
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", margin: "0 auto 24px",
          background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.08))",
          border: "1px solid rgba(139,92,246,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Lock size={28} strokeWidth={1.5} color="#7C3AED" />
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 10, letterSpacing: "-0.3px" }}>
          Workspace locked
        </div>
        <div style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7, marginBottom: 28 }}>
          Your agent needs to be certified before you can set up his workspace. Go to <strong style={{ color: "#4F46E5" }}>My Agent</strong>, run the Quality Test, and confirm you're satisfied.
        </div>
        <div style={{
          padding: "14px 20px", borderRadius: 14,
          background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)",
          fontSize: 12, color: "#4F46E5", fontWeight: 600, lineHeight: 1.6,
        }}>
          💡 Think of it like hiring: you interview the candidate first, then you give them their desk and tools.
        </div>
      </div>
    </div>
  );
}

// ─── Flow Card ────────────────────────────────────────────────────────────────
function FlowCard({ bgColor, title, description, agentImgUrl, accentColor, accentBg, stepCount, onClick }: {
  bgColor: string; title: string; description: string; agentImgUrl: string;
  accentColor: string; accentBg: string; stepCount: string; onClick: () => void;
}) {
  return (
    <div className="lf-flow-card" onClick={onClick}>
      <div style={{ padding: "16px 18px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, overflow: "hidden", border: "1px solid #F3F4F6", flexShrink: 0, background: bgColor }}>
            <img src={agentImgUrl} alt={title} style={{ width: "100%", height: "100%", objectFit: "contain", objectPosition: "center bottom" }} />
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, color: accentColor, background: accentBg, padding: "3px 9px", borderRadius: 20, letterSpacing: "0.5px", textTransform: "uppercase" as const }}>
            ⚡ {stepCount}
          </div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", letterSpacing: "-0.3px", lineHeight: 1.2, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.7, marginBottom: 14, flex: 1 }}>{description}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={11} color={accentColor} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>LeadFlow</span>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: accentColor }}>
            Configure <ChevronRight size={13} strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Interactive Flow Diagram ─────────────────────────────────────────────────
function InteractiveFlowDiagram({ steps }: { steps: FlowStep[] }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const onMouseDown = (e: React.MouseEvent) => { setDragging(true); dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }; };
  const onMouseMove = (e: React.MouseEvent) => { if (!dragging) return; setOffset({ x: dragStart.current.ox + (e.clientX - dragStart.current.x), y: dragStart.current.oy + (e.clientY - dragStart.current.y) }); };
  const onMouseUp = () => setDragging(false);
  return (
    <div style={{ position: "relative", flex: 1, background: "#F9FAFB", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        {[{ icon: <ZoomIn size={13}/>, fn: () => setZoom(z => Math.min(3, z+1)) }, { icon: <ZoomOut size={13}/>, fn: () => setZoom(z => Math.max(1, z-1)) }, { icon: <Move size={13}/>, fn: () => { setZoom(1); setOffset({x:0,y:0}); } }].map((b, i) => (
          <button key={i} onClick={b.fn} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280" }}>{b.icon}</button>
        ))}
      </div>
      <div onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        style={{ width: "100%", height: "100%", cursor: dragging ? "grabbing" : "grab", userSelect: "none", overflow: "hidden" }}>
        <div style={{ transform: `translate(${offset.x}px,${offset.y}px)`, paddingTop: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 0, width: "100%" }}>
          {steps.map((step, i) => (
            <div key={step.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div className="lf-preview-node" style={{ width: zoom===1?220:zoom===2?280:340, border: `1.5px solid ${step.border}`, background: step.bg }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.8)", border: `1px solid ${step.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: step.color, flexShrink: 0 }}>{step.icon}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{step.label}</div>
                  <div style={{ fontSize: 9, color: "#9CA3AF", fontStyle: "italic" }}>{step.sublabel}</div>
                </div>
                {step.live && <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3, fontSize: 8, fontWeight: 600, color: "#059669", background: "#DCFCE7", padding: "2px 7px", borderRadius: 20, flexShrink: 0 }}><span style={{ width: 4, height: 4, borderRadius: "50%", background: "#059669", display: "inline-block" }} />Live</div>}
              </div>
              {i < steps.length-1 && <div className="lf-connector"><div style={{ width: 1.5, height: 16, background: "#D1D5DB" }} /><div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "6px solid #D1D5DB" }} /></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Preview Screen ───────────────────────────────────────────────────────────
function PreviewScreen({ title, subtitle, description, accentColor, accentBg, stats, howItWorks, agent, steps, onStart, onBack, backLabel }: {
  title: string; subtitle: string; description: string; accentColor: string; accentBg: string;
  stats: { label: string; value: string }[]; howItWorks: { icon: React.ReactNode; label: string; desc: string }[];
  agent: React.ReactNode; steps: FlowStep[]; onStart: () => void; onBack: () => void; backLabel: string;
}) {
  return (
    <div className="lf-preview-layout" style={{ height: "100%", overflow: "hidden" }}>
      <div className="lf-preview-sidebar">
        <div style={{ padding: "24px 28px 0" }}>
          <button className="lf-back-btn" onClick={onBack}><ArrowLeft size={13} strokeWidth={1.8} /> {backLabel}</button>
        </div>
        <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", alignItems: "center", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ width: "100%", height: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>{agent}</div>
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", letterSpacing: "-0.3px", marginBottom: 2 }}>{title}</div>
            <div style={{ fontSize: 12, color: "#9CA3AF", fontStyle: "italic", marginBottom: 16 }}>{subtitle}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, width: "100%" }}>
            {stats.map(s => (
              <div key={s.label} className="lf-preview-stat">
                <div className="lf-preview-stat-val" style={{ color: accentColor }}>{s.value}</div>
                <div className="lf-preview-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "1px", marginBottom: 8 }}>About this workflow</div>
          <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.8, margin: 0 }}>{description}</p>
        </div>
        <div style={{ padding: "20px 24px", flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "1px", marginBottom: 14 }}>How it works</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {howItWorks.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: accentBg, border: `1px solid ${accentColor}30`, display: "flex", alignItems: "center", justifyContent: "center", color: accentColor, flexShrink: 0 }}>{step.icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{step.label}</div>
                  <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.6 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "16px 24px 28px" }}>
          <button className="lf-start-btn" onClick={onStart}>Start Configuration <ChevronRight size={14} strokeWidth={2.5} /></button>
        </div>
      </div>
      <div style={{ flex: 1, padding: "28px", display: "flex", flexDirection: "column", gap: 16, overflow: "hidden", background: "#EDEEF5" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 3, letterSpacing: "-0.2px" }}>Workflow Preview</div>
          <div style={{ fontSize: 11, color: "#9CA3AF" }}>Interactive — drag to pan, use +/- to zoom</div>
        </div>
        <InteractiveFlowDiagram steps={steps} />
      </div>
    </div>
  );
}

// ─── Form helpers ─────────────────────────────────────────────────────────────
function InfoBanner({ text }: { text: string }) { return <div className="lf-info-banner">{text}</div>; }
function SaveBtn({ label, icon, onClick, saving, saved }: { label: string; icon?: React.ReactNode; onClick: () => void; saving: boolean; saved: boolean }) {
  return (
    <button className={`lf-save-btn ${saved ? "saved" : ""}`} onClick={onClick} disabled={saving}>
      {saving ? <Loader2 size={13} strokeWidth={2} style={{ animation: "spin 1s linear infinite" }} /> : saved ? <Check size={13} strokeWidth={2.5} /> : icon}
      {saving ? "Saving..." : saved ? "Saved!" : label}
    </button>
  );
}

interface PanelProps { config: AutomationConfig; onChange: (key: keyof AutomationConfig, value: string | string[]) => void; onSave: () => void; saving: boolean; saved: boolean; }

function TriggerPanel({ config, onChange, onSave, saving, saved }: PanelProps) {
  return (<><InfoBanner text="Connect your WhatsApp Business account so LeadFlow can receive messages from your leads." /><div style={{ marginBottom:14 }}><label className="lf-label">Client ID</label><input className="lf-input" value={config.wa_client_id} onChange={e => onChange("wa_client_id", e.target.value)} placeholder="e.g. 1234567890" /></div><div style={{ marginBottom:18 }}><label className="lf-label">Client Secret</label><input className="lf-input" type="password" value={config.wa_client_secret} onChange={e => onChange("wa_client_secret", e.target.value)} placeholder="e.g. EAAxxxxxxxx..." /></div><SaveBtn label="Connect" icon={<Wifi size={13} strokeWidth={1.5}/>} onClick={onSave} saving={saving} saved={saved}/></>);
}
function TypingPanel({ config, onChange, onSave, saving, saved }: PanelProps) {
  return (<><InfoBanner text="Makes your AI agent show a typing indicator before replying — so leads feel like they're talking to a real person." /><div style={{ marginBottom:14 }}><label className="lf-label">WhatsApp Access Token</label><input className="lf-input" type="password" value={config.wa_access_token} onChange={e => onChange("wa_access_token", e.target.value)} placeholder="EAAxxxxxxxx..." /></div><div style={{ marginBottom:18 }}><label className="lf-label">Typing Duration</label><select className="lf-select" value={config.typing_duration} onChange={e => onChange("typing_duration", e.target.value)}><option>1 second</option><option>2 seconds</option><option>3 seconds</option><option>5 seconds</option></select></div><SaveBtn label="Save Changes" onClick={onSave} saving={saving} saved={saved}/></>);
}
function AgentPanel({ config, onChange, onSave, saving, saved }: PanelProps) {
  const styles = [
    { key:"Professional",    msg:"Thank you for reaching out. We've received your request and will be in touch shortly." },
    { key:"Friendly & Warm", msg:"Hey! Thanks for contacting us 😊 We got your message and we'll get back to you very soon!" },
    { key:"Casual & Direct", msg:"Got it! We'll hit you back shortly 👍" },
    { key:"Formal",          msg:"Dear client, we acknowledge receipt of your inquiry and will respond within the shortest possible delay." },
  ];
  return (<><InfoBanner text="Set your agent's name and choose the writing style that best represents how you communicate with leads." /><div style={{ marginBottom:14 }}><label className="lf-label">Agent Name</label><input className="lf-input" value={config.agent_name} onChange={e => onChange("agent_name", e.target.value)} placeholder="e.g. Sarah, Alex, Max..." /></div><div style={{ marginBottom:20 }}><label className="lf-label">Writing Style</label><p style={{ fontSize:11, color:"#9CA3AF", marginBottom:10 }}>Pick the style that best matches how you talk to your leads:</p>{styles.map(s => (<div key={s.key} className={`lf-style-opt ${config.writing_style===s.key?"selected":""}`} onClick={() => onChange("writing_style", s.key)}><div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}><span style={{ fontSize:10, fontWeight:700, color:config.writing_style===s.key?"#4F46E5":"#6B7280", textTransform:"uppercase" as const, letterSpacing:"0.8px" }}>{s.key}</span>{config.writing_style===s.key&&<Check size={11} strokeWidth={2.5} color="#4F46E5"/>}</div><p style={{ fontSize:11, color:"#374151", lineHeight:1.6, margin:0 }}>{s.msg}</p></div>))}</div><SaveBtn label="Save Changes" onClick={onSave} saving={saving} saved={saved}/></>);
}
function Script1Panel({ config, onChange, onSave, saving, saved }: PanelProps) {
  return (<><InfoBanner text="This script was auto-filled from your onboarding info. Review it and adjust anything that doesn't feel right." /><div style={{ marginBottom:14 }}><label className="lf-label">Script Preview</label><textarea className="lf-textarea" value={config.script1_text} onChange={e => onChange("script1_text", e.target.value)} style={{ height:200 }}/></div><div style={{ marginBottom:16 }}><label className="lf-label">Variables</label><div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:8 }}>{[{key:"script1_service",label:"[SERVICE]",placeholder:"e.g. home cleaning"},{key:"script1_end_result",label:"[DESIRED END RESULT]",placeholder:"e.g. a spotless home"},{key:"script1_category",label:"[CATEGORY]",placeholder:"e.g. cleaning services"},{key:"script1_deliverable",label:"[DELIVERABLE]",placeholder:"e.g. your free guide"},{key:"script1_outcome",label:"[OUTCOME]",placeholder:"e.g. how to get started"}].map(f=>(<div key={f.key}><span style={{fontSize:9,fontWeight:700,color:"#4F46E5",letterSpacing:"0.5px",textTransform:"uppercase" as const,display:"block",marginBottom:4}}>{f.label}</span><input className="lf-input" value={(config as any)[f.key]} onChange={e=>onChange(f.key as keyof AutomationConfig,e.target.value)} placeholder={f.placeholder} style={{fontSize:12}}/></div>))}</div></div><SaveBtn label="Save Changes" onClick={onSave} saving={saving} saved={saved}/></>);
}
function LeadMagnetPanel({ config, onChange, onSave, saving, saved }: PanelProps) {
  return (<><InfoBanner text="Paste the link to your lead magnet — this is what gets sent to the lead automatically after Script 1." /><div style={{ marginBottom:14 }}><label className="lf-label">Lead Magnet Link</label><input className="lf-input" value={config.lead_magnet_link} onChange={e => onChange("lead_magnet_link", e.target.value)} placeholder="https://..."/></div><p style={{fontSize:11,color:"#9CA3AF",marginBottom:20,lineHeight:1.6}}>Can be a PDF, video, Google Doc, Notion page, or any link.</p><SaveBtn label="Save Changes" icon={<Link size={13} strokeWidth={1.5}/>} onClick={onSave} saving={saving} saved={saved}/></>);
}
function Script2Panel({ config, onChange, onSave, saving, saved }: PanelProps) {
  return (<><InfoBanner text="This script was auto-filled from your onboarding info. Review it and adjust anything that doesn't feel right." /><div style={{ marginBottom:14 }}><label className="lf-label">Script Preview</label><textarea className="lf-textarea" value={config.script2_text} onChange={e => onChange("script2_text", e.target.value)} style={{ height:200 }}/></div><div style={{ marginBottom:16 }}><label className="lf-label">Variables</label><div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:8 }}>{[{key:"script2_call_duration",label:"[X] Call duration",placeholder:"e.g. 20"},{key:"script2_booking_link",label:"[BOOKING LINK]",placeholder:"https://cal.com/..."}].map(f=>(<div key={f.key}><span style={{fontSize:9,fontWeight:700,color:"#4F46E5",letterSpacing:"0.5px",textTransform:"uppercase" as const,display:"block",marginBottom:4}}>{f.label}</span><input className="lf-input" value={(config as any)[f.key]} onChange={e=>onChange(f.key as keyof AutomationConfig,e.target.value)} placeholder={f.placeholder} style={{fontSize:12}}/></div>))}</div></div><SaveBtn label="Save Changes" onClick={onSave} saving={saving} saved={saved}/></>);
}
function BookingPanel({ config, onChange, onSave, saving, saved }: PanelProps) {
  const allDays = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const toggleDay = (day: string) => { const current = config.booking_days||[]; onChange("booking_days", (current.includes(day)?current.filter(d=>d!==day):[...current,day]) as any); };
  return (<><InfoBanner text="Customise your booking form — this is what leads see when they click your booking link." /><div style={{marginBottom:14}}><label className="lf-label">Event Name</label><input className="lf-input" value={config.booking_event_name} onChange={e=>onChange("booking_event_name",e.target.value)} placeholder="e.g. Free Strategy Call"/></div><div style={{marginBottom:14}}><label className="lf-label">Host Name</label><input className="lf-input" value={config.booking_host} onChange={e=>onChange("booking_host",e.target.value)} placeholder="e.g. John from CleanCo"/></div><div style={{marginBottom:14}}><label className="lf-label">Call Duration</label><select className="lf-select" value={config.booking_duration} onChange={e=>onChange("booking_duration",e.target.value)}>{["15 minutes","20 minutes","30 minutes","45 minutes","60 minutes"].map(o=><option key={o}>{o}</option>)}</select></div><div style={{marginBottom:14}}><label className="lf-label">Available Days</label><div style={{display:"flex",gap:6,flexWrap:"wrap" as const,marginTop:6}}>{allDays.map(day=><div key={day} className={`lf-day ${(config.booking_days||[]).includes(day)?"selected":""}`} onClick={()=>toggleDay(day)}>{day}</div>)}</div></div><div style={{marginBottom:20}}><label className="lf-label">Available Hours</label><div style={{display:"flex",gap:8,alignItems:"center",marginTop:6}}><select className="lf-select" value={config.booking_hours_from} onChange={e=>onChange("booking_hours_from",e.target.value)} style={{flex:1}}>{["8:00","9:00","10:00","11:00","12:00","13:00","14:00"].map(h=><option key={h}>{h}</option>)}</select><span style={{fontSize:12,color:"#9CA3AF",flexShrink:0}}>to</span><select className="lf-select" value={config.booking_hours_to} onChange={e=>onChange("booking_hours_to",e.target.value)} style={{flex:1}}>{["15:00","16:00","17:00","18:00","19:00","20:00","21:00"].map(h=><option key={h}>{h}</option>)}</select></div></div><SaveBtn label="Save Changes" onClick={onSave} saving={saving} saved={saved}/></>);
}
function ReplyNodePanel({ config, onChange, onSave, saving, saved }: PanelProps) {
  return (<><InfoBanner text="Connect your WhatsApp to allow LeadFlow to send messages to your leads automatically." /><div style={{marginBottom:14}}><label className="lf-label">WhatsApp Access Token</label><input className="lf-input" type="password" value={config.wa_access_token} onChange={e=>onChange("wa_access_token",e.target.value)} placeholder="EAAxxxxxxxx..."/></div><div style={{marginBottom:18}}><label className="lf-label">Business Account ID</label><input className="lf-input" value={config.wa_business_account_id} onChange={e=>onChange("wa_business_account_id",e.target.value)} placeholder="e.g. 1408732614201335"/></div><SaveBtn label="Connect" icon={<Wifi size={13} strokeWidth={1.5}/>} onClick={onSave} saving={saving} saved={saved}/></>);
}

function RightPanel({ step, config, onChange, onSave, saving, saved }: { step: FlowStep; config: AutomationConfig; onChange: (key: keyof AutomationConfig, value: string | string[]) => void; onSave: () => void; saving: boolean; saved: boolean; }) {
  return (
    <div className="lf-right-panel">
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", marginBottom: 3, letterSpacing: "-0.2px" }}>{step.label} Settings</div>
        <div style={{ fontSize: 11, color: "#9CA3AF" }}>Configure this step</div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label className="lf-label">Step Type</label>
        <div style={{ padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${step.border}`, background: step.bg, fontSize: 12, fontWeight: 700, color: step.color, display: "flex", alignItems: "center", gap: 8 }}>
          <span>{step.icon}</span><span>{step.sublabel}</span>
        </div>
      </div>
      {step.type === "trigger"    && <TriggerPanel    config={config} onChange={onChange} onSave={onSave} saving={saving} saved={saved}/>}
      {step.type === "typing"     && <TypingPanel     config={config} onChange={onChange} onSave={onSave} saving={saving} saved={saved}/>}
      {step.type === "agent"      && <AgentPanel      config={config} onChange={onChange} onSave={onSave} saving={saving} saved={saved}/>}
      {step.type === "script1"    && <Script1Panel    config={config} onChange={onChange} onSave={onSave} saving={saving} saved={saved}/>}
      {step.type === "leadmagnet" && <LeadMagnetPanel config={config} onChange={onChange} onSave={onSave} saving={saving} saved={saved}/>}
      {step.type === "script2"    && <Script2Panel    config={config} onChange={onChange} onSave={onSave} saving={saving} saved={saved}/>}
      {step.type === "booking"    && <BookingPanel    config={config} onChange={onChange} onSave={onSave} saving={saving} saved={saved}/>}
      {step.type === "replynode"  && <ReplyNodePanel  config={config} onChange={onChange} onSave={onSave} saving={saving} saved={saved}/>}
    </div>
  );
}

// ─── Flow Editor ──────────────────────────────────────────────────────────────
function FlowEditor({ title, subtitle, steps, onBack, backLabel="Back", config, onChange, onSave, onPublish, saving, saved, publishing, publishDone }: {
  title: string; subtitle: string; steps: FlowStep[]; onBack: () => void; backLabel?: string;
  config: AutomationConfig; onChange: (key: keyof AutomationConfig, value: string | string[]) => void;
  onSave: () => void; onPublish: () => void; saving: boolean; saved: boolean; publishing: boolean; publishDone: boolean;
}) {
  const [selected, setSelected] = useState<string>(steps[0].id);
  const selectedStep = steps.find(s => s.id === selected)!;
  return (
    <div style={{ display: "flex", height: "100%", background: "#EDEEF5" }}>
      <div style={{ flex: 1, padding: "32px 36px", overflowY: "auto" }}>
        <button className="lf-back-btn" onClick={onBack}><ArrowLeft size={13} strokeWidth={1.8}/> {backLabel}</button>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-0.4px", marginBottom: 4 }}>{title}</h1>
            <p style={{ fontSize: 12, color: "#9CA3AF" }}>{subtitle}</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="lf-test-btn">Test Flow</button>
            <button className={`lf-publish-btn ${publishDone?"done":""}`} onClick={onPublish} disabled={publishing}>
              {publishing ? <Loader2 size={13} strokeWidth={2} style={{ animation:"spin 1s linear infinite" }}/> : publishDone ? <Check size={13} strokeWidth={2.5}/> : <Zap size={13} strokeWidth={2}/>}
              {publishing ? "Publishing..." : publishDone ? "Published!" : "Publish"}
            </button>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 520, margin: "0 auto" }}>
          {steps.map((step, i) => (
            <div key={step.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
              <div className="lf-flow-node" onClick={() => setSelected(step.id)}
                style={{ width: "100%", border: `1.5px solid ${selected===step.id?step.color:step.border}`, background: selected===step.id?step.bg:"#FFFFFF", boxShadow: selected===step.id?`0 4px 20px ${step.color}18`:"0 1px 3px rgba(0,0,0,0.04)" }}>
                {step.live && <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg, ${step.color}, ${step.color}88)`, borderRadius:"12px 12px 0 0" }}/>}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:34, height:34, borderRadius:9, background:selected===step.id?"rgba(255,255,255,0.8)":step.bg, border:`1px solid ${step.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:step.color }}>{step.icon}</div>
                    <div><div style={{ fontSize:13, fontWeight:700, color:"#111827" }}>{step.label}</div><div style={{ fontSize:10, color:"#9CA3AF", fontStyle:"italic" }}>{step.sublabel}</div></div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    {step.live ? <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:9, fontWeight:700, color:"#059669", background:"#DCFCE7", padding:"3px 9px", borderRadius:20 }}><span style={{ width:5, height:5, borderRadius:"50%", background:"#059669", display:"inline-block" }}/>Live</div> : <div style={{ fontSize:9, fontWeight:700, color:"#9CA3AF", background:"#F3F4F6", padding:"3px 9px", borderRadius:20 }}>Draft</div>}
                    <Settings size={13} strokeWidth={1.5} color="#9CA3AF"/>
                  </div>
                </div>
                <div style={{ marginTop:9, fontSize:11, color:"#6B7280", lineHeight:1.6, paddingLeft:44 }}>{step.content}</div>
              </div>
              {i < steps.length-1 && <div className="lf-connector"><div style={{ width:1.5, height:18, background:"#D1D5DB" }}/><div style={{ width:22, height:22, borderRadius:"50%", border:"1.5px solid #E5E7EB", background:"#FFFFFF", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#9CA3AF" }}><Plus size={11} strokeWidth={1.5}/></div><div style={{ width:1.5, height:18, background:"#D1D5DB" }}/></div>}
            </div>
          ))}
          <button className="lf-add-step"><Plus size={13} strokeWidth={1.5}/> Add Step</button>
        </div>
      </div>
      <RightPanel step={selectedStep} config={config} onChange={onChange} onSave={onSave} saving={saving} saved={saved}/>
    </div>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────
function HomeScreen({ onSelect }: { onSelect: (v: View) => void }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px 32px 40px", background: "#EDEEF5" }}>
      <div className="lf-animate" style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px", marginBottom: 4 }}>My Workflows</div>
        <div style={{ fontSize: 13, color: "#9CA3AF" }}>Your agent's workspace — set up his tools and deploy him</div>
      </div>
      <div className="lf-animate-delay-2">
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#111827", letterSpacing: "-0.3px", marginBottom: 3 }}>Your Workflows</div>
          <div style={{ fontSize: 12, color: "#9CA3AF" }}>Choose a workflow to configure</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20 }}>
          <FlowCard
            bgColor="#EEE9FF" title="Booking Workflow"
            description="Give your agent his full booking setup — WhatsApp connection, scripts, lead magnet, and booking system. All automated."
            agentImgUrl={`${BASE}bookingflow.png`}
            accentColor="#4F46E5" accentBg="#EEF2FF" stepCount="8 Steps"
            onClick={() => onSelect("booking-preview")}
          />
          <FlowCard
            bgColor="#FFF0C2" title="Follow-Up Workflow"
            description="Set up automated follow-ups and an AI agent that re-engages leads who haven't responded."
            agentImgUrl={`${BASE}followupflow.png`}
            accentColor="#D97706" accentBg="#FEF3C7" stepCount="2 Workflows"
            onClick={() => onSelect("followup-home")}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Follow-Up Home ───────────────────────────────────────────────────────────
function FollowUpHome({ onSelect, onBack }: { onSelect: (v: View) => void; onBack: () => void }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px 32px 40px", background: "#EDEEF5" }}>
      <div style={{ marginBottom: 28 }}>
        <button className="lf-back-btn" onClick={onBack}><ArrowLeft size={13} strokeWidth={1.8}/> Back to Workflows</button>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px", marginBottom: 4 }}>Follow-Up Workflow</div>
        <div style={{ fontSize: 13, color: "#9CA3AF" }}>Choose your follow-up strategy</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20 }}>
        <FlowCard bgColor="#FFFBEB" title="Follow-Up Automation" description="Send scheduled follow-up messages at the perfect time. Set your delay and let it run automatically." agentImgUrl={`${BASE}followupautomation3.png`} accentColor="#D97706" accentBg="#FEF3C7" stepCount="Scheduled" onClick={() => onSelect("followup-automation-preview")}/>
        <FlowCard bgColor="#EFF6FF" title="Follow-Up Agent" description="AI agent takes over when a lead replies — responding intelligently to guide them toward booking." agentImgUrl={`${BASE}followupagent3.png`} accentColor="#2563EB" accentBg="#DBEAFE" stepCount="AI Agent" onClick={() => onSelect("followup-agent-preview")}/>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function MyWorkflowsScreen({ userId, agentCertified }: { userId: string; agentCertified: boolean }) {
  const [view, setView] = useState<View>("intro");
  const [config, setConfig] = useState<AutomationConfig>(EMPTY_CONFIG);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishDone, setPublishDone] = useState(false);

  // If not certified — show locked state regardless
  if (!agentCertified) return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <LockedWorkflows />
    </>
  );

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase.from("account_leadflow_automations").select("*").eq("user_id", session.user.id).maybeSingle();
      if (data) setConfig(prev => ({ ...prev, ...Object.fromEntries(Object.keys(EMPTY_CONFIG).map(k => [k, (data as any)[k] ?? (EMPTY_CONFIG as any)[k]])) }));
    };
    load();
  }, []);

  const onChange = useCallback((key: keyof AutomationConfig, value: string | string[]) => { setConfig(prev => ({ ...prev, [key]: value })); setSaved(false); }, []);

  const onSave = async () => {
    setSaving(true); setSaved(false);
    await supabase.from("account_leadflow_automations").upsert({ user_id: userId, ...config }, { onConflict: "user_id" });
    if (config.wa_client_id) {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: client } = await supabase.from("clients").upsert({ wa_phone_number_id: config.wa_client_id, wa_access_token: config.wa_access_token || "", email: user?.email || "", full_name: user?.user_metadata?.full_name || "", plan: "free" }, { onConflict: "wa_phone_number_id" }).select("id").single();
      if (client) await supabase.from("account_leadflow_automations").update({ client_id: client.id }).eq("user_id", userId);
    }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const onPublish = async () => {
    setPublishing(true);
    await supabase.from("account_leadflow_automations").upsert({ user_id: userId, ...config }, { onConflict: "user_id" });
    const { data: onboarding } = await supabase.from("accounts_leadflow").select("*").eq("user_id", userId).maybeSingle();
    try {
      await fetch(N8N_WEBHOOK, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: userId, onboarding: onboarding || {}, automation: config, published_at: new Date().toISOString() }) });
      setPublishDone(true); setTimeout(() => setPublishDone(false), 3000);
    } catch (e) { console.error("Webhook error:", e); }
    setPublishing(false);
  };

  const editorProps = { config, onChange, onSave, onPublish, saving, saved, publishing, publishDone };

  const bookingHowItWorks = [
    { icon: <Wifi size={13} strokeWidth={1.5}/>, label: "Connect WhatsApp", desc: "Link your WhatsApp Business account as the trigger for all incoming leads." },
    { icon: <Bot size={13} strokeWidth={1.5}/>, label: "AI Agent greets", desc: "Your agent sends a human-like welcome and qualifies the lead with Script 1." },
    { icon: <Gift size={13} strokeWidth={1.5}/>, label: "Lead Magnet sent", desc: "The lead magnet link is delivered automatically after qualification." },
    { icon: <Calendar size={13} strokeWidth={1.5}/>, label: "Booking confirmed", desc: "Script 2 follows up and guides the lead to book a call automatically." },
  ];
  const followupAutoHowItWorks = [
    { icon: <Clock size={13} strokeWidth={1.5}/>, label: "Scheduled trigger", desc: "Set a delay and the flow fires automatically at the right time." },
    { icon: <MessageSquare size={13} strokeWidth={1.5}/>, label: "Re-engage message", desc: "A personalised follow-up message is sent to bring the lead back." },
  ];
  const followupAgentHowItWorks = [
    { icon: <Bot size={13} strokeWidth={1.5}/>, label: "Lead replies", desc: "When a lead replies, the AI agent takes over the conversation instantly." },
    { icon: <MessageCircle size={15} strokeWidth={1.5}/>, label: "AI responds", desc: "The agent replies intelligently based on the lead's message." },
  ];

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div className="lf-root" style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

        {view === "intro" && <WorkflowsIntroScreen onContinue={() => setView("home")} />}
        {view === "home" && <HomeScreen onSelect={setView} />}
        {view === "followup-home" && <FollowUpHome onSelect={setView} onBack={() => setView("home")} />}

        {view === "booking-preview" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <PreviewScreen title="Booking Workflow" subtitle="Your main lead automation workspace"
              description="Set up the full sequence that greets every lead, qualifies them, delivers your lead magnet, and books the call — completely on autopilot."
              accentColor="#4F46E5" accentBg="#EEF2FF"
              stats={[{ label:"Steps", value:"8" }, { label:"Automated", value:"100%" }, { label:"Channel", value:"WA" }]}
              howItWorks={bookingHowItWorks}
              agent={<div style={{ width:"100%", height:"100%" }}><BookingAgent /></div>}
              steps={BOOKING_STEPS}
              onStart={() => setView("booking-flow")} onBack={() => setView("home")} backLabel="Back to Workflows"
            />
          </div>
        )}
        {view === "booking-flow" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <FlowEditor title="Booking Workflow" subtitle="Your main lead automation workspace" steps={BOOKING_STEPS} onBack={() => setView("booking-preview")} backLabel="Back to Preview" {...editorProps}/>
          </div>
        )}
        {view === "followup-automation-preview" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <PreviewScreen title="Follow-Up Automation" subtitle="Scheduled time-based follow-up"
              description="Send perfectly timed follow-up messages to leads who haven't responded. Set your delay once and let the automation re-engage them."
              accentColor="#D97706" accentBg="#FFFBEB"
              stats={[{ label:"Steps", value:"2" }, { label:"Type", value:"Auto" }, { label:"Channel", value:"WA" }]}
              howItWorks={followupAutoHowItWorks}
              agent={<div style={{ width:"100%", height:"100%" }}><FollowUpAutomation /></div>}
              steps={FOLLOWUP_AUTO_STEPS}
              onStart={() => setView("followup-automation")} onBack={() => setView("followup-home")} backLabel="Back to Follow-Up"
            />
          </div>
        )}
        {view === "followup-automation" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <FlowEditor title="Follow-Up Automation" subtitle="Scheduled time-based messages" steps={FOLLOWUP_AUTO_STEPS} onBack={() => setView("followup-automation-preview")} backLabel="Back to Preview" {...editorProps}/>
          </div>
        )}
        {view === "followup-agent-preview" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <PreviewScreen title="Follow-Up Agent" subtitle="AI agent re-engages your leads"
              description="When a lead replies, your AI agent takes over instantly — responding intelligently to guide them toward booking a call with you."
              accentColor="#2563EB" accentBg="#EFF6FF"
              stats={[{ label:"Steps", value:"2" }, { label:"Type", value:"AI" }, { label:"Channel", value:"WA" }]}
              howItWorks={followupAgentHowItWorks}
              agent={<div style={{ width:"100%", height:"100%" }}><FollowUpAgent /></div>}
              steps={FOLLOWUP_AGENT_STEPS}
              onStart={() => setView("followup-agent")} onBack={() => setView("followup-home")} backLabel="Back to Follow-Up"
            />
          </div>
        )}
        {view === "followup-agent" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <FlowEditor title="Follow-Up Agent" subtitle="AI agent re-engages leads" steps={FOLLOWUP_AGENT_STEPS} onBack={() => setView("followup-agent-preview")} backLabel="Back to Preview" {...editorProps}/>
          </div>
        )}
      </div>
    </>
  );
}
