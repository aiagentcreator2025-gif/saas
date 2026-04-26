import { useState } from "react";
import {
  Plus, Settings, Zap, MessageSquare, Gift, Phone,
  Calendar, ArrowLeft, Clock, Bot, MessageCircle, ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type View =
  | "home"
  | "lead-flow"
  | "followup-home"
  | "followup-automation"
  | "followup-agent";

interface FlowStep {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  content: string;
  live: boolean;
  type?: "reply";
}

// ─── Flow Data ────────────────────────────────────────────────────────────────

const LEAD_FLOW_STEPS: FlowStep[] = [
  { id:"1", label:"Trigger",      sublabel:"WhatsApp Connection", color:"#4A46B5", bg:"#EEEDF8", border:"#C8C5F0", icon:<Zap size={15} strokeWidth={1.5}/>,            content:"When a new lead messages on WhatsApp",                                      live:true  },
  { id:"2", label:"Script 1",     sublabel:"Welcome Message",     color:"#378ADD", bg:"#E6F1FB", border:"#B3D4F5", icon:<MessageSquare size={15} strokeWidth={1.5}/>,  content:"Hello {name}! Welcome to our service. Let me send you something valuable...", live:true  },
  { id:"3", label:"Lead Magnet",  sublabel:"Send Resource",       color:"#1D9E75", bg:"#E1F5EE", border:"#A3DFC8", icon:<Gift size={15} strokeWidth={1.5}/>,            content:"Sending free guide: '5 Ways to Grow Your Business in 2025'",               live:true  },
  { id:"4", label:"Script 2",     sublabel:"Closing Message",     color:"#BA7517", bg:"#FDF3E1", border:"#F0D09A", icon:<Phone size={15} strokeWidth={1.5}/>,           content:"Did you get a chance to check it out? I'd love to show you how we can help...", live:false },
  { id:"5", label:"Booking",      sublabel:"Schedule Call",       color:"#D85A30", bg:"#FBEEE8", border:"#F0B99A", icon:<Calendar size={15} strokeWidth={1.5}/>,        content:"Here's my calendar link to book a free strategy call:",                    live:false },
  { id:"6", label:"Reply Node",   sublabel:"WhatsApp Reply",      color:"#1D9E75", bg:"#E1F5EE", border:"#A3DFC8", icon:<MessageCircle size={15} strokeWidth={1.5}/>,  content:"Great! Your call is confirmed. We'll send you a reminder 1 hour before.", live:false, type:"reply" },
];

const FOLLOWUP_AUTO_STEPS: FlowStep[] = [
  { id:"1", label:"Scheduled Trigger", sublabel:"Time-based Send",  color:"#4A46B5", bg:"#EEEDF8", border:"#C8C5F0", icon:<Clock size={15} strokeWidth={1.5}/>,           content:"Send follow-up after: 1 day",         live:true  },
  { id:"2", label:"Follow-Up Message", sublabel:"Re-engage Lead",   color:"#378ADD", bg:"#E6F1FB", border:"#B3D4F5", icon:<MessageSquare size={15} strokeWidth={1.5}/>,  content:"Hey {name}, just checking in! Did you get a chance to look at what I sent?", live:false },
];

const FOLLOWUP_AGENT_STEPS: FlowStep[] = [
  { id:"1", label:"Trigger Agent",  sublabel:"AI Reply Trigger",   color:"#4A46B5", bg:"#EEEDF8", border:"#C8C5F0", icon:<Bot size={15} strokeWidth={1.5}/>,             content:"When lead replies, AI agent takes over the conversation", live:true  },
  { id:"2", label:"Agent Reply",    sublabel:"WhatsApp Reply",     color:"#1D9E75", bg:"#E1F5EE", border:"#A3DFC8", icon:<MessageCircle size={15} strokeWidth={1.5}/>,  content:"AI responds based on lead's message to guide them toward booking", live:false },
];

// ─── Shared Styles ────────────────────────────────────────────────────────────

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  .lf-card:hover   { box-shadow: 0 8px 32px rgba(0,0,0,.10) !important; transform: translateY(-2px); }
  .lf-step:hover   { box-shadow: 0 4px 16px rgba(0,0,0,.08) !important; }
  .lf-btn:hover    { opacity: .8; }
  .lf-ghost:hover  { background: #F2F1EE !important; }
  .lf-back:hover   { background: #F2F1EE !important; }
`;

// ─── Back Button ──────────────────────────────────────────────────────────────

function BackBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="lf-back" onClick={onClick} style={{
      display:"flex", alignItems:"center", gap:6, padding:"7px 14px",
      borderRadius:9, border:"1px solid #E8E6E0", background:"#FFFFFF",
      fontSize:12, color:"#8A8680", cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
      marginBottom:28, transition:"background .15s",
    }}>
      <ArrowLeft size={13} strokeWidth={1.5} /> {label}
    </button>
  );
}

// ─── Flow Editor ──────────────────────────────────────────────────────────────

function FlowEditor({
  title, subtitle, steps, onBack,
  backLabel = "Back",
}: {
  title: string; subtitle: string;
  steps: FlowStep[];
  onBack: () => void;
  backLabel?: string;
}) {
  const [selected, setSelected] = useState<string>(steps[0].id);
  const selectedStep = steps.find(s => s.id === selected)!;
  const [delay, setDelay] = useState("Immediately");

  return (
    <div style={{ display:"flex", height:"100%", background:"#F9F9F8", fontFamily:"'DM Sans',sans-serif" }}>

      {/* Left: flow */}
      <div style={{ flex:1, padding:"32px 40px", overflowY:"auto" }}>
        <BackBtn label={backLabel} onClick={onBack} />

        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:32 }}>
          <div>
            <h1 style={{ fontFamily:"'Libre Baskerville',serif", fontSize:22, fontWeight:400, color:"#1A1916", letterSpacing:"-0.4px", marginBottom:4 }}>{title}</h1>
            <p style={{ fontSize:12, color:"#8A8680", fontWeight:300, fontStyle:"italic" }}>{subtitle}</p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="lf-ghost" style={{ padding:"8px 16px", borderRadius:9, border:"1px solid #E8E6E0", background:"#FFFFFF", fontSize:12, color:"#8A8680", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"background .15s" }}>
              Test Flow
            </button>
            <button className="lf-btn" style={{ padding:"8px 18px", borderRadius:9, border:"none", background:"#1A1916", fontSize:12, color:"#fff", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"opacity .15s" }}>
              Publish
            </button>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", maxWidth:520, margin:"0 auto" }}>
          {steps.map((step, i) => (
            <div key={step.id} style={{ display:"flex", flexDirection:"column", alignItems:"center", width:"100%" }}>
              <div
                className="lf-step"
                onClick={() => setSelected(step.id)}
                style={{
                  width:"100%", padding:"16px 18px", borderRadius:14,
                  border: `1.5px solid ${selected === step.id ? step.color : step.border}`,
                  background: selected === step.id ? step.bg : "#FFFFFF",
                  cursor:"pointer", transition:"all .18s",
                  boxShadow: selected === step.id ? `0 6px 20px ${step.color}18` : "0 1px 4px rgba(0,0,0,.05)",
                  position:"relative", overflow:"hidden",
                }}
              >
                {/* top accent line if live */}
                {step.live && (
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:step.color, borderRadius:"14px 14px 0 0" }} />
                )}
                {/* Reply node dashed style */}
                {step.type === "reply" && selected !== step.id && (
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`repeating-linear-gradient(90deg,${step.color} 0,${step.color} 8px,transparent 8px,transparent 14px)` }} />
                )}

                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:9, background: selected === step.id ? "rgba(255,255,255,.7)" : step.bg, border:`1px solid ${step.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:step.color }}>
                      {step.icon}
                    </div>
                    <div>
                      <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:13, fontWeight:400, color:"#1A1916" }}>{step.label}</div>
                      <div style={{ fontSize:10, color:"#8A8680", fontWeight:300, fontStyle:"italic" }}>{step.sublabel}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    {step.type === "reply" ? (
                      <div style={{ fontSize:9, fontWeight:500, color:"#1D9E75", background:"#E1F5EE", padding:"3px 9px", borderRadius:20 }}>Reply</div>
                    ) : step.live ? (
                      <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:9, fontWeight:500, color:"#1D9E75", background:"#E1F5EE", padding:"3px 9px", borderRadius:20 }}>
                        <span style={{ width:5, height:5, borderRadius:"50%", background:"#1D9E75", display:"inline-block" }} />
                        Live
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
                  <div style={{ width:20, height:20, borderRadius:"50%", border:"1.5px solid #E8E6E0", background:"#FFFFFF", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#C4C2BC", transition:"border-color .15s" }}>
                    <Plus size={11} strokeWidth={1.5} />
                  </div>
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

      {/* Right: settings panel */}
      <div style={{ width:280, background:"#FFFFFF", borderLeft:"1px solid #E8E6E0", padding:"28px 22px", overflowY:"auto" }}>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:14, fontWeight:400, color:"#1A1916", marginBottom:3 }}>{selectedStep.label} Settings</div>
          <div style={{ fontSize:11, color:"#8A8680", fontWeight:300, fontStyle:"italic" }}>Configure this step</div>
        </div>

        {/* Step type */}
        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block", fontSize:9, color:"#8A8680", textTransform:"uppercase", letterSpacing:"1px", marginBottom:7, fontWeight:400 }}>Step Type</label>
          <div style={{ padding:"9px 12px", borderRadius:9, border:`1px solid ${selectedStep.border}`, background:selectedStep.bg, fontSize:12, color:selectedStep.color, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ color:selectedStep.color }}>{selectedStep.icon}</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:400 }}>{selectedStep.sublabel}</span>
          </div>
        </div>

        {/* Scheduled trigger special UI */}
        {selectedStep.sublabel === "Time-based Send" ? (
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", fontSize:9, color:"#8A8680", textTransform:"uppercase", letterSpacing:"1px", marginBottom:7, fontWeight:400 }}>Send After</label>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {["5 minutes","30 minutes","1 hour","3 hours","1 day","2 days","3 days","1 week"].map(opt => (
                <div key={opt} onClick={() => setDelay(opt)} style={{ padding:"9px 12px", borderRadius:9, border:`1px solid ${delay===opt ? "#4A46B5" : "#E8E6E0"}`, background:delay===opt ? "#EEEDF8" : "#FFFFFF", fontSize:12, color:delay===opt ? "#4A46B5" : "#8A8680", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", transition:"all .15s", fontFamily:"'DM Sans',sans-serif" }}>
                  {opt}
                  {delay===opt && <div style={{ width:7, height:7, borderRadius:"50%", background:"#4A46B5" }} />}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:9, color:"#8A8680", textTransform:"uppercase", letterSpacing:"1px", marginBottom:7, fontWeight:400 }}>Message / Content</label>
              <textarea defaultValue={selectedStep.content} style={{ width:"100%", padding:"10px 12px", border:"1px solid #E8E6E0", borderRadius:9, fontSize:11, color:"#1A1916", background:"#F9F9F8", outline:"none", resize:"none", height:100, lineHeight:1.6, fontFamily:"'DM Sans',sans-serif", fontWeight:300 }} />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ display:"block", fontSize:9, color:"#8A8680", textTransform:"uppercase", letterSpacing:"1px", marginBottom:7, fontWeight:400 }}>Send Delay</label>
              <select style={{ width:"100%", padding:"9px 12px", border:"1px solid #E8E6E0", borderRadius:9, fontSize:12, color:"#1A1916", background:"#FFFFFF", outline:"none", fontFamily:"'DM Sans',sans-serif" }}>
                <option>Immediately</option>
                <option>After 5 minutes</option>
                <option>After 1 hour</option>
                <option>After 24 hours</option>
              </select>
            </div>
          </>
        )}

        <button className="lf-btn" style={{ width:"100%", padding:"11px", borderRadius:9, border:"none", background:"#1A1916", color:"#fff", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"opacity .15s" }}>
          Save Changes
        </button>
      </div>
    </div>
  );
}

// ─── Choice Card ──────────────────────────────────────────────────────────────

function ChoiceCard({ icon, color, iconBg, title, description, bullets, onClick }: {
  icon: React.ReactNode; color: string; iconBg: string;
  title: string; description: string; bullets: string[];
  onClick: () => void;
}) {
  return (
    <div className="lf-card" onClick={onClick} style={{
      background:"#FFFFFF", border:"1px solid #E8E6E0", borderRadius:18,
      padding:"32px 28px", cursor:"pointer", transition:"box-shadow .2s,transform .2s",
      flex:1, display:"flex", flexDirection:"column", gap:16,
    }}>
      <div style={{ width:56, height:56, borderRadius:14, background:iconBg, display:"flex", alignItems:"center", justifyContent:"center", color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:18, fontWeight:400, color:"#1A1916", marginBottom:8 }}>{title}</div>
        <div style={{ fontSize:12, color:"#8A8680", fontWeight:300, lineHeight:1.7 }}>{description}</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:7, marginTop:4 }}>
        {bullets.map(b => (
          <div key={b} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:6, height:6, borderRadius:"50%", background:color, flexShrink:0 }} />
            <span style={{ fontSize:12, color:"#8A8680", fontWeight:300 }}>{b}</span>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:"auto", paddingTop:8, fontSize:12, color, fontWeight:500 }}>
        Open <ChevronRight size={13} strokeWidth={2} />
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
      <div style={{ display:"flex", gap:20, maxWidth:860 }}>
        <ChoiceCard
          icon={<Zap size={24} strokeWidth={1.5} />}
          color="#4A46B5" iconBg="#EEEDF8"
          title="Lead Flow"
          description="Set up the full sequence that greets every lead, delivers your lead magnet, and books the call — on autopilot."
          bullets={["Trigger", "Script 1 — Welcome", "Lead Magnet", "Script 2 — Follow-up", "Booking", "Reply Node"]}
          onClick={() => onSelect("lead-flow")}
        />
        <ChoiceCard
          icon={<Bot size={24} strokeWidth={1.5} />}
          color="#1D9E75" iconBg="#E1F5EE"
          title="Follow-Up Flow"
          description="Configure agents that re-engage cold leads and confirm bookings to maximise show-up rates."
          bullets={["Follow-Up Automation", "Follow-Up Agent"]}
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
      <div style={{ display:"flex", gap:20, maxWidth:860 }}>
        <ChoiceCard
          icon={<Clock size={24} strokeWidth={1.5} />}
          color="#BA7517" iconBg="#FDF3E1"
          title="Follow-Up Automation"
          description="Send scheduled follow-up messages at the perfect time. Choose your delay and let it run automatically."
          bullets={["Scheduled Trigger", "Time-based delays", "Re-engage message"]}
          onClick={() => onSelect("followup-automation")}
        />
        <ChoiceCard
          icon={<Bot size={24} strokeWidth={1.5} />}
          color="#378ADD" iconBg="#E6F1FB"
          title="Follow-Up Agent"
          description="AI agent takes over when a lead replies — responding intelligently to guide them toward booking."
          bullets={["Trigger Agent Reply", "AI-powered responses", "WhatsApp integration"]}
          onClick={() => onSelect("followup-agent")}
        />
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function LeadFlowScreen() {
  const [view, setView] = useState<View>("home");

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ height:"100%", display:"flex", flexDirection:"column" }}>
        {view === "home" && (
          <HomeScreen onSelect={setView} />
        )}
        {view === "lead-flow" && (
          <FlowEditor
            title="Lead Flow"
            subtitle="Your main lead automation sequence"
            steps={LEAD_FLOW_STEPS}
            onBack={() => setView("home")}
            backLabel="Back to Lead Flow"
          />
        )}
        {view === "followup-home" && (
          <FollowUpHome onSelect={setView} onBack={() => setView("home")} />
        )}
        {view === "followup-automation" && (
          <FlowEditor
            title="Follow-Up Automation"
            subtitle="Scheduled time-based follow-up messages"
            steps={FOLLOWUP_AUTO_STEPS}
            onBack={() => setView("followup-home")}
            backLabel="Back to Follow-Up Flow"
          />
        )}
        {view === "followup-agent" && (
          <FlowEditor
            title="Follow-Up Agent"
            subtitle="AI agent replies to re-engage your leads"
            steps={FOLLOWUP_AGENT_STEPS}
            onBack={() => setView("followup-home")}
            backLabel="Back to Follow-Up Flow"
          />
        )}
      </div>
    </>
  );
}
