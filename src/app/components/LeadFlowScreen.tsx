import { useState } from "react";
import {
  Plus, Settings, Zap, MessageSquare, Gift, Phone,
  Calendar, ArrowLeft, Clock, Bot, MessageCircle, ChevronRight,
  Wifi, Type, Link, Check,
} from "lucide-react";

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
  type?: "reply" | "trigger" | "typing" | "agent" | "script1" | "leadmagnet" | "script2" | "booking" | "replynode";
}

const LEAD_FLOW_STEPS: FlowStep[] = [
  { id:"1", label:"Trigger",           sublabel:"WhatsApp Connection",   color:"#4A46B5", bg:"#EEEDF8", border:"#C8C5F0", icon:<Wifi size={15} strokeWidth={1.5}/>,           content:"Connect LeadFlow to WhatsApp to receive messages",          live:true,  type:"trigger"    },
  { id:"2", label:"Typing Animation",  sublabel:"Human-like Behaviour",  color:"#8A55CC", bg:"#F3EEFB", border:"#D4BFEF", icon:<Type size={15} strokeWidth={1.5}/>,            content:"Makes your AI agent appear human by showing typing in WhatsApp", live:true, type:"typing"  },
  { id:"3", label:"AI Agent",          sublabel:"Agent Identity",        color:"#378ADD", bg:"#E6F1FB", border:"#B3D4F5", icon:<Bot size={15} strokeWidth={1.5}/>,             content:"Configure your AI agent's name and writing style",           live:true,  type:"agent"      },
  { id:"4", label:"Script 1",          sublabel:"Welcome & Qualify",     color:"#1D9E75", bg:"#E1F5EE", border:"#A3DFC8", icon:<MessageSquare size={15} strokeWidth={1.5}/>,  content:"Auto-filled from onboarding — confirm or adjust your welcome script", live:true, type:"script1" },
  { id:"5", label:"Lead Magnet",       sublabel:"Send Resource",         color:"#BA7517", bg:"#FDF3E1", border:"#F0D09A", icon:<Gift size={15} strokeWidth={1.5}/>,            content:"Paste the link to your lead magnet (guide, video, PDF...)",  live:false, type:"leadmagnet" },
  { id:"6", label:"Script 2",          sublabel:"Follow-Up & Offer",     color:"#D85A30", bg:"#FBEEE8", border:"#F0B99A", icon:<Phone size={15} strokeWidth={1.5}/>,           content:"Auto-filled from onboarding — confirm or adjust your follow-up script", live:false, type:"script2" },
  { id:"7", label:"Booking",           sublabel:"Schedule Call",         color:"#4A46B5", bg:"#EEEDF8", border:"#C8C5F0", icon:<Calendar size={15} strokeWidth={1.5}/>,        content:"Customise your booking form — event name, host, availability", live:false, type:"booking"  },
  { id:"8", label:"Reply Node",        sublabel:"WhatsApp Reply",        color:"#1D9E75", bg:"#E1F5EE", border:"#A3DFC8", icon:<MessageCircle size={15} strokeWidth={1.5}/>,  content:"Connect your WhatsApp to send messages to leads",            live:false, type:"replynode", },
];

const FOLLOWUP_AUTO_STEPS: FlowStep[] = [
  { id:"1", label:"Scheduled Trigger", sublabel:"Time-based Send",  color:"#4A46B5", bg:"#EEEDF8", border:"#C8C5F0", icon:<Clock size={15} strokeWidth={1.5}/>,          content:"Send follow-up after: 1 day",                                                        live:true  },
  { id:"2", label:"Follow-Up Message", sublabel:"Re-engage Lead",   color:"#378ADD", bg:"#E6F1FB", border:"#B3D4F5", icon:<MessageSquare size={15} strokeWidth={1.5}/>, content:"Hey {name}, just checking in! Did you get a chance to look at what I sent?",        live:false },
];

const FOLLOWUP_AGENT_STEPS: FlowStep[] = [
  { id:"1", label:"Trigger Agent",  sublabel:"AI Reply Trigger",  color:"#4A46B5", bg:"#EEEDF8", border:"#C8C5F0", icon:<Bot size={15} strokeWidth={1.5}/>,            content:"When lead replies, AI agent takes over the conversation",              live:true  },
  { id:"2", label:"Agent Reply",    sublabel:"WhatsApp Reply",    color:"#1D9E75", bg:"#E1F5EE", border:"#A3DFC8", icon:<MessageCircle size={15} strokeWidth={1.5}/>, content:"AI responds based on lead's message to guide them toward booking",    live:false },
];

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  .lf-card:hover   { box-shadow: 0 8px 32px rgba(0,0,0,.10) !important; transform: translateY(-2px); }
  .lf-step:hover   { box-shadow: 0 4px 16px rgba(0,0,0,.08) !important; }
  .lf-btn:hover    { opacity: .8; }
  .lf-ghost:hover  { background: #F2F1EE !important; }
  .lf-back:hover   { background: #F2F1EE !important; }
  .style-opt:hover { border-color: #4A46B5 !important; }
`;

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

// ─── Right Panel per step type ────────────────────────────────────────────────

function TriggerPanel() {
  return (
    <>
      <InfoBanner text="Connect your WhatsApp Business account so LeadFlow can receive messages from your leads." />
      <Field label="Client ID" placeholder="e.g. 1234567890" />
      <Field label="Client Secret" placeholder="e.g. EAAxxxxxxxx..." type="password" />
      <PrimaryBtn label="Connect" icon={<Wifi size={13} strokeWidth={1.5} />} />
    </>
  );
}

function TypingPanel() {
  return (
    <>
      <InfoBanner text="Makes your AI agent show a typing indicator before replying — so leads feel like they're talking to a real person." />
      <Field label="WhatsApp Access Token" placeholder="EAAxxxxxxxx..." type="password" />
      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>Typing Duration</label>
        <select style={selectStyle}>
          <option>1 second</option>
          <option>2 seconds</option>
          <option>3 seconds</option>
          <option>5 seconds</option>
        </select>
      </div>
      <PrimaryBtn label="Save Changes" />
    </>
  );
}

function AgentPanel() {
  const [selected, setSelected] = useState<number | null>(null);
  const styles = [
    { label: "Professional", msg: "Thank you for reaching out. We've received your request and a member of our team will be in touch with you shortly." },
    { label: "Friendly & Warm", msg: "Hey! Thanks for contacting us 😊 We got your message and we'll get back to you very soon!" },
    { label: "Casual & Direct", msg: "Got it! We'll hit you back shortly 👍" },
    { label: "Formal", msg: "Dear client, we acknowledge receipt of your inquiry and will respond within the shortest possible delay. Thank you for your patience." },
  ];
  return (
    <>
      <InfoBanner text="Set your agent's name and choose the writing style that best represents how you communicate with leads." />
      <Field label="Agent Name" placeholder="e.g. Sarah, Alex, Max..." />
      <div style={{ marginBottom:20 }}>
        <label style={labelStyle}>Writing Style</label>
        <p style={{ fontSize:10, color:"#8A8680", fontWeight:300, marginBottom:10, fontStyle:"italic" }}>
          Pick the style that best matches how you talk to your leads:
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {styles.map((s, i) => (
            <div
              key={i}
              className="style-opt"
              onClick={() => setSelected(i)}
              style={{
                padding:"11px 13px", borderRadius:10, cursor:"pointer", transition:"all .15s",
                border:`1.5px solid ${selected === i ? "#4A46B5" : "#E8E6E0"}`,
                background: selected === i ? "#EEEDF8" : "#FAFAF9",
              }}
            >
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:10, fontWeight:500, color: selected === i ? "#4A46B5" : "#8A8680", textTransform:"uppercase", letterSpacing:"0.8px" }}>{s.label}</span>
                {selected === i && <Check size={11} strokeWidth={2.5} color="#4A46B5" />}
              </div>
              <p style={{ fontSize:11, color:"#1A1916", fontWeight:300, lineHeight:1.6, margin:0 }}>{s.msg}</p>
            </div>
          ))}
        </div>
      </div>
      <PrimaryBtn label="Save Changes" />
    </>
  );
}

function Script1Panel() {
  const script = `Hey! 👋 Just to confirm — you reached out because you're interested in [SERVICE] to maybe get help with [DESIRED END RESULT], right?

→ Perfect 😊 Before I send you anything, what's your name?

→ Nice to meet you, [NAME] 👍
Quick question so I can send you exactly the right thing — have you ever tried [CATEGORY] before, or is this your first time?

→ And do you already have a clear idea of how it works, or are you still figuring things out?

→ Perfect 👍
I'll send you [DELIVERABLE] right now. Take a few minutes to go through it — by the end you'll have a clear picture of [OUTCOME]. And if it clicks and you want to go further, we can talk about the next step. Sound good?`;

  return (
    <>
      <InfoBanner text="This script was auto-filled from your onboarding info. Review it and adjust anything that doesn't feel right." />
      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>Script Preview</label>
        <textarea
          defaultValue={script}
          style={{ ...textareaStyle, height:220 }}
        />
      </div>
      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>Variables — confirm or correct</label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <MiniField label="[SERVICE]" placeholder="e.g. home cleaning, coaching..." />
          <MiniField label="[DESIRED END RESULT]" placeholder="e.g. a spotless home every week" />
          <MiniField label="[CATEGORY]" placeholder="e.g. professional cleaning services" />
          <MiniField label="[DELIVERABLE]" placeholder="e.g. your free guide" />
          <MiniField label="[OUTCOME]" placeholder="e.g. how to get started today" />
        </div>
      </div>
      <PrimaryBtn label="Save Changes" />
    </>
  );
}

function LeadMagnetPanel() {
  return (
    <>
      <InfoBanner text="Paste the link to your lead magnet — this is what gets sent to the lead automatically after Script 1." />
      <Field label="Lead Magnet Link" placeholder="https://..." />
      <p style={{ fontSize:10, color:"#8A8680", fontWeight:300, marginBottom:20, lineHeight:1.6 }}>
        Can be a PDF, video, Google Doc, Notion page, or any link. Make sure it's publicly accessible.
      </p>
      <PrimaryBtn label="Save Changes" icon={<Link size={13} strokeWidth={1.5} />} />
    </>
  );
}

function Script2Panel() {
  const script = `Hey [NAME] 👋 Sorry — just wanted to double check, did the link work okay?

→ Got it — did you have time to go through it or not yet?

If not complete: No worries, go finish it — I'll be here 😊

If complete:
→ Nice! How did you find it? Did it give you a clearer picture?

→ Really glad it helped 😊
Quick question I didn't get to ask earlier — what made you reach out in the first place?
1 — Just exploring
2 — Or actually looking to make a real change?

→ Got it, so you're serious about this. What's driving that — what do you actually want to achieve?
1 — Improve a specific area of my life
2 — Hit a goal I've been putting off
3 — Get out of a situation I'm stuck in
4 — Level up to the next stage

→ And if you actually got there — what would that mean for you personally?
1 — Feel more confident and in control
2 — Less stress, more peace of mind
3 — Be able to show up better for people around me
4 — Finally feel like I'm moving forward

→ Be honest with me…
If nothing changes and you're in the exact same spot 3 months from now — how does that feel?
1 — Frustrated with myself
2 — Disappointed I didn't try
3 — Stuck and tired of it
4 — Honestly, I'd be okay with it

→ I hear you. So here's where most people get stuck — they have the motivation but no clear path. Quick question: could you figure out the next steps completely alone, or would it help to have someone walk you through it?

→ Perfect 👍
Let's get on a short call — completely free. No selling, no pressure.
In [X] minutes I'll help you:
1 — Get clear on where you are and where you want to go
2 — Identify what's been holding you back
3 — Give you a simple first step you can take right after the call
Does that sound useful?

→ Perfect 👍
I have a few spots open:
— [DAY] at [TIME]
— [DAY] at [TIME]
Which works for you?

→ Locked in 👍 Here's the link: [BOOKING LINK]
Once you book send me a quick confirmation 🙏`;

  return (
    <>
      <InfoBanner text="This script was auto-filled from your onboarding info. Review it and adjust anything that doesn't feel right." />
      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>Script Preview</label>
        <textarea
          defaultValue={script}
          style={{ ...textareaStyle, height:220 }}
        />
      </div>
      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>Variables — confirm or correct</label>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <MiniField label="[X] — Call duration" placeholder="e.g. 20" />
          <MiniField label="[BOOKING LINK]" placeholder="https://cal.com/..." />
        </div>
      </div>
      <PrimaryBtn label="Save Changes" />
    </>
  );
}

function BookingPanel() {
  return (
    <>
      <InfoBanner text="Customise your booking form — this is what leads see when they click your booking link." />
      <Field label="Event Name" placeholder="e.g. Free Strategy Call, Discovery Call..." />
      <Field label="Host Name" placeholder="e.g. John from CleanCo" />
      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>Call Duration</label>
        <select style={selectStyle}>
          <option>15 minutes</option>
          <option>20 minutes</option>
          <option>30 minutes</option>
          <option>45 minutes</option>
          <option>60 minutes</option>
        </select>
      </div>
      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>Available Days</label>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(day => (
            <DayToggle key={day} label={day} />
          ))}
        </div>
      </div>
      <div style={{ marginBottom:20 }}>
        <label style={labelStyle}>Available Hours</label>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <select style={{ ...selectStyle, flex:1, marginBottom:0 }}>
            {["8:00","9:00","10:00","11:00","12:00","13:00","14:00"].map(h => <option key={h}>{h}</option>)}
          </select>
          <span style={{ fontSize:11, color:"#8A8680" }}>to</span>
          <select style={{ ...selectStyle, flex:1, marginBottom:0 }}>
            {["15:00","16:00","17:00","18:00","19:00","20:00","21:00"].map(h => <option key={h}>{h}</option>)}
          </select>
        </div>
      </div>
      <PrimaryBtn label="Save Changes" />
    </>
  );
}

function ReplyNodePanel() {
  return (
    <>
      <InfoBanner text="Connect your WhatsApp to allow LeadFlow to send messages to your leads automatically." />
      <Field label="WhatsApp Access Token" placeholder="EAAxxxxxxxx..." type="password" />
      <Field label="Business Account ID" placeholder="e.g. 1408732614201335" />
      <PrimaryBtn label="Connect" icon={<Wifi size={13} strokeWidth={1.5} />} />
    </>
  );
}

// ─── Mini shared components ───────────────────────────────────────────────────

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
  fontFamily:"'DM Sans',sans-serif", fontWeight:300,
};

function InfoBanner({ text }: { text: string }) {
  return (
    <div style={{ padding:"10px 12px", borderRadius:9, background:"#F7F6F3", border:"1px solid #E8E6E0", fontSize:11, color:"#8A8680", lineHeight:1.6, fontWeight:300, marginBottom:18, fontStyle:"italic" }}>
      {text}
    </div>
  );
}

function Field({ label, placeholder, type = "text" }: { label: string; placeholder: string; type?: string }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        style={{ width:"100%", padding:"9px 12px", border:"1px solid #E8E6E0", borderRadius:9, fontSize:12, color:"#1A1916", background:"#FFFFFF", outline:"none", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box" }}
      />
    </div>
  );
}

function MiniField({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
      <span style={{ fontSize:9, color:"#4A46B5", fontWeight:500, letterSpacing:"0.5px", textTransform:"uppercase" }}>{label}</span>
      <input
        placeholder={placeholder}
        style={{ width:"100%", padding:"8px 10px", border:"1px solid #E8E6E0", borderRadius:8, fontSize:11, color:"#1A1916", background:"#FFFFFF", outline:"none", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box" }}
      />
    </div>
  );
}

function PrimaryBtn({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <button className="lf-btn" style={{ width:"100%", padding:"11px", borderRadius:9, border:"none", background:"#1A1916", color:"#fff", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"opacity .15s", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
      {icon}{label}
    </button>
  );
}

function DayToggle({ label }: { label: string }) {
  const [on, setOn] = useState(["Mon","Tue","Wed","Thu","Fri"].includes(label));
  return (
    <div onClick={() => setOn(!on)} style={{ padding:"6px 12px", borderRadius:8, border:`1.5px solid ${on ? "#4A46B5" : "#E8E6E0"}`, background: on ? "#EEEDF8" : "#FAFAF9", fontSize:11, color: on ? "#4A46B5" : "#8A8680", cursor:"pointer", fontWeight: on ? 500 : 300, transition:"all .15s" }}>
      {label}
    </div>
  );
}

// ─── Right Panel Router ───────────────────────────────────────────────────────

function RightPanel({ step }: { step: FlowStep }) {
  return (
    <div style={{ width:300, background:"#FFFFFF", borderLeft:"1px solid #E8E6E0", padding:"28px 22px", overflowY:"auto", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:14, fontWeight:400, color:"#1A1916", marginBottom:3 }}>{step.label} Settings</div>
        <div style={{ fontSize:11, color:"#8A8680", fontWeight:300, fontStyle:"italic" }}>Configure this step</div>
      </div>
      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>Step Type</label>
        <div style={{ padding:"9px 12px", borderRadius:9, border:`1px solid ${step.border}`, background:step.bg, fontSize:12, color:step.color, display:"flex", alignItems:"center", gap:8 }}>
          <span>{step.icon}</span>
          <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:400 }}>{step.sublabel}</span>
        </div>
      </div>

      {step.type === "trigger"    && <TriggerPanel />}
      {step.type === "typing"     && <TypingPanel />}
      {step.type === "agent"      && <AgentPanel />}
      {step.type === "script1"    && <Script1Panel />}
      {step.type === "leadmagnet" && <LeadMagnetPanel />}
      {step.type === "script2"    && <Script2Panel />}
      {step.type === "booking"    && <BookingPanel />}
      {step.type === "replynode"  && <ReplyNodePanel />}

      {/* fallback for followup steps */}
      {!step.type && (
        <>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>Message / Content</label>
            <textarea defaultValue={step.content} style={{ ...textareaStyle, height:100 }} />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={labelStyle}>Send Delay</label>
            <select style={selectStyle}>
              <option>Immediately</option>
              <option>After 5 minutes</option>
              <option>After 1 hour</option>
              <option>After 24 hours</option>
            </select>
          </div>
          <PrimaryBtn label="Save Changes" />
        </>
      )}
    </div>
  );
}

// ─── Flow Editor ──────────────────────────────────────────────────────────────

function FlowEditor({ title, subtitle, steps, onBack, backLabel = "Back" }: {
  title: string; subtitle: string; steps: FlowStep[]; onBack: () => void; backLabel?: string;
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
            <button className="lf-btn" style={{ padding:"8px 18px", borderRadius:9, border:"none", background:"#1A1916", fontSize:12, color:"#fff", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"opacity .15s" }}>Publish</button>
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
                  border:`1.5px solid ${selected === step.id ? step.color : step.border}`,
                  background: selected === step.id ? step.bg : "#FFFFFF",
                  cursor:"pointer", transition:"all .18s",
                  boxShadow: selected === step.id ? `0 6px 20px ${step.color}18` : "0 1px 4px rgba(0,0,0,.05)",
                  position:"relative", overflow:"hidden",
                }}
              >
                {step.live && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:step.color, borderRadius:"14px 14px 0 0" }} />}
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
                  <div style={{ width:20, height:20, borderRadius:"50%", border:"1.5px solid #E8E6E0", background:"#FFFFFF", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#C4C2BC" }}>
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

      <RightPanel step={selectedStep} />
    </div>
  );
}

// ─── Choice Card ──────────────────────────────────────────────────────────────

function ChoiceCard({ icon, color, iconBg, title, description, bullets, onClick }: {
  icon: React.ReactNode; color: string; iconBg: string;
  title: string; description: string; bullets: string[]; onClick: () => void;
}) {
  return (
    <div className="lf-card" onClick={onClick} style={{
      background:"#FFFFFF", border:"1px solid #E8E6E0", borderRadius:18,
      padding:"32px 28px", cursor:"pointer", transition:"box-shadow .2s,transform .2s",
      flex:1, display:"flex", flexDirection:"column", gap:16,
    }}>
      <div style={{ width:56, height:56, borderRadius:14, background:iconBg, display:"flex", alignItems:"center", justifyContent:"center", color }}>{icon}</div>
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
          bullets={["Trigger", "Typing Animation", "AI Agent", "Script 1", "Lead Magnet", "Script 2", "Booking", "Reply Node"]}
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

export function LeadFlowScreen() {
  const [view, setView] = useState<View>("home");
  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ height:"100%", display:"flex", flexDirection:"column" }}>
        {view === "home"               && <HomeScreen onSelect={setView} />}
        {view === "lead-flow"          && <FlowEditor title="Lead Flow" subtitle="Your main lead automation sequence" steps={LEAD_FLOW_STEPS} onBack={() => setView("home")} backLabel="Back to Lead Flow" />}
        {view === "followup-home"      && <FollowUpHome onSelect={setView} onBack={() => setView("home")} />}
        {view === "followup-automation"&& <FlowEditor title="Follow-Up Automation" subtitle="Scheduled time-based follow-up messages" steps={FOLLOWUP_AUTO_STEPS} onBack={() => setView("followup-home")} backLabel="Back to Follow-Up Flow" />}
        {view === "followup-agent"     && <FlowEditor title="Follow-Up Agent" subtitle="AI agent replies to re-engage your leads" steps={FOLLOWUP_AGENT_STEPS} onBack={() => setView("followup-home")} backLabel="Back to Follow-Up Flow" />}
      </div>
    </>
  );
}
