import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Settings, Zap, MessageSquare, Gift, Phone,
  Calendar, ArrowLeft, Clock, Bot, MessageCircle, ChevronRight,
  Wifi, Type, Link, Check, Loader2, ZoomIn, ZoomOut, Move,
} from "lucide-react";
import { supabase } from "../supabaseClient";

const N8N_WEBHOOK = "https://rosegoldprojectai2.app.n8n.cloud/webhook/ea72ec64-9444-495a-ae04-babcb9e90cdd";

type View =
  | "home"
  | "lead-flow-preview"
  | "lead-flow"
  | "followup-home"
  | "followup-automation-preview"
  | "followup-automation"
  | "followup-agent-preview"
  | "followup-agent";

export interface AutomationConfig {
  wa_client_id: string;
  wa_client_secret: string;
  wa_access_token: string;
  typing_duration: string;
  agent_name: string;
  writing_style: string;
  script1_text: string;
  script1_service: string;
  script1_end_result: string;
  script1_category: string;
  script1_deliverable: string;
  script1_outcome: string;
  lead_magnet_link: string;
  script2_text: string;
  script2_call_duration: string;
  script2_booking_link: string;
  booking_event_name: string;
  booking_host: string;
  booking_duration: string;
  booking_days: string[];
  booking_hours_from: string;
  booking_hours_to: string;
  wa_business_account_id: string;
}

const EMPTY_CONFIG: AutomationConfig = {
  wa_client_id: "", wa_client_secret: "",
  wa_access_token: "", typing_duration: "2 seconds",
  agent_name: "", writing_style: "",
  script1_text: `Hey! 👋 Just to confirm — you reached out because you're interested in [SERVICE] to maybe get help with [DESIRED END RESULT], right?

→ Perfect 😊 Before I send you anything, what's your name?

→ Nice to meet you, [NAME] 👍
Quick question so I can send you exactly the right thing — have you ever tried [CATEGORY] before, or is this your first time?

→ And do you already have a clear idea of how it works, or are you still figuring things out?

→ Perfect 👍
I'll send you [DELIVERABLE] right now. Take a few minutes to go through it — by the end you'll have a clear picture of [OUTCOME]. And if it clicks and you want to go further, we can talk about the next step. Sound good?`,
  script1_service: "", script1_end_result: "", script1_category: "",
  script1_deliverable: "", script1_outcome: "",
  lead_magnet_link: "",
  script2_text: `Hey [NAME] 👋 Sorry — just wanted to double check, did the link work okay?

→ Got it — did you have time to go through it or not yet?

If not complete: No worries, go finish it — I'll be here 😊

If complete:
→ Nice! How did you find it? Did it give you a clearer picture?

→ Really glad it helped 😊
Quick question — what made you reach out in the first place?
1 — Just exploring
2 — Or actually looking to make a real change?

→ Got it, so you're serious about this. What's driving that — what do you actually want to achieve?

→ And if you actually got there — what would that mean for you personally?

→ Be honest with me…
If nothing changes and you're in the exact same spot 3 months from now — how does that feel?

→ I hear you. So here's where most people get stuck — they have the motivation but no clear path. Could you figure out the next steps completely alone, or would it help to have someone walk you through it?

→ Perfect 👍
Let's get on a short call — completely free. No selling, no pressure.
In [X] minutes I'll help you:
1 — Get clear on where you are and where you want to go
2 — Identify what's been holding you back
3 — Give you a simple first step you can take right after the call
Does that sound useful?

→ Perfect 👍 Here's the link: [BOOKING LINK]
Once you book send me a quick confirmation 🙏`,
  script2_call_duration: "", script2_booking_link: "",
  booking_event_name: "", booking_host: "",
  booking_duration: "30 minutes",
  booking_days: ["Mon","Tue","Wed","Thu","Fri"],
  booking_hours_from: "9:00", booking_hours_to: "18:00",
  wa_business_account_id: "",
};

interface FlowStep {
  id: string; label: string; sublabel: string;
  color: string; bg: string; border: string;
  icon: React.ReactNode; content: string; live: boolean;
  type?: "reply"|"trigger"|"typing"|"agent"|"script1"|"leadmagnet"|"script2"|"booking"|"replynode";
}

const LEAD_FLOW_STEPS: FlowStep[] = [
  { id:"1", label:"Trigger",           sublabel:"WhatsApp Connection",   color:"#4A46B5", bg:"#EEEDF8", border:"#C8C5F0", icon:<Wifi size={15} strokeWidth={1.5}/>,           content:"Connect LeadFlow to WhatsApp to receive messages",                    live:true,  type:"trigger"    },
  { id:"2", label:"Typing Animation",  sublabel:"Human-like Behaviour",  color:"#8A55CC", bg:"#F3EEFB", border:"#D4BFEF", icon:<Type size={15} strokeWidth={1.5}/>,            content:"Makes your AI agent appear human by showing typing in WhatsApp",      live:true,  type:"typing"     },
  { id:"3", label:"AI Agent",          sublabel:"Agent Identity",        color:"#378ADD", bg:"#E6F1FB", border:"#B3D4F5", icon:<Bot size={15} strokeWidth={1.5}/>,             content:"Configure your AI agent's name and writing style",                   live:true,  type:"agent"      },
  { id:"4", label:"Script 1",          sublabel:"Welcome & Qualify",     color:"#1D9E75", bg:"#E1F5EE", border:"#A3DFC8", icon:<MessageSquare size={15} strokeWidth={1.5}/>,  content:"Auto-filled from onboarding — confirm or adjust your welcome script", live:true,  type:"script1"    },
  { id:"5", label:"Lead Magnet",       sublabel:"Send Resource",         color:"#BA7517", bg:"#FDF3E1", border:"#F0D09A", icon:<Gift size={15} strokeWidth={1.5}/>,            content:"Paste the link to your lead magnet (guide, video, PDF...)",           live:false, type:"leadmagnet" },
  { id:"6", label:"Script 2",          sublabel:"Follow-Up & Offer",     color:"#D85A30", bg:"#FBEEE8", border:"#F0B99A", icon:<Phone size={15} strokeWidth={1.5}/>,           content:"Auto-filled from onboarding — confirm or adjust your follow-up script",live:false, type:"script2"    },
  { id:"7", label:"Booking",           sublabel:"Schedule Call",         color:"#4A46B5", bg:"#EEEDF8", border:"#C8C5F0", icon:<Calendar size={15} strokeWidth={1.5}/>,        content:"Customise your booking form — event name, host, availability",       live:false, type:"booking"    },
  { id:"8", label:"Reply Node",        sublabel:"WhatsApp Reply",        color:"#1D9E75", bg:"#E1F5EE", border:"#A3DFC8", icon:<MessageCircle size={15} strokeWidth={1.5}/>,  content:"Connect your WhatsApp to send messages to leads",                    live:false, type:"replynode"  },
];

const FOLLOWUP_AUTO_STEPS: FlowStep[] = [
  { id:"1", label:"Scheduled Trigger", sublabel:"Time-based Send",  color:"#4A46B5", bg:"#EEEDF8", border:"#C8C5F0", icon:<Clock size={15} strokeWidth={1.5}/>,          content:"Send follow-up after: 1 day",                                                             live:true  },
  { id:"2", label:"Follow-Up Message", sublabel:"Re-engage Lead",   color:"#378ADD", bg:"#E6F1FB", border:"#B3D4F5", icon:<MessageSquare size={15} strokeWidth={1.5}/>, content:"Hey {name}, just checking in! Did you get a chance to look at what I sent?", live:false },
];

const FOLLOWUP_AGENT_STEPS: FlowStep[] = [
  { id:"1", label:"Trigger Agent", sublabel:"AI Reply Trigger", color:"#4A46B5", bg:"#EEEDF8", border:"#C8C5F0", icon:<Bot size={15} strokeWidth={1.5}/>,            content:"When lead replies, AI agent takes over the conversation",           live:true  },
  { id:"2", label:"Agent Reply",   sublabel:"WhatsApp Reply",   color:"#1D9E75", bg:"#E1F5EE", border:"#A3DFC8", icon:<MessageCircle size={15} strokeWidth={1.5}/>, content:"AI responds based on lead's message to guide them toward booking",   live:false },
];

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  .lf-card:hover   { box-shadow: 0 8px 32px rgba(0,0,0,.08) !important; }
  .lf-step:hover   { box-shadow: 0 4px 16px rgba(0,0,0,.08) !important; }
  .lf-btn:hover    { opacity: .8; }
  .lf-ghost:hover  { background: #F2F1EE !important; }
  .lf-back:hover   { background: #F2F1EE !important; }
  .style-opt:hover { border-color: #4A46B5 !important; }
  .preview-flow-node:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1) !important; }
  .start-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(26,25,22,.18) !important; }
  .open-btn:hover  { background: #1A1916 !important; color: #fff !important; }
`;

const labelStyle: React.CSSProperties = {
  display:"block", fontSize:9, color:"#8A8680",
  textTransform:"uppercase", letterSpacing:"1px", marginBottom:7, fontWeight:400,
};
const selectStyle: React.CSSProperties = {
  width:"100%", padding:"9px 12px", border:"1px solid #E8E6E0",
  borderRadius:9, fontSize:12, color:"#1A1916", background:"#FFFFFF",
  outline:"none", fontFamily:"'DM Sans',sans-serif", marginBottom:16,
};
const textareaStyle: React.CSSProperties = {
  width:"100%", padding:"10px 12px", border:"1px solid #E8E6E0",
  borderRadius:9, fontSize:11, color:"#1A1916", background:"#F9F9F8",
  outline:"none", resize:"none", lineHeight:1.7,
  fontFamily:"'DM Sans',sans-serif", fontWeight:300, boxSizing:"border-box",
};
const inputStyle: React.CSSProperties = {
  width:"100%", padding:"9px 12px", border:"1px solid #E8E6E0",
  borderRadius:9, fontSize:12, color:"#1A1916", background:"#FFFFFF",
  outline:"none", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box",
};

// ─── Agents ───────────────────────────────────────────────────────────────────

export const BookingAgent = ({ style }: { style?: React.CSSProperties }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      backgroundImage: "url(/booking4.png)",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      ...style,
    }}
  />
);

export const FollowUpAutomation = ({ style }: { style?: React.CSSProperties }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      backgroundImage: "url(/followupautomation.png)",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      ...style,
    }}
  />
);

export const FollowUpAgent = ({ style }: { style?: React.CSSProperties }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      backgroundImage: "url(/followupagent.png)",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      ...style,
    }}
  />
);

export const FollowUpFlow = ({ style }: { style?: React.CSSProperties }) => (
  <div
    style={{
      width: "100%",
      height: "100%",
      backgroundImage: "url(/followup6.png)",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      ...style,
    }}
  />
);

// ─── Interactive Flow Diagram ─────────────────────────────────────────────────

function InteractiveFlowDiagram({ steps }: { steps: FlowStep[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: dragStart.current.ox + (e.clientX - dragStart.current.x), y: dragStart.current.oy + (e.clientY - dragStart.current.y) });
  };
  const onMouseUp = () => setDragging(false);

  return (
    <div style={{ position:"relative", flex:1, background:"#F9F9F8", borderRadius:14, border:"1px solid #E8E6E0", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:12, right:12, zIndex:10, display:"flex", flexDirection:"column", gap:6 }}>
        <button onClick={() => setZoom(z => Math.min(3, z + 1))} style={{ width:30, height:30, borderRadius:8, border:"1px solid #E8E6E0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#8A8680" }}><ZoomIn size={13} /></button>
        <button onClick={() => setZoom(z => Math.max(1, z - 1))} style={{ width:30, height:30, borderRadius:8, border:"1px solid #E8E6E0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#8A8680" }}><ZoomOut size={13} /></button>
        <button onClick={() => { setZoom(1); setOffset({ x:0, y:0 }); }} style={{ width:30, height:30, borderRadius:8, border:"1px solid #E8E6E0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#8A8680" }}><Move size={13} /></button>
      </div>
      <div style={{ position:"absolute", bottom:10, left:12, fontSize:9, color:"#C4C2BC", fontFamily:"'DM Sans',sans-serif", letterSpacing:"0.5px" }}>Drag to pan · +/- to zoom</div>
      <div ref={containerRef} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        style={{ width:"100%", height:"100%", cursor: dragging ? "grabbing" : "grab", userSelect:"none", overflow:"hidden" }}>
        <div style={{ transform:`translate(${offset.x}px, ${offset.y}px)`, paddingTop:24, display:"flex", flexDirection:"column", alignItems:"center", gap:0, width:"100%" }}>
          {steps.map((step, i) => (
            <div key={step.id} style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
              <div className="preview-flow-node" style={{ width: zoom === 1 ? 220 : zoom === 2 ? 280 : 340, padding:"12px 16px", borderRadius:12, border:`1.5px solid ${step.border}`, background: step.bg, transition:"all .15s", display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:30, height:30, borderRadius:8, background:"rgba(255,255,255,.8)", border:`1px solid ${step.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:step.color, flexShrink:0 }}>{step.icon}</div>
                <div>
                  <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize: zoom === 1 ? 12 : 14, color:"#1A1916" }}>{step.label}</div>
                  <div style={{ fontSize: zoom === 1 ? 9 : 11, color:"#8A8680", fontWeight:300, fontStyle:"italic" }}>{step.sublabel}</div>
                </div>
                {step.live && (
                  <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:3, fontSize:8, color:"#1D9E75", background:"#E1F5EE", padding:"2px 7px", borderRadius:20, flexShrink:0 }}>
                    <span style={{ width:4, height:4, borderRadius:"50%", background:"#1D9E75", display:"inline-block" }} />Live
                  </div>
                )}
              </div>
              {i < steps.length - 1 && (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", margin:"2px 0" }}>
                  <div style={{ width:1.5, height:16, background:"#D8D6D0" }} />
                  <div style={{ width:0, height:0, borderLeft:"5px solid transparent", borderRight:"5px solid transparent", borderTop:`6px solid #D8D6D0` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Preview Screen ───────────────────────────────────────────────────────────

interface PreviewConfig {
  title: string; subtitle: string; description: string;
  accentColor: string; accentBg: string;
  stats: { label: string; value: string }[];
  howItWorks: { icon: React.ReactNode; label: string; desc: string }[];
  agent: React.ReactNode; steps: FlowStep[];
  onStart: () => void; onBack: () => void; backLabel: string;
}

function PreviewScreen({ title, subtitle, description, accentColor, accentBg, stats, howItWorks, agent, steps, onStart, onBack, backLabel }: PreviewConfig) {
  return (
    <div style={{ display:"flex", height:"100%", background:"#F9F9F8", fontFamily:"'DM Sans',sans-serif", overflow:"hidden" }}>
      <div style={{ width:360, flexShrink:0, background:"#FFFFFF", borderRight:"1px solid #E8E6E0", display:"flex", flexDirection:"column", overflowY:"auto" }}>
        <div style={{ padding:"24px 28px 0" }}>
          <button className="lf-back" onClick={onBack} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:9, border:"1px solid #E8E6E0", background:"#FFFFFF", fontSize:12, color:"#8A8680", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", marginBottom:24, transition:"background .15s" }}>
            <ArrowLeft size={13} strokeWidth={1.5} /> {backLabel}
          </button>
        </div>
        <div style={{ padding:"0 28px 24px", display:"flex", flexDirection:"column", alignItems:"center", borderBottom:"1px solid #F2F1EE" }}>
          <div style={{ width:"100%", height:240, borderRadius:20, overflow:"hidden", border:`1px solid ${accentColor}22`, marginBottom:20 }}>
            {agent}
          </div>
          <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:20, fontWeight:400, color:"#1A1916", marginBottom:4, textAlign:"center" }}>{title}</div>
          <div style={{ fontSize:11, color:"#8A8680", fontWeight:300, fontStyle:"italic", marginBottom:20, textAlign:"center" }}>{subtitle}</div>
          <div style={{ display:"flex", gap:8, width:"100%" }}>
            {stats.map(s => (
              <div key={s.label} style={{ flex:1, padding:"10px 12px", borderRadius:10, background:"#F9F9F8", border:"1px solid #E8E6E0", textAlign:"center" }}>
                <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:16, color:accentColor, marginBottom:2 }}>{s.value}</div>
                <div style={{ fontSize:9, color:"#8A8680", fontWeight:300, textTransform:"uppercase", letterSpacing:"0.8px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding:"24px 28px", borderBottom:"1px solid #F2F1EE" }}>
          <div style={{ fontSize:9, color:"#8A8680", textTransform:"uppercase", letterSpacing:"1px", fontWeight:400, marginBottom:10 }}>About this flow</div>
          <p style={{ fontSize:12, color:"#4A4845", lineHeight:1.8, fontWeight:300, margin:0 }}>{description}</p>
        </div>
        <div style={{ padding:"24px 28px", flex:1 }}>
          <div style={{ fontSize:9, color:"#8A8680", textTransform:"uppercase", letterSpacing:"1px", fontWeight:400, marginBottom:14 }}>How it works</div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {howItWorks.map((step, i) => (
              <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ width:28, height:28, borderRadius:8, background:accentBg, border:`1px solid ${accentColor}33`, display:"flex", alignItems:"center", justifyContent:"center", color:accentColor, flexShrink:0 }}>{step.icon}</div>
                <div>
                  <div style={{ fontSize:12, fontWeight:500, color:"#1A1916", marginBottom:2 }}>{step.label}</div>
                  <div style={{ fontSize:11, color:"#8A8680", fontWeight:300, lineHeight:1.6 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding:"20px 28px 28px" }}>
          <button className="start-btn" onClick={onStart} style={{ width:"100%", padding:"13px", borderRadius:11, border:"none", background:"#1A1916", color:"#fff", fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:500, transition:"all .2s", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            Start Configuration <ChevronRight size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
      <div style={{ flex:1, padding:"32px 36px", display:"flex", flexDirection:"column", gap:16, overflow:"hidden" }}>
        <div>
          <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:17, fontWeight:400, color:"#1A1916", marginBottom:4 }}>Flow Preview</div>
          <div style={{ fontSize:11, color:"#8A8680", fontWeight:300, fontStyle:"italic" }}>Interactive — drag to pan, scroll to zoom</div>
        </div>
        <InteractiveFlowDiagram steps={steps} />
      </div>
    </div>
  );
}

// ─── Panels ───────────────────────────────────────────────────────────────────

function InfoBanner({ text }: { text: string }) {
  return (
    <div style={{ padding:"10px 12px", borderRadius:9, background:"#F7F6F3", border:"1px solid #E8E6E0", fontSize:11, color:"#8A8680", lineHeight:1.6, fontWeight:300, marginBottom:18, fontStyle:"italic" }}>{text}</div>
  );
}

function SaveBtn({ label, icon, onClick, saving, saved }: { label: string; icon?: React.ReactNode; onClick: () => void; saving: boolean; saved: boolean }) {
  return (
    <button className="lf-btn" onClick={onClick} disabled={saving} style={{ width:"100%", padding:"11px", borderRadius:9, border:"none", background: saved ? "#1D9E75" : "#1A1916", color:"#fff", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .2s", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
      {saving ? <Loader2 size={13} strokeWidth={2} style={{ animation:"spin 1s linear infinite" }} /> : saved ? <Check size={13} strokeWidth={2.5} /> : icon}
      {saving ? "Saving..." : saved ? "Saved!" : label}
    </button>
  );
}

function BackBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="lf-back" onClick={onClick} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:9, border:"1px solid #E8E6E0", background:"#FFFFFF", fontSize:12, color:"#8A8680", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", marginBottom:28, transition:"background .15s" }}>
      <ArrowLeft size={13} strokeWidth={1.5} /> {label}
    </button>
  );
}

interface PanelProps {
  config: AutomationConfig;
  onChange: (key: keyof AutomationConfig, value: string | string[]) => void;
  onSave: () => void; saving: boolean; saved: boolean;
}

function TriggerPanel({ config, onChange, onSave, saving, saved }: PanelProps) {
  return (
    <>
      <InfoBanner text="Connect your WhatsApp Business account so LeadFlow can receive messages from your leads." />
      <div style={{ marginBottom:14 }}><label style={labelStyle}>Client ID</label><input value={config.wa_client_id} onChange={e => onChange("wa_client_id", e.target.value)} placeholder="e.g. 1234567890" style={inputStyle} /></div>
      <div style={{ marginBottom:14 }}><label style={labelStyle}>Client Secret</label><input type="password" value={config.wa_client_secret} onChange={e => onChange("wa_client_secret", e.target.value)} placeholder="e.g. EAAxxxxxxxx..." style={inputStyle} /></div>
      <SaveBtn label="Connect" icon={<Wifi size={13} strokeWidth={1.5} />} onClick={onSave} saving={saving} saved={saved} />
    </>
  );
}

function TypingPanel({ config, onChange, onSave, saving, saved }: PanelProps) {
  return (
    <>
      <InfoBanner text="Makes your AI agent show a typing indicator before replying — so leads feel like they're talking to a real person." />
      <div style={{ marginBottom:14 }}><label style={labelStyle}>WhatsApp Access Token</label><input type="password" value={config.wa_access_token} onChange={e => onChange("wa_access_token", e.target.value)} placeholder="EAAxxxxxxxx..." style={inputStyle} /></div>
      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>Typing Duration</label>
        <select value={config.typing_duration} onChange={e => onChange("typing_duration", e.target.value)} style={selectStyle}>
          <option>1 second</option><option>2 seconds</option><option>3 seconds</option><option>5 seconds</option>
        </select>
      </div>
      <SaveBtn label="Save Changes" onClick={onSave} saving={saving} saved={saved} />
    </>
  );
}

function AgentPanel({ config, onChange, onSave, saving, saved }: PanelProps) {
  const styles = [
    { key:"Professional",    msg:"Thank you for reaching out. We've received your request and a member of our team will be in touch with you shortly." },
    { key:"Friendly & Warm", msg:"Hey! Thanks for contacting us 😊 We got your message and we'll get back to you very soon!" },
    { key:"Casual & Direct", msg:"Got it! We'll hit you back shortly 👍" },
    { key:"Formal",          msg:"Dear client, we acknowledge receipt of your inquiry and will respond within the shortest possible delay. Thank you for your patience." },
  ];
  return (
    <>
      <InfoBanner text="Set your agent's name and choose the writing style that best represents how you communicate with leads." />
      <div style={{ marginBottom:14 }}><label style={labelStyle}>Agent Name</label><input value={config.agent_name} onChange={e => onChange("agent_name", e.target.value)} placeholder="e.g. Sarah, Alex, Max..." style={inputStyle} /></div>
      <div style={{ marginBottom:20 }}>
        <label style={labelStyle}>Writing Style</label>
        <p style={{ fontSize:10, color:"#8A8680", fontWeight:300, marginBottom:10, fontStyle:"italic" }}>Pick the style that best matches how you talk to your leads:</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {styles.map((s) => (
            <div key={s.key} className="style-opt" onClick={() => onChange("writing_style", s.key)} style={{ padding:"11px 13px", borderRadius:10, cursor:"pointer", transition:"all .15s", border:`1.5px solid ${config.writing_style === s.key ? "#4A46B5" : "#E8E6E0"}`, background: config.writing_style === s.key ? "#EEEDF8" : "#FAFAF9" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:10, fontWeight:500, color: config.writing_style === s.key ? "#4A46B5" : "#8A8680", textTransform:"uppercase", letterSpacing:"0.8px" }}>{s.key}</span>
                {config.writing_style === s.key && <Check size={11} strokeWidth={2.5} color="#4A46B5" />}
              </div>
              <p style={{ fontSize:11, color:"#1A1916", fontWeight:300, lineHeight:1.6, margin:0 }}>{s.msg}</p>
            </div>
          ))}
        </div>
      </div>
      <SaveBtn label="Save Changes" onClick={onSave} saving={saving} saved={saved} />
    </>
  );
}

function Script1Panel({ config, onChange, onSave, saving, saved }: PanelProps) {
  return (
    <>
      <InfoBanner text="This script was auto-filled from your onboarding info. Review it and adjust anything that doesn't feel right." />
      <div style={{ marginBottom:16 }}><label style={labelStyle}>Script Preview</label><textarea value={config.script1_text} onChange={e => onChange("script1_text", e.target.value)} style={{ ...textareaStyle, height:220 }} /></div>
      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>Variables — confirm or correct</label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { key:"script1_service",     label:"[SERVICE]",            placeholder:"e.g. home cleaning, coaching..." },
            { key:"script1_end_result",  label:"[DESIRED END RESULT]", placeholder:"e.g. a spotless home every week" },
            { key:"script1_category",    label:"[CATEGORY]",           placeholder:"e.g. professional cleaning services" },
            { key:"script1_deliverable", label:"[DELIVERABLE]",        placeholder:"e.g. your free guide" },
            { key:"script1_outcome",     label:"[OUTCOME]",            placeholder:"e.g. how to get started today" },
          ].map(f => (
            <div key={f.key} style={{ display:"flex", flexDirection:"column", gap:3 }}>
              <span style={{ fontSize:9, color:"#4A46B5", fontWeight:500, letterSpacing:"0.5px", textTransform:"uppercase" }}>{f.label}</span>
              <input value={(config as any)[f.key]} onChange={e => onChange(f.key as keyof AutomationConfig, e.target.value)} placeholder={f.placeholder} style={{ ...inputStyle, fontSize:11, padding:"8px 10px", borderRadius:8 }} />
            </div>
          ))}
        </div>
      </div>
      <SaveBtn label="Save Changes" onClick={onSave} saving={saving} saved={saved} />
    </>
  );
}

function LeadMagnetPanel({ config, onChange, onSave, saving, saved }: PanelProps) {
  return (
    <>
      <InfoBanner text="Paste the link to your lead magnet — this is what gets sent to the lead automatically after Script 1." />
      <div style={{ marginBottom:14 }}><label style={labelStyle}>Lead Magnet Link</label><input value={config.lead_magnet_link} onChange={e => onChange("lead_magnet_link", e.target.value)} placeholder="https://..." style={inputStyle} /></div>
      <p style={{ fontSize:10, color:"#8A8680", fontWeight:300, marginBottom:20, lineHeight:1.6 }}>Can be a PDF, video, Google Doc, Notion page, or any link. Make sure it's publicly accessible.</p>
      <SaveBtn label="Save Changes" icon={<Link size={13} strokeWidth={1.5} />} onClick={onSave} saving={saving} saved={saved} />
    </>
  );
}

function Script2Panel({ config, onChange, onSave, saving, saved }: PanelProps) {
  return (
    <>
      <InfoBanner text="This script was auto-filled from your onboarding info. Review it and adjust anything that doesn't feel right." />
      <div style={{ marginBottom:16 }}><label style={labelStyle}>Script Preview</label><textarea value={config.script2_text} onChange={e => onChange("script2_text", e.target.value)} style={{ ...textareaStyle, height:220 }} /></div>
      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>Variables — confirm or correct</label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[
            { key:"script2_call_duration", label:"[X] — Call duration", placeholder:"e.g. 20" },
            { key:"script2_booking_link",  label:"[BOOKING LINK]",      placeholder:"https://cal.com/..." },
          ].map(f => (
            <div key={f.key} style={{ display:"flex", flexDirection:"column", gap:3 }}>
              <span style={{ fontSize:9, color:"#4A46B5", fontWeight:500, letterSpacing:"0.5px", textTransform:"uppercase" }}>{f.label}</span>
              <input value={(config as any)[f.key]} onChange={e => onChange(f.key as keyof AutomationConfig, e.target.value)} placeholder={f.placeholder} style={{ ...inputStyle, fontSize:11, padding:"8px 10px", borderRadius:8 }} />
            </div>
          ))}
        </div>
      </div>
      <SaveBtn label="Save Changes" onClick={onSave} saving={saving} saved={saved} />
    </>
  );
}

function BookingPanel({ config, onChange, onSave, saving, saved }: PanelProps) {
  const allDays = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const toggleDay = (day: string) => {
    const current = config.booking_days || [];
    const updated = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
    onChange("booking_days", updated as any);
  };
  return (
    <>
      <InfoBanner text="Customise your booking form — this is what leads see when they click your booking link." />
      <div style={{ marginBottom:14 }}><label style={labelStyle}>Event Name</label><input value={config.booking_event_name} onChange={e => onChange("booking_event_name", e.target.value)} placeholder="e.g. Free Strategy Call, Discovery Call..." style={inputStyle} /></div>
      <div style={{ marginBottom:14 }}><label style={labelStyle}>Host Name</label><input value={config.booking_host} onChange={e => onChange("booking_host", e.target.value)} placeholder="e.g. John from CleanCo" style={inputStyle} /></div>
      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>Call Duration</label>
        <select value={config.booking_duration} onChange={e => onChange("booking_duration", e.target.value)} style={selectStyle}>
          {["15 minutes","20 minutes","30 minutes","45 minutes","60 minutes"].map(o => <option key={o}>{o}</option>)}
        </select>
      </div>
      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>Available Days</label>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {allDays.map(day => (
            <div key={day} onClick={() => toggleDay(day)} style={{ padding:"6px 12px", borderRadius:8, border:`1.5px solid ${(config.booking_days||[]).includes(day) ? "#4A46B5" : "#E8E6E0"}`, background: (config.booking_days||[]).includes(day) ? "#EEEDF8" : "#FAFAF9", fontSize:11, color: (config.booking_days||[]).includes(day) ? "#4A46B5" : "#8A8680", cursor:"pointer", fontWeight: (config.booking_days||[]).includes(day) ? 500 : 300, transition:"all .15s" }}>{day}</div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom:20 }}>
        <label style={labelStyle}>Available Hours</label>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <select value={config.booking_hours_from} onChange={e => onChange("booking_hours_from", e.target.value)} style={{ ...selectStyle, flex:1, marginBottom:0 }}>
            {["8:00","9:00","10:00","11:00","12:00","13:00","14:00"].map(h => <option key={h}>{h}</option>)}
          </select>
          <span style={{ fontSize:11, color:"#8A8680" }}>to</span>
          <select value={config.booking_hours_to} onChange={e => onChange("booking_hours_to", e.target.value)} style={{ ...selectStyle, flex:1, marginBottom:0 }}>
            {["15:00","16:00","17:00","18:00","19:00","20:00","21:00"].map(h => <option key={h}>{h}</option>)}
          </select>
        </div>
      </div>
      <SaveBtn label="Save Changes" onClick={onSave} saving={saving} saved={saved} />
    </>
  );
}

function ReplyNodePanel({ config, onChange, onSave, saving, saved }: PanelProps) {
  return (
    <>
      <InfoBanner text="Connect your WhatsApp to allow LeadFlow to send messages to your leads automatically." />
      <div style={{ marginBottom:14 }}><label style={labelStyle}>WhatsApp Access Token</label><input type="password" value={config.wa_access_token} onChange={e => onChange("wa_access_token", e.target.value)} placeholder="EAAxxxxxxxx..." style={inputStyle} /></div>
      <div style={{ marginBottom:14 }}><label style={labelStyle}>Business Account ID</label><input value={config.wa_business_account_id} onChange={e => onChange("wa_business_account_id", e.target.value)} placeholder="e.g. 1408732614201335" style={inputStyle} /></div>
      <SaveBtn label="Connect" icon={<Wifi size={13} strokeWidth={1.5} />} onClick={onSave} saving={saving} saved={saved} />
    </>
  );
}

function RightPanel({ step, config, onChange, onSave, saving, saved }: { step: FlowStep; config: AutomationConfig; onChange: (key: keyof AutomationConfig, value: string | string[]) => void; onSave: () => void; saving: boolean; saved: boolean }) {
  return (
    <div style={{ width:440, flexShrink:0, background:"#FFFFFF", borderLeft:"1px solid #E8E6E0", padding:"28px 26px", overflowY:"auto", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:14, fontWeight:400, color:"#1A1916", marginBottom:3 }}>{step.label} Settings</div>
        <div style={{ fontSize:11, color:"#8A8680", fontWeight:300, fontStyle:"italic" }}>Configure this step</div>
      </div>
      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>Step Type</label>
        <div style={{ padding:"9px 12px", borderRadius:9, border:`1px solid ${step.border}`, background:step.bg, fontSize:12, color:step.color, display:"flex", alignItems:"center", gap:8 }}>
          <span>{step.icon}</span><span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:400 }}>{step.sublabel}</span>
        </div>
      </div>
      {step.type === "trigger"    && <TriggerPanel    config={config} onChange={onChange} onSave={onSave} saving={saving} saved={saved} />}
      {step.type === "typing"     && <TypingPanel     config={config} onChange={onChange} onSave={onSave} saving={saving} saved={saved} />}
      {step.type === "agent"      && <AgentPanel      config={config} onChange={onChange} onSave={onSave} saving={saving} saved={saved} />}
      {step.type === "script1"    && <Script1Panel    config={config} onChange={onChange} onSave={onSave} saving={saving} saved={saved} />}
      {step.type === "leadmagnet" && <LeadMagnetPanel config={config} onChange={onChange} onSave={onSave} saving={saving} saved={saved} />}
      {step.type === "script2"    && <Script2Panel    config={config} onChange={onChange} onSave={onSave} saving={saving} saved={saved} />}
      {step.type === "booking"    && <BookingPanel    config={config} onChange={onChange} onSave={onSave} saving={saving} saved={saved} />}
      {step.type === "replynode"  && <ReplyNodePanel  config={config} onChange={onChange} onSave={onSave} saving={saving} saved={saved} />}
      {!step.type && (
        <>
          <div style={{ marginBottom:16 }}><label style={labelStyle}>Message / Content</label><textarea defaultValue={step.content} style={{ ...textareaStyle, height:100 }} /></div>
          <div style={{ marginBottom:20 }}><label style={labelStyle}>Send Delay</label><select style={selectStyle}><option>Immediately</option><option>After 5 minutes</option><option>After 1 hour</option><option>After 24 hours</option></select></div>
          <SaveBtn label="Save Changes" onClick={onSave} saving={saving} saved={saved} />
        </>
      )}
    </div>
  );
}

// ─── Flow Editor ──────────────────────────────────────────────────────────────

function FlowEditor({ title, subtitle, steps, onBack, backLabel = "Back", config, onChange, onSave, onPublish, saving, saved, publishing, publishDone }: {
  title: string; subtitle: string; steps: FlowStep[]; onBack: () => void; backLabel?: string;
  config: AutomationConfig; onChange: (key: keyof AutomationConfig, value: string | string[]) => void;
  onSave: () => void; onPublish: () => void; saving: boolean; saved: boolean; publishing: boolean; publishDone: boolean;
}) {
  const [selected, setSelected] = useState<string>(steps[0].id);
  const selectedStep = steps.find(s => s.id === selected)!;
  return (
    <div style={{ display:"flex", height:"100%", background:"#F9F9F8", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ flex:1, padding:"32px 40px", overflowY:"auto" }}>
        <BackBtn label={backLabel} onClick={onBack} />
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:32 }}>
          <div>
            <h1 style={{ fontFamily:"'Libre Baskerville',serif", fontSize:22, fontWeight:400, color:"#1A1916", letterSpacing:"-0.4px", marginBottom:4 }}>{title}</h1>
            <p style={{ fontSize:12, color:"#8A8680", fontWeight:300, fontStyle:"italic" }}>{subtitle}</p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="lf-ghost" style={{ padding:"8px 16px", borderRadius:9, border:"1px solid #E8E6E0", background:"#FFFFFF", fontSize:12, color:"#8A8680", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"background .15s" }}>Test Flow</button>
            <button className="lf-btn" onClick={onPublish} disabled={publishing} style={{ padding:"8px 18px", borderRadius:9, border:"none", background: publishDone ? "#1D9E75" : "#1A1916", fontSize:12, color:"#fff", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .2s", display:"flex", alignItems:"center", gap:6 }}>
              {publishing ? <Loader2 size={13} strokeWidth={2} style={{ animation:"spin 1s linear infinite" }} /> : publishDone ? <Check size={13} strokeWidth={2.5} /> : null}
              {publishing ? "Publishing..." : publishDone ? "Published!" : "Publish"}
            </button>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", maxWidth:520, margin:"0 auto" }}>
          {steps.map((step, i) => (
            <div key={step.id} style={{ display:"flex", flexDirection:"column", alignItems:"center", width:"100%" }}>
              <div className="lf-step" onClick={() => setSelected(step.id)} style={{ width:"100%", padding:"16px 18px", borderRadius:14, border:`1.5px solid ${selected === step.id ? step.color : step.border}`, background: selected === step.id ? step.bg : "#FFFFFF", cursor:"pointer", transition:"all .18s", boxShadow: selected === step.id ? `0 6px 20px ${step.color}18` : "0 1px 4px rgba(0,0,0,.05)", position:"relative", overflow:"hidden" }}>
                {step.live && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:step.color, borderRadius:"14px 14px 0 0" }} />}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:9, background: selected === step.id ? "rgba(255,255,255,.7)" : step.bg, border:`1px solid ${step.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:step.color }}>{step.icon}</div>
                    <div>
                      <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:13, fontWeight:400, color:"#1A1916" }}>{step.label}</div>
                      <div style={{ fontSize:10, color:"#8A8680", fontWeight:300, fontStyle:"italic" }}>{step.sublabel}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    {step.live ? (
                      <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:9, fontWeight:500, color:"#1D9E75", background:"#E1F5EE", padding:"3px 9px", borderRadius:20 }}>
                        <span style={{ width:5, height:5, borderRadius:"50%", background:"#1D9E75", display:"inline-block" }} />Live
                      </div>
                    ) : (
                      <div style={{ fontSize:9, fontWeight:400, color:"#8A8680", background:"#F2F1EE", padding:"3px 9px", borderRadius:20 }}>Draft</div>
                    )}
                    <Settings size={13} strokeWidth={1.5} color="#C4C2BC" />
                  </div>
                </div>
                <div style={{ marginTop:9, fontSize:11, color:"#8A8680", lineHeight:1.6, paddingLeft:42, fontWeight:300 }}>{step.content}</div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", margin:"3px 0" }}>
                  <div style={{ width:1.5, height:18, background:"#E8E6E0" }} />
                  <div style={{ width:20, height:20, borderRadius:"50%", border:"1.5px solid #E8E6E0", background:"#FFFFFF", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#C4C2BC" }}><Plus size={11} strokeWidth={1.5} /></div>
                  <div style={{ width:1.5, height:18, background:"#E8E6E0" }} />
                </div>
              )}
            </div>
          ))}
          <button className="lf-ghost" style={{ marginTop:14, display:"flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:10, border:"1.5px dashed #D8D6D0", background:"#FFFFFF", fontSize:11, fontWeight:400, color:"#8A8680", cursor:"pointer", width:"100%", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", transition:"background .15s" }}>
            <Plus size={13} strokeWidth={1.5} /> Add Step
          </button>
        </div>
      </div>
      <RightPanel step={selectedStep} config={config} onChange={onChange} onSave={onSave} saving={saving} saved={saved} />
    </div>
  );
}

// ─── Choice Card ──────────────────────────────────────────────────────────────

function ChoiceCard({ color, accentBg, title, description, bullets, agent, tag, onClick }: {
  color: string; accentBg: string; title: string; description: string;
  bullets: string[]; agent: React.ReactNode; tag: string; onClick: () => void;
}) {
  return (
    <div className="lf-card" onClick={onClick} style={{ background:"#FFFFFF", border:"1px solid #E8E6E0", borderRadius:16, cursor:"pointer", transition:"box-shadow .2s", flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ height:340, overflow:"hidden", flexShrink:0 }}>
        {agent}
      </div>
      <div style={{ padding:"28px 24px", display:"flex", flexDirection:"column", flex:1, justifyContent:"space-between" }}>
        <div>
          <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:18, fontWeight:400, color:"#1A1916", marginBottom:8 }}>{title}</div>
          <div style={{ fontSize:11, color:"#8A8680", fontWeight:300, lineHeight:1.6, marginBottom:18 }}>{description}</div>
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            {bullets.map(b => (
              <div key={b} style={{ display:"flex", alignItems:"flex-start", gap:9 }}>
                <div style={{ width:14, height:14, borderRadius:3, background:`${color}15`, border:`1px solid ${color}30`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1.5 }}>
                  <Check size={8} strokeWidth={2.5} color={color} />
                </div>
                <span style={{ fontSize:11, color:"#4A4845", fontWeight:300, fontFamily:"'DM Sans',sans-serif", lineHeight:1.5 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:12, color, fontWeight:500, fontFamily:"'DM Sans',sans-serif", cursor:"pointer", marginTop:16 }}>
          Open Flow <ChevronRight size={13} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────
function HomeScreen({ onSelect }: { onSelect: (v: View) => void }) {
  return (
    <div style={{ padding:"40px 48px", background:"#F9F9F8", minHeight:"100vh", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ marginBottom:36 }}>
        <h1 style={{ fontFamily:"'Libre Baskerville',serif", fontSize:26, fontWeight:400, color:"#1A1916", letterSpacing:"-0.5px", marginBottom:6 }}>Lead Flow</h1>
        <p style={{ fontSize:13, color:"#8A8680", fontWeight:300, fontStyle:"italic" }}>Choose your automation flow to configure</p>
      </div>
      {/* Banner */}
      <div style={{ width:"100%", borderRadius:16, overflow:"hidden", marginBottom:32, maxHeight:260 }}>
        <img src="/banner6.png" alt="To the moon" style={{ width:"100%", height:"100%", display:"block", objectFit:"cover", objectPosition:"center" }} />
      </div>
      <div style={{ display:"flex", gap:24, maxWidth:860 }}>
        <ChoiceCard
          color="#4A46B5" accentBg="#EEEDF8" title="Lead Flow"
          description="Set up the full sequence that greets every lead, delivers your lead magnet, and books the call — on autopilot."
          bullets={["Greets every lead instantly, 24/7","Sends your lead magnet automatically","Books calls while you sleep"]}
          agent={<BookingAgent />} tag="8 steps"
          onClick={() => onSelect("lead-flow-preview")}
        />
        <ChoiceCard
          color="#1D9E75" accentBg="#E1F5EE" title="Follow-Up Flow"
          description="Configure agents that re-engage leads after booking and confirm calls to maximise show-up rates."
          bullets={["Re-engages leads after booking automatically","Confirms bookings to maximise show-ups","AI handles replies intelligently"]}
          agent={<FollowUpFlow />} tag="2 flows"
          onClick={() => onSelect("followup-home")}
        />
      </div>
    </div>
  );
}
// ─── Follow-Up Home ───────────────────────────────────────────────────────────

function FollowUpHome({ onSelect, onBack }: { onSelect: (v: View) => void; onBack: () => void }) {
  return (
    <div style={{ padding:"40px 48px", background:"#F9F9F8", minHeight:"100vh", fontFamily:"'DM Sans',sans-serif" }}>
      <BackBtn label="Back to Lead Flow" onClick={onBack} />
      <div style={{ marginBottom:36 }}>
        <h1 style={{ fontFamily:"'Libre Baskerville',serif", fontSize:26, fontWeight:400, color:"#1A1916", letterSpacing:"-0.5px", marginBottom:6 }}>Follow-Up Flow</h1>
        <p style={{ fontSize:13, color:"#8A8680", fontWeight:300, fontStyle:"italic" }}>Choose how you want to re-engage your leads</p>
      </div>
      <div style={{ display:"flex", gap:24, maxWidth:860 }}>
        <ChoiceCard
          color="#BA7517" accentBg="#FDF3E1" title="Follow-Up Automation"
          description="Send scheduled follow-up messages at the perfect time. Choose your delay and let it run automatically."
          bullets={["Fires automatically at the right time","Re-engages leads with personalised messages","Zero manual work required"]}
          agent={<FollowUpAutomation />} tag="Scheduled"
          onClick={() => onSelect("followup-automation-preview")}
        />
        <ChoiceCard
          color="#378ADD" accentBg="#E6F1FB" title="Follow-Up Agent"
          description="AI agent takes over when a lead replies — responding intelligently to guide them toward booking."
          bullets={["AI takes over when a lead replies","Responds intelligently every time","Guides leads toward booking automatically"]}
          agent={<FollowUpAgent />} tag="AI"
          onClick={() => onSelect("followup-agent-preview")}
        />
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function LeadFlowScreen() {
  const [view, setView] = useState<View>("home");
  const [config, setConfig] = useState<AutomationConfig>(EMPTY_CONFIG);
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishDone, setPublishDone] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      setUserId(session.user.id);
      const { data } = await supabase.from("account_leadflow_automations").select("*").eq("user_id", session.user.id).maybeSingle();
      if (data) {
        setConfig(prev => ({ ...prev, ...Object.fromEntries(Object.keys(EMPTY_CONFIG).map(k => [k, (data as any)[k] ?? (EMPTY_CONFIG as any)[k]])) }));
      }
    };
    load();
  }, []);

  const onChange = useCallback((key: keyof AutomationConfig, value: string | string[]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }, []);

  const onSave = async () => {
    if (!userId) return;
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
    if (!userId) return;
    setPublishing(true);
    await supabase.from("account_leadflow_automations").upsert({ user_id: userId, ...config }, { onConflict: "user_id" });
    const { data: onboarding } = await supabase.from("accounts_leadflow").select("*").eq("user_id", userId).maybeSingle();
    try {
      await fetch(N8N_WEBHOOK, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ user_id: userId, onboarding: onboarding || {}, automation: config, published_at: new Date().toISOString() }) });
      setPublishDone(true);
      setTimeout(() => setPublishDone(false), 3000);
    } catch (e) { console.error("Webhook error:", e); }
    setPublishing(false);
  };

  const editorProps = { config, onChange, onSave, onPublish, saving, saved, publishing, publishDone };

  const leadHowItWorks = [
    { icon:<Wifi size={13} strokeWidth={1.5}/>,         label:"Connect WhatsApp",  desc:"Link your WhatsApp Business account as the trigger for all incoming leads." },
    { icon:<Bot size={13} strokeWidth={1.5}/>,           label:"AI Agent greets",   desc:"Your agent sends a human-like welcome, qualifies the lead with Script 1." },
    { icon:<Gift size={13} strokeWidth={1.5}/>,          label:"Lead Magnet sent",  desc:"The lead magnet link is delivered automatically after qualification." },
    { icon:<Calendar size={13} strokeWidth={1.5}/>,      label:"Booking confirmed", desc:"Script 2 follows up and guides the lead to book a call automatically." },
  ];
  const followupAutoHowItWorks = [
    { icon:<Clock size={13} strokeWidth={1.5}/>,         label:"Scheduled trigger", desc:"Set a delay and the flow fires automatically at the right time." },
    { icon:<MessageSquare size={13} strokeWidth={1.5}/>, label:"Re-engage message", desc:"A personalised follow-up message is sent to bring the lead back." },
  ];
  const followupAgentHowItWorks = [
    { icon:<Bot size={13} strokeWidth={1.5}/>,           label:"Lead replies",      desc:"When a lead replies, the AI agent takes over the conversation instantly." },
    { icon:<MessageCircle size={15} strokeWidth={1.5}/>, label:"AI responds",       desc:"The agent replies intelligently based on the lead's message to push toward booking." },
  ];

  const bookingAgentFull = (
    <div style={{ width:"100%", height:"100%" }}><BookingAgent /></div>
  );
  const followUpAutomationFull = (
    <div style={{ width:"100%", height:"100%" }}><FollowUpAutomation /></div>
  );
  const followUpAgentFull = (
    <div style={{ width:"100%", height:"100%" }}><FollowUpAgent /></div>
  );

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ height:"100%", display:"flex", flexDirection:"column" }}>

        {view === "home" && <HomeScreen onSelect={setView} />}

        {view === "lead-flow-preview" && (
          <PreviewScreen
            title="Lead Flow" subtitle="Your main lead automation sequence"
            description="Set up the full sequence that greets every lead, qualifies them, delivers your lead magnet, and books the call — completely on autopilot. Your agent handles everything so you don't have to."
            accentColor="#4A46B5" accentBg="#EEEDF8"
            stats={[{ label:"Steps", value:"8" }, { label:"Automated", value:"100%" }, { label:"Channel", value:"WA" }]}
            howItWorks={leadHowItWorks} agent={bookingAgentFull} steps={LEAD_FLOW_STEPS}
            onStart={() => setView("lead-flow")} onBack={() => setView("home")} backLabel="Back to Lead Flow"
          />
        )}

        {view === "lead-flow" && (
          <FlowEditor title="Lead Flow" subtitle="Your main lead automation sequence" steps={LEAD_FLOW_STEPS} onBack={() => setView("lead-flow-preview")} backLabel="Back to Preview" {...editorProps} />
        )}

        {view === "followup-home" && <FollowUpHome onSelect={setView} onBack={() => setView("home")} />}

        {view === "followup-automation-preview" && (
          <PreviewScreen
            title="Follow-Up Automation" subtitle="Scheduled time-based follow-up messages"
            description="Send perfectly timed follow-up messages to leads who haven't responded. Set your delay once and let the automation re-engage them automatically — no manual work needed."
            accentColor="#BA7517" accentBg="#FDF3E1"
            stats={[{ label:"Steps", value:"2" }, { label:"Type", value:"Auto" }, { label:"Channel", value:"WA" }]}
            howItWorks={followupAutoHowItWorks} agent={followUpAutomationFull} steps={FOLLOWUP_AUTO_STEPS}
            onStart={() => setView("followup-automation")} onBack={() => setView("followup-home")} backLabel="Back to Follow-Up Flow"
          />
        )}

        {view === "followup-automation" && (
          <FlowEditor title="Follow-Up Automation" subtitle="Scheduled time-based follow-up messages" steps={FOLLOWUP_AUTO_STEPS} onBack={() => setView("followup-automation-preview")} backLabel="Back to Preview" {...editorProps} />
        )}

        {view === "followup-agent-preview" && (
          <PreviewScreen
            title="Follow-Up Agent" subtitle="AI agent replies to re-engage your leads"
            description="When a lead replies, your AI agent takes over instantly — responding intelligently based on the conversation to guide them toward booking a call with you."
            accentColor="#378ADD" accentBg="#E6F1FB"
            stats={[{ label:"Steps", value:"2" }, { label:"Type", value:"AI" }, { label:"Channel", value:"WA" }]}
            howItWorks={followupAgentHowItWorks} agent={followUpAgentFull} steps={FOLLOWUP_AGENT_STEPS}
            onStart={() => setView("followup-agent")} onBack={() => setView("followup-home")} backLabel="Back to Follow-Up Flow"
          />
        )}

        {view === "followup-agent" && (
          <FlowEditor title="Follow-Up Agent" subtitle="AI agent replies to re-engage your leads" steps={FOLLOWUP_AGENT_STEPS} onBack={() => setView("followup-agent-preview")} backLabel="Back to Preview" {...editorProps} />
        )}

      </div>
    </>
  );
}
