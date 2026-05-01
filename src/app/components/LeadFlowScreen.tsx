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
  .lf-card:hover   { box-shadow: 0 8px 32px rgba(0,0,0,.10) !important; transform: translateY(-2px); }
  .lf-step:hover   { box-shadow: 0 4px 16px rgba(0,0,0,.08) !important; }
  .lf-btn:hover    { opacity: .8; }
  .lf-ghost:hover  { background: #F2F1EE !important; }
  .lf-back:hover   { background: #F2F1EE !important; }
  .style-opt:hover { border-color: #4A46B5 !important; }
  .preview-flow-node:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1) !important; }
  .start-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(26,25,22,.18) !important; }
  .pixel-agent svg, svg.pixel-agent {
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    shape-rendering: crispEdges;
  }
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

// ─── Pixel Art Agents ────────────────────────────────────────────────────────

export const BookingAgent = ({ size = 160 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" shapeRendering="crispEdges" style={{ imageRendering: "pixelated" }}>
    <rect x="5" y="0" width="1" height="1" fill="#030104"/>
    <rect x="6" y="0" width="1" height="1" fill="#020200"/>
    <rect x="7" y="0" width="1" height="1" fill="#020200"/>
    <rect x="8" y="0" width="1" height="1" fill="#020202"/>
    <rect x="9" y="0" width="1" height="1" fill="#010101"/>
    <rect x="10" y="0" width="1" height="1" fill="#010101"/>
    <rect x="11" y="0" width="1" height="1" fill="#010101"/>
    <rect x="12" y="0" width="1" height="1" fill="#020202"/>
    <rect x="13" y="0" width="1" height="1" fill="#020202"/>
    <rect x="14" y="0" width="1" height="1" fill="#010101"/>
    <rect x="15" y="0" width="1" height="1" fill="#020202"/>
    <rect x="16" y="0" width="1" height="1" fill="#020202"/>
    <rect x="17" y="0" width="1" height="1" fill="#020202"/>
    <rect x="18" y="0" width="1" height="1" fill="#010101"/>
    <rect x="19" y="0" width="1" height="1" fill="#020202"/>
    <rect x="20" y="0" width="1" height="1" fill="#020202"/>
    <rect x="21" y="0" width="1" height="1" fill="#020202"/>
    <rect x="22" y="0" width="1" height="1" fill="#010101"/>
    <rect x="23" y="0" width="1" height="1" fill="#020202"/>
    <rect x="24" y="0" width="1" height="1" fill="#010101"/>
    <rect x="25" y="0" width="1" height="1" fill="#020202"/>
    <rect x="26" y="0" width="1" height="1" fill="#010101"/>
    <rect x="27" y="0" width="1" height="1" fill="#010101"/>
    <rect x="28" y="0" width="1" height="1" fill="#020202"/>
    <rect x="29" y="0" width="1" height="1" fill="#020202"/>
    <rect x="30" y="0" width="1" height="1" fill="#010101"/>
    <rect x="31" y="0" width="1" height="1" fill="#010101"/>
    <rect x="32" y="0" width="1" height="1" fill="#010101"/>
    <rect x="33" y="0" width="1" height="1" fill="#010101"/>
    <rect x="34" y="0" width="1" height="1" fill="#010100"/>
    <rect x="35" y="0" width="1" height="1" fill="#020200"/>
    <rect x="36" y="0" width="1" height="1" fill="#030301"/>
    <rect x="5" y="1" width="1" height="1" fill="#010000"/>
    <rect x="6" y="1" width="1" height="1" fill="#000000"/>
    <rect x="7" y="1" width="1" height="1" fill="#010101"/>
    <rect x="8" y="1" width="1" height="1" fill="#000000"/>
    <rect x="9" y="1" width="1" height="1" fill="#010101"/>
    <rect x="10" y="1" width="1" height="1" fill="#000000"/>
    <rect x="11" y="1" width="1" height="1" fill="#000000"/>
    <rect x="12" y="1" width="1" height="1" fill="#010101"/>
    <rect x="13" y="1" width="1" height="1" fill="#000000"/>
    <rect x="14" y="1" width="1" height="1" fill="#000000"/>
    <rect x="15" y="1" width="1" height="1" fill="#000000"/>
    <rect x="16" y="1" width="1" height="1" fill="#000000"/>
    <rect x="17" y="1" width="1" height="1" fill="#000000"/>
    <rect x="18" y="1" width="1" height="1" fill="#010101"/>
    <rect x="19" y="1" width="1" height="1" fill="#010101"/>
    <rect x="20" y="1" width="1" height="1" fill="#000000"/>
    <rect x="21" y="1" width="1" height="1" fill="#010101"/>
    <rect x="22" y="1" width="1" height="1" fill="#000000"/>
    <rect x="23" y="1" width="1" height="1" fill="#010101"/>
    <rect x="24" y="1" width="1" height="1" fill="#000000"/>
    <rect x="25" y="1" width="1" height="1" fill="#000000"/>
    <rect x="26" y="1" width="1" height="1" fill="#000000"/>
    <rect x="27" y="1" width="1" height="1" fill="#000000"/>
    <rect x="28" y="1" width="1" height="1" fill="#000000"/>
    <rect x="29" y="1" width="1" height="1" fill="#000000"/>
    <rect x="30" y="1" width="1" height="1" fill="#010101"/>
    <rect x="31" y="1" width="1" height="1" fill="#000000"/>
    <rect x="32" y="1" width="1" height="1" fill="#000000"/>
    <rect x="33" y="1" width="1" height="1" fill="#000000"/>
    <rect x="34" y="1" width="1" height="1" fill="#000000"/>
    <rect x="35" y="1" width="1" height="1" fill="#000000"/>
    <rect x="36" y="1" width="1" height="1" fill="#040402"/>
    <rect x="5" y="2" width="1" height="1" fill="#000002"/>
    <rect x="6" y="2" width="1" height="1" fill="#000000"/>
    <rect x="7" y="2" width="1" height="1" fill="#000000"/>
    <rect x="8" y="2" width="1" height="1" fill="#010101"/>
    <rect x="9" y="2" width="1" height="1" fill="#000000"/>
    <rect x="10" y="2" width="1" height="1" fill="#000000"/>
    <rect x="11" y="2" width="1" height="1" fill="#010101"/>
    <rect x="12" y="2" width="1" height="1" fill="#000000"/>
    <rect x="13" y="2" width="1" height="1" fill="#000000"/>
    <rect x="14" y="2" width="1" height="1" fill="#010101"/>
    <rect x="15" y="2" width="1" height="1" fill="#000000"/>
    <rect x="16" y="2" width="1" height="1" fill="#000000"/>
    <rect x="17" y="2" width="1" height="1" fill="#010101"/>
    <rect x="18" y="2" width="1" height="1" fill="#010101"/>
    <rect x="19" y="2" width="1" height="1" fill="#000000"/>
    <rect x="20" y="2" width="1" height="1" fill="#000000"/>
    <rect x="21" y="2" width="1" height="1" fill="#010101"/>
    <rect x="22" y="2" width="1" height="1" fill="#000000"/>
    <rect x="23" y="2" width="1" height="1" fill="#000000"/>
    <rect x="24" y="2" width="1" height="1" fill="#000000"/>
    <rect x="25" y="2" width="1" height="1" fill="#000000"/>
    <rect x="26" y="2" width="1" height="1" fill="#000000"/>
    <rect x="27" y="2" width="1" height="1" fill="#000000"/>
    <rect x="28" y="2" width="1" height="1" fill="#000000"/>
    <rect x="29" y="2" width="1" height="1" fill="#010101"/>
    <rect x="30" y="2" width="1" height="1" fill="#000000"/>
    <rect x="31" y="2" width="1" height="1" fill="#000000"/>
    <rect x="32" y="2" width="1" height="1" fill="#000000"/>
    <rect x="33" y="2" width="1" height="1" fill="#000000"/>
    <rect x="34" y="2" width="1" height="1" fill="#000000"/>
    <rect x="35" y="2" width="1" height="1" fill="#000000"/>
    <rect x="36" y="2" width="1" height="1" fill="#030301"/>
    <rect x="3" y="3" width="1" height="1" fill="#020202"/>
    <rect x="4" y="3" width="1" height="1" fill="#010101"/>
    <rect x="5" y="3" width="1" height="1" fill="#010101"/>
    <rect x="6" y="3" width="1" height="1" fill="#010101"/>
    <rect x="7" y="3" width="1" height="1" fill="#000000"/>
    <rect x="8" y="3" width="1" height="1" fill="#000000"/>
    <rect x="9" y="3" width="1" height="1" fill="#000000"/>
    <rect x="10" y="3" width="1" height="1" fill="#000000"/>
    <rect x="11" y="3" width="1" height="1" fill="#000000"/>
    <rect x="12" y="3" width="1" height="1" fill="#000000"/>
    <rect x="13" y="3" width="1" height="1" fill="#000000"/>
    <rect x="14" y="3" width="1" height="1" fill="#010101"/>
    <rect x="15" y="3" width="1" height="1" fill="#010101"/>
    <rect x="16" y="3" width="1" height="1" fill="#000000"/>
    <rect x="17" y="3" width="1" height="1" fill="#000000"/>
    <rect x="18" y="3" width="1" height="1" fill="#000000"/>
    <rect x="19" y="3" width="1" height="1" fill="#010101"/>
    <rect x="20" y="3" width="1" height="1" fill="#000000"/>
    <rect x="21" y="3" width="1" height="1" fill="#000000"/>
    <rect x="22" y="3" width="1" height="1" fill="#000000"/>
    <rect x="23" y="3" width="1" height="1" fill="#000000"/>
    <rect x="24" y="3" width="1" height="1" fill="#000000"/>
    <rect x="25" y="3" width="1" height="1" fill="#000000"/>
    <rect x="26" y="3" width="1" height="1" fill="#000000"/>
    <rect x="27" y="3" width="1" height="1" fill="#000000"/>
    <rect x="28" y="3" width="1" height="1" fill="#010101"/>
    <rect x="29" y="3" width="1" height="1" fill="#000000"/>
    <rect x="30" y="3" width="1" height="1" fill="#000000"/>
    <rect x="31" y="3" width="1" height="1" fill="#000000"/>
    <rect x="32" y="3" width="1" height="1" fill="#000000"/>
    <rect x="33" y="3" width="1" height="1" fill="#000000"/>
    <rect x="34" y="3" width="1" height="1" fill="#010101"/>
    <rect x="35" y="3" width="1" height="1" fill="#010101"/>
    <rect x="36" y="3" width="1" height="1" fill="#010101"/>
    <rect x="37" y="3" width="1" height="1" fill="#000000"/>
    <rect x="38" y="3" width="1" height="1" fill="#000000"/>
    <rect x="39" y="3" width="1" height="1" fill="#030303"/>
    <rect x="3" y="4" width="1" height="1" fill="#010101"/>
    <rect x="4" y="4" width="1" height="1" fill="#000000"/>
    <rect x="5" y="4" width="1" height="1" fill="#000000"/>
    <rect x="6" y="4" width="1" height="1" fill="#000000"/>
    <rect x="7" y="4" width="1" height="1" fill="#000000"/>
    <rect x="8" y="4" width="1" height="1" fill="#000000"/>
    <rect x="9" y="4" width="1" height="1" fill="#000000"/>
    <rect x="10" y="4" width="1" height="1" fill="#000000"/>
    <rect x="11" y="4" width="1" height="1" fill="#000000"/>
    <rect x="12" y="4" width="1" height="1" fill="#010101"/>
    <rect x="13" y="4" width="1" height="1" fill="#000000"/>
    <rect x="14" y="4" width="1" height="1" fill="#010101"/>
    <rect x="15" y="4" width="1" height="1" fill="#000000"/>
    <rect x="16" y="4" width="1" height="1" fill="#000000"/>
    <rect x="17" y="4" width="1" height="1" fill="#000000"/>
    <rect x="18" y="4" width="1" height="1" fill="#000000"/>
    <rect x="19" y="4" width="1" height="1" fill="#010101"/>
    <rect x="20" y="4" width="1" height="1" fill="#000000"/>
    <rect x="21" y="4" width="1" height="1" fill="#010101"/>
    <rect x="22" y="4" width="1" height="1" fill="#010101"/>
    <rect x="23" y="4" width="1" height="1" fill="#000000"/>
    <rect x="24" y="4" width="1" height="1" fill="#000000"/>
    <rect x="25" y="4" width="1" height="1" fill="#000000"/>
    <rect x="26" y="4" width="1" height="1" fill="#000000"/>
    <rect x="27" y="4" width="1" height="1" fill="#000000"/>
    <rect x="28" y="4" width="1" height="1" fill="#000000"/>
    <rect x="29" y="4" width="1" height="1" fill="#010101"/>
    <rect x="30" y="4" width="1" height="1" fill="#000000"/>
    <rect x="31" y="4" width="1" height="1" fill="#000000"/>
    <rect x="32" y="4" width="1" height="1" fill="#000000"/>
    <rect x="33" y="4" width="1" height="1" fill="#000000"/>
    <rect x="34" y="4" width="1" height="1" fill="#000000"/>
    <rect x="35" y="4" width="1" height="1" fill="#000000"/>
    <rect x="36" y="4" width="1" height="1" fill="#010101"/>
    <rect x="37" y="4" width="1" height="1" fill="#000000"/>
    <rect x="38" y="4" width="1" height="1" fill="#000000"/>
    <rect x="39" y="4" width="1" height="1" fill="#030303"/>
    <rect x="3" y="5" width="1" height="1" fill="#000000"/>
    <rect x="4" y="5" width="1" height="1" fill="#000000"/>
    <rect x="5" y="5" width="1" height="1" fill="#000000"/>
    <rect x="6" y="5" width="1" height="1" fill="#000000"/>
    <rect x="7" y="5" width="1" height="1" fill="#000000"/>
    <rect x="8" y="5" width="1" height="1" fill="#000000"/>
    <rect x="9" y="5" width="1" height="1" fill="#010101"/>
    <rect x="10" y="5" width="1" height="1" fill="#000000"/>
    <rect x="11" y="5" width="1" height="1" fill="#000000"/>
    <rect x="12" y="5" width="1" height="1" fill="#000000"/>
    <rect x="13" y="5" width="1" height="1" fill="#000000"/>
    <rect x="14" y="5" width="1" height="1" fill="#010101"/>
    <rect x="15" y="5" width="1" height="1" fill="#010101"/>
    <rect x="16" y="5" width="1" height="1" fill="#000000"/>
    <rect x="17" y="5" width="1" height="1" fill="#000000"/>
    <rect x="18" y="5" width="1" height="1" fill="#010101"/>
    <rect x="19" y="5" width="1" height="1" fill="#010101"/>
    <rect x="20" y="5" width="1" height="1" fill="#000000"/>
    <rect x="21" y="5" width="1" height="1" fill="#000000"/>
    <rect x="22" y="5" width="1" height="1" fill="#000000"/>
    <rect x="23" y="5" width="1" height="1" fill="#000000"/>
    <rect x="24" y="5" width="1" height="1" fill="#000000"/>
    <rect x="25" y="5" width="1" height="1" fill="#010101"/>
    <rect x="26" y="5" width="1" height="1" fill="#000000"/>
    <rect x="27" y="5" width="1" height="1" fill="#000000"/>
    <rect x="28" y="5" width="1" height="1" fill="#010101"/>
    <rect x="29" y="5" width="1" height="1" fill="#000000"/>
    <rect x="30" y="5" width="1" height="1" fill="#000000"/>
    <rect x="31" y="5" width="1" height="1" fill="#000000"/>
    <rect x="32" y="5" width="1" height="1" fill="#010101"/>
    <rect x="33" y="5" width="1" height="1" fill="#010101"/>
    <rect x="34" y="5" width="1" height="1" fill="#000000"/>
    <rect x="35" y="5" width="1" height="1" fill="#010101"/>
    <rect x="36" y="5" width="1" height="1" fill="#010101"/>
    <rect x="37" y="5" width="1" height="1" fill="#000000"/>
    <rect x="38" y="5" width="1" height="1" fill="#000000"/>
    <rect x="39" y="5" width="1" height="1" fill="#030303"/>
    <rect x="3" y="6" width="1" height="1" fill="#000000"/>
    <rect x="4" y="6" width="1" height="1" fill="#000000"/>
    <rect x="5" y="6" width="1" height="1" fill="#000000"/>
    <rect x="6" y="6" width="1" height="1" fill="#000000"/>
    <rect x="7" y="6" width="1" height="1" fill="#010101"/>
    <rect x="8" y="6" width="1" height="1" fill="#000000"/>
    <rect x="9" y="6" width="1" height="1" fill="#000000"/>
    <rect x="10" y="6" width="1" height="1" fill="#000000"/>
    <rect x="11" y="6" width="1" height="1" fill="#010101"/>
    <rect x="12" y="6" width="1" height="1" fill="#010101"/>
    <rect x="13" y="6" width="1" height="1" fill="#010101"/>
    <rect x="14" y="6" width="1" height="1" fill="#000000"/>
    <rect x="15" y="6" width="1" height="1" fill="#010101"/>
    <rect x="16" y="6" width="1" height="1" fill="#010101"/>
    <rect x="17" y="6" width="1" height="1" fill="#010101"/>
    <rect x="18" y="6" width="1" height="1" fill="#010101"/>
    <rect x="19" y="6" width="1" height="1" fill="#000000"/>
    <rect x="20" y="6" width="1" height="1" fill="#010101"/>
    <rect x="21" y="6" width="1" height="1" fill="#010101"/>
    <rect x="22" y="6" width="1" height="1" fill="#010101"/>
    <rect x="23" y="6" width="1" height="1" fill="#000000"/>
    <rect x="24" y="6" width="1" height="1" fill="#000000"/>
    <rect x="25" y="6" width="1" height="1" fill="#000000"/>
    <rect x="26" y="6" width="1" height="1" fill="#010101"/>
    <rect x="27" y="6" width="1" height="1" fill="#000000"/>
    <rect x="28" y="6" width="1" height="1" fill="#010101"/>
    <rect x="29" y="6" width="1" height="1" fill="#000000"/>
    <rect x="30" y="6" width="1" height="1" fill="#000000"/>
    <rect x="31" y="6" width="1" height="1" fill="#000000"/>
    <rect x="32" y="6" width="1" height="1" fill="#010101"/>
    <rect x="33" y="6" width="1" height="1" fill="#010101"/>
    <rect x="34" y="6" width="1" height="1" fill="#000000"/>
    <rect x="35" y="6" width="1" height="1" fill="#010101"/>
    <rect x="36" y="6" width="1" height="1" fill="#000000"/>
    <rect x="37" y="6" width="1" height="1" fill="#010101"/>
    <rect x="38" y="6" width="1" height="1" fill="#000000"/>
    <rect x="39" y="6" width="1" height="1" fill="#030303"/>
    <rect x="3" y="7" width="1" height="1" fill="#000000"/>
    <rect x="4" y="7" width="1" height="1" fill="#000000"/>
    <rect x="5" y="7" width="1" height="1" fill="#000000"/>
    <rect x="6" y="7" width="1" height="1" fill="#000000"/>
    <rect x="7" y="7" width="1" height="1" fill="#000000"/>
    <rect x="8" y="7" width="1" height="1" fill="#000000"/>
    <rect x="9" y="7" width="1" height="1" fill="#010101"/>
    <rect x="10" y="7" width="1" height="1" fill="#010101"/>
    <rect x="11" y="7" width="1" height="1" fill="#000000"/>
    <rect x="12" y="7" width="1" height="1" fill="#000000"/>
    <rect x="13" y="7" width="1" height="1" fill="#000000"/>
    <rect x="14" y="7" width="1" height="1" fill="#000000"/>
    <rect x="15" y="7" width="1" height="1" fill="#000000"/>
    <rect x="16" y="7" width="1" height="1" fill="#000000"/>
    <rect x="17" y="7" width="1" height="1" fill="#000000"/>
    <rect x="18" y="7" width="1" height="1" fill="#010101"/>
    <rect x="19" y="7" width="1" height="1" fill="#000000"/>
    <rect x="20" y="7" width="1" height="1" fill="#000000"/>
    <rect x="21" y="7" width="1" height="1" fill="#000000"/>
    <rect x="22" y="7" width="1" height="1" fill="#010101"/>
    <rect x="23" y="7" width="1" height="1" fill="#000000"/>
    <rect x="24" y="7" width="1" height="1" fill="#000000"/>
    <rect x="25" y="7" width="1" height="1" fill="#000000"/>
    <rect x="26" y="7" width="1" height="1" fill="#010101"/>
    <rect x="27" y="7" width="1" height="1" fill="#010101"/>
    <rect x="28" y="7" width="1" height="1" fill="#000000"/>
    <rect x="29" y="7" width="1" height="1" fill="#000000"/>
    <rect x="30" y="7" width="1" height="1" fill="#000000"/>
    <rect x="31" y="7" width="1" height="1" fill="#000000"/>
    <rect x="32" y="7" width="1" height="1" fill="#000000"/>
    <rect x="33" y="7" width="1" height="1" fill="#000000"/>
    <rect x="34" y="7" width="1" height="1" fill="#000000"/>
    <rect x="35" y="7" width="1" height="1" fill="#000000"/>
    <rect x="36" y="7" width="1" height="1" fill="#000000"/>
    <rect x="37" y="7" width="1" height="1" fill="#010101"/>
    <rect x="38" y="7" width="1" height="1" fill="#000000"/>
    <rect x="39" y="7" width="1" height="1" fill="#030303"/>
    <rect x="3" y="8" width="1" height="1" fill="#000000"/>
    <rect x="4" y="8" width="1" height="1" fill="#000000"/>
    <rect x="5" y="8" width="1" height="1" fill="#010101"/>
    <rect x="6" y="8" width="1" height="1" fill="#000000"/>
    <rect x="7" y="8" width="1" height="1" fill="#010101"/>
    <rect x="8" y="8" width="1" height="1" fill="#000000"/>
    <rect x="9" y="8" width="1" height="1" fill="#000000"/>
    <rect x="10" y="8" width="1" height="1" fill="#000000"/>
    <rect x="11" y="8" width="1" height="1" fill="#000000"/>
    <rect x="12" y="8" width="1" height="1" fill="#000000"/>
    <rect x="13" y="8" width="1" height="1" fill="#000000"/>
    <rect x="14" y="8" width="1" height="1" fill="#010101"/>
    <rect x="15" y="8" width="1" height="1" fill="#000000"/>
    <rect x="16" y="8" width="1" height="1" fill="#000000"/>
    <rect x="17" y="8" width="1" height="1" fill="#000000"/>
    <rect x="18" y="8" width="1" height="1" fill="#010101"/>
    <rect x="19" y="8" width="1" height="1" fill="#000000"/>
    <rect x="20" y="8" width="1" height="1" fill="#010101"/>
    <rect x="21" y="8" width="1" height="1" fill="#000000"/>
    <rect x="22" y="8" width="1" height="1" fill="#000000"/>
    <rect x="23" y="8" width="1" height="1" fill="#000000"/>
    <rect x="24" y="8" width="1" height="1" fill="#000000"/>
    <rect x="25" y="8" width="1" height="1" fill="#010101"/>
    <rect x="26" y="8" width="1" height="1" fill="#010101"/>
    <rect x="27" y="8" width="1" height="1" fill="#010101"/>
    <rect x="28" y="8" width="1" height="1" fill="#010101"/>
    <rect x="29" y="8" width="1" height="1" fill="#000000"/>
    <rect x="30" y="8" width="1" height="1" fill="#010101"/>
    <rect x="31" y="8" width="1" height="1" fill="#000000"/>
    <rect x="32" y="8" width="1" height="1" fill="#000000"/>
    <rect x="33" y="8" width="1" height="1" fill="#000000"/>
    <rect x="34" y="8" width="1" height="1" fill="#000000"/>
    <rect x="35" y="8" width="1" height="1" fill="#000000"/>
    <rect x="36" y="8" width="1" height="1" fill="#000000"/>
    <rect x="37" y="8" width="1" height="1" fill="#010101"/>
    <rect x="38" y="8" width="1" height="1" fill="#000000"/>
    <rect x="39" y="8" width="1" height="1" fill="#020202"/>
    <rect x="3" y="9" width="1" height="1" fill="#000000"/>
    <rect x="4" y="9" width="1" height="1" fill="#000000"/>
    <rect x="5" y="9" width="1" height="1" fill="#010101"/>
    <rect x="6" y="9" width="1" height="1" fill="#000000"/>
    <rect x="7" y="9" width="1" height="1" fill="#010101"/>
    <rect x="8" y="9" width="1" height="1" fill="#000000"/>
    <rect x="9" y="9" width="1" height="1" fill="#000000"/>
    <rect x="10" y="9" width="1" height="1" fill="#000000"/>
    <rect x="11" y="9" width="1" height="1" fill="#000000"/>
    <rect x="12" y="9" width="1" height="1" fill="#000000"/>
    <rect x="13" y="9" width="1" height="1" fill="#000000"/>
    <rect x="14" y="9" width="1" height="1" fill="#010101"/>
    <rect x="15" y="9" width="1" height="1" fill="#000000"/>
    <rect x="16" y="9" width="1" height="1" fill="#000000"/>
    <rect x="17" y="9" width="1" height="1" fill="#000000"/>
    <rect x="18" y="9" width="1" height="1" fill="#000000"/>
    <rect x="19" y="9" width="1" height="1" fill="#000000"/>
    <rect x="20" y="9" width="1" height="1" fill="#010101"/>
    <rect x="21" y="9" width="1" height="1" fill="#000000"/>
    <rect x="22" y="9" width="1" height="1" fill="#000000"/>
    <rect x="23" y="9" width="1" height="1" fill="#000000"/>
    <rect x="24" y="9" width="1" height="1" fill="#000000"/>
    <rect x="25" y="9" width="1" height="1" fill="#010101"/>
    <rect x="26" y="9" width="1" height="1" fill="#010101"/>
    <rect x="27" y="9" width="1" height="1" fill="#010101"/>
    <rect x="28" y="9" width="1" height="1" fill="#010101"/>
    <rect x="29" y="9" width="1" height="1" fill="#000000"/>
    <rect x="30" y="9" width="1" height="1" fill="#010101"/>
    <rect x="31" y="9" width="1" height="1" fill="#000000"/>
    <rect x="32" y="9" width="1" height="1" fill="#010101"/>
    <rect x="33" y="9" width="1" height="1" fill="#010101"/>
    <rect x="34" y="9" width="1" height="1" fill="#000000"/>
    <rect x="35" y="9" width="1" height="1" fill="#000000"/>
    <rect x="36" y="9" width="1" height="1" fill="#000000"/>
    <rect x="37" y="9" width="1" height="1" fill="#010101"/>
    <rect x="38" y="9" width="1" height="1" fill="#000000"/>
    <rect x="39" y="9" width="1" height="1" fill="#020202"/>
    <rect x="3" y="10" width="1" height="1" fill="#000000"/>
    <rect x="4" y="10" width="1" height="1" fill="#000000"/>
    <rect x="5" y="10" width="1" height="1" fill="#000000"/>
    <rect x="6" y="10" width="1" height="1" fill="#000000"/>
    <rect x="7" y="10" width="1" height="1" fill="#000000"/>
    <rect x="8" y="10" width="1" height="1" fill="#000000"/>
    <rect x="9" y="10" width="1" height="1" fill="#010101"/>
    <rect x="10" y="10" width="1" height="1" fill="#000000"/>
    <rect x="11" y="10" width="1" height="1" fill="#010101"/>
    <rect x="12" y="10" width="1" height="1" fill="#000000"/>
    <rect x="13" y="10" width="1" height="1" fill="#000000"/>
    <rect x="14" y="10" width="1" height="1" fill="#000000"/>
    <rect x="15" y="10" width="1" height="1" fill="#000000"/>
    <rect x="16" y="10" width="1" height="1" fill="#000000"/>
    <rect x="17" y="10" width="1" height="1" fill="#000000"/>
    <rect x="18" y="10" width="1" height="1" fill="#010101"/>
    <rect x="19" y="10" width="1" height="1" fill="#000000"/>
    <rect x="20" y="10" width="1" height="1" fill="#010101"/>
    <rect x="21" y="10" width="1" height="1" fill="#000000"/>
    <rect x="22" y="10" width="1" height="1" fill="#010101"/>
    <rect x="23" y="10" width="1" height="1" fill="#010101"/>
    <rect x="24" y="10" width="1" height="1" fill="#010101"/>
    <rect x="25" y="10" width="1" height="1" fill="#000000"/>
    <rect x="26" y="10" width="1" height="1" fill="#010101"/>
    <rect x="27" y="10" width="1" height="1" fill="#000000"/>
    <rect x="28" y="10" width="1" height="1" fill="#000000"/>
    <rect x="29" y="10" width="1" height="1" fill="#010101"/>
    <rect x="30" y="10" width="1" height="1" fill="#000000"/>
    <rect x="31" y="10" width="1" height="1" fill="#010101"/>
    <rect x="32" y="10" width="1" height="1" fill="#010101"/>
    <rect x="33" y="10" width="1" height="1" fill="#010101"/>
    <rect x="34" y="10" width="1" height="1" fill="#000000"/>
    <rect x="35" y="10" width="1" height="1" fill="#000000"/>
    <rect x="36" y="10" width="1" height="1" fill="#000000"/>
    <rect x="37" y="10" width="1" height="1" fill="#000000"/>
    <rect x="38" y="10" width="1" height="1" fill="#000000"/>
    <rect x="39" y="10" width="1" height="1" fill="#030303"/>
    <rect x="3" y="11" width="1" height="1" fill="#000000"/>
    <rect x="4" y="11" width="1" height="1" fill="#010101"/>
    <rect x="5" y="11" width="1" height="1" fill="#000000"/>
    <rect x="6" y="11" width="1" height="1" fill="#000000"/>
    <rect x="7" y="11" width="1" height="1" fill="#000000"/>
    <rect x="8" y="11" width="1" height="1" fill="#010101"/>
    <rect x="9" y="11" width="1" height="1" fill="#000000"/>
    <rect x="10" y="11" width="1" height="1" fill="#000000"/>
    <rect x="11" y="11" width="1" height="1" fill="#000000"/>
    <rect x="12" y="11" width="1" height="1" fill="#000000"/>
    <rect x="13" y="11" width="1" height="1" fill="#000000"/>
    <rect x="14" y="11" width="1" height="1" fill="#000000"/>
    <rect x="15" y="11" width="1" height="1" fill="#010101"/>
    <rect x="16" y="11" width="1" height="1" fill="#000000"/>
    <rect x="17" y="11" width="1" height="1" fill="#000000"/>
    <rect x="18" y="11" width="1" height="1" fill="#000000"/>
    <rect x="19" y="11" width="1" height="1" fill="#000000"/>
    <rect x="20" y="11" width="1" height="1" fill="#010101"/>
    <rect x="21" y="11" width="1" height="1" fill="#000000"/>
    <rect x="22" y="11" width="1" height="1" fill="#000000"/>
    <rect x="23" y="11" width="1" height="1" fill="#010101"/>
    <rect x="24" y="11" width="1" height="1" fill="#000000"/>
    <rect x="25" y="11" width="1" height="1" fill="#010101"/>
    <rect x="26" y="11" width="1" height="1" fill="#000000"/>
    <rect x="27" y="11" width="1" height="1" fill="#010101"/>
    <rect x="28" y="11" width="1" height="1" fill="#010101"/>
    <rect x="29" y="11" width="1" height="1" fill="#010101"/>
    <rect x="30" y="11" width="1" height="1" fill="#010101"/>
    <rect x="31" y="11" width="1" height="1" fill="#000000"/>
    <rect x="32" y="11" width="1" height="1" fill="#000000"/>
    <rect x="33" y="11" width="1" height="1" fill="#000000"/>
    <rect x="34" y="11" width="1" height="1" fill="#000000"/>
    <rect x="35" y="11" width="1" height="1" fill="#000000"/>
    <rect x="36" y="11" width="1" height="1" fill="#000000"/>
    <rect x="37" y="11" width="1" height="1" fill="#000000"/>
    <rect x="38" y="11" width="1" height="1" fill="#000000"/>
    <rect x="39" y="11" width="1" height="1" fill="#020202"/>
    <rect x="3" y="12" width="1" height="1" fill="#000000"/>
    <rect x="4" y="12" width="1" height="1" fill="#010101"/>
    <rect x="5" y="12" width="1" height="1" fill="#000000"/>
    <rect x="6" y="12" width="1" height="1" fill="#000000"/>
    <rect x="7" y="12" width="1" height="1" fill="#010101"/>
    <rect x="8" y="12" width="1" height="1" fill="#000000"/>
    <rect x="9" y="12" width="1" height="1" fill="#000000"/>
    <rect x="10" y="12" width="1" height="1" fill="#000000"/>
    <rect x="11" y="12" width="1" height="1" fill="#010101"/>
    <rect x="12" y="12" width="1" height="1" fill="#000100"/>
    <rect x="13" y="12" width="1" height="1" fill="#000000"/>
    <rect x="14" y="12" width="1" height="1" fill="#010103"/>
    <rect x="15" y="12" width="1" height="1" fill="#000205"/>
    <rect x="16" y="12" width="1" height="1" fill="#010000"/>
    <rect x="17" y="12" width="1" height="1" fill="#000000"/>
    <rect x="18" y="12" width="1" height="1" fill="#010101"/>
    <rect x="19" y="12" width="1" height="1" fill="#000000"/>
    <rect x="20" y="12" width="1" height="1" fill="#010101"/>
    <rect x="21" y="12" width="1" height="1" fill="#010101"/>
    <rect x="22" y="12" width="1" height="1" fill="#010101"/>
    <rect x="23" y="12" width="1" height="1" fill="#010101"/>
    <rect x="24" y="12" width="1" height="1" fill="#000000"/>
    <rect x="25" y="12" width="1" height="1" fill="#000000"/>
    <rect x="26" y="12" width="1" height="1" fill="#000000"/>
    <rect x="27" y="12" width="1" height="1" fill="#000000"/>
    <rect x="28" y="12" width="1" height="1" fill="#010101"/>
    <rect x="29" y="12" width="1" height="1" fill="#000000"/>
    <rect x="30" y="12" width="1" height="1" fill="#000000"/>
    <rect x="31" y="12" width="1" height="1" fill="#010101"/>
    <rect x="32" y="12" width="1" height="1" fill="#000000"/>
    <rect x="33" y="12" width="1" height="1" fill="#000000"/>
    <rect x="34" y="12" width="1" height="1" fill="#000000"/>
    <rect x="35" y="12" width="1" height="1" fill="#000000"/>
    <rect x="36" y="12" width="1" height="1" fill="#000000"/>
    <rect x="37" y="12" width="1" height="1" fill="#010101"/>
    <rect x="38" y="12" width="1" height="1" fill="#000000"/>
    <rect x="39" y="12" width="1" height="1" fill="#030303"/>
    <rect x="3" y="13" width="1" height="1" fill="#000000"/>
    <rect x="4" y="13" width="1" height="1" fill="#000000"/>
    <rect x="5" y="13" width="1" height="1" fill="#000000"/>
    <rect x="6" y="13" width="1" height="1" fill="#000000"/>
    <rect x="7" y="13" width="1" height="1" fill="#000000"/>
    <rect x="8" y="13" width="1" height="1" fill="#000000"/>
    <rect x="9" y="13" width="1" height="1" fill="#010101"/>
    <rect x="10" y="13" width="1" height="1" fill="#000000"/>
    <rect x="11" y="13" width="1" height="1" fill="#000000"/>
    <rect x="12" y="13" width="1" height="1" fill="#010103"/>
    <rect x="13" y="13" width="1" height="1" fill="#e8ad9b"/>
    <rect x="14" y="13" width="1" height="1" fill="#ee9b89"/>
    <rect x="15" y="13" width="1" height="1" fill="#f1a082"/>
    <rect x="16" y="13" width="1" height="1" fill="#050503"/>
    <rect x="17" y="13" width="1" height="1" fill="#010101"/>
    <rect x="18" y="13" width="1" height="1" fill="#010101"/>
    <rect x="19" y="13" width="1" height="1" fill="#000000"/>
    <rect x="20" y="13" width="1" height="1" fill="#000000"/>
    <rect x="21" y="13" width="1" height="1" fill="#000000"/>
    <rect x="22" y="13" width="1" height="1" fill="#000000"/>
    <rect x="23" y="13" width="1" height="1" fill="#000000"/>
    <rect x="24" y="13" width="1" height="1" fill="#000000"/>
    <rect x="25" y="13" width="1" height="1" fill="#000000"/>
    <rect x="26" y="13" width="1" height="1" fill="#000000"/>
    <rect x="27" y="13" width="1" height="1" fill="#000000"/>
    <rect x="28" y="13" width="1" height="1" fill="#000000"/>
    <rect x="29" y="13" width="1" height="1" fill="#000000"/>
    <rect x="30" y="13" width="1" height="1" fill="#000000"/>
    <rect x="31" y="13" width="1" height="1" fill="#000000"/>
    <rect x="32" y="13" width="1" height="1" fill="#000000"/>
    <rect x="33" y="13" width="1" height="1" fill="#000000"/>
    <rect x="34" y="13" width="1" height="1" fill="#000000"/>
    <rect x="35" y="13" width="1" height="1" fill="#000000"/>
    <rect x="36" y="13" width="1" height="1" fill="#000000"/>
    <rect x="37" y="13" width="1" height="1" fill="#010101"/>
    <rect x="38" y="13" width="1" height="1" fill="#000000"/>
    <rect x="39" y="13" width="1" height="1" fill="#030303"/>
    <rect x="3" y="14" width="1" height="1" fill="#000000"/>
    <rect x="4" y="14" width="1" height="1" fill="#000000"/>
    <rect x="5" y="14" width="1" height="1" fill="#000000"/>
    <rect x="6" y="14" width="1" height="1" fill="#010101"/>
    <rect x="7" y="14" width="1" height="1" fill="#000000"/>
    <rect x="8" y="14" width="1" height="1" fill="#000000"/>
    <rect x="9" y="14" width="1" height="1" fill="#000000"/>
    <rect x="10" y="14" width="1" height="1" fill="#000000"/>
    <rect x="11" y="14" width="1" height="1" fill="#000000"/>
    <rect x="12" y="14" width="1" height="1" fill="#040001"/>
    <rect x="13" y="14" width="1" height="1" fill="#f3ab92"/>
    <rect x="14" y="14" width="1" height="1" fill="#faa483"/>
    <rect x="15" y="14" width="1" height="1" fill="#f2a788"/>
    <rect x="16" y="14" width="1" height="1" fill="#090504"/>
    <rect x="17" y="14" width="1" height="1" fill="#010000"/>
    <rect x="18" y="14" width="1" height="1" fill="#000000"/>
    <rect x="19" y="14" width="1" height="1" fill="#000000"/>
    <rect x="20" y="14" width="1" height="1" fill="#000000"/>
    <rect x="21" y="14" width="1" height="1" fill="#000000"/>
    <rect x="22" y="14" width="1" height="1" fill="#000000"/>
    <rect x="23" y="14" width="1" height="1" fill="#000000"/>
    <rect x="24" y="14" width="1" height="1" fill="#000000"/>
    <rect x="25" y="14" width="1" height="1" fill="#000000"/>
    <rect x="26" y="14" width="1" height="1" fill="#000000"/>
    <rect x="27" y="14" width="1" height="1" fill="#000000"/>
    <rect x="28" y="14" width="1" height="1" fill="#000000"/>
    <rect x="29" y="14" width="1" height="1" fill="#000000"/>
    <rect x="30" y="14" width="1" height="1" fill="#000000"/>
    <rect x="31" y="14" width="1" height="1" fill="#010101"/>
    <rect x="32" y="14" width="1" height="1" fill="#000000"/>
    <rect x="33" y="14" width="1" height="1" fill="#000000"/>
    <rect x="34" y="14" width="1" height="1" fill="#000000"/>
    <rect x="35" y="14" width="1" height="1" fill="#000000"/>
    <rect x="36" y="14" width="1" height="1" fill="#000000"/>
    <rect x="37" y="14" width="1" height="1" fill="#000000"/>
    <rect x="38" y="14" width="1" height="1" fill="#000000"/>
    <rect x="39" y="14" width="1" height="1" fill="#020202"/>
    <rect x="3" y="15" width="1" height="1" fill="#000000"/>
    <rect x="4" y="15" width="1" height="1" fill="#000000"/>
    <rect x="5" y="15" width="1" height="1" fill="#000000"/>
    <rect x="6" y="15" width="1" height="1" fill="#010101"/>
    <rect x="7" y="15" width="1" height="1" fill="#000000"/>
    <rect x="8" y="15" width="1" height="1" fill="#000000"/>
    <rect x="9" y="15" width="1" height="1" fill="#000000"/>
    <rect x="10" y="15" width="1" height="1" fill="#010101"/>
    <rect x="11" y="15" width="1" height="1" fill="#000000"/>
    <rect x="12" y="15" width="1" height="1" fill="#040001"/>
    <rect x="13" y="15" width="1" height="1" fill="#f8b097"/>
    <rect x="14" y="15" width="1" height="1" fill="#fca685"/>
    <rect x="15" y="15" width="1" height="1" fill="#eda283"/>
    <rect x="16" y="15" width="1" height="1" fill="#0a0605"/>
    <rect x="17" y="15" width="1" height="1" fill="#020100"/>
    <rect x="18" y="15" width="1" height="1" fill="#020200"/>
    <rect x="19" y="15" width="1" height="1" fill="#020202"/>
    <rect x="20" y="15" width="1" height="1" fill="#010101"/>
    <rect x="21" y="15" width="1" height="1" fill="#010101"/>
    <rect x="22" y="15" width="1" height="1" fill="#010101"/>
    <rect x="23" y="15" width="1" height="1" fill="#010101"/>
    <rect x="24" y="15" width="1" height="1" fill="#020202"/>
    <rect x="25" y="15" width="1" height="1" fill="#010101"/>
    <rect x="26" y="15" width="1" height="1" fill="#020202"/>
    <rect x="27" y="15" width="1" height="1" fill="#010101"/>
    <rect x="28" y="15" width="1" height="1" fill="#010101"/>
    <rect x="29" y="15" width="1" height="1" fill="#020202"/>
    <rect x="30" y="15" width="1" height="1" fill="#020202"/>
    <rect x="31" y="15" width="1" height="1" fill="#020202"/>
    <rect x="32" y="15" width="1" height="1" fill="#010101"/>
    <rect x="33" y="15" width="1" height="1" fill="#010101"/>
    <rect x="34" y="15" width="1" height="1" fill="#010101"/>
    <rect x="35" y="15" width="1" height="1" fill="#010101"/>
    <rect x="36" y="15" width="1" height="1" fill="#010101"/>
    <rect x="37" y="15" width="1" height="1" fill="#010101"/>
    <rect x="38" y="15" width="1" height="1" fill="#010101"/>
    <rect x="39" y="15" width="1" height="1" fill="#030303"/>
    <rect x="3" y="16" width="1" height="1" fill="#000000"/>
    <rect x="4" y="16" width="1" height="1" fill="#000000"/>
    <rect x="5" y="16" width="1" height="1" fill="#000000"/>
    <rect x="6" y="16" width="1" height="1" fill="#000000"/>
    <rect x="7" y="16" width="1" height="1" fill="#010101"/>
    <rect x="8" y="16" width="1" height="1" fill="#000000"/>
    <rect x="9" y="16" width="1" height="1" fill="#000000"/>
    <rect x="10" y="16" width="1" height="1" fill="#000000"/>
    <rect x="11" y="16" width="1" height="1" fill="#000000"/>
    <rect x="12" y="16" width="1" height="1" fill="#010100"/>
    <rect x="13" y="16" width="1" height="1" fill="#f9b199"/>
    <rect x="14" y="16" width="1" height="1" fill="#f5a58a"/>
    <rect x="15" y="16" width="1" height="1" fill="#f9a487"/>
    <rect x="16" y="16" width="1" height="1" fill="#fca88c"/>
    <rect x="17" y="16" width="1" height="1" fill="#f9aa8b"/>
    <rect x="18" y="16" width="1" height="1" fill="#f9a88a"/>
    <rect x="19" y="16" width="1" height="1" fill="#fba88a"/>
    <rect x="20" y="16" width="1" height="1" fill="#fba88a"/>
    <rect x="21" y="16" width="1" height="1" fill="#faa98b"/>
    <rect x="22" y="16" width="1" height="1" fill="#f9a88a"/>
    <rect x="23" y="16" width="1" height="1" fill="#f9a88a"/>
    <rect x="24" y="16" width="1" height="1" fill="#f7a688"/>
    <rect x="25" y="16" width="1" height="1" fill="#f8a789"/>
    <rect x="26" y="16" width="1" height="1" fill="#f8a789"/>
    <rect x="27" y="16" width="1" height="1" fill="#faa789"/>
    <rect x="28" y="16" width="1" height="1" fill="#faa789"/>
    <rect x="29" y="16" width="1" height="1" fill="#f9a88a"/>
    <rect x="30" y="16" width="1" height="1" fill="#f8a789"/>
    <rect x="31" y="16" width="1" height="1" fill="#faa588"/>
    <rect x="32" y="16" width="1" height="1" fill="#f8a587"/>
    <rect x="33" y="16" width="1" height="1" fill="#fda98f"/>
    <rect x="34" y="16" width="1" height="1" fill="#f5baac"/>
    <rect x="35" y="16" width="1" height="1" fill="#000503"/>
    <rect x="36" y="16" width="1" height="1" fill="#040301"/>
    <rect x="3" y="17" width="1" height="1" fill="#000000"/>
    <rect x="4" y="17" width="1" height="1" fill="#000000"/>
    <rect x="5" y="17" width="1" height="1" fill="#010101"/>
    <rect x="6" y="17" width="1" height="1" fill="#010101"/>
    <rect x="7" y="17" width="1" height="1" fill="#000000"/>
    <rect x="8" y="17" width="1" height="1" fill="#000000"/>
    <rect x="9" y="17" width="1" height="1" fill="#000000"/>
    <rect x="10" y="17" width="1" height="1" fill="#000000"/>
    <rect x="11" y="17" width="1" height="1" fill="#000000"/>
    <rect x="12" y="17" width="1" height="1" fill="#010100"/>
    <rect x="13" y="17" width="1" height="1" fill="#f8b098"/>
    <rect x="14" y="17" width="1" height="1" fill="#f8a789"/>
    <rect x="15" y="17" width="1" height="1" fill="#faa68e"/>
    <rect x="16" y="17" width="1" height="1" fill="#f5aa8b"/>
    <rect x="17" y="17" width="1" height="1" fill="#f5aa8a"/>
    <rect x="18" y="17" width="1" height="1" fill="#f4a989"/>
    <rect x="19" y="17" width="1" height="1" fill="#f5aa8a"/>
    <rect x="20" y="17" width="1" height="1" fill="#f4a989"/>
    <rect x="21" y="17" width="1" height="1" fill="#f6aa8a"/>
    <rect x="22" y="17" width="1" height="1" fill="#f6aa8a"/>
    <rect x="23" y="17" width="1" height="1" fill="#f7aa8c"/>
    <rect x="24" y="17" width="1" height="1" fill="#f6a98b"/>
    <rect x="25" y="17" width="1" height="1" fill="#f7ab8b"/>
    <rect x="26" y="17" width="1" height="1" fill="#f6aa8a"/>
    <rect x="27" y="17" width="1" height="1" fill="#f5aa8a"/>
    <rect x="28" y="17" width="1" height="1" fill="#f6ab8b"/>
    <rect x="29" y="17" width="1" height="1" fill="#f6aa8a"/>
    <rect x="30" y="17" width="1" height="1" fill="#f5a989"/>
    <rect x="31" y="17" width="1" height="1" fill="#f5aa8a"/>
    <rect x="32" y="17" width="1" height="1" fill="#f7ab8b"/>
    <rect x="33" y="17" width="1" height="1" fill="#f5a487"/>
    <rect x="34" y="17" width="1" height="1" fill="#f6b7a6"/>
    <rect x="35" y="17" width="1" height="1" fill="#030502"/>
    <rect x="36" y="17" width="1" height="1" fill="#060503"/>
    <rect x="3" y="18" width="1" height="1" fill="#000100"/>
    <rect x="4" y="18" width="1" height="1" fill="#000002"/>
    <rect x="5" y="18" width="1" height="1" fill="#0f0000"/>
    <rect x="6" y="18" width="1" height="1" fill="#010000"/>
    <rect x="7" y="18" width="1" height="1" fill="#000100"/>
    <rect x="8" y="18" width="1" height="1" fill="#020100"/>
    <rect x="9" y="18" width="1" height="1" fill="#000000"/>
    <rect x="10" y="18" width="1" height="1" fill="#000000"/>
    <rect x="11" y="18" width="1" height="1" fill="#000000"/>
    <rect x="12" y="18" width="1" height="1" fill="#010101"/>
    <rect x="13" y="18" width="1" height="1" fill="#f8b098"/>
    <rect x="14" y="18" width="1" height="1" fill="#f7a689"/>
    <rect x="15" y="18" width="1" height="1" fill="#f9a88d"/>
    <rect x="16" y="18" width="1" height="1" fill="#f9a88d"/>
    <rect x="17" y="18" width="1" height="1" fill="#f8a78c"/>
    <rect x="18" y="18" width="1" height="1" fill="#faa98e"/>
    <rect x="19" y="18" width="1" height="1" fill="#f9a98e"/>
    <rect x="20" y="18" width="1" height="1" fill="#f8a88d"/>
    <rect x="21" y="18" width="1" height="1" fill="#f8a690"/>
    <rect x="22" y="18" width="1" height="1" fill="#f6af9d"/>
    <rect x="23" y="18" width="1" height="1" fill="#f2a396"/>
    <rect x="24" y="18" width="1" height="1" fill="#ffa186"/>
    <rect x="25" y="18" width="1" height="1" fill="#f8a88d"/>
    <rect x="26" y="18" width="1" height="1" fill="#faaa8f"/>
    <rect x="27" y="18" width="1" height="1" fill="#f8a88d"/>
    <rect x="28" y="18" width="1" height="1" fill="#f7a78c"/>
    <rect x="29" y="18" width="1" height="1" fill="#f8a88d"/>
    <rect x="30" y="18" width="1" height="1" fill="#faaa8f"/>
    <rect x="31" y="18" width="1" height="1" fill="#ffae94"/>
    <rect x="32" y="18" width="1" height="1" fill="#f1ad9a"/>
    <rect x="33" y="18" width="1" height="1" fill="#eeaf9e"/>
    <rect x="34" y="18" width="1" height="1" fill="#e8b2a6"/>
    <rect x="35" y="18" width="1" height="1" fill="#0c0002"/>
    <rect x="36" y="18" width="1" height="1" fill="#040404"/>
    <rect x="3" y="19" width="1" height="1" fill="#010200"/>
    <rect x="4" y="19" width="1" height="1" fill="#070200"/>
    <rect x="5" y="19" width="1" height="1" fill="#f7b59f"/>
    <rect x="6" y="19" width="1" height="1" fill="#f79f89"/>
    <rect x="7" y="19" width="1" height="1" fill="#f49c88"/>
    <rect x="8" y="19" width="1" height="1" fill="#050402"/>
    <rect x="9" y="19" width="1" height="1" fill="#000000"/>
    <rect x="10" y="19" width="1" height="1" fill="#000000"/>
    <rect x="11" y="19" width="1" height="1" fill="#000000"/>
    <rect x="12" y="19" width="1" height="1" fill="#010101"/>
    <rect x="13" y="19" width="1" height="1" fill="#f7af97"/>
    <rect x="14" y="19" width="1" height="1" fill="#f8a78a"/>
    <rect x="15" y="19" width="1" height="1" fill="#f9a88d"/>
    <rect x="16" y="19" width="1" height="1" fill="#f9a88d"/>
    <rect x="17" y="19" width="1" height="1" fill="#f9a88d"/>
    <rect x="18" y="19" width="1" height="1" fill="#f9a88d"/>
    <rect x="19" y="19" width="1" height="1" fill="#f9a98e"/>
    <rect x="20" y="19" width="1" height="1" fill="#f8a88d"/>
    <rect x="21" y="19" width="1" height="1" fill="#7d4e46"/>
    <rect x="22" y="19" width="1" height="1" fill="#070003"/>
    <rect x="23" y="19" width="1" height="1" fill="#040108"/>
    <rect x="24" y="19" width="1" height="1" fill="#fba594"/>
    <rect x="25" y="19" width="1" height="1" fill="#f8a88d"/>
    <rect x="26" y="19" width="1" height="1" fill="#f8a88d"/>
    <rect x="27" y="19" width="1" height="1" fill="#f8a88d"/>
    <rect x="28" y="19" width="1" height="1" fill="#f8a88d"/>
    <rect x="29" y="19" width="1" height="1" fill="#f8a88d"/>
    <rect x="30" y="19" width="1" height="1" fill="#f8a88d"/>
    <rect x="31" y="19" width="1" height="1" fill="#f8a08a"/>
    <rect x="32" y="19" width="1" height="1" fill="#080206"/>
    <rect x="33" y="19" width="1" height="1" fill="#040001"/>
    <rect x="34" y="19" width="1" height="1" fill="#010000"/>
    <rect x="35" y="19" width="1" height="1" fill="#030002"/>
    <rect x="36" y="19" width="1" height="1" fill="#030303"/>
    <rect x="3" y="20" width="1" height="1" fill="#000000"/>
    <rect x="4" y="20" width="1" height="1" fill="#000100"/>
    <rect x="5" y="20" width="1" height="1" fill="#f7b3a0"/>
    <rect x="6" y="20" width="1" height="1" fill="#f9a388"/>
    <rect x="7" y="20" width="1" height="1" fill="#f8a68e"/>
    <rect x="8" y="20" width="1" height="1" fill="#040301"/>
    <rect x="9" y="20" width="1" height="1" fill="#000000"/>
    <rect x="10" y="20" width="1" height="1" fill="#000000"/>
    <rect x="11" y="20" width="1" height="1" fill="#000000"/>
    <rect x="12" y="20" width="1" height="1" fill="#020202"/>
    <rect x="13" y="20" width="1" height="1" fill="#fab29a"/>
    <rect x="14" y="20" width="1" height="1" fill="#f9a88b"/>
    <rect x="15" y="20" width="1" height="1" fill="#f9a88d"/>
    <rect x="16" y="20" width="1" height="1" fill="#f8a88d"/>
    <rect x="17" y="20" width="1" height="1" fill="#f8a88d"/>
    <rect x="18" y="20" width="1" height="1" fill="#f8a88d"/>
    <rect x="19" y="20" width="1" height="1" fill="#f8a88d"/>
    <rect x="20" y="20" width="1" height="1" fill="#f8a88d"/>
    <rect x="21" y="20" width="1" height="1" fill="#795442"/>
    <rect x="22" y="20" width="1" height="1" fill="#000100"/>
    <rect x="23" y="20" width="1" height="1" fill="#010100"/>
    <rect x="24" y="20" width="1" height="1" fill="#f9aa8c"/>
    <rect x="25" y="20" width="1" height="1" fill="#f8a88d"/>
    <rect x="26" y="20" width="1" height="1" fill="#f8a88d"/>
    <rect x="27" y="20" width="1" height="1" fill="#f8a88d"/>
    <rect x="28" y="20" width="1" height="1" fill="#f8a88d"/>
    <rect x="29" y="20" width="1" height="1" fill="#f8a88d"/>
    <rect x="30" y="20" width="1" height="1" fill="#f8a88d"/>
    <rect x="31" y="20" width="1" height="1" fill="#f7a688"/>
    <rect x="32" y="20" width="1" height="1" fill="#090305"/>
    <rect x="33" y="20" width="1" height="1" fill="#040001"/>
    <rect x="34" y="20" width="1" height="1" fill="#010101"/>
    <rect x="35" y="20" width="1" height="1" fill="#000000"/>
    <rect x="36" y="20" width="1" height="1" fill="#030303"/>
    <rect x="3" y="21" width="1" height="1" fill="#000000"/>
    <rect x="4" y="21" width="1" height="1" fill="#000100"/>
    <rect x="5" y="21" width="1" height="1" fill="#f8b4a1"/>
    <rect x="6" y="21" width="1" height="1" fill="#f8a488"/>
    <rect x="7" y="21" width="1" height="1" fill="#f6a68d"/>
    <rect x="8" y="21" width="1" height="1" fill="#030200"/>
    <rect x="9" y="21" width="1" height="1" fill="#000000"/>
    <rect x="10" y="21" width="1" height="1" fill="#000000"/>
    <rect x="11" y="21" width="1" height="1" fill="#000000"/>
    <rect x="12" y="21" width="1" height="1" fill="#020202"/>
    <rect x="13" y="21" width="1" height="1" fill="#fbb39b"/>
    <rect x="14" y="21" width="1" height="1" fill="#f9a88b"/>
    <rect x="15" y="21" width="1" height="1" fill="#f9a88d"/>
    <rect x="16" y="21" width="1" height="1" fill="#f7a78c"/>
    <rect x="17" y="21" width="1" height="1" fill="#f9a98e"/>
    <rect x="18" y="21" width="1" height="1" fill="#f8a88d"/>
    <rect x="19" y="21" width="1" height="1" fill="#f8a88d"/>
    <rect x="20" y="21" width="1" height="1" fill="#f8a88d"/>
    <rect x="21" y="21" width="1" height="1" fill="#785341"/>
    <rect x="22" y="21" width="1" height="1" fill="#000100"/>
    <rect x="23" y="21" width="1" height="1" fill="#010100"/>
    <rect x="24" y="21" width="1" height="1" fill="#f9aa8c"/>
    <rect x="25" y="21" width="1" height="1" fill="#f8a88d"/>
    <rect x="26" y="21" width="1" height="1" fill="#f8a88d"/>
    <rect x="27" y="21" width="1" height="1" fill="#f8a88d"/>
    <rect x="28" y="21" width="1" height="1" fill="#f8a88d"/>
    <rect x="29" y="21" width="1" height="1" fill="#f9a98e"/>
    <rect x="30" y="21" width="1" height="1" fill="#f7a78c"/>
    <rect x="31" y="21" width="1" height="1" fill="#f6a587"/>
    <rect x="32" y="21" width="1" height="1" fill="#080204"/>
    <rect x="33" y="21" width="1" height="1" fill="#030000"/>
    <rect x="34" y="21" width="1" height="1" fill="#000000"/>
    <rect x="35" y="21" width="1" height="1" fill="#000000"/>
    <rect x="36" y="21" width="1" height="1" fill="#030303"/>
    <rect x="3" y="22" width="1" height="1" fill="#000000"/>
    <rect x="4" y="22" width="1" height="1" fill="#000100"/>
    <rect x="5" y="22" width="1" height="1" fill="#f6b3a0"/>
    <rect x="6" y="22" width="1" height="1" fill="#f9a487"/>
    <rect x="7" y="22" width="1" height="1" fill="#f8ab91"/>
    <rect x="8" y="22" width="1" height="1" fill="#060503"/>
    <rect x="9" y="22" width="1" height="1" fill="#010100"/>
    <rect x="10" y="22" width="1" height="1" fill="#000201"/>
    <rect x="11" y="22" width="1" height="1" fill="#000100"/>
    <rect x="12" y="22" width="1" height="1" fill="#040000"/>
    <rect x="13" y="22" width="1" height="1" fill="#f3af98"/>
    <rect x="14" y="22" width="1" height="1" fill="#f8a88d"/>
    <rect x="15" y="22" width="1" height="1" fill="#f8a88d"/>
    <rect x="16" y="22" width="1" height="1" fill="#f8a88d"/>
    <rect x="17" y="22" width="1" height="1" fill="#f8a88d"/>
    <rect x="18" y="22" width="1" height="1" fill="#f9a98e"/>
    <rect x="19" y="22" width="1" height="1" fill="#f9a98e"/>
    <rect x="20" y="22" width="1" height="1" fill="#f9a98e"/>
    <rect x="21" y="22" width="1" height="1" fill="#7a5044"/>
    <rect x="22" y="22" width="1" height="1" fill="#070000"/>
    <rect x="23" y="22" width="1" height="1" fill="#060004"/>
    <rect x="24" y="22" width="1" height="1" fill="#f3a68a"/>
    <rect x="25" y="22" width="1" height="1" fill="#f7a78c"/>
    <rect x="26" y="22" width="1" height="1" fill="#f8a88d"/>
    <rect x="27" y="22" width="1" height="1" fill="#f8a88d"/>
    <rect x="28" y="22" width="1" height="1" fill="#f7a78c"/>
    <rect x="29" y="22" width="1" height="1" fill="#f6a68b"/>
    <rect x="30" y="22" width="1" height="1" fill="#f7a78c"/>
    <rect x="31" y="22" width="1" height="1" fill="#f6ac89"/>
    <rect x="32" y="22" width="1" height="1" fill="#090303"/>
    <rect x="33" y="22" width="1" height="1" fill="#060000"/>
    <rect x="34" y="22" width="1" height="1" fill="#000000"/>
    <rect x="35" y="22" width="1" height="1" fill="#000100"/>
    <rect x="36" y="22" width="1" height="1" fill="#030301"/>
    <rect x="3" y="23" width="1" height="1" fill="#000000"/>
    <rect x="4" y="23" width="1" height="1" fill="#000100"/>
    <rect x="5" y="23" width="1" height="1" fill="#f8b5a2"/>
    <rect x="6" y="23" width="1" height="1" fill="#f8a48a"/>
    <rect x="7" y="23" width="1" height="1" fill="#f2a184"/>
    <rect x="8" y="23" width="1" height="1" fill="#5e4332"/>
    <rect x="9" y="23" width="1" height="1" fill="#614736"/>
    <rect x="10" y="23" width="1" height="1" fill="#5f4234"/>
    <rect x="11" y="23" width="1" height="1" fill="#5f4234"/>
    <rect x="12" y="23" width="1" height="1" fill="#634b3f"/>
    <rect x="13" y="23" width="1" height="1" fill="#fab2a3"/>
    <rect x="14" y="23" width="1" height="1" fill="#fba78d"/>
    <rect x="15" y="23" width="1" height="1" fill="#f8a88d"/>
    <rect x="16" y="23" width="1" height="1" fill="#faaa8f"/>
    <rect x="17" y="23" width="1" height="1" fill="#faaa8f"/>
    <rect x="18" y="23" width="1" height="1" fill="#f9a98e"/>
    <rect x="19" y="23" width="1" height="1" fill="#f9a98e"/>
    <rect x="20" y="23" width="1" height="1" fill="#f8a88d"/>
    <rect x="21" y="23" width="1" height="1" fill="#a66957"/>
    <rect x="22" y="23" width="1" height="1" fill="#5b3b2e"/>
    <rect x="23" y="23" width="1" height="1" fill="#644239"/>
    <rect x="24" y="23" width="1" height="1" fill="#fda894"/>
    <rect x="25" y="23" width="1" height="1" fill="#f8a88d"/>
    <rect x="26" y="23" width="1" height="1" fill="#f7a78c"/>
    <rect x="27" y="23" width="1" height="1" fill="#f6a68b"/>
    <rect x="28" y="23" width="1" height="1" fill="#f7a78c"/>
    <rect x="29" y="23" width="1" height="1" fill="#f7a78c"/>
    <rect x="30" y="23" width="1" height="1" fill="#f8a88d"/>
    <rect x="31" y="23" width="1" height="1" fill="#f29e84"/>
    <rect x="32" y="23" width="1" height="1" fill="#613b30"/>
    <rect x="33" y="23" width="1" height="1" fill="#5d3c33"/>
    <rect x="34" y="23" width="1" height="1" fill="#644644"/>
    <rect x="35" y="23" width="1" height="1" fill="#060006"/>
    <rect x="36" y="23" width="1" height="1" fill="#030301"/>
    <rect x="3" y="24" width="1" height="1" fill="#010200"/>
    <rect x="4" y="24" width="1" height="1" fill="#010300"/>
    <rect x="5" y="24" width="1" height="1" fill="#fdb8a9"/>
    <rect x="6" y="24" width="1" height="1" fill="#f7a78c"/>
    <rect x="7" y="24" width="1" height="1" fill="#f8a78c"/>
    <rect x="8" y="24" width="1" height="1" fill="#f7a68b"/>
    <rect x="9" y="24" width="1" height="1" fill="#f7a68b"/>
    <rect x="10" y="24" width="1" height="1" fill="#f6a58a"/>
    <rect x="11" y="24" width="1" height="1" fill="#f7a68b"/>
    <rect x="12" y="24" width="1" height="1" fill="#f7a68b"/>
    <rect x="13" y="24" width="1" height="1" fill="#f8a78c"/>
    <rect x="14" y="24" width="1" height="1" fill="#f8a88d"/>
    <rect x="15" y="24" width="1" height="1" fill="#f8a88d"/>
    <rect x="16" y="24" width="1" height="1" fill="#f9a98e"/>
    <rect x="17" y="24" width="1" height="1" fill="#f9a98e"/>
    <rect x="18" y="24" width="1" height="1" fill="#f8a88d"/>
    <rect x="19" y="24" width="1" height="1" fill="#f9a990"/>
    <rect x="20" y="24" width="1" height="1" fill="#f8a88f"/>
    <rect x="21" y="24" width="1" height="1" fill="#f8a88d"/>
    <rect x="22" y="24" width="1" height="1" fill="#f7a78c"/>
    <rect x="23" y="24" width="1" height="1" fill="#f9a88d"/>
    <rect x="24" y="24" width="1" height="1" fill="#f8a78c"/>
    <rect x="25" y="24" width="1" height="1" fill="#faa68c"/>
    <rect x="26" y="24" width="1" height="1" fill="#f8a88d"/>
    <rect x="27" y="24" width="1" height="1" fill="#f9a98e"/>
    <rect x="28" y="24" width="1" height="1" fill="#f8a88d"/>
    <rect x="29" y="24" width="1" height="1" fill="#f9a88d"/>
    <rect x="30" y="24" width="1" height="1" fill="#f7a68b"/>
    <rect x="31" y="24" width="1" height="1" fill="#f5a58a"/>
    <rect x="32" y="24" width="1" height="1" fill="#f8a88d"/>
    <rect x="33" y="24" width="1" height="1" fill="#f9a98e"/>
    <rect x="34" y="24" width="1" height="1" fill="#f3b6a4"/>
    <rect x="35" y="24" width="1" height="1" fill="#010101"/>
    <rect x="36" y="24" width="1" height="1" fill="#030301"/>
    <rect x="3" y="25" width="1" height="1" fill="#000100"/>
    <rect x="4" y="25" width="1" height="1" fill="#000100"/>
    <rect x="5" y="25" width="1" height="1" fill="#f4b09d"/>
    <rect x="6" y="25" width="1" height="1" fill="#f7a689"/>
    <rect x="7" y="25" width="1" height="1" fill="#f9a589"/>
    <rect x="8" y="25" width="1" height="1" fill="#f7a68b"/>
    <rect x="9" y="25" width="1" height="1" fill="#f7a68b"/>
    <rect x="10" y="25" width="1" height="1" fill="#f7a68b"/>
    <rect x="11" y="25" width="1" height="1" fill="#f7a68b"/>
    <rect x="12" y="25" width="1" height="1" fill="#f8a78c"/>
    <rect x="13" y="25" width="1" height="1" fill="#f8a78c"/>
    <rect x="14" y="25" width="1" height="1" fill="#f8a88d"/>
    <rect x="15" y="25" width="1" height="1" fill="#f8a88d"/>
    <rect x="16" y="25" width="1" height="1" fill="#f9a98e"/>
    <rect x="17" y="25" width="1" height="1" fill="#f9a98e"/>
    <rect x="18" y="25" width="1" height="1" fill="#f8a88d"/>
    <rect x="19" y="25" width="1" height="1" fill="#f9a990"/>
    <rect x="20" y="25" width="1" height="1" fill="#f9a990"/>
    <rect x="21" y="25" width="1" height="1" fill="#f8a88d"/>
    <rect x="22" y="25" width="1" height="1" fill="#f7a78c"/>
    <rect x="23" y="25" width="1" height="1" fill="#f7a68b"/>
    <rect x="24" y="25" width="1" height="1" fill="#faa98e"/>
    <rect x="25" y="25" width="1" height="1" fill="#f8ab8f"/>
    <rect x="26" y="25" width="1" height="1" fill="#f8a88d"/>
    <rect x="27" y="25" width="1" height="1" fill="#f8a78c"/>
    <rect x="28" y="25" width="1" height="1" fill="#f8a78c"/>
    <rect x="29" y="25" width="1" height="1" fill="#f6a98d"/>
    <rect x="30" y="25" width="1" height="1" fill="#f7aa8e"/>
    <rect x="31" y="25" width="1" height="1" fill="#f9a88b"/>
    <rect x="32" y="25" width="1" height="1" fill="#f8a488"/>
    <rect x="33" y="25" width="1" height="1" fill="#f7a387"/>
    <rect x="34" y="25" width="1" height="1" fill="#f7baa8"/>
    <rect x="35" y="25" width="1" height="1" fill="#000403"/>
    <rect x="36" y="25" width="1" height="1" fill="#030301"/>
    <rect x="5" y="26" width="1" height="1" fill="#0f0000"/>
    <rect x="6" y="26" width="1" height="1" fill="#0d0000"/>
    <rect x="7" y="26" width="1" height="1" fill="#0c0000"/>
    <rect x="8" y="26" width="1" height="1" fill="#f3a68a"/>
    <rect x="9" y="26" width="1" height="1" fill="#fba78d"/>
    <rect x="10" y="26" width="1" height="1" fill="#f8a78c"/>
    <rect x="11" y="26" width="1" height="1" fill="#f7a68b"/>
    <rect x="12" y="26" width="1" height="1" fill="#f8a78c"/>
    <rect x="13" y="26" width="1" height="1" fill="#f7a68b"/>
    <rect x="14" y="26" width="1" height="1" fill="#f8a78c"/>
    <rect x="15" y="26" width="1" height="1" fill="#f9a88d"/>
    <rect x="16" y="26" width="1" height="1" fill="#f8a88d"/>
    <rect x="17" y="26" width="1" height="1" fill="#f8a88d"/>
    <rect x="18" y="26" width="1" height="1" fill="#f8a88d"/>
    <rect x="19" y="26" width="1" height="1" fill="#f8a88f"/>
    <rect x="20" y="26" width="1" height="1" fill="#f8a88f"/>
    <rect x="21" y="26" width="1" height="1" fill="#f8a88d"/>
    <rect x="22" y="26" width="1" height="1" fill="#faaa8f"/>
    <rect x="23" y="26" width="1" height="1" fill="#f8ad96"/>
    <rect x="24" y="26" width="1" height="1" fill="#1b0000"/>
    <rect x="25" y="26" width="1" height="1" fill="#0f0000"/>
    <rect x="26" y="26" width="1" height="1" fill="#130000"/>
    <rect x="27" y="26" width="1" height="1" fill="#120300"/>
    <rect x="28" y="26" width="1" height="1" fill="#100100"/>
    <rect x="29" y="26" width="1" height="1" fill="#0e0000"/>
    <rect x="30" y="26" width="1" height="1" fill="#0b0000"/>
    <rect x="31" y="26" width="1" height="1" fill="#1b0000"/>
    <rect x="32" y="26" width="1" height="1" fill="#faa98c"/>
    <rect x="33" y="26" width="1" height="1" fill="#faa892"/>
    <rect x="34" y="26" width="1" height="1" fill="#f4b9a7"/>
    <rect x="35" y="26" width="1" height="1" fill="#000201"/>
    <rect x="36" y="26" width="1" height="1" fill="#030301"/>
    <rect x="5" y="27" width="1" height="1" fill="#000000"/>
    <rect x="6" y="27" width="1" height="1" fill="#000002"/>
    <rect x="7" y="27" width="1" height="1" fill="#010101"/>
    <rect x="8" y="27" width="1" height="1" fill="#f5ae92"/>
    <rect x="9" y="27" width="1" height="1" fill="#f7a689"/>
    <rect x="10" y="27" width="1" height="1" fill="#f7a68b"/>
    <rect x="11" y="27" width="1" height="1" fill="#f7a68b"/>
    <rect x="12" y="27" width="1" height="1" fill="#f9a88d"/>
    <rect x="13" y="27" width="1" height="1" fill="#f7a68b"/>
    <rect x="14" y="27" width="1" height="1" fill="#f8a78c"/>
    <rect x="15" y="27" width="1" height="1" fill="#f8a78c"/>
    <rect x="16" y="27" width="1" height="1" fill="#f8a88d"/>
    <rect x="17" y="27" width="1" height="1" fill="#f8a88d"/>
    <rect x="18" y="27" width="1" height="1" fill="#f8a88d"/>
    <rect x="19" y="27" width="1" height="1" fill="#f8a88f"/>
    <rect x="20" y="27" width="1" height="1" fill="#f9a990"/>
    <rect x="21" y="27" width="1" height="1" fill="#f7a78c"/>
    <rect x="22" y="27" width="1" height="1" fill="#f7a78c"/>
    <rect x="23" y="27" width="1" height="1" fill="#f4a88e"/>
    <rect x="24" y="27" width="1" height="1" fill="#080309"/>
    <rect x="25" y="27" width="1" height="1" fill="#010302"/>
    <rect x="26" y="27" width="1" height="1" fill="#000100"/>
    <rect x="27" y="27" width="1" height="1" fill="#000002"/>
    <rect x="28" y="27" width="1" height="1" fill="#000103"/>
    <rect x="29" y="27" width="1" height="1" fill="#000201"/>
    <rect x="30" y="27" width="1" height="1" fill="#000201"/>
    <rect x="31" y="27" width="1" height="1" fill="#070208"/>
    <rect x="32" y="27" width="1" height="1" fill="#f6a085"/>
    <rect x="33" y="27" width="1" height="1" fill="#f9a38a"/>
    <rect x="34" y="27" width="1" height="1" fill="#f6b7a6"/>
    <rect x="35" y="27" width="1" height="1" fill="#010302"/>
    <rect x="36" y="27" width="1" height="1" fill="#030301"/>
    <rect x="45" y="27" width="1" height="1" fill="#3a383d"/>
    <rect x="46" y="27" width="1" height="1" fill="#3a383b"/>
    <rect x="47" y="27" width="1" height="1" fill="#3e3c41"/>
    <rect x="56" y="27" width="1" height="1" fill="#3b3a3f"/>
    <rect x="57" y="27" width="1" height="1" fill="#343237"/>
    <rect x="58" y="27" width="1" height="1" fill="#757279"/>
    <rect x="5" y="28" width="1" height="1" fill="#020003"/>
    <rect x="6" y="28" width="1" height="1" fill="#020200"/>
    <rect x="7" y="28" width="1" height="1" fill="#060604"/>
    <rect x="8" y="28" width="1" height="1" fill="#f0a588"/>
    <rect x="9" y="28" width="1" height="1" fill="#f6a085"/>
    <rect x="10" y="28" width="1" height="1" fill="#f5a688"/>
    <rect x="11" y="28" width="1" height="1" fill="#f5a688"/>
    <rect x="12" y="28" width="1" height="1" fill="#f3a68c"/>
    <rect x="13" y="28" width="1" height="1" fill="#ffa896"/>
    <rect x="14" y="28" width="1" height="1" fill="#faa68c"/>
    <rect x="15" y="28" width="1" height="1" fill="#f7a68b"/>
    <rect x="16" y="28" width="1" height="1" fill="#f7a78c"/>
    <rect x="17" y="28" width="1" height="1" fill="#f7a78c"/>
    <rect x="18" y="28" width="1" height="1" fill="#f8a88d"/>
    <rect x="19" y="28" width="1" height="1" fill="#f9a88d"/>
    <rect x="20" y="28" width="1" height="1" fill="#f9a88d"/>
    <rect x="21" y="28" width="1" height="1" fill="#f8a78c"/>
    <rect x="22" y="28" width="1" height="1" fill="#faa98e"/>
    <rect x="23" y="28" width="1" height="1" fill="#ffa58a"/>
    <rect x="24" y="28" width="1" height="1" fill="#030000"/>
    <rect x="25" y="28" width="1" height="1" fill="#030000"/>
    <rect x="26" y="28" width="1" height="1" fill="#050000"/>
    <rect x="27" y="28" width="1" height="1" fill="#040000"/>
    <rect x="28" y="28" width="1" height="1" fill="#050000"/>
    <rect x="29" y="28" width="1" height="1" fill="#030000"/>
    <rect x="30" y="28" width="1" height="1" fill="#040001"/>
    <rect x="31" y="28" width="1" height="1" fill="#080405"/>
    <rect x="32" y="28" width="1" height="1" fill="#fba187"/>
    <rect x="33" y="28" width="1" height="1" fill="#f1a991"/>
    <rect x="34" y="28" width="1" height="1" fill="#f2baa3"/>
    <rect x="35" y="28" width="1" height="1" fill="#030303"/>
    <rect x="36" y="28" width="1" height="1" fill="#030303"/>
    <rect x="45" y="28" width="1" height="1" fill="#070506"/>
    <rect x="46" y="28" width="1" height="1" fill="#010002"/>
    <rect x="47" y="28" width="1" height="1" fill="#070508"/>
    <rect x="56" y="28" width="1" height="1" fill="#010101"/>
    <rect x="57" y="28" width="1" height="1" fill="#050400"/>
    <rect x="58" y="28" width="1" height="1" fill="#4f4d52"/>
    <rect x="5" y="29" width="1" height="1" fill="#020003"/>
    <rect x="6" y="29" width="1" height="1" fill="#000000"/>
    <rect x="7" y="29" width="1" height="1" fill="#000000"/>
    <rect x="8" y="29" width="1" height="1" fill="#040404"/>
    <rect x="9" y="29" width="1" height="1" fill="#090804"/>
    <rect x="10" y="29" width="1" height="1" fill="#070802"/>
    <rect x="11" y="29" width="1" height="1" fill="#050600"/>
    <rect x="12" y="29" width="1" height="1" fill="#060500"/>
    <rect x="13" y="29" width="1" height="1" fill="#f6af9d"/>
    <rect x="14" y="29" width="1" height="1" fill="#f9a58d"/>
    <rect x="15" y="29" width="1" height="1" fill="#f9a88d"/>
    <rect x="16" y="29" width="1" height="1" fill="#f8a88d"/>
    <rect x="17" y="29" width="1" height="1" fill="#f8a88d"/>
    <rect x="18" y="29" width="1" height="1" fill="#f6a68b"/>
    <rect x="19" y="29" width="1" height="1" fill="#f9a88d"/>
    <rect x="20" y="29" width="1" height="1" fill="#f8a78c"/>
    <rect x="21" y="29" width="1" height="1" fill="#f8a78c"/>
    <rect x="22" y="29" width="1" height="1" fill="#f8a78c"/>
    <rect x="23" y="29" width="1" height="1" fill="#f9a986"/>
    <rect x="24" y="29" width="1" height="1" fill="#eea791"/>
    <rect x="25" y="29" width="1" height="1" fill="#eda189"/>
    <rect x="26" y="29" width="1" height="1" fill="#eb9b82"/>
    <rect x="27" y="29" width="1" height="1" fill="#ec9c83"/>
    <rect x="28" y="29" width="1" height="1" fill="#ed9d84"/>
    <rect x="29" y="29" width="1" height="1" fill="#ec9a84"/>
    <rect x="30" y="29" width="1" height="1" fill="#ea9882"/>
    <rect x="31" y="29" width="1" height="1" fill="#e29a81"/>
    <rect x="32" y="29" width="1" height="1" fill="#100901"/>
    <rect x="33" y="29" width="1" height="1" fill="#0b0602"/>
    <rect x="34" y="29" width="1" height="1" fill="#090003"/>
    <rect x="45" y="29" width="1" height="1" fill="#080705"/>
    <rect x="46" y="29" width="1" height="1" fill="#040203"/>
    <rect x="47" y="29" width="1" height="1" fill="#060405"/>
    <rect x="56" y="29" width="1" height="1" fill="#060702"/>
    <rect x="57" y="29" width="1" height="1" fill="#010000"/>
    <rect x="58" y="29" width="1" height="1" fill="#403e41"/>
    <rect x="5" y="30" width="1" height="1" fill="#040003"/>
    <rect x="6" y="30" width="1" height="1" fill="#010300"/>
    <rect x="7" y="30" width="1" height="1" fill="#000100"/>
    <rect x="8" y="30" width="1" height="1" fill="#000000"/>
    <rect x="9" y="30" width="1" height="1" fill="#000000"/>
    <rect x="10" y="30" width="1" height="1" fill="#010100"/>
    <rect x="11" y="30" width="1" height="1" fill="#000000"/>
    <rect x="12" y="30" width="1" height="1" fill="#070000"/>
    <rect x="13" y="30" width="1" height="1" fill="#f6b097"/>
    <rect x="14" y="30" width="1" height="1" fill="#f7a689"/>
    <rect x="15" y="30" width="1" height="1" fill="#faa489"/>
    <rect x="16" y="30" width="1" height="1" fill="#faa489"/>
    <rect x="17" y="30" width="1" height="1" fill="#faa489"/>
    <rect x="18" y="30" width="1" height="1" fill="#faa489"/>
    <rect x="19" y="30" width="1" height="1" fill="#faa68a"/>
    <rect x="20" y="30" width="1" height="1" fill="#faa68a"/>
    <rect x="21" y="30" width="1" height="1" fill="#faa789"/>
    <rect x="22" y="30" width="1" height="1" fill="#f9a688"/>
    <rect x="23" y="30" width="1" height="1" fill="#f7a387"/>
    <rect x="24" y="30" width="1" height="1" fill="#f8a48a"/>
    <rect x="25" y="30" width="1" height="1" fill="#f9a28e"/>
    <rect x="26" y="30" width="1" height="1" fill="#f8a08c"/>
    <rect x="27" y="30" width="1" height="1" fill="#f99e89"/>
    <rect x="28" y="30" width="1" height="1" fill="#f99e89"/>
    <rect x="29" y="30" width="1" height="1" fill="#f7a389"/>
    <rect x="30" y="30" width="1" height="1" fill="#f5a187"/>
    <rect x="31" y="30" width="1" height="1" fill="#ef9c7e"/>
    <rect x="32" y="30" width="1" height="1" fill="#050706"/>
    <rect x="33" y="30" width="1" height="1" fill="#030000"/>
    <rect x="34" y="30" width="1" height="1" fill="#010006"/>
    <rect x="42" y="30" width="1" height="1" fill="#08080a"/>
    <rect x="43" y="30" width="1" height="1" fill="#020202"/>
    <rect x="44" y="30" width="1" height="1" fill="#010103"/>
    <rect x="45" y="30" width="1" height="1" fill="#000000"/>
    <rect x="46" y="30" width="1" height="1" fill="#010101"/>
    <rect x="47" y="30" width="1" height="1" fill="#010101"/>
    <rect x="48" y="30" width="1" height="1" fill="#000000"/>
    <rect x="49" y="30" width="1" height="1" fill="#020202"/>
    <rect x="50" y="30" width="1" height="1" fill="#020202"/>
    <rect x="51" y="30" width="1" height="1" fill="#020202"/>
    <rect x="52" y="30" width="1" height="1" fill="#010101"/>
    <rect x="53" y="30" width="1" height="1" fill="#010101"/>
    <rect x="54" y="30" width="1" height="1" fill="#020202"/>
    <rect x="55" y="30" width="1" height="1" fill="#030400"/>
    <rect x="56" y="30" width="1" height="1" fill="#010100"/>
    <rect x="57" y="30" width="1" height="1" fill="#010101"/>
    <rect x="58" y="30" width="1" height="1" fill="#010101"/>
    <rect x="59" y="30" width="1" height="1" fill="#000000"/>
    <rect x="60" y="30" width="1" height="1" fill="#020202"/>
    <rect x="5" y="31" width="1" height="1" fill="#010101"/>
    <rect x="6" y="31" width="1" height="1" fill="#000100"/>
    <rect x="7" y="31" width="1" height="1" fill="#000200"/>
    <rect x="8" y="31" width="1" height="1" fill="#020300"/>
    <rect x="9" y="31" width="1" height="1" fill="#000100"/>
    <rect x="10" y="31" width="1" height="1" fill="#000100"/>
    <rect x="11" y="31" width="1" height="1" fill="#010200"/>
    <rect x="12" y="31" width="1" height="1" fill="#0a0200"/>
    <rect x="13" y="31" width="1" height="1" fill="#f9af94"/>
    <rect x="14" y="31" width="1" height="1" fill="#f3a68c"/>
    <rect x="15" y="31" width="1" height="1" fill="#f2a591"/>
    <rect x="16" y="31" width="1" height="1" fill="#f1a691"/>
    <rect x="17" y="31" width="1" height="1" fill="#f1a691"/>
    <rect x="18" y="31" width="1" height="1" fill="#f3a692"/>
    <rect x="19" y="31" width="1" height="1" fill="#f6a894"/>
    <rect x="20" y="31" width="1" height="1" fill="#f4a692"/>
    <rect x="21" y="31" width="1" height="1" fill="#f4a692"/>
    <rect x="22" y="31" width="1" height="1" fill="#f4a692"/>
    <rect x="23" y="31" width="1" height="1" fill="#f5a793"/>
    <rect x="24" y="31" width="1" height="1" fill="#f3a591"/>
    <rect x="25" y="31" width="1" height="1" fill="#f2a68c"/>
    <rect x="26" y="31" width="1" height="1" fill="#f1a58b"/>
    <rect x="27" y="31" width="1" height="1" fill="#f3a68c"/>
    <rect x="28" y="31" width="1" height="1" fill="#f2a58b"/>
    <rect x="29" y="31" width="1" height="1" fill="#f3a18c"/>
    <rect x="30" y="31" width="1" height="1" fill="#f2a08b"/>
    <rect x="31" y="31" width="1" height="1" fill="#ea9b7d"/>
    <rect x="32" y="31" width="1" height="1" fill="#0b0600"/>
    <rect x="33" y="31" width="1" height="1" fill="#050601"/>
    <rect x="34" y="31" width="1" height="1" fill="#020204"/>
    <rect x="42" y="31" width="1" height="1" fill="#040404"/>
    <rect x="43" y="31" width="1" height="1" fill="#010100"/>
    <rect x="44" y="31" width="1" height="1" fill="#010101"/>
    <rect x="45" y="31" width="1" height="1" fill="#000000"/>
    <rect x="46" y="31" width="1" height="1" fill="#000000"/>
    <rect x="47" y="31" width="1" height="1" fill="#000000"/>
    <rect x="48" y="31" width="1" height="1" fill="#010100"/>
    <rect x="49" y="31" width="1" height="1" fill="#010100"/>
    <rect x="50" y="31" width="1" height="1" fill="#020200"/>
    <rect x="51" y="31" width="1" height="1" fill="#020200"/>
    <rect x="52" y="31" width="1" height="1" fill="#020200"/>
    <rect x="53" y="31" width="1" height="1" fill="#010100"/>
    <rect x="54" y="31" width="1" height="1" fill="#010100"/>
    <rect x="55" y="31" width="1" height="1" fill="#000002"/>
    <rect x="56" y="31" width="1" height="1" fill="#000002"/>
    <rect x="57" y="31" width="1" height="1" fill="#000000"/>
    <rect x="58" y="31" width="1" height="1" fill="#010101"/>
    <rect x="59" y="31" width="1" height="1" fill="#020200"/>
    <rect x="60" y="31" width="1" height="1" fill="#050503"/>
    <rect x="3" y="32" width="1" height="1" fill="#000000"/>
    <rect x="4" y="32" width="1" height="1" fill="#000002"/>
    <rect x="5" y="32" width="1" height="1" fill="#685276"/>
    <rect x="6" y="32" width="1" height="1" fill="#634770"/>
    <rect x="7" y="32" width="1" height="1" fill="#62466f"/>
    <rect x="8" y="32" width="1" height="1" fill="#654a73"/>
    <rect x="9" y="32" width="1" height="1" fill="#654a73"/>
    <rect x="10" y="32" width="1" height="1" fill="#634871"/>
    <rect x="11" y="32" width="1" height="1" fill="#634871"/>
    <rect x="12" y="32" width="1" height="1" fill="#64466c"/>
    <rect x="13" y="32" width="1" height="1" fill="#100009"/>
    <rect x="14" y="32" width="1" height="1" fill="#0c0703"/>
    <rect x="15" y="32" width="1" height="1" fill="#0d0805"/>
    <rect x="16" y="32" width="1" height="1" fill="#0b0706"/>
    <rect x="17" y="32" width="1" height="1" fill="#0b0706"/>
    <rect x="18" y="32" width="1" height="1" fill="#0b0706"/>
    <rect x="19" y="32" width="1" height="1" fill="#0a0605"/>
    <rect x="20" y="32" width="1" height="1" fill="#0a0605"/>
    <rect x="21" y="32" width="1" height="1" fill="#0b0706"/>
    <rect x="22" y="32" width="1" height="1" fill="#0b0706"/>
    <rect x="23" y="32" width="1" height="1" fill="#0b0706"/>
    <rect x="24" y="32" width="1" height="1" fill="#0b0706"/>
    <rect x="25" y="32" width="1" height="1" fill="#0b0704"/>
    <rect x="26" y="32" width="1" height="1" fill="#0b0704"/>
    <rect x="27" y="32" width="1" height="1" fill="#0c0606"/>
    <rect x="28" y="32" width="1" height="1" fill="#0c0606"/>
    <rect x="29" y="32" width="1" height="1" fill="#0c0805"/>
    <rect x="30" y="32" width="1" height="1" fill="#0a0603"/>
    <rect x="31" y="32" width="1" height="1" fill="#0f0a06"/>
    <rect x="40" y="32" width="1" height="1" fill="#000000"/>
    <rect x="41" y="32" width="1" height="1" fill="#000000"/>
    <rect x="42" y="32" width="1" height="1" fill="#3a3b33"/>
    <rect x="43" y="32" width="1" height="1" fill="#3b3d30"/>
    <rect x="44" y="32" width="1" height="1" fill="#393a32"/>
    <rect x="45" y="32" width="1" height="1" fill="#010200"/>
    <rect x="46" y="32" width="1" height="1" fill="#040301"/>
    <rect x="47" y="32" width="1" height="1" fill="#0a0603"/>
    <rect x="48" y="32" width="1" height="1" fill="#424238"/>
    <rect x="49" y="32" width="1" height="1" fill="#3c3c32"/>
    <rect x="50" y="32" width="1" height="1" fill="#3b3b31"/>
    <rect x="51" y="32" width="1" height="1" fill="#3a3a30"/>
    <rect x="52" y="32" width="1" height="1" fill="#3c3c32"/>
    <rect x="53" y="32" width="1" height="1" fill="#3a3a30"/>
    <rect x="54" y="32" width="1" height="1" fill="#39392f"/>
    <rect x="55" y="32" width="1" height="1" fill="#3c3c32"/>
    <rect x="56" y="32" width="1" height="1" fill="#030200"/>
    <rect x="57" y="32" width="1" height="1" fill="#030200"/>
    <rect x="58" y="32" width="1" height="1" fill="#171611"/>
    <rect x="59" y="32" width="1" height="1" fill="#3b3d32"/>
    <rect x="60" y="32" width="1" height="1" fill="#34362b"/>
    <rect x="61" y="32" width="1" height="1" fill="#010100"/>
    <rect x="62" y="32" width="1" height="1" fill="#000002"/>
    <rect x="63" y="32" width="1" height="1" fill="#000002"/>
    <rect x="3" y="33" width="1" height="1" fill="#040500"/>
    <rect x="4" y="33" width="1" height="1" fill="#030102"/>
    <rect x="5" y="33" width="1" height="1" fill="#644b75"/>
    <rect x="6" y="33" width="1" height="1" fill="#614172"/>
    <rect x="7" y="33" width="1" height="1" fill="#604071"/>
    <rect x="8" y="33" width="1" height="1" fill="#614172"/>
    <rect x="9" y="33" width="1" height="1" fill="#614172"/>
    <rect x="10" y="33" width="1" height="1" fill="#614172"/>
    <rect x="11" y="33" width="1" height="1" fill="#604071"/>
    <rect x="12" y="33" width="1" height="1" fill="#614470"/>
    <rect x="13" y="33" width="1" height="1" fill="#0f0415"/>
    <rect x="14" y="33" width="1" height="1" fill="#010100"/>
    <rect x="15" y="33" width="1" height="1" fill="#010100"/>
    <rect x="16" y="33" width="1" height="1" fill="#010101"/>
    <rect x="17" y="33" width="1" height="1" fill="#010101"/>
    <rect x="18" y="33" width="1" height="1" fill="#000000"/>
    <rect x="19" y="33" width="1" height="1" fill="#010101"/>
    <rect x="20" y="33" width="1" height="1" fill="#000000"/>
    <rect x="21" y="33" width="1" height="1" fill="#010101"/>
    <rect x="22" y="33" width="1" height="1" fill="#010101"/>
    <rect x="23" y="33" width="1" height="1" fill="#000000"/>
    <rect x="24" y="33" width="1" height="1" fill="#000000"/>
    <rect x="25" y="33" width="1" height="1" fill="#000000"/>
    <rect x="26" y="33" width="1" height="1" fill="#000000"/>
    <rect x="27" y="33" width="1" height="1" fill="#010101"/>
    <rect x="28" y="33" width="1" height="1" fill="#010101"/>
    <rect x="29" y="33" width="1" height="1" fill="#010100"/>
    <rect x="30" y="33" width="1" height="1" fill="#000000"/>
    <rect x="31" y="33" width="1" height="1" fill="#040402"/>
    <rect x="40" y="33" width="1" height="1" fill="#010100"/>
    <rect x="41" y="33" width="1" height="1" fill="#020200"/>
    <rect x="42" y="33" width="1" height="1" fill="#323429"/>
    <rect x="43" y="33" width="1" height="1" fill="#343628"/>
    <rect x="44" y="33" width="1" height="1" fill="#303129"/>
    <rect x="45" y="33" width="1" height="1" fill="#000100"/>
    <rect x="46" y="33" width="1" height="1" fill="#010200"/>
    <rect x="47" y="33" width="1" height="1" fill="#070803"/>
    <rect x="48" y="33" width="1" height="1" fill="#3b3b2f"/>
    <rect x="49" y="33" width="1" height="1" fill="#37372b"/>
    <rect x="50" y="33" width="1" height="1" fill="#37372b"/>
    <rect x="51" y="33" width="1" height="1" fill="#39392d"/>
    <rect x="52" y="33" width="1" height="1" fill="#38382c"/>
    <rect x="53" y="33" width="1" height="1" fill="#38382c"/>
    <rect x="54" y="33" width="1" height="1" fill="#37372b"/>
    <rect x="55" y="33" width="1" height="1" fill="#3f3f35"/>
    <rect x="56" y="33" width="1" height="1" fill="#050400"/>
    <rect x="57" y="33" width="1" height="1" fill="#060501"/>
    <rect x="58" y="33" width="1" height="1" fill="#161510"/>
    <rect x="59" y="33" width="1" height="1" fill="#323427"/>
    <rect x="60" y="33" width="1" height="1" fill="#343629"/>
    <rect x="61" y="33" width="1" height="1" fill="#000100"/>
    <rect x="62" y="33" width="1" height="1" fill="#000002"/>
    <rect x="63" y="33" width="1" height="1" fill="#050505"/>
    <rect x="3" y="34" width="1" height="1" fill="#000000"/>
    <rect x="4" y="34" width="1" height="1" fill="#010000"/>
    <rect x="5" y="34" width="1" height="1" fill="#614870"/>
    <rect x="6" y="34" width="1" height="1" fill="#634374"/>
    <rect x="7" y="34" width="1" height="1" fill="#634374"/>
    <rect x="8" y="34" width="1" height="1" fill="#624273"/>
    <rect x="9" y="34" width="1" height="1" fill="#634374"/>
    <rect x="10" y="34" width="1" height="1" fill="#624273"/>
    <rect x="11" y="34" width="1" height="1" fill="#624273"/>
    <rect x="12" y="34" width="1" height="1" fill="#644475"/>
    <rect x="13" y="34" width="1" height="1" fill="#090011"/>
    <rect x="14" y="34" width="1" height="1" fill="#010100"/>
    <rect x="15" y="34" width="1" height="1" fill="#010101"/>
    <rect x="16" y="34" width="1" height="1" fill="#010101"/>
    <rect x="17" y="34" width="1" height="1" fill="#010101"/>
    <rect x="18" y="34" width="1" height="1" fill="#000000"/>
    <rect x="19" y="34" width="1" height="1" fill="#010101"/>
    <rect x="20" y="34" width="1" height="1" fill="#010101"/>
    <rect x="21" y="34" width="1" height="1" fill="#010101"/>
    <rect x="22" y="34" width="1" height="1" fill="#010101"/>
    <rect x="23" y="34" width="1" height="1" fill="#000000"/>
    <rect x="24" y="34" width="1" height="1" fill="#000000"/>
    <rect x="25" y="34" width="1" height="1" fill="#000000"/>
    <rect x="26" y="34" width="1" height="1" fill="#000000"/>
    <rect x="27" y="34" width="1" height="1" fill="#010101"/>
    <rect x="28" y="34" width="1" height="1" fill="#010101"/>
    <rect x="29" y="34" width="1" height="1" fill="#000100"/>
    <rect x="30" y="34" width="1" height="1" fill="#000000"/>
    <rect x="31" y="34" width="1" height="1" fill="#060606"/>
    <rect x="40" y="34" width="1" height="1" fill="#000000"/>
    <rect x="41" y="34" width="1" height="1" fill="#000000"/>
    <rect x="42" y="34" width="1" height="1" fill="#35372c"/>
    <rect x="43" y="34" width="1" height="1" fill="#383a2c"/>
    <rect x="44" y="34" width="1" height="1" fill="#353729"/>
    <rect x="45" y="34" width="1" height="1" fill="#353729"/>
    <rect x="46" y="34" width="1" height="1" fill="#333527"/>
    <rect x="47" y="34" width="1" height="1" fill="#36382b"/>
    <rect x="48" y="34" width="1" height="1" fill="#393a2c"/>
    <rect x="49" y="34" width="1" height="1" fill="#39392d"/>
    <rect x="50" y="34" width="1" height="1" fill="#39392d"/>
    <rect x="51" y="34" width="1" height="1" fill="#39392d"/>
    <rect x="52" y="34" width="1" height="1" fill="#3a3a2e"/>
    <rect x="53" y="34" width="1" height="1" fill="#3b3b2f"/>
    <rect x="54" y="34" width="1" height="1" fill="#3a3a2e"/>
    <rect x="55" y="34" width="1" height="1" fill="#393a2a"/>
    <rect x="56" y="34" width="1" height="1" fill="#353529"/>
    <rect x="57" y="34" width="1" height="1" fill="#303024"/>
    <rect x="58" y="34" width="1" height="1" fill="#38382c"/>
    <rect x="59" y="34" width="1" height="1" fill="#35372a"/>
    <rect x="60" y="34" width="1" height="1" fill="#36382b"/>
    <rect x="61" y="34" width="1" height="1" fill="#000100"/>
    <rect x="62" y="34" width="1" height="1" fill="#000002"/>
    <rect x="63" y="34" width="1" height="1" fill="#050505"/>
    <rect x="3" y="35" width="1" height="1" fill="#000000"/>
    <rect x="4" y="35" width="1" height="1" fill="#020001"/>
    <rect x="5" y="35" width="1" height="1" fill="#634a72"/>
    <rect x="6" y="35" width="1" height="1" fill="#624273"/>
    <rect x="7" y="35" width="1" height="1" fill="#634374"/>
    <rect x="8" y="35" width="1" height="1" fill="#634374"/>
    <rect x="9" y="35" width="1" height="1" fill="#644475"/>
    <rect x="10" y="35" width="1" height="1" fill="#624273"/>
    <rect x="11" y="35" width="1" height="1" fill="#634374"/>
    <rect x="12" y="35" width="1" height="1" fill="#624271"/>
    <rect x="13" y="35" width="1" height="1" fill="#62447a"/>
    <rect x="14" y="35" width="1" height="1" fill="#664177"/>
    <rect x="15" y="35" width="1" height="1" fill="#644177"/>
    <rect x="16" y="35" width="1" height="1" fill="#2b2a2f"/>
    <rect x="17" y="35" width="1" height="1" fill="#2b2b2b"/>
    <rect x="18" y="35" width="1" height="1" fill="#2d2d2f"/>
    <rect x="19" y="35" width="1" height="1" fill="#605c6d"/>
    <rect x="20" y="35" width="1" height="1" fill="#615a6c"/>
    <rect x="21" y="35" width="1" height="1" fill="#65626d"/>
    <rect x="22" y="35" width="1" height="1" fill="#000000"/>
    <rect x="23" y="35" width="1" height="1" fill="#000000"/>
    <rect x="24" y="35" width="1" height="1" fill="#010101"/>
    <rect x="25" y="35" width="1" height="1" fill="#010101"/>
    <rect x="26" y="35" width="1" height="1" fill="#010101"/>
    <rect x="27" y="35" width="1" height="1" fill="#080808"/>
    <rect x="28" y="35" width="1" height="1" fill="#625e6d"/>
    <rect x="29" y="35" width="1" height="1" fill="#656172"/>
    <rect x="30" y="35" width="1" height="1" fill="#5e4072"/>
    <rect x="31" y="35" width="1" height="1" fill="#634076"/>
    <rect x="32" y="35" width="1" height="1" fill="#08030a"/>
    <rect x="33" y="35" width="1" height="1" fill="#060405"/>
    <rect x="34" y="35" width="1" height="1" fill="#08080a"/>
    <rect x="40" y="35" width="1" height="1" fill="#000000"/>
    <rect x="41" y="35" width="1" height="1" fill="#000000"/>
    <rect x="42" y="35" width="1" height="1" fill="#2f3227"/>
    <rect x="43" y="35" width="1" height="1" fill="#36382d"/>
    <rect x="44" y="35" width="1" height="1" fill="#36382b"/>
    <rect x="45" y="35" width="1" height="1" fill="#35392b"/>
    <rect x="46" y="35" width="1" height="1" fill="#333729"/>
    <rect x="47" y="35" width="1" height="1" fill="#35372c"/>
    <rect x="48" y="35" width="1" height="1" fill="#37392c"/>
    <rect x="49" y="35" width="1" height="1" fill="#37392c"/>
    <rect x="50" y="35" width="1" height="1" fill="#363a2c"/>
    <rect x="51" y="35" width="1" height="1" fill="#35392b"/>
    <rect x="52" y="35" width="1" height="1" fill="#37392c"/>
    <rect x="53" y="35" width="1" height="1" fill="#383a2d"/>
    <rect x="54" y="35" width="1" height="1" fill="#373b2d"/>
    <rect x="55" y="35" width="1" height="1" fill="#333729"/>
    <rect x="56" y="35" width="1" height="1" fill="#343629"/>
    <rect x="57" y="35" width="1" height="1" fill="#33352a"/>
    <rect x="58" y="35" width="1" height="1" fill="#34382a"/>
    <rect x="59" y="35" width="1" height="1" fill="#36382b"/>
    <rect x="60" y="35" width="1" height="1" fill="#2e3023"/>
    <rect x="61" y="35" width="1" height="1" fill="#000100"/>
    <rect x="62" y="35" width="1" height="1" fill="#030102"/>
    <rect x="63" y="35" width="1" height="1" fill="#050505"/>
    <rect x="3" y="36" width="1" height="1" fill="#020200"/>
    <rect x="4" y="36" width="1" height="1" fill="#020200"/>
    <rect x="5" y="36" width="1" height="1" fill="#684f77"/>
    <rect x="6" y="36" width="1" height="1" fill="#654576"/>
    <rect x="7" y="36" width="1" height="1" fill="#644475"/>
    <rect x="8" y="36" width="1" height="1" fill="#634374"/>
    <rect x="9" y="36" width="1" height="1" fill="#644475"/>
    <rect x="10" y="36" width="1" height="1" fill="#634374"/>
    <rect x="11" y="36" width="1" height="1" fill="#644475"/>
    <rect x="12" y="36" width="1" height="1" fill="#644378"/>
    <rect x="13" y="36" width="1" height="1" fill="#634579"/>
    <rect x="14" y="36" width="1" height="1" fill="#634674"/>
    <rect x="15" y="36" width="1" height="1" fill="#674079"/>
    <rect x="16" y="36" width="1" height="1" fill="#27262b"/>
    <rect x="17" y="36" width="1" height="1" fill="#2a292e"/>
    <rect x="18" y="36" width="1" height="1" fill="#2c2a2f"/>
    <rect x="19" y="36" width="1" height="1" fill="#676070"/>
    <rect x="20" y="36" width="1" height="1" fill="#696071"/>
    <rect x="21" y="36" width="1" height="1" fill="#67646b"/>
    <rect x="22" y="36" width="1" height="1" fill="#000000"/>
    <rect x="23" y="36" width="1" height="1" fill="#010101"/>
    <rect x="24" y="36" width="1" height="1" fill="#000000"/>
    <rect x="25" y="36" width="1" height="1" fill="#000000"/>
    <rect x="26" y="36" width="1" height="1" fill="#000000"/>
    <rect x="27" y="36" width="1" height="1" fill="#030305"/>
    <rect x="28" y="36" width="1" height="1" fill="#65616f"/>
    <rect x="29" y="36" width="1" height="1" fill="#676070"/>
    <rect x="30" y="36" width="1" height="1" fill="#634777"/>
    <rect x="31" y="36" width="1" height="1" fill="#654278"/>
    <rect x="32" y="36" width="1" height="1" fill="#020305"/>
    <rect x="33" y="36" width="1" height="1" fill="#020005"/>
    <rect x="34" y="36" width="1" height="1" fill="#050505"/>
    <rect x="40" y="36" width="1" height="1" fill="#000000"/>
    <rect x="41" y="36" width="1" height="1" fill="#000000"/>
    <rect x="42" y="36" width="1" height="1" fill="#e2d8bf"/>
    <rect x="43" y="36" width="1" height="1" fill="#ede1c9"/>
    <rect x="44" y="36" width="1" height="1" fill="#f0e1ca"/>
    <rect x="45" y="36" width="1" height="1" fill="#f1e3c9"/>
    <rect x="46" y="36" width="1" height="1" fill="#f0e2c8"/>
    <rect x="47" y="36" width="1" height="1" fill="#f2e4ca"/>
    <rect x="48" y="36" width="1" height="1" fill="#f1e3c9"/>
    <rect x="49" y="36" width="1" height="1" fill="#f2e4ca"/>
    <rect x="50" y="36" width="1" height="1" fill="#f2e4ca"/>
    <rect x="51" y="36" width="1" height="1" fill="#efe3c9"/>
    <rect x="52" y="36" width="1" height="1" fill="#f1e2cb"/>
    <rect x="53" y="36" width="1" height="1" fill="#f0e2c8"/>
    <rect x="54" y="36" width="1" height="1" fill="#f1e3c9"/>
    <rect x="55" y="36" width="1" height="1" fill="#eee2ca"/>
    <rect x="56" y="36" width="1" height="1" fill="#f0e2c7"/>
    <rect x="57" y="36" width="1" height="1" fill="#f1e3c9"/>
    <rect x="58" y="36" width="1" height="1" fill="#efe1c6"/>
    <rect x="59" y="36" width="1" height="1" fill="#ede1c7"/>
    <rect x="60" y="36" width="1" height="1" fill="#f2e6ce"/>
    <rect x="61" y="36" width="1" height="1" fill="#0a0904"/>
    <rect x="62" y="36" width="1" height="1" fill="#010000"/>
    <rect x="63" y="36" width="1" height="1" fill="#040404"/>
    <rect x="3" y="37" width="1" height="1" fill="#010000"/>
    <rect x="4" y="37" width="1" height="1" fill="#000105"/>
    <rect x="5" y="37" width="1" height="1" fill="#6b5079"/>
    <rect x="6" y="37" width="1" height="1" fill="#644475"/>
    <rect x="7" y="37" width="1" height="1" fill="#614172"/>
    <rect x="8" y="37" width="1" height="1" fill="#624273"/>
    <rect x="9" y="37" width="1" height="1" fill="#634374"/>
    <rect x="10" y="37" width="1" height="1" fill="#644475"/>
    <rect x="11" y="37" width="1" height="1" fill="#644475"/>
    <rect x="12" y="37" width="1" height="1" fill="#654576"/>
    <rect x="13" y="37" width="1" height="1" fill="#654576"/>
    <rect x="14" y="37" width="1" height="1" fill="#654376"/>
    <rect x="15" y="37" width="1" height="1" fill="#684379"/>
    <rect x="16" y="37" width="1" height="1" fill="#312e39"/>
    <rect x="17" y="37" width="1" height="1" fill="#2e2d35"/>
    <rect x="18" y="37" width="1" height="1" fill="#2e2d35"/>
    <rect x="19" y="37" width="1" height="1" fill="#676276"/>
    <rect x="20" y="37" width="1" height="1" fill="#656172"/>
    <rect x="21" y="37" width="1" height="1" fill="#655f6d"/>
    <rect x="22" y="37" width="1" height="1" fill="#000000"/>
    <rect x="23" y="37" width="1" height="1" fill="#000000"/>
    <rect x="24" y="37" width="1" height="1" fill="#000000"/>
    <rect x="25" y="37" width="1" height="1" fill="#000000"/>
    <rect x="26" y="37" width="1" height="1" fill="#000000"/>
    <rect x="27" y="37" width="1" height="1" fill="#030301"/>
    <rect x="28" y="37" width="1" height="1" fill="#695f7a"/>
    <rect x="29" y="37" width="1" height="1" fill="#675f74"/>
    <rect x="30" y="37" width="1" height="1" fill="#624573"/>
    <rect x="31" y="37" width="1" height="1" fill="#664177"/>
    <rect x="32" y="37" width="1" height="1" fill="#060105"/>
    <rect x="33" y="37" width="1" height="1" fill="#030305"/>
    <rect x="34" y="37" width="1" height="1" fill="#040404"/>
    <rect x="40" y="37" width="1" height="1" fill="#020200"/>
    <rect x="41" y="37" width="1" height="1" fill="#050402"/>
    <rect x="42" y="37" width="1" height="1" fill="#e8e0cd"/>
    <rect x="43" y="37" width="1" height="1" fill="#ece4cf"/>
    <rect x="44" y="37" width="1" height="1" fill="#ede2c6"/>
    <rect x="45" y="37" width="1" height="1" fill="#eee2c8"/>
    <rect x="46" y="37" width="1" height="1" fill="#eee3c7"/>
    <rect x="47" y="37" width="1" height="1" fill="#efe3cb"/>
    <rect x="48" y="37" width="1" height="1" fill="#f0e4cc"/>
    <rect x="49" y="37" width="1" height="1" fill="#eee2ca"/>
    <rect x="50" y="37" width="1" height="1" fill="#f0e4cc"/>
    <rect x="51" y="37" width="1" height="1" fill="#f0e4cc"/>
    <rect x="52" y="37" width="1" height="1" fill="#efe3cb"/>
    <rect x="53" y="37" width="1" height="1" fill="#eee2ca"/>
    <rect x="54" y="37" width="1" height="1" fill="#eee2ca"/>
    <rect x="55" y="37" width="1" height="1" fill="#efe2cf"/>
    <rect x="56" y="37" width="1" height="1" fill="#f0e4ce"/>
    <rect x="57" y="37" width="1" height="1" fill="#eee5c8"/>
    <rect x="58" y="37" width="1" height="1" fill="#ede2cc"/>
    <rect x="59" y="37" width="1" height="1" fill="#eee2c8"/>
    <rect x="60" y="37" width="1" height="1" fill="#eee2c8"/>
    <rect x="61" y="37" width="1" height="1" fill="#0b0803"/>
    <rect x="62" y="37" width="1" height="1" fill="#000201"/>
    <rect x="63" y="37" width="1" height="1" fill="#020403"/>
    <rect x="0" y="38" width="1" height="1" fill="#020202"/>
    <rect x="1" y="38" width="1" height="1" fill="#000200"/>
    <rect x="2" y="38" width="1" height="1" fill="#06000c"/>
    <rect x="3" y="38" width="1" height="1" fill="#66407d"/>
    <rect x="4" y="38" width="1" height="1" fill="#62407c"/>
    <rect x="5" y="38" width="1" height="1" fill="#664677"/>
    <rect x="6" y="38" width="1" height="1" fill="#634374"/>
    <rect x="7" y="38" width="1" height="1" fill="#644475"/>
    <rect x="8" y="38" width="1" height="1" fill="#644475"/>
    <rect x="9" y="38" width="1" height="1" fill="#654576"/>
    <rect x="10" y="38" width="1" height="1" fill="#654576"/>
    <rect x="11" y="38" width="1" height="1" fill="#654576"/>
    <rect x="12" y="38" width="1" height="1" fill="#654576"/>
    <rect x="13" y="38" width="1" height="1" fill="#644475"/>
    <rect x="14" y="38" width="1" height="1" fill="#664379"/>
    <rect x="15" y="38" width="1" height="1" fill="#664476"/>
    <rect x="16" y="38" width="1" height="1" fill="#624476"/>
    <rect x="17" y="38" width="1" height="1" fill="#634577"/>
    <rect x="18" y="38" width="1" height="1" fill="#654779"/>
    <rect x="19" y="38" width="1" height="1" fill="#654779"/>
    <rect x="20" y="38" width="1" height="1" fill="#644775"/>
    <rect x="21" y="38" width="1" height="1" fill="#54445e"/>
    <rect x="22" y="38" width="1" height="1" fill="#010000"/>
    <rect x="23" y="38" width="1" height="1" fill="#000000"/>
    <rect x="24" y="38" width="1" height="1" fill="#010101"/>
    <rect x="25" y="38" width="1" height="1" fill="#000000"/>
    <rect x="26" y="38" width="1" height="1" fill="#000000"/>
    <rect x="27" y="38" width="1" height="1" fill="#000000"/>
    <rect x="28" y="38" width="1" height="1" fill="#5e4272"/>
    <rect x="29" y="38" width="1" height="1" fill="#664678"/>
    <rect x="30" y="38" width="1" height="1" fill="#664476"/>
    <rect x="31" y="38" width="1" height="1" fill="#68457d"/>
    <rect x="32" y="38" width="1" height="1" fill="#070206"/>
    <rect x="33" y="38" width="1" height="1" fill="#020202"/>
    <rect x="34" y="38" width="1" height="1" fill="#070802"/>
    <rect x="35" y="38" width="1" height="1" fill="#060409"/>
    <rect x="36" y="38" width="1" height="1" fill="#040605"/>
    <rect x="40" y="38" width="1" height="1" fill="#040402"/>
    <rect x="41" y="38" width="1" height="1" fill="#050402"/>
    <rect x="42" y="38" width="1" height="1" fill="#e5ddc6"/>
    <rect x="43" y="38" width="1" height="1" fill="#eae3c9"/>
    <rect x="44" y="38" width="1" height="1" fill="#e7dbc3"/>
    <rect x="45" y="38" width="1" height="1" fill="#a99c8b"/>
    <rect x="46" y="38" width="1" height="1" fill="#aea097"/>
    <rect x="47" y="38" width="1" height="1" fill="#b1a493"/>
    <rect x="48" y="38" width="1" height="1" fill="#ede1c9"/>
    <rect x="49" y="38" width="1" height="1" fill="#eee2ca"/>
    <rect x="50" y="38" width="1" height="1" fill="#a99e88"/>
    <rect x="51" y="38" width="1" height="1" fill="#afa896"/>
    <rect x="52" y="38" width="1" height="1" fill="#ada694"/>
    <rect x="53" y="38" width="1" height="1" fill="#f8ebd8"/>
    <rect x="54" y="38" width="1" height="1" fill="#f0e4ca"/>
    <rect x="55" y="38" width="1" height="1" fill="#fff4ec"/>
    <rect x="56" y="38" width="1" height="1" fill="#674b85"/>
    <rect x="57" y="38" width="1" height="1" fill="#6a5077"/>
    <rect x="58" y="38" width="1" height="1" fill="#6d527f"/>
    <rect x="59" y="38" width="1" height="1" fill="#f1e4d1"/>
    <rect x="60" y="38" width="1" height="1" fill="#f0e4cc"/>
    <rect x="61" y="38" width="1" height="1" fill="#0b0803"/>
    <rect x="62" y="38" width="1" height="1" fill="#000100"/>
    <rect x="63" y="38" width="1" height="1" fill="#020403"/>
    <rect x="0" y="39" width="1" height="1" fill="#030102"/>
    <rect x="1" y="39" width="1" height="1" fill="#020204"/>
    <rect x="2" y="39" width="1" height="1" fill="#030009"/>
    <rect x="3" y="39" width="1" height="1" fill="#5f4173"/>
    <rect x="4" y="39" width="1" height="1" fill="#634374"/>
    <rect x="5" y="39" width="1" height="1" fill="#624273"/>
    <rect x="6" y="39" width="1" height="1" fill="#634374"/>
    <rect x="7" y="39" width="1" height="1" fill="#644475"/>
    <rect x="8" y="39" width="1" height="1" fill="#654576"/>
    <rect x="9" y="39" width="1" height="1" fill="#644475"/>
    <rect x="10" y="39" width="1" height="1" fill="#644475"/>
    <rect x="11" y="39" width="1" height="1" fill="#654576"/>
    <rect x="12" y="39" width="1" height="1" fill="#664677"/>
    <rect x="13" y="39" width="1" height="1" fill="#654576"/>
    <rect x="14" y="39" width="1" height="1" fill="#664677"/>
    <rect x="15" y="39" width="1" height="1" fill="#664677"/>
    <rect x="16" y="39" width="1" height="1" fill="#664677"/>
    <rect x="17" y="39" width="1" height="1" fill="#664677"/>
    <rect x="18" y="39" width="1" height="1" fill="#654576"/>
    <rect x="19" y="39" width="1" height="1" fill="#644475"/>
    <rect x="20" y="39" width="1" height="1" fill="#664677"/>
    <rect x="21" y="39" width="1" height="1" fill="#594465"/>
    <rect x="22" y="39" width="1" height="1" fill="#040009"/>
    <rect x="23" y="39" width="1" height="1" fill="#060009"/>
    <rect x="24" y="39" width="1" height="1" fill="#060009"/>
    <rect x="25" y="39" width="1" height="1" fill="#04000b"/>
    <rect x="26" y="39" width="1" height="1" fill="#04000b"/>
    <rect x="27" y="39" width="1" height="1" fill="#040009"/>
    <rect x="28" y="39" width="1" height="1" fill="#614673"/>
    <rect x="29" y="39" width="1" height="1" fill="#664677"/>
    <rect x="30" y="39" width="1" height="1" fill="#664677"/>
    <rect x="31" y="39" width="1" height="1" fill="#65427c"/>
    <rect x="32" y="39" width="1" height="1" fill="#644475"/>
    <rect x="33" y="39" width="1" height="1" fill="#634579"/>
    <rect x="34" y="39" width="1" height="1" fill="#5e486e"/>
    <rect x="35" y="39" width="1" height="1" fill="#000201"/>
    <rect x="36" y="39" width="1" height="1" fill="#040301"/>
    <rect x="40" y="39" width="1" height="1" fill="#010101"/>
    <rect x="41" y="39" width="1" height="1" fill="#000000"/>
    <rect x="42" y="39" width="1" height="1" fill="#e1d6c2"/>
    <rect x="43" y="39" width="1" height="1" fill="#ede1cb"/>
    <rect x="44" y="39" width="1" height="1" fill="#f0e5d1"/>
    <rect x="45" y="39" width="1" height="1" fill="#ada598"/>
    <rect x="46" y="39" width="1" height="1" fill="#ada495"/>
    <rect x="47" y="39" width="1" height="1" fill="#aa9e90"/>
    <rect x="48" y="39" width="1" height="1" fill="#efe3cd"/>
    <rect x="49" y="39" width="1" height="1" fill="#efe4ce"/>
    <rect x="50" y="39" width="1" height="1" fill="#ada495"/>
    <rect x="51" y="39" width="1" height="1" fill="#aca394"/>
    <rect x="52" y="39" width="1" height="1" fill="#aba293"/>
    <rect x="53" y="39" width="1" height="1" fill="#f5e9d3"/>
    <rect x="54" y="39" width="1" height="1" fill="#eee2ca"/>
    <rect x="55" y="39" width="1" height="1" fill="#fcecdd"/>
    <rect x="56" y="39" width="1" height="1" fill="#71528e"/>
    <rect x="57" y="39" width="1" height="1" fill="#704f84"/>
    <rect x="58" y="39" width="1" height="1" fill="#6c4f85"/>
    <rect x="59" y="39" width="1" height="1" fill="#ede1c9"/>
    <rect x="60" y="39" width="1" height="1" fill="#efe3cb"/>
    <rect x="61" y="39" width="1" height="1" fill="#0a0905"/>
    <rect x="62" y="39" width="1" height="1" fill="#010000"/>
    <rect x="63" y="39" width="1" height="1" fill="#020403"/>
    <rect x="0" y="40" width="1" height="1" fill="#010000"/>
    <rect x="1" y="40" width="1" height="1" fill="#000002"/>
    <rect x="2" y="40" width="1" height="1" fill="#030009"/>
    <rect x="3" y="40" width="1" height="1" fill="#634577"/>
    <rect x="4" y="40" width="1" height="1" fill="#634374"/>
    <rect x="5" y="40" width="1" height="1" fill="#634374"/>
    <rect x="6" y="40" width="1" height="1" fill="#634374"/>
    <rect x="7" y="40" width="1" height="1" fill="#644475"/>
    <rect x="8" y="40" width="1" height="1" fill="#644475"/>
    <rect x="9" y="40" width="1" height="1" fill="#644475"/>
    <rect x="10" y="40" width="1" height="1" fill="#644475"/>
    <rect x="11" y="40" width="1" height="1" fill="#654576"/>
    <rect x="12" y="40" width="1" height="1" fill="#674778"/>
    <rect x="13" y="40" width="1" height="1" fill="#664677"/>
    <rect x="14" y="40" width="1" height="1" fill="#654576"/>
    <rect x="15" y="40" width="1" height="1" fill="#654576"/>
    <rect x="16" y="40" width="1" height="1" fill="#654576"/>
    <rect x="17" y="40" width="1" height="1" fill="#654576"/>
    <rect x="18" y="40" width="1" height="1" fill="#644475"/>
    <rect x="19" y="40" width="1" height="1" fill="#664677"/>
    <rect x="20" y="40" width="1" height="1" fill="#654576"/>
    <rect x="21" y="40" width="1" height="1" fill="#654577"/>
    <rect x="22" y="40" width="1" height="1" fill="#654479"/>
    <rect x="23" y="40" width="1" height="1" fill="#644476"/>
    <rect x="24" y="40" width="1" height="1" fill="#614173"/>
    <rect x="25" y="40" width="1" height="1" fill="#624176"/>
    <rect x="26" y="40" width="1" height="1" fill="#634277"/>
    <rect x="27" y="40" width="1" height="1" fill="#644378"/>
    <rect x="28" y="40" width="1" height="1" fill="#67467b"/>
    <rect x="29" y="40" width="1" height="1" fill="#664677"/>
    <rect x="30" y="40" width="1" height="1" fill="#644475"/>
    <rect x="31" y="40" width="1" height="1" fill="#644475"/>
    <rect x="32" y="40" width="1" height="1" fill="#624575"/>
    <rect x="33" y="40" width="1" height="1" fill="#624571"/>
    <rect x="34" y="40" width="1" height="1" fill="#67507a"/>
    <rect x="35" y="40" width="1" height="1" fill="#040404"/>
    <rect x="36" y="40" width="1" height="1" fill="#060501"/>
    <rect x="37" y="40" width="1" height="1" fill="#201e23"/>
    <rect x="38" y="40" width="1" height="1" fill="#120f16"/>
    <rect x="39" y="40" width="1" height="1" fill="#141215"/>
    <rect x="40" y="40" width="1" height="1" fill="#000000"/>
    <rect x="41" y="40" width="1" height="1" fill="#000000"/>
    <rect x="42" y="40" width="1" height="1" fill="#e6decb"/>
    <rect x="43" y="40" width="1" height="1" fill="#efe4d0"/>
    <rect x="44" y="40" width="1" height="1" fill="#efe4d0"/>
    <rect x="45" y="40" width="1" height="1" fill="#ada598"/>
    <rect x="46" y="40" width="1" height="1" fill="#aca394"/>
    <rect x="47" y="40" width="1" height="1" fill="#ab9f91"/>
    <rect x="48" y="40" width="1" height="1" fill="#eee2ca"/>
    <rect x="49" y="40" width="1" height="1" fill="#eee4cb"/>
    <rect x="50" y="40" width="1" height="1" fill="#aaa190"/>
    <rect x="51" y="40" width="1" height="1" fill="#aea596"/>
    <rect x="52" y="40" width="1" height="1" fill="#b0a798"/>
    <rect x="53" y="40" width="1" height="1" fill="#f7ebd5"/>
    <rect x="54" y="40" width="1" height="1" fill="#f0e4cc"/>
    <rect x="55" y="40" width="1" height="1" fill="#fae9d9"/>
    <rect x="56" y="40" width="1" height="1" fill="#6d4b87"/>
    <rect x="57" y="40" width="1" height="1" fill="#6e4d82"/>
    <rect x="58" y="40" width="1" height="1" fill="#6e5187"/>
    <rect x="59" y="40" width="1" height="1" fill="#efe3cb"/>
    <rect x="60" y="40" width="1" height="1" fill="#f0e4cc"/>
    <rect x="61" y="40" width="1" height="1" fill="#0a0905"/>
    <rect x="62" y="40" width="1" height="1" fill="#020001"/>
    <rect x="63" y="40" width="1" height="1" fill="#020403"/>
    <rect x="0" y="41" width="1" height="1" fill="#010000"/>
    <rect x="1" y="41" width="1" height="1" fill="#000000"/>
    <rect x="2" y="41" width="1" height="1" fill="#04000a"/>
    <rect x="3" y="41" width="1" height="1" fill="#624575"/>
    <rect x="4" y="41" width="1" height="1" fill="#614474"/>
    <rect x="5" y="41" width="1" height="1" fill="#614474"/>
    <rect x="6" y="41" width="1" height="1" fill="#634676"/>
    <rect x="7" y="41" width="1" height="1" fill="#634676"/>
    <rect x="8" y="41" width="1" height="1" fill="#634676"/>
    <rect x="9" y="41" width="1" height="1" fill="#634676"/>
    <rect x="10" y="41" width="1" height="1" fill="#6c567a"/>
    <rect x="11" y="41" width="1" height="1" fill="#05040a"/>
    <rect x="12" y="41" width="1" height="1" fill="#060004"/>
    <rect x="13" y="41" width="1" height="1" fill="#61466f"/>
    <rect x="14" y="41" width="1" height="1" fill="#624573"/>
    <rect x="15" y="41" width="1" height="1" fill="#634676"/>
    <rect x="16" y="41" width="1" height="1" fill="#654576"/>
    <rect x="17" y="41" width="1" height="1" fill="#654576"/>
    <rect x="18" y="41" width="1" height="1" fill="#644475"/>
    <rect x="19" y="41" width="1" height="1" fill="#654576"/>
    <rect x="20" y="41" width="1" height="1" fill="#644475"/>
    <rect x="21" y="41" width="1" height="1" fill="#644475"/>
    <rect x="22" y="41" width="1" height="1" fill="#644475"/>
    <rect x="23" y="41" width="1" height="1" fill="#644475"/>
    <rect x="24" y="41" width="1" height="1" fill="#654576"/>
    <rect x="25" y="41" width="1" height="1" fill="#644475"/>
    <rect x="26" y="41" width="1" height="1" fill="#654576"/>
    <rect x="27" y="41" width="1" height="1" fill="#654576"/>
    <rect x="28" y="41" width="1" height="1" fill="#654576"/>
    <rect x="29" y="41" width="1" height="1" fill="#634676"/>
    <rect x="30" y="41" width="1" height="1" fill="#634676"/>
    <rect x="31" y="41" width="1" height="1" fill="#624476"/>
    <rect x="32" y="41" width="1" height="1" fill="#634676"/>
    <rect x="33" y="41" width="1" height="1" fill="#654878"/>
    <rect x="34" y="41" width="1" height="1" fill="#6a5178"/>
    <rect x="35" y="41" width="1" height="1" fill="#020001"/>
    <rect x="36" y="41" width="1" height="1" fill="#000000"/>
    <rect x="37" y="41" width="1" height="1" fill="#000000"/>
    <rect x="38" y="41" width="1" height="1" fill="#010101"/>
    <rect x="39" y="41" width="1" height="1" fill="#000000"/>
    <rect x="40" y="41" width="1" height="1" fill="#020200"/>
    <rect x="41" y="41" width="1" height="1" fill="#050503"/>
    <rect x="42" y="41" width="1" height="1" fill="#e6decb"/>
    <rect x="43" y="41" width="1" height="1" fill="#ece4cd"/>
    <rect x="44" y="41" width="1" height="1" fill="#ece0c8"/>
    <rect x="45" y="41" width="1" height="1" fill="#ab9f8f"/>
    <rect x="46" y="41" width="1" height="1" fill="#aea693"/>
    <rect x="47" y="41" width="1" height="1" fill="#b1a899"/>
    <rect x="48" y="41" width="1" height="1" fill="#f0e4ca"/>
    <rect x="49" y="41" width="1" height="1" fill="#ebdfc9"/>
    <rect x="50" y="41" width="1" height="1" fill="#ab9e8d"/>
    <rect x="51" y="41" width="1" height="1" fill="#b1a897"/>
    <rect x="52" y="41" width="1" height="1" fill="#b2a99a"/>
    <rect x="53" y="41" width="1" height="1" fill="#f2e8cd"/>
    <rect x="54" y="41" width="1" height="1" fill="#eee3c7"/>
    <rect x="55" y="41" width="1" height="1" fill="#ffeee6"/>
    <rect x="56" y="41" width="1" height="1" fill="#73548f"/>
    <rect x="57" y="41" width="1" height="1" fill="#74578d"/>
    <rect x="58" y="41" width="1" height="1" fill="#6d5285"/>
    <rect x="59" y="41" width="1" height="1" fill="#eee2ca"/>
    <rect x="60" y="41" width="1" height="1" fill="#f0e4cc"/>
    <rect x="61" y="41" width="1" height="1" fill="#0b0a05"/>
    <rect x="62" y="41" width="1" height="1" fill="#000000"/>
    <rect x="63" y="41" width="1" height="1" fill="#040404"/>
    <rect x="0" y="42" width="1" height="1" fill="#010000"/>
    <rect x="1" y="42" width="1" height="1" fill="#000000"/>
    <rect x="2" y="42" width="1" height="1" fill="#04000a"/>
    <rect x="3" y="42" width="1" height="1" fill="#634676"/>
    <rect x="4" y="42" width="1" height="1" fill="#614474"/>
    <rect x="5" y="42" width="1" height="1" fill="#624575"/>
    <rect x="6" y="42" width="1" height="1" fill="#624575"/>
    <rect x="7" y="42" width="1" height="1" fill="#624575"/>
    <rect x="8" y="42" width="1" height="1" fill="#634676"/>
    <rect x="9" y="42" width="1" height="1" fill="#634676"/>
    <rect x="10" y="42" width="1" height="1" fill="#644b73"/>
    <rect x="11" y="42" width="1" height="1" fill="#000100"/>
    <rect x="12" y="42" width="1" height="1" fill="#040203"/>
    <rect x="13" y="42" width="1" height="1" fill="#634871"/>
    <rect x="14" y="42" width="1" height="1" fill="#624575"/>
    <rect x="15" y="42" width="1" height="1" fill="#624575"/>
    <rect x="16" y="42" width="1" height="1" fill="#644475"/>
    <rect x="17" y="42" width="1" height="1" fill="#644475"/>
    <rect x="18" y="42" width="1" height="1" fill="#654576"/>
    <rect x="19" y="42" width="1" height="1" fill="#654576"/>
    <rect x="20" y="42" width="1" height="1" fill="#644475"/>
    <rect x="21" y="42" width="1" height="1" fill="#644475"/>
    <rect x="22" y="42" width="1" height="1" fill="#644475"/>
    <rect x="23" y="42" width="1" height="1" fill="#654576"/>
    <rect x="24" y="42" width="1" height="1" fill="#644475"/>
    <rect x="25" y="42" width="1" height="1" fill="#654576"/>
    <rect x="26" y="42" width="1" height="1" fill="#644475"/>
    <rect x="27" y="42" width="1" height="1" fill="#654576"/>
    <rect x="28" y="42" width="1" height="1" fill="#654576"/>
    <rect x="29" y="42" width="1" height="1" fill="#634676"/>
    <rect x="30" y="42" width="1" height="1" fill="#634676"/>
    <rect x="31" y="42" width="1" height="1" fill="#634577"/>
    <rect x="32" y="42" width="1" height="1" fill="#644777"/>
    <rect x="33" y="42" width="1" height="1" fill="#634676"/>
    <rect x="34" y="42" width="1" height="1" fill="#634a71"/>
    <rect x="35" y="42" width="1" height="1" fill="#010000"/>
    <rect x="36" y="42" width="1" height="1" fill="#010100"/>
    <rect x="37" y="42" width="1" height="1" fill="#010100"/>
    <rect x="38" y="42" width="1" height="1" fill="#020202"/>
    <rect x="39" y="42" width="1" height="1" fill="#010101"/>
    <rect x="40" y="42" width="1" height="1" fill="#000000"/>
    <rect x="41" y="42" width="1" height="1" fill="#000000"/>
    <rect x="42" y="42" width="1" height="1" fill="#e5ddc8"/>
    <rect x="43" y="42" width="1" height="1" fill="#ebe4ca"/>
    <rect x="44" y="42" width="1" height="1" fill="#efe3c9"/>
    <rect x="45" y="42" width="1" height="1" fill="#efe4c6"/>
    <rect x="46" y="42" width="1" height="1" fill="#efe3cb"/>
    <rect x="47" y="42" width="1" height="1" fill="#efe3cb"/>
    <rect x="48" y="42" width="1" height="1" fill="#f0e4ce"/>
    <rect x="49" y="42" width="1" height="1" fill="#efe3cd"/>
    <rect x="50" y="42" width="1" height="1" fill="#efe3cb"/>
    <rect x="51" y="42" width="1" height="1" fill="#efe3cb"/>
    <rect x="52" y="42" width="1" height="1" fill="#eee2ca"/>
    <rect x="53" y="42" width="1" height="1" fill="#efe3cb"/>
    <rect x="54" y="42" width="1" height="1" fill="#efe3cb"/>
    <rect x="55" y="42" width="1" height="1" fill="#efe5cc"/>
    <rect x="56" y="42" width="1" height="1" fill="#ede4c5"/>
    <rect x="57" y="42" width="1" height="1" fill="#ede1c7"/>
    <rect x="58" y="42" width="1" height="1" fill="#eee5c8"/>
    <rect x="59" y="42" width="1" height="1" fill="#f0e4cc"/>
    <rect x="60" y="42" width="1" height="1" fill="#f1e5cd"/>
    <rect x="61" y="42" width="1" height="1" fill="#080702"/>
    <rect x="62" y="42" width="1" height="1" fill="#000000"/>
    <rect x="63" y="42" width="1" height="1" fill="#020202"/>
    <rect x="0" y="43" width="1" height="1" fill="#030104"/>
    <rect x="1" y="43" width="1" height="1" fill="#020202"/>
    <rect x="2" y="43" width="1" height="1" fill="#040006"/>
    <rect x="3" y="43" width="1" height="1" fill="#5e4b6b"/>
    <rect x="4" y="43" width="1" height="1" fill="#5a4d69"/>
    <rect x="5" y="43" width="1" height="1" fill="#594c68"/>
    <rect x="6" y="43" width="1" height="1" fill="#5b4d6e"/>
    <rect x="7" y="43" width="1" height="1" fill="#5b4d6e"/>
    <rect x="8" y="43" width="1" height="1" fill="#5e4d6f"/>
    <rect x="9" y="43" width="1" height="1" fill="#5f4e70"/>
    <rect x="10" y="43" width="1" height="1" fill="#62546d"/>
    <rect x="11" y="43" width="1" height="1" fill="#000100"/>
    <rect x="12" y="43" width="1" height="1" fill="#010101"/>
    <rect x="13" y="43" width="1" height="1" fill="#614774"/>
    <rect x="14" y="43" width="1" height="1" fill="#644476"/>
    <rect x="15" y="43" width="1" height="1" fill="#634375"/>
    <rect x="16" y="43" width="1" height="1" fill="#634676"/>
    <rect x="17" y="43" width="1" height="1" fill="#634676"/>
    <rect x="18" y="43" width="1" height="1" fill="#634676"/>
    <rect x="19" y="43" width="1" height="1" fill="#634577"/>
    <rect x="20" y="43" width="1" height="1" fill="#624476"/>
    <rect x="21" y="43" width="1" height="1" fill="#634577"/>
    <rect x="22" y="43" width="1" height="1" fill="#634577"/>
    <rect x="23" y="43" width="1" height="1" fill="#654577"/>
    <rect x="24" y="43" width="1" height="1" fill="#654577"/>
    <rect x="25" y="43" width="1" height="1" fill="#644476"/>
    <rect x="26" y="43" width="1" height="1" fill="#634375"/>
    <rect x="27" y="43" width="1" height="1" fill="#644475"/>
    <rect x="28" y="43" width="1" height="1" fill="#644475"/>
    <rect x="29" y="43" width="1" height="1" fill="#634676"/>
    <rect x="30" y="43" width="1" height="1" fill="#644777"/>
    <rect x="31" y="43" width="1" height="1" fill="#644777"/>
    <rect x="32" y="43" width="1" height="1" fill="#04000b"/>
    <rect x="33" y="43" width="1" height="1" fill="#030007"/>
    <rect x="34" y="43" width="1" height="1" fill="#040009"/>
    <rect x="35" y="43" width="1" height="1" fill="#5d5763"/>
    <rect x="36" y="43" width="1" height="1" fill="#5a5969"/>
    <rect x="37" y="43" width="1" height="1" fill="#080401"/>
    <rect x="38" y="43" width="1" height="1" fill="#0b0801"/>
    <rect x="39" y="43" width="1" height="1" fill="#0b0a06"/>
    <rect x="40" y="43" width="1" height="1" fill="#000000"/>
    <rect x="41" y="43" width="1" height="1" fill="#000000"/>
    <rect x="42" y="43" width="1" height="1" fill="#e4dcc7"/>
    <rect x="43" y="43" width="1" height="1" fill="#ece4cd"/>
    <rect x="44" y="43" width="1" height="1" fill="#efe3cb"/>
    <rect x="45" y="43" width="1" height="1" fill="#f2e6d0"/>
    <rect x="46" y="43" width="1" height="1" fill="#efe3cd"/>
    <rect x="47" y="43" width="1" height="1" fill="#f0e4ca"/>
    <rect x="48" y="43" width="1" height="1" fill="#f0e4ce"/>
    <rect x="49" y="43" width="1" height="1" fill="#efe3cd"/>
    <rect x="50" y="43" width="1" height="1" fill="#f0e4ce"/>
    <rect x="51" y="43" width="1" height="1" fill="#efe5cc"/>
    <rect x="52" y="43" width="1" height="1" fill="#eee4cb"/>
    <rect x="53" y="43" width="1" height="1" fill="#f0e4cc"/>
    <rect x="54" y="43" width="1" height="1" fill="#f0e4cc"/>
    <rect x="55" y="43" width="1" height="1" fill="#eee4cb"/>
    <rect x="56" y="43" width="1" height="1" fill="#efe5cc"/>
    <rect x="57" y="43" width="1" height="1" fill="#efe5cc"/>
    <rect x="58" y="43" width="1" height="1" fill="#eee2ca"/>
    <rect x="59" y="43" width="1" height="1" fill="#efe1c7"/>
    <rect x="60" y="43" width="1" height="1" fill="#efe1c7"/>
    <rect x="61" y="43" width="1" height="1" fill="#0a0904"/>
    <rect x="62" y="43" width="1" height="1" fill="#020001"/>
    <rect x="63" y="43" width="1" height="1" fill="#050505"/>
    <rect x="0" y="44" width="1" height="1" fill="#020003"/>
    <rect x="1" y="44" width="1" height="1" fill="#000000"/>
    <rect x="2" y="44" width="1" height="1" fill="#020003"/>
    <rect x="3" y="44" width="1" height="1" fill="#575060"/>
    <rect x="4" y="44" width="1" height="1" fill="#5a5068"/>
    <rect x="5" y="44" width="1" height="1" fill="#5b5169"/>
    <rect x="6" y="44" width="1" height="1" fill="#5b5267"/>
    <rect x="7" y="44" width="1" height="1" fill="#5b5267"/>
    <rect x="8" y="44" width="1" height="1" fill="#595166"/>
    <rect x="9" y="44" width="1" height="1" fill="#5a5267"/>
    <rect x="10" y="44" width="1" height="1" fill="#5e5769"/>
    <rect x="11" y="44" width="1" height="1" fill="#000002"/>
    <rect x="12" y="44" width="1" height="1" fill="#000000"/>
    <rect x="13" y="44" width="1" height="1" fill="#604673"/>
    <rect x="14" y="44" width="1" height="1" fill="#654577"/>
    <rect x="15" y="44" width="1" height="1" fill="#634375"/>
    <rect x="16" y="44" width="1" height="1" fill="#624575"/>
    <rect x="17" y="44" width="1" height="1" fill="#624575"/>
    <rect x="18" y="44" width="1" height="1" fill="#634676"/>
    <rect x="19" y="44" width="1" height="1" fill="#624476"/>
    <rect x="20" y="44" width="1" height="1" fill="#634577"/>
    <rect x="21" y="44" width="1" height="1" fill="#634577"/>
    <rect x="22" y="44" width="1" height="1" fill="#634577"/>
    <rect x="23" y="44" width="1" height="1" fill="#654577"/>
    <rect x="24" y="44" width="1" height="1" fill="#654577"/>
    <rect x="25" y="44" width="1" height="1" fill="#644476"/>
    <rect x="26" y="44" width="1" height="1" fill="#654577"/>
    <rect x="27" y="44" width="1" height="1" fill="#654576"/>
    <rect x="28" y="44" width="1" height="1" fill="#654576"/>
    <rect x="29" y="44" width="1" height="1" fill="#634676"/>
    <rect x="30" y="44" width="1" height="1" fill="#634676"/>
    <rect x="31" y="44" width="1" height="1" fill="#653f78"/>
    <rect x="32" y="44" width="1" height="1" fill="#050308"/>
    <rect x="33" y="44" width="1" height="1" fill="#050006"/>
    <rect x="34" y="44" width="1" height="1" fill="#010004"/>
    <rect x="35" y="44" width="1" height="1" fill="#5a5164"/>
    <rect x="36" y="44" width="1" height="1" fill="#595764"/>
    <rect x="37" y="44" width="1" height="1" fill="#f6af9b"/>
    <rect x="38" y="44" width="1" height="1" fill="#f0a48a"/>
    <rect x="39" y="44" width="1" height="1" fill="#f4b5a3"/>
    <rect x="40" y="44" width="1" height="1" fill="#050505"/>
    <rect x="41" y="44" width="1" height="1" fill="#010101"/>
    <rect x="42" y="44" width="1" height="1" fill="#e1d9c4"/>
    <rect x="43" y="44" width="1" height="1" fill="#ebe3cc"/>
    <rect x="44" y="44" width="1" height="1" fill="#eedfca"/>
    <rect x="45" y="44" width="1" height="1" fill="#afa697"/>
    <rect x="46" y="44" width="1" height="1" fill="#b0a496"/>
    <rect x="47" y="44" width="1" height="1" fill="#afa395"/>
    <rect x="48" y="44" width="1" height="1" fill="#eee2c8"/>
    <rect x="49" y="44" width="1" height="1" fill="#eee2cc"/>
    <rect x="50" y="44" width="1" height="1" fill="#ab9f8f"/>
    <rect x="51" y="44" width="1" height="1" fill="#b1a899"/>
    <rect x="52" y="44" width="1" height="1" fill="#aea498"/>
    <rect x="53" y="44" width="1" height="1" fill="#f4e8d0"/>
    <rect x="54" y="44" width="1" height="1" fill="#f1e5cf"/>
    <rect x="55" y="44" width="1" height="1" fill="#fdf2de"/>
    <rect x="56" y="44" width="1" height="1" fill="#817b6f"/>
    <rect x="57" y="44" width="1" height="1" fill="#80796f"/>
    <rect x="58" y="44" width="1" height="1" fill="#837c6c"/>
    <rect x="59" y="44" width="1" height="1" fill="#efe5cc"/>
    <rect x="60" y="44" width="1" height="1" fill="#f0e6cd"/>
    <rect x="61" y="44" width="1" height="1" fill="#0b0a05"/>
    <rect x="62" y="44" width="1" height="1" fill="#010000"/>
    <rect x="63" y="44" width="1" height="1" fill="#040404"/>
    <rect x="0" y="45" width="1" height="1" fill="#030104"/>
    <rect x="1" y="45" width="1" height="1" fill="#010000"/>
    <rect x="2" y="45" width="1" height="1" fill="#030104"/>
    <rect x="3" y="45" width="1" height="1" fill="#565366"/>
    <rect x="4" y="45" width="1" height="1" fill="#5d5262"/>
    <rect x="5" y="45" width="1" height="1" fill="#5b5060"/>
    <rect x="6" y="45" width="1" height="1" fill="#5b5060"/>
    <rect x="7" y="45" width="1" height="1" fill="#5d5262"/>
    <rect x="8" y="45" width="1" height="1" fill="#5d5564"/>
    <rect x="9" y="45" width="1" height="1" fill="#5f5766"/>
    <rect x="10" y="45" width="1" height="1" fill="#615f6c"/>
    <rect x="11" y="45" width="1" height="1" fill="#000102"/>
    <rect x="12" y="45" width="1" height="1" fill="#000000"/>
    <rect x="13" y="45" width="1" height="1" fill="#62447a"/>
    <rect x="14" y="45" width="1" height="1" fill="#644476"/>
    <rect x="15" y="45" width="1" height="1" fill="#654577"/>
    <rect x="16" y="45" width="1" height="1" fill="#644476"/>
    <rect x="17" y="45" width="1" height="1" fill="#644476"/>
    <rect x="18" y="45" width="1" height="1" fill="#654577"/>
    <rect x="19" y="45" width="1" height="1" fill="#634577"/>
    <rect x="20" y="45" width="1" height="1" fill="#634577"/>
    <rect x="21" y="45" width="1" height="1" fill="#634577"/>
    <rect x="22" y="45" width="1" height="1" fill="#634577"/>
    <rect x="23" y="45" width="1" height="1" fill="#654576"/>
    <rect x="24" y="45" width="1" height="1" fill="#664677"/>
    <rect x="25" y="45" width="1" height="1" fill="#654576"/>
    <rect x="26" y="45" width="1" height="1" fill="#654576"/>
    <rect x="27" y="45" width="1" height="1" fill="#654576"/>
    <rect x="28" y="45" width="1" height="1" fill="#654576"/>
    <rect x="29" y="45" width="1" height="1" fill="#624575"/>
    <rect x="30" y="45" width="1" height="1" fill="#644777"/>
    <rect x="31" y="45" width="1" height="1" fill="#6a477d"/>
    <rect x="32" y="45" width="1" height="1" fill="#060105"/>
    <rect x="33" y="45" width="1" height="1" fill="#000000"/>
    <rect x="34" y="45" width="1" height="1" fill="#050000"/>
    <rect x="35" y="45" width="1" height="1" fill="#aa827a"/>
    <rect x="36" y="45" width="1" height="1" fill="#b37874"/>
    <rect x="37" y="45" width="1" height="1" fill="#fda893"/>
    <rect x="38" y="45" width="1" height="1" fill="#f6ab8b"/>
    <rect x="39" y="45" width="1" height="1" fill="#fdb295"/>
    <rect x="40" y="45" width="1" height="1" fill="#010000"/>
    <rect x="41" y="45" width="1" height="1" fill="#010000"/>
    <rect x="42" y="45" width="1" height="1" fill="#e6decb"/>
    <rect x="43" y="45" width="1" height="1" fill="#ece4cf"/>
    <rect x="44" y="45" width="1" height="1" fill="#ece1cd"/>
    <rect x="45" y="45" width="1" height="1" fill="#afa79a"/>
    <rect x="46" y="45" width="1" height="1" fill="#b0a496"/>
    <rect x="47" y="45" width="1" height="1" fill="#aca595"/>
    <rect x="48" y="45" width="1" height="1" fill="#efe3cd"/>
    <rect x="49" y="45" width="1" height="1" fill="#efe3cb"/>
    <rect x="50" y="45" width="1" height="1" fill="#afa393"/>
    <rect x="51" y="45" width="1" height="1" fill="#aea498"/>
    <rect x="52" y="45" width="1" height="1" fill="#aea498"/>
    <rect x="53" y="45" width="1" height="1" fill="#f6e9d8"/>
    <rect x="54" y="45" width="1" height="1" fill="#eee2ca"/>
    <rect x="55" y="45" width="1" height="1" fill="#f6ead2"/>
    <rect x="56" y="45" width="1" height="1" fill="#817a72"/>
    <rect x="57" y="45" width="1" height="1" fill="#7d796d"/>
    <rect x="58" y="45" width="1" height="1" fill="#7e776f"/>
    <rect x="59" y="45" width="1" height="1" fill="#eee2ca"/>
    <rect x="60" y="45" width="1" height="1" fill="#efe3c9"/>
    <rect x="61" y="45" width="1" height="1" fill="#0a0904"/>
    <rect x="62" y="45" width="1" height="1" fill="#000000"/>
    <rect x="63" y="45" width="1" height="1" fill="#020403"/>
    <rect x="0" y="46" width="1" height="1" fill="#020003"/>
    <rect x="1" y="46" width="1" height="1" fill="#010000"/>
    <rect x="2" y="46" width="1" height="1" fill="#0a0000"/>
    <rect x="3" y="46" width="1" height="1" fill="#faa586"/>
    <rect x="4" y="46" width="1" height="1" fill="#f6a789"/>
    <rect x="5" y="46" width="1" height="1" fill="#f8a98b"/>
    <rect x="6" y="46" width="1" height="1" fill="#f7a88a"/>
    <rect x="7" y="46" width="1" height="1" fill="#f8a98b"/>
    <rect x="8" y="46" width="1" height="1" fill="#f3a787"/>
    <rect x="9" y="46" width="1" height="1" fill="#f4a888"/>
    <rect x="10" y="46" width="1" height="1" fill="#f4b196"/>
    <rect x="11" y="46" width="1" height="1" fill="#010000"/>
    <rect x="12" y="46" width="1" height="1" fill="#000000"/>
    <rect x="13" y="46" width="1" height="1" fill="#62447a"/>
    <rect x="14" y="46" width="1" height="1" fill="#654577"/>
    <rect x="15" y="46" width="1" height="1" fill="#644476"/>
    <rect x="16" y="46" width="1" height="1" fill="#644476"/>
    <rect x="17" y="46" width="1" height="1" fill="#654577"/>
    <rect x="18" y="46" width="1" height="1" fill="#654577"/>
    <rect x="19" y="46" width="1" height="1" fill="#634577"/>
    <rect x="20" y="46" width="1" height="1" fill="#634577"/>
    <rect x="21" y="46" width="1" height="1" fill="#634577"/>
    <rect x="22" y="46" width="1" height="1" fill="#634577"/>
    <rect x="23" y="46" width="1" height="1" fill="#654576"/>
    <rect x="24" y="46" width="1" height="1" fill="#654576"/>
    <rect x="25" y="46" width="1" height="1" fill="#664677"/>
    <rect x="26" y="46" width="1" height="1" fill="#654576"/>
    <rect x="27" y="46" width="1" height="1" fill="#654576"/>
    <rect x="28" y="46" width="1" height="1" fill="#644475"/>
    <rect x="29" y="46" width="1" height="1" fill="#634676"/>
    <rect x="30" y="46" width="1" height="1" fill="#644777"/>
    <rect x="31" y="46" width="1" height="1" fill="#664379"/>
    <rect x="32" y="46" width="1" height="1" fill="#070206"/>
    <rect x="33" y="46" width="1" height="1" fill="#000103"/>
    <rect x="34" y="46" width="1" height="1" fill="#050200"/>
    <rect x="35" y="46" width="1" height="1" fill="#fba58a"/>
    <rect x="36" y="46" width="1" height="1" fill="#fda68a"/>
    <rect x="37" y="46" width="1" height="1" fill="#f7a68b"/>
    <rect x="38" y="46" width="1" height="1" fill="#f4a483"/>
    <rect x="39" y="46" width="1" height="1" fill="#faad8f"/>
    <rect x="40" y="46" width="1" height="1" fill="#010000"/>
    <rect x="41" y="46" width="1" height="1" fill="#030200"/>
    <rect x="42" y="46" width="1" height="1" fill="#e6decb"/>
    <rect x="43" y="46" width="1" height="1" fill="#ede5d0"/>
    <rect x="44" y="46" width="1" height="1" fill="#eee3cd"/>
    <rect x="45" y="46" width="1" height="1" fill="#aaa393"/>
    <rect x="46" y="46" width="1" height="1" fill="#aea294"/>
    <rect x="47" y="46" width="1" height="1" fill="#aaa393"/>
    <rect x="48" y="46" width="1" height="1" fill="#efe3cd"/>
    <rect x="49" y="46" width="1" height="1" fill="#efe3cb"/>
    <rect x="50" y="46" width="1" height="1" fill="#aea292"/>
    <rect x="51" y="46" width="1" height="1" fill="#aca296"/>
    <rect x="52" y="46" width="1" height="1" fill="#aea498"/>
    <rect x="53" y="46" width="1" height="1" fill="#f7ead9"/>
    <rect x="54" y="46" width="1" height="1" fill="#efe3cb"/>
    <rect x="55" y="46" width="1" height="1" fill="#fbefd7"/>
    <rect x="56" y="46" width="1" height="1" fill="#807971"/>
    <rect x="57" y="46" width="1" height="1" fill="#787468"/>
    <rect x="58" y="46" width="1" height="1" fill="#7a736b"/>
    <rect x="59" y="46" width="1" height="1" fill="#ede1c9"/>
    <rect x="60" y="46" width="1" height="1" fill="#eee2c8"/>
    <rect x="61" y="46" width="1" height="1" fill="#0b0a05"/>
    <rect x="62" y="46" width="1" height="1" fill="#000000"/>
    <rect x="63" y="46" width="1" height="1" fill="#030504"/>
    <rect x="0" y="47" width="1" height="1" fill="#050306"/>
    <rect x="1" y="47" width="1" height="1" fill="#000000"/>
    <rect x="2" y="47" width="1" height="1" fill="#070000"/>
    <rect x="3" y="47" width="1" height="1" fill="#f9a58b"/>
    <rect x="4" y="47" width="1" height="1" fill="#f7a389"/>
    <rect x="5" y="47" width="1" height="1" fill="#f8a48a"/>
    <rect x="6" y="47" width="1" height="1" fill="#f8a78c"/>
    <rect x="7" y="47" width="1" height="1" fill="#f7a68b"/>
    <rect x="8" y="47" width="1" height="1" fill="#f6a588"/>
    <rect x="9" y="47" width="1" height="1" fill="#f7a186"/>
    <rect x="10" y="47" width="1" height="1" fill="#f5ac9d"/>
    <rect x="11" y="47" width="1" height="1" fill="#020100"/>
    <rect x="12" y="47" width="1" height="1" fill="#020200"/>
    <rect x="13" y="47" width="1" height="1" fill="#624571"/>
    <rect x="14" y="47" width="1" height="1" fill="#634374"/>
    <rect x="15" y="47" width="1" height="1" fill="#644475"/>
    <rect x="16" y="47" width="1" height="1" fill="#614375"/>
    <rect x="17" y="47" width="1" height="1" fill="#634577"/>
    <rect x="18" y="47" width="1" height="1" fill="#634577"/>
    <rect x="19" y="47" width="1" height="1" fill="#634577"/>
    <rect x="20" y="47" width="1" height="1" fill="#644678"/>
    <rect x="21" y="47" width="1" height="1" fill="#634577"/>
    <rect x="22" y="47" width="1" height="1" fill="#634577"/>
    <rect x="23" y="47" width="1" height="1" fill="#654576"/>
    <rect x="24" y="47" width="1" height="1" fill="#654576"/>
    <rect x="25" y="47" width="1" height="1" fill="#634676"/>
    <rect x="26" y="47" width="1" height="1" fill="#634676"/>
    <rect x="27" y="47" width="1" height="1" fill="#654576"/>
    <rect x="28" y="47" width="1" height="1" fill="#654576"/>
    <rect x="29" y="47" width="1" height="1" fill="#644475"/>
    <rect x="30" y="47" width="1" height="1" fill="#654576"/>
    <rect x="31" y="47" width="1" height="1" fill="#67447a"/>
    <rect x="32" y="47" width="1" height="1" fill="#060107"/>
    <rect x="33" y="47" width="1" height="1" fill="#020100"/>
    <rect x="34" y="47" width="1" height="1" fill="#0d0000"/>
    <rect x="35" y="47" width="1" height="1" fill="#f3a58e"/>
    <rect x="36" y="47" width="1" height="1" fill="#fba186"/>
    <rect x="37" y="47" width="1" height="1" fill="#fda486"/>
    <rect x="38" y="47" width="1" height="1" fill="#ffa696"/>
    <rect x="39" y="47" width="1" height="1" fill="#ffb4a7"/>
    <rect x="40" y="47" width="1" height="1" fill="#000000"/>
    <rect x="41" y="47" width="1" height="1" fill="#000000"/>
    <rect x="42" y="47" width="1" height="1" fill="#e5dac6"/>
    <rect x="43" y="47" width="1" height="1" fill="#ede1c9"/>
    <rect x="44" y="47" width="1" height="1" fill="#eedfca"/>
    <rect x="45" y="47" width="1" height="1" fill="#aea693"/>
    <rect x="46" y="47" width="1" height="1" fill="#b2aa97"/>
    <rect x="47" y="47" width="1" height="1" fill="#afa599"/>
    <rect x="48" y="47" width="1" height="1" fill="#efe3cb"/>
    <rect x="49" y="47" width="1" height="1" fill="#eee2ca"/>
    <rect x="50" y="47" width="1" height="1" fill="#aa9e88"/>
    <rect x="51" y="47" width="1" height="1" fill="#ada592"/>
    <rect x="52" y="47" width="1" height="1" fill="#aca491"/>
    <rect x="53" y="47" width="1" height="1" fill="#f3e8d4"/>
    <rect x="54" y="47" width="1" height="1" fill="#eee4c9"/>
    <rect x="55" y="47" width="1" height="1" fill="#f5e9d1"/>
    <rect x="56" y="47" width="1" height="1" fill="#756e5e"/>
    <rect x="57" y="47" width="1" height="1" fill="#746c5f"/>
    <rect x="58" y="47" width="1" height="1" fill="#736b58"/>
    <rect x="59" y="47" width="1" height="1" fill="#ebdfc5"/>
    <rect x="60" y="47" width="1" height="1" fill="#eee2c8"/>
    <rect x="61" y="47" width="1" height="1" fill="#0b0a05"/>
    <rect x="62" y="47" width="1" height="1" fill="#020100"/>
    <rect x="63" y="47" width="1" height="1" fill="#040402"/>
    <rect x="0" y="48" width="1" height="1" fill="#010002"/>
    <rect x="1" y="48" width="1" height="1" fill="#010101"/>
    <rect x="2" y="48" width="1" height="1" fill="#080000"/>
    <rect x="3" y="48" width="1" height="1" fill="#f4a78b"/>
    <rect x="4" y="48" width="1" height="1" fill="#f8a78c"/>
    <rect x="5" y="48" width="1" height="1" fill="#f8a78c"/>
    <rect x="6" y="48" width="1" height="1" fill="#f7a68b"/>
    <rect x="7" y="48" width="1" height="1" fill="#f6a58a"/>
    <rect x="8" y="48" width="1" height="1" fill="#f7a58d"/>
    <rect x="9" y="48" width="1" height="1" fill="#f7a78e"/>
    <rect x="10" y="48" width="1" height="1" fill="#fdb4a5"/>
    <rect x="11" y="48" width="1" height="1" fill="#040301"/>
    <rect x="12" y="48" width="1" height="1" fill="#000000"/>
    <rect x="13" y="48" width="1" height="1" fill="#5f426e"/>
    <rect x="14" y="48" width="1" height="1" fill="#634374"/>
    <rect x="15" y="48" width="1" height="1" fill="#634374"/>
    <rect x="16" y="48" width="1" height="1" fill="#614375"/>
    <rect x="17" y="48" width="1" height="1" fill="#614375"/>
    <rect x="18" y="48" width="1" height="1" fill="#634577"/>
    <rect x="19" y="48" width="1" height="1" fill="#624476"/>
    <rect x="20" y="48" width="1" height="1" fill="#634577"/>
    <rect x="21" y="48" width="1" height="1" fill="#634577"/>
    <rect x="22" y="48" width="1" height="1" fill="#624476"/>
    <rect x="23" y="48" width="1" height="1" fill="#654576"/>
    <rect x="24" y="48" width="1" height="1" fill="#644475"/>
    <rect x="25" y="48" width="1" height="1" fill="#624575"/>
    <rect x="26" y="48" width="1" height="1" fill="#624575"/>
    <rect x="27" y="48" width="1" height="1" fill="#644475"/>
    <rect x="28" y="48" width="1" height="1" fill="#644475"/>
    <rect x="29" y="48" width="1" height="1" fill="#654576"/>
    <rect x="30" y="48" width="1" height="1" fill="#654576"/>
    <rect x="31" y="48" width="1" height="1" fill="#654278"/>
    <rect x="32" y="48" width="1" height="1" fill="#070208"/>
    <rect x="33" y="48" width="1" height="1" fill="#020100"/>
    <rect x="34" y="48" width="1" height="1" fill="#000104"/>
    <rect x="35" y="48" width="1" height="1" fill="#000305"/>
    <rect x="36" y="48" width="1" height="1" fill="#000300"/>
    <rect x="37" y="48" width="1" height="1" fill="#030400"/>
    <rect x="38" y="48" width="1" height="1" fill="#040001"/>
    <rect x="39" y="48" width="1" height="1" fill="#030104"/>
    <rect x="40" y="48" width="1" height="1" fill="#010100"/>
    <rect x="41" y="48" width="1" height="1" fill="#000000"/>
    <rect x="42" y="48" width="1" height="1" fill="#e3d8c4"/>
    <rect x="43" y="48" width="1" height="1" fill="#eee2ca"/>
    <rect x="44" y="48" width="1" height="1" fill="#efe3c9"/>
    <rect x="45" y="48" width="1" height="1" fill="#f0e4ca"/>
    <rect x="46" y="48" width="1" height="1" fill="#f0e4ca"/>
    <rect x="47" y="48" width="1" height="1" fill="#eee2c8"/>
    <rect x="48" y="48" width="1" height="1" fill="#ede1c7"/>
    <rect x="49" y="48" width="1" height="1" fill="#eee2c8"/>
    <rect x="50" y="48" width="1" height="1" fill="#eee2c8"/>
    <rect x="51" y="48" width="1" height="1" fill="#efe4c8"/>
    <rect x="52" y="48" width="1" height="1" fill="#efe3c9"/>
    <rect x="53" y="48" width="1" height="1" fill="#efe3c9"/>
    <rect x="54" y="48" width="1" height="1" fill="#efe3c9"/>
    <rect x="55" y="48" width="1" height="1" fill="#eee2ca"/>
    <rect x="56" y="48" width="1" height="1" fill="#f0e2c7"/>
    <rect x="57" y="48" width="1" height="1" fill="#efe1c6"/>
    <rect x="58" y="48" width="1" height="1" fill="#ece1c5"/>
    <rect x="59" y="48" width="1" height="1" fill="#ede1c7"/>
    <rect x="60" y="48" width="1" height="1" fill="#ede1c7"/>
    <rect x="61" y="48" width="1" height="1" fill="#0b0a05"/>
    <rect x="62" y="48" width="1" height="1" fill="#050402"/>
    <rect x="63" y="48" width="1" height="1" fill="#050503"/>
    <rect x="0" y="49" width="1" height="1" fill="#312f34"/>
    <rect x="1" y="49" width="1" height="1" fill="#2a292e"/>
    <rect x="2" y="49" width="1" height="1" fill="#3c2c2d"/>
    <rect x="3" y="49" width="1" height="1" fill="#6c4035"/>
    <rect x="4" y="49" width="1" height="1" fill="#6a4a3b"/>
    <rect x="5" y="49" width="1" height="1" fill="#69493a"/>
    <rect x="6" y="49" width="1" height="1" fill="#674738"/>
    <rect x="7" y="49" width="1" height="1" fill="#6e4e3f"/>
    <rect x="8" y="49" width="1" height="1" fill="#705041"/>
    <rect x="9" y="49" width="1" height="1" fill="#755546"/>
    <rect x="10" y="49" width="1" height="1" fill="#704d47"/>
    <rect x="11" y="49" width="1" height="1" fill="#000002"/>
    <rect x="12" y="49" width="1" height="1" fill="#010000"/>
    <rect x="13" y="49" width="1" height="1" fill="#5e436c"/>
    <rect x="14" y="49" width="1" height="1" fill="#624575"/>
    <rect x="15" y="49" width="1" height="1" fill="#624575"/>
    <rect x="16" y="49" width="1" height="1" fill="#624476"/>
    <rect x="17" y="49" width="1" height="1" fill="#614375"/>
    <rect x="18" y="49" width="1" height="1" fill="#614375"/>
    <rect x="19" y="49" width="1" height="1" fill="#614375"/>
    <rect x="20" y="49" width="1" height="1" fill="#614375"/>
    <rect x="21" y="49" width="1" height="1" fill="#624476"/>
    <rect x="22" y="49" width="1" height="1" fill="#624476"/>
    <rect x="23" y="49" width="1" height="1" fill="#654576"/>
    <rect x="24" y="49" width="1" height="1" fill="#644475"/>
    <rect x="25" y="49" width="1" height="1" fill="#634374"/>
    <rect x="26" y="49" width="1" height="1" fill="#634374"/>
    <rect x="27" y="49" width="1" height="1" fill="#644476"/>
    <rect x="28" y="49" width="1" height="1" fill="#644476"/>
    <rect x="29" y="49" width="1" height="1" fill="#654576"/>
    <rect x="30" y="49" width="1" height="1" fill="#664677"/>
    <rect x="31" y="49" width="1" height="1" fill="#654479"/>
    <rect x="32" y="49" width="1" height="1" fill="#040108"/>
    <rect x="33" y="49" width="1" height="1" fill="#000000"/>
    <rect x="34" y="49" width="1" height="1" fill="#010100"/>
    <rect x="35" y="49" width="1" height="1" fill="#000000"/>
    <rect x="36" y="49" width="1" height="1" fill="#010101"/>
    <rect x="37" y="49" width="1" height="1" fill="#000000"/>
    <rect x="38" y="49" width="1" height="1" fill="#010100"/>
    <rect x="39" y="49" width="1" height="1" fill="#000002"/>
    <rect x="40" y="49" width="1" height="1" fill="#000000"/>
    <rect x="41" y="49" width="1" height="1" fill="#050402"/>
    <rect x="42" y="49" width="1" height="1" fill="#e9e4d0"/>
    <rect x="43" y="49" width="1" height="1" fill="#f0e5cf"/>
    <rect x="44" y="49" width="1" height="1" fill="#f1e3c9"/>
    <rect x="45" y="49" width="1" height="1" fill="#efe3c9"/>
    <rect x="46" y="49" width="1" height="1" fill="#efe3c9"/>
    <rect x="47" y="49" width="1" height="1" fill="#f0e2c8"/>
    <rect x="48" y="49" width="1" height="1" fill="#f1e3c9"/>
    <rect x="49" y="49" width="1" height="1" fill="#efe1c7"/>
    <rect x="50" y="49" width="1" height="1" fill="#efe3c9"/>
    <rect x="51" y="49" width="1" height="1" fill="#efe3c9"/>
    <rect x="52" y="49" width="1" height="1" fill="#f1e2cb"/>
    <rect x="53" y="49" width="1" height="1" fill="#eee3c7"/>
    <rect x="54" y="49" width="1" height="1" fill="#efe4c8"/>
    <rect x="55" y="49" width="1" height="1" fill="#eee2c8"/>
    <rect x="56" y="49" width="1" height="1" fill="#f0e2c8"/>
    <rect x="57" y="49" width="1" height="1" fill="#efe1c7"/>
    <rect x="58" y="49" width="1" height="1" fill="#efe1c7"/>
    <rect x="59" y="49" width="1" height="1" fill="#ece1c5"/>
    <rect x="60" y="49" width="1" height="1" fill="#ede2c6"/>
    <rect x="61" y="49" width="1" height="1" fill="#070802"/>
    <rect x="62" y="49" width="1" height="1" fill="#000000"/>
    <rect x="63" y="49" width="1" height="1" fill="#060503"/>
    <rect x="3" y="50" width="1" height="1" fill="#020003"/>
    <rect x="4" y="50" width="1" height="1" fill="#000100"/>
    <rect x="5" y="50" width="1" height="1" fill="#000201"/>
    <rect x="6" y="50" width="1" height="1" fill="#000201"/>
    <rect x="7" y="50" width="1" height="1" fill="#000100"/>
    <rect x="8" y="50" width="1" height="1" fill="#000100"/>
    <rect x="9" y="50" width="1" height="1" fill="#000100"/>
    <rect x="10" y="50" width="1" height="1" fill="#0b040c"/>
    <rect x="11" y="50" width="1" height="1" fill="#544566"/>
    <rect x="12" y="50" width="1" height="1" fill="#5e4b69"/>
    <rect x="13" y="50" width="1" height="1" fill="#624575"/>
    <rect x="14" y="50" width="1" height="1" fill="#604373"/>
    <rect x="15" y="50" width="1" height="1" fill="#634676"/>
    <rect x="16" y="50" width="1" height="1" fill="#624476"/>
    <rect x="17" y="50" width="1" height="1" fill="#604274"/>
    <rect x="18" y="50" width="1" height="1" fill="#624476"/>
    <rect x="19" y="50" width="1" height="1" fill="#624476"/>
    <rect x="20" y="50" width="1" height="1" fill="#624476"/>
    <rect x="21" y="50" width="1" height="1" fill="#614375"/>
    <rect x="22" y="50" width="1" height="1" fill="#614375"/>
    <rect x="23" y="50" width="1" height="1" fill="#634374"/>
    <rect x="24" y="50" width="1" height="1" fill="#634374"/>
    <rect x="25" y="50" width="1" height="1" fill="#634374"/>
    <rect x="26" y="50" width="1" height="1" fill="#634374"/>
    <rect x="27" y="50" width="1" height="1" fill="#634375"/>
    <rect x="28" y="50" width="1" height="1" fill="#654577"/>
    <rect x="29" y="50" width="1" height="1" fill="#654576"/>
    <rect x="30" y="50" width="1" height="1" fill="#634374"/>
    <rect x="31" y="50" width="1" height="1" fill="#634174"/>
    <rect x="40" y="50" width="1" height="1" fill="#020202"/>
    <rect x="41" y="50" width="1" height="1" fill="#050402"/>
    <rect x="42" y="50" width="1" height="1" fill="#0a0907"/>
    <rect x="43" y="50" width="1" height="1" fill="#0b0706"/>
    <rect x="44" y="50" width="1" height="1" fill="#060803"/>
    <rect x="45" y="50" width="1" height="1" fill="#060803"/>
    <rect x="46" y="50" width="1" height="1" fill="#060805"/>
    <rect x="47" y="50" width="1" height="1" fill="#090b08"/>
    <rect x="48" y="50" width="1" height="1" fill="#090b08"/>
    <rect x="49" y="50" width="1" height="1" fill="#090b08"/>
    <rect x="50" y="50" width="1" height="1" fill="#070906"/>
    <rect x="51" y="50" width="1" height="1" fill="#060803"/>
    <rect x="52" y="50" width="1" height="1" fill="#050702"/>
    <rect x="53" y="50" width="1" height="1" fill="#0c0805"/>
    <rect x="54" y="50" width="1" height="1" fill="#0a0905"/>
    <rect x="55" y="50" width="1" height="1" fill="#070906"/>
    <rect x="56" y="50" width="1" height="1" fill="#070906"/>
    <rect x="57" y="50" width="1" height="1" fill="#0a0b06"/>
    <rect x="58" y="50" width="1" height="1" fill="#090a05"/>
    <rect x="59" y="50" width="1" height="1" fill="#0b0a06"/>
    <rect x="60" y="50" width="1" height="1" fill="#090502"/>
    <rect x="3" y="51" width="1" height="1" fill="#050601"/>
    <rect x="4" y="51" width="1" height="1" fill="#010000"/>
    <rect x="5" y="51" width="1" height="1" fill="#000000"/>
    <rect x="6" y="51" width="1" height="1" fill="#010101"/>
    <rect x="7" y="51" width="1" height="1" fill="#010101"/>
    <rect x="8" y="51" width="1" height="1" fill="#000000"/>
    <rect x="9" y="51" width="1" height="1" fill="#000000"/>
    <rect x="10" y="51" width="1" height="1" fill="#06000b"/>
    <rect x="11" y="51" width="1" height="1" fill="#5f4376"/>
    <rect x="12" y="51" width="1" height="1" fill="#604274"/>
    <rect x="13" y="51" width="1" height="1" fill="#614375"/>
    <rect x="14" y="51" width="1" height="1" fill="#624575"/>
    <rect x="15" y="51" width="1" height="1" fill="#614474"/>
    <rect x="16" y="51" width="1" height="1" fill="#644475"/>
    <rect x="17" y="51" width="1" height="1" fill="#664677"/>
    <rect x="18" y="51" width="1" height="1" fill="#664677"/>
    <rect x="19" y="51" width="1" height="1" fill="#634579"/>
    <rect x="20" y="51" width="1" height="1" fill="#624478"/>
    <rect x="21" y="51" width="1" height="1" fill="#644476"/>
    <rect x="22" y="51" width="1" height="1" fill="#634375"/>
    <rect x="23" y="51" width="1" height="1" fill="#634375"/>
    <rect x="24" y="51" width="1" height="1" fill="#644476"/>
    <rect x="25" y="51" width="1" height="1" fill="#634277"/>
    <rect x="26" y="51" width="1" height="1" fill="#624575"/>
    <rect x="27" y="51" width="1" height="1" fill="#644378"/>
    <rect x="28" y="51" width="1" height="1" fill="#634277"/>
    <rect x="29" y="51" width="1" height="1" fill="#644475"/>
    <rect x="30" y="51" width="1" height="1" fill="#634579"/>
    <rect x="31" y="51" width="1" height="1" fill="#67467b"/>
    <rect x="40" y="51" width="1" height="1" fill="#060604"/>
    <rect x="41" y="51" width="1" height="1" fill="#000000"/>
    <rect x="42" y="51" width="1" height="1" fill="#000000"/>
    <rect x="43" y="51" width="1" height="1" fill="#010101"/>
    <rect x="44" y="51" width="1" height="1" fill="#010101"/>
    <rect x="45" y="51" width="1" height="1" fill="#010101"/>
    <rect x="46" y="51" width="1" height="1" fill="#010101"/>
    <rect x="47" y="51" width="1" height="1" fill="#000000"/>
    <rect x="48" y="51" width="1" height="1" fill="#000000"/>
    <rect x="49" y="51" width="1" height="1" fill="#000000"/>
    <rect x="50" y="51" width="1" height="1" fill="#000000"/>
    <rect x="51" y="51" width="1" height="1" fill="#010101"/>
    <rect x="52" y="51" width="1" height="1" fill="#010101"/>
    <rect x="53" y="51" width="1" height="1" fill="#000000"/>
    <rect x="54" y="51" width="1" height="1" fill="#000000"/>
    <rect x="55" y="51" width="1" height="1" fill="#010101"/>
    <rect x="56" y="51" width="1" height="1" fill="#000000"/>
    <rect x="57" y="51" width="1" height="1" fill="#000000"/>
    <rect x="58" y="51" width="1" height="1" fill="#010101"/>
    <rect x="59" y="51" width="1" height="1" fill="#010101"/>
    <rect x="60" y="51" width="1" height="1" fill="#030303"/>
    <rect x="3" y="52" width="1" height="1" fill="#080806"/>
    <rect x="4" y="52" width="1" height="1" fill="#060405"/>
    <rect x="5" y="52" width="1" height="1" fill="#030301"/>
    <rect x="6" y="52" width="1" height="1" fill="#000000"/>
    <rect x="7" y="52" width="1" height="1" fill="#000000"/>
    <rect x="8" y="52" width="1" height="1" fill="#010204"/>
    <rect x="9" y="52" width="1" height="1" fill="#040507"/>
    <rect x="10" y="52" width="1" height="1" fill="#05010f"/>
    <rect x="11" y="52" width="1" height="1" fill="#564567"/>
    <rect x="12" y="52" width="1" height="1" fill="#5a456c"/>
    <rect x="13" y="52" width="1" height="1" fill="#5a456c"/>
    <rect x="14" y="52" width="1" height="1" fill="#5e4972"/>
    <rect x="15" y="52" width="1" height="1" fill="#614c75"/>
    <rect x="16" y="52" width="1" height="1" fill="#614c75"/>
    <rect x="17" y="52" width="1" height="1" fill="#614c75"/>
    <rect x="18" y="52" width="1" height="1" fill="#5f4a73"/>
    <rect x="19" y="52" width="1" height="1" fill="#5e4970"/>
    <rect x="20" y="52" width="1" height="1" fill="#5d486f"/>
    <rect x="21" y="52" width="1" height="1" fill="#5c486d"/>
    <rect x="22" y="52" width="1" height="1" fill="#5d496e"/>
    <rect x="23" y="52" width="1" height="1" fill="#5f4a71"/>
    <rect x="24" y="52" width="1" height="1" fill="#684f77"/>
    <rect x="25" y="52" width="1" height="1" fill="#654b70"/>
    <rect x="26" y="52" width="1" height="1" fill="#654c73"/>
    <rect x="27" y="52" width="1" height="1" fill="#5b466d"/>
    <rect x="28" y="52" width="1" height="1" fill="#604b72"/>
    <rect x="29" y="52" width="1" height="1" fill="#685278"/>
    <rect x="30" y="52" width="1" height="1" fill="#674f73"/>
    <rect x="31" y="52" width="1" height="1" fill="#654c73"/>
    <rect x="40" y="52" width="1" height="1" fill="#07050a"/>
    <rect x="41" y="52" width="1" height="1" fill="#060407"/>
    <rect x="42" y="52" width="1" height="1" fill="#060407"/>
    <rect x="43" y="52" width="1" height="1" fill="#060407"/>
    <rect x="44" y="52" width="1" height="1" fill="#060407"/>
    <rect x="45" y="52" width="1" height="1" fill="#060407"/>
    <rect x="46" y="52" width="1" height="1" fill="#060407"/>
    <rect x="47" y="52" width="1" height="1" fill="#040207"/>
    <rect x="48" y="52" width="1" height="1" fill="#060409"/>
    <rect x="49" y="52" width="1" height="1" fill="#060409"/>
    <rect x="50" y="52" width="1" height="1" fill="#060407"/>
    <rect x="51" y="52" width="1" height="1" fill="#060407"/>
    <rect x="52" y="52" width="1" height="1" fill="#060407"/>
    <rect x="53" y="52" width="1" height="1" fill="#060409"/>
    <rect x="54" y="52" width="1" height="1" fill="#050306"/>
    <rect x="55" y="52" width="1" height="1" fill="#060407"/>
    <rect x="56" y="52" width="1" height="1" fill="#060407"/>
    <rect x="57" y="52" width="1" height="1" fill="#060407"/>
    <rect x="58" y="52" width="1" height="1" fill="#060407"/>
    <rect x="59" y="52" width="1" height="1" fill="#060407"/>
    <rect x="60" y="52" width="1" height="1" fill="#080609"/>
    <rect x="5" y="53" width="1" height="1" fill="#040205"/>
    <rect x="6" y="53" width="1" height="1" fill="#020202"/>
    <rect x="7" y="53" width="1" height="1" fill="#030303"/>
    <rect x="8" y="53" width="1" height="1" fill="#303644"/>
    <rect x="9" y="53" width="1" height="1" fill="#303644"/>
    <rect x="10" y="53" width="1" height="1" fill="#303642"/>
    <rect x="11" y="53" width="1" height="1" fill="#333945"/>
    <rect x="12" y="53" width="1" height="1" fill="#323844"/>
    <rect x="13" y="53" width="1" height="1" fill="#323844"/>
    <rect x="14" y="53" width="1" height="1" fill="#323844"/>
    <rect x="15" y="53" width="1" height="1" fill="#323844"/>
    <rect x="16" y="53" width="1" height="1" fill="#323844"/>
    <rect x="17" y="53" width="1" height="1" fill="#323844"/>
    <rect x="18" y="53" width="1" height="1" fill="#323844"/>
    <rect x="19" y="53" width="1" height="1" fill="#323844"/>
    <rect x="20" y="53" width="1" height="1" fill="#313743"/>
    <rect x="21" y="53" width="1" height="1" fill="#313944"/>
    <rect x="22" y="53" width="1" height="1" fill="#2f3742"/>
    <rect x="23" y="53" width="1" height="1" fill="#303741"/>
    <rect x="24" y="53" width="1" height="1" fill="#05060b"/>
    <rect x="25" y="53" width="1" height="1" fill="#050100"/>
    <rect x="26" y="53" width="1" height="1" fill="#010204"/>
    <rect x="27" y="53" width="1" height="1" fill="#303342"/>
    <rect x="28" y="53" width="1" height="1" fill="#313443"/>
    <rect x="29" y="53" width="1" height="1" fill="#28292e"/>
    <rect x="30" y="53" width="1" height="1" fill="#030400"/>
    <rect x="31" y="53" width="1" height="1" fill="#040402"/>
    <rect x="5" y="54" width="1" height="1" fill="#020003"/>
    <rect x="6" y="54" width="1" height="1" fill="#000000"/>
    <rect x="7" y="54" width="1" height="1" fill="#000000"/>
    <rect x="8" y="54" width="1" height="1" fill="#303644"/>
    <rect x="9" y="54" width="1" height="1" fill="#323846"/>
    <rect x="10" y="54" width="1" height="1" fill="#313743"/>
    <rect x="11" y="54" width="1" height="1" fill="#323844"/>
    <rect x="12" y="54" width="1" height="1" fill="#323844"/>
    <rect x="13" y="54" width="1" height="1" fill="#323844"/>
    <rect x="14" y="54" width="1" height="1" fill="#323844"/>
    <rect x="15" y="54" width="1" height="1" fill="#323844"/>
    <rect x="16" y="54" width="1" height="1" fill="#323844"/>
    <rect x="17" y="54" width="1" height="1" fill="#323844"/>
    <rect x="18" y="54" width="1" height="1" fill="#323844"/>
    <rect x="19" y="54" width="1" height="1" fill="#323844"/>
    <rect x="20" y="54" width="1" height="1" fill="#333945"/>
    <rect x="21" y="54" width="1" height="1" fill="#383c47"/>
    <rect x="22" y="54" width="1" height="1" fill="#30333c"/>
    <rect x="23" y="54" width="1" height="1" fill="#32323e"/>
    <rect x="24" y="54" width="1" height="1" fill="#000000"/>
    <rect x="25" y="54" width="1" height="1" fill="#000000"/>
    <rect x="26" y="54" width="1" height="1" fill="#020202"/>
    <rect x="27" y="54" width="1" height="1" fill="#1e2126"/>
    <rect x="28" y="54" width="1" height="1" fill="#1e2126"/>
    <rect x="29" y="54" width="1" height="1" fill="#15161a"/>
    <rect x="30" y="54" width="1" height="1" fill="#000000"/>
    <rect x="31" y="54" width="1" height="1" fill="#020202"/>
    <rect x="5" y="55" width="1" height="1" fill="#020003"/>
    <rect x="6" y="55" width="1" height="1" fill="#010000"/>
    <rect x="7" y="55" width="1" height="1" fill="#020100"/>
    <rect x="8" y="55" width="1" height="1" fill="#2c3240"/>
    <rect x="9" y="55" width="1" height="1" fill="#303644"/>
    <rect x="10" y="55" width="1" height="1" fill="#313743"/>
    <rect x="11" y="55" width="1" height="1" fill="#313743"/>
    <rect x="12" y="55" width="1" height="1" fill="#323844"/>
    <rect x="13" y="55" width="1" height="1" fill="#323844"/>
    <rect x="14" y="55" width="1" height="1" fill="#333945"/>
    <rect x="15" y="55" width="1" height="1" fill="#323844"/>
    <rect x="16" y="55" width="1" height="1" fill="#333945"/>
    <rect x="17" y="55" width="1" height="1" fill="#323844"/>
    <rect x="18" y="55" width="1" height="1" fill="#333945"/>
    <rect x="19" y="55" width="1" height="1" fill="#323844"/>
    <rect x="20" y="55" width="1" height="1" fill="#333945"/>
    <rect x="21" y="55" width="1" height="1" fill="#383b44"/>
    <rect x="22" y="55" width="1" height="1" fill="#000000"/>
    <rect x="23" y="55" width="1" height="1" fill="#010101"/>
    <rect x="24" y="55" width="1" height="1" fill="#010101"/>
    <rect x="25" y="55" width="1" height="1" fill="#020001"/>
    <rect x="26" y="55" width="1" height="1" fill="#000000"/>
    <rect x="27" y="55" width="1" height="1" fill="#040301"/>
    <rect x="28" y="55" width="1" height="1" fill="#050402"/>
    <rect x="29" y="55" width="1" height="1" fill="#040807"/>
    <rect x="30" y="55" width="1" height="1" fill="#020100"/>
    <rect x="31" y="55" width="1" height="1" fill="#040404"/>
    <rect x="5" y="56" width="1" height="1" fill="#050306"/>
    <rect x="6" y="56" width="1" height="1" fill="#030200"/>
    <rect x="7" y="56" width="1" height="1" fill="#040301"/>
    <rect x="8" y="56" width="1" height="1" fill="#333947"/>
    <rect x="9" y="56" width="1" height="1" fill="#313745"/>
    <rect x="10" y="56" width="1" height="1" fill="#303642"/>
    <rect x="11" y="56" width="1" height="1" fill="#303642"/>
    <rect x="12" y="56" width="1" height="1" fill="#303642"/>
    <rect x="13" y="56" width="1" height="1" fill="#323844"/>
    <rect x="14" y="56" width="1" height="1" fill="#313743"/>
    <rect x="15" y="56" width="1" height="1" fill="#313743"/>
    <rect x="16" y="56" width="1" height="1" fill="#313743"/>
    <rect x="17" y="56" width="1" height="1" fill="#313743"/>
    <rect x="18" y="56" width="1" height="1" fill="#313743"/>
    <rect x="19" y="56" width="1" height="1" fill="#313743"/>
    <rect x="20" y="56" width="1" height="1" fill="#323844"/>
    <rect x="21" y="56" width="1" height="1" fill="#35383f"/>
    <rect x="22" y="56" width="1" height="1" fill="#000000"/>
    <rect x="23" y="56" width="1" height="1" fill="#000000"/>
    <rect x="24" y="56" width="1" height="1" fill="#000000"/>
    <rect x="25" y="56" width="1" height="1" fill="#010000"/>
    <rect x="26" y="56" width="1" height="1" fill="#000002"/>
    <rect x="27" y="56" width="1" height="1" fill="#2e3545"/>
    <rect x="28" y="56" width="1" height="1" fill="#2e3545"/>
    <rect x="29" y="56" width="1" height="1" fill="#25292c"/>
    <rect x="30" y="56" width="1" height="1" fill="#010000"/>
    <rect x="31" y="56" width="1" height="1" fill="#050505"/>
    <rect x="5" y="57" width="1" height="1" fill="#000308"/>
    <rect x="6" y="57" width="1" height="1" fill="#04050a"/>
    <rect x="7" y="57" width="1" height="1" fill="#06070c"/>
    <rect x="8" y="57" width="1" height="1" fill="#2e3440"/>
    <rect x="9" y="57" width="1" height="1" fill="#303642"/>
    <rect x="10" y="57" width="1" height="1" fill="#303642"/>
    <rect x="11" y="57" width="1" height="1" fill="#303642"/>
    <rect x="12" y="57" width="1" height="1" fill="#303642"/>
    <rect x="13" y="57" width="1" height="1" fill="#303642"/>
    <rect x="14" y="57" width="1" height="1" fill="#313743"/>
    <rect x="15" y="57" width="1" height="1" fill="#313743"/>
    <rect x="16" y="57" width="1" height="1" fill="#343844"/>
    <rect x="17" y="57" width="1" height="1" fill="#343844"/>
    <rect x="18" y="57" width="1" height="1" fill="#323642"/>
    <rect x="19" y="57" width="1" height="1" fill="#313541"/>
    <rect x="20" y="57" width="1" height="1" fill="#323642"/>
    <rect x="21" y="57" width="1" height="1" fill="#353a40"/>
    <rect x="22" y="57" width="1" height="1" fill="#000000"/>
    <rect x="23" y="57" width="1" height="1" fill="#000000"/>
    <rect x="24" y="57" width="1" height="1" fill="#000000"/>
    <rect x="25" y="57" width="1" height="1" fill="#000000"/>
    <rect x="26" y="57" width="1" height="1" fill="#000002"/>
    <rect x="27" y="57" width="1" height="1" fill="#2f3543"/>
    <rect x="28" y="57" width="1" height="1" fill="#2f3543"/>
    <rect x="29" y="57" width="1" height="1" fill="#24292f"/>
    <rect x="30" y="57" width="1" height="1" fill="#010100"/>
    <rect x="31" y="57" width="1" height="1" fill="#040402"/>
    <rect x="3" y="58" width="1" height="1" fill="#000000"/>
    <rect x="4" y="58" width="1" height="1" fill="#030200"/>
    <rect x="5" y="58" width="1" height="1" fill="#3d414a"/>
    <rect x="6" y="58" width="1" height="1" fill="#2e3440"/>
    <rect x="7" y="58" width="1" height="1" fill="#2b313d"/>
    <rect x="8" y="58" width="1" height="1" fill="#2e3440"/>
    <rect x="9" y="58" width="1" height="1" fill="#303642"/>
    <rect x="10" y="58" width="1" height="1" fill="#303642"/>
    <rect x="11" y="58" width="1" height="1" fill="#303642"/>
    <rect x="12" y="58" width="1" height="1" fill="#303642"/>
    <rect x="13" y="58" width="1" height="1" fill="#303642"/>
    <rect x="14" y="58" width="1" height="1" fill="#313743"/>
    <rect x="15" y="58" width="1" height="1" fill="#313743"/>
    <rect x="16" y="58" width="1" height="1" fill="#323642"/>
    <rect x="17" y="58" width="1" height="1" fill="#323642"/>
    <rect x="18" y="58" width="1" height="1" fill="#313541"/>
    <rect x="19" y="58" width="1" height="1" fill="#303440"/>
    <rect x="20" y="58" width="1" height="1" fill="#313541"/>
    <rect x="21" y="58" width="1" height="1" fill="#34393f"/>
    <rect x="22" y="58" width="1" height="1" fill="#000000"/>
    <rect x="23" y="58" width="1" height="1" fill="#000000"/>
    <rect x="24" y="58" width="1" height="1" fill="#000000"/>
    <rect x="25" y="58" width="1" height="1" fill="#000000"/>
    <rect x="26" y="58" width="1" height="1" fill="#000100"/>
    <rect x="27" y="58" width="1" height="1" fill="#303644"/>
    <rect x="28" y="58" width="1" height="1" fill="#2f3543"/>
    <rect x="29" y="58" width="1" height="1" fill="#272a2f"/>
    <rect x="30" y="58" width="1" height="1" fill="#020100"/>
    <rect x="31" y="58" width="1" height="1" fill="#040402"/>
    <rect x="3" y="59" width="1" height="1" fill="#060604"/>
    <rect x="4" y="59" width="1" height="1" fill="#010000"/>
    <rect x="5" y="59" width="1" height="1" fill="#2c333d"/>
    <rect x="6" y="59" width="1" height="1" fill="#30323f"/>
    <rect x="7" y="59" width="1" height="1" fill="#313340"/>
    <rect x="8" y="59" width="1" height="1" fill="#2f3541"/>
    <rect x="9" y="59" width="1" height="1" fill="#2e3440"/>
    <rect x="10" y="59" width="1" height="1" fill="#2f3541"/>
    <rect x="11" y="59" width="1" height="1" fill="#303642"/>
    <rect x="12" y="59" width="1" height="1" fill="#313743"/>
    <rect x="13" y="59" width="1" height="1" fill="#313743"/>
    <rect x="14" y="59" width="1" height="1" fill="#303642"/>
    <rect x="15" y="59" width="1" height="1" fill="#313743"/>
    <rect x="16" y="59" width="1" height="1" fill="#303440"/>
    <rect x="17" y="59" width="1" height="1" fill="#303440"/>
    <rect x="18" y="59" width="1" height="1" fill="#303440"/>
    <rect x="19" y="59" width="1" height="1" fill="#323642"/>
    <rect x="20" y="59" width="1" height="1" fill="#333743"/>
    <rect x="21" y="59" width="1" height="1" fill="#34393f"/>
    <rect x="22" y="59" width="1" height="1" fill="#000000"/>
    <rect x="23" y="59" width="1" height="1" fill="#010101"/>
    <rect x="24" y="59" width="1" height="1" fill="#000000"/>
    <rect x="25" y="59" width="1" height="1" fill="#010101"/>
    <rect x="26" y="59" width="1" height="1" fill="#010302"/>
    <rect x="27" y="59" width="1" height="1" fill="#2e3442"/>
    <rect x="28" y="59" width="1" height="1" fill="#2d3341"/>
    <rect x="29" y="59" width="1" height="1" fill="#27282c"/>
    <rect x="30" y="59" width="1" height="1" fill="#030200"/>
    <rect x="31" y="59" width="1" height="1" fill="#040402"/>
    <rect x="3" y="60" width="1" height="1" fill="#020200"/>
    <rect x="4" y="60" width="1" height="1" fill="#000000"/>
    <rect x="5" y="60" width="1" height="1" fill="#33363b"/>
    <rect x="6" y="60" width="1" height="1" fill="#2d343e"/>
    <rect x="7" y="60" width="1" height="1" fill="#2c333d"/>
    <rect x="8" y="60" width="1" height="1" fill="#2c333d"/>
    <rect x="9" y="60" width="1" height="1" fill="#2d343e"/>
    <rect x="10" y="60" width="1" height="1" fill="#2d343e"/>
    <rect x="11" y="60" width="1" height="1" fill="#2e353f"/>
    <rect x="12" y="60" width="1" height="1" fill="#2e353f"/>
    <rect x="13" y="60" width="1" height="1" fill="#2e353f"/>
    <rect x="14" y="60" width="1" height="1" fill="#2e353f"/>
    <rect x="15" y="60" width="1" height="1" fill="#2f3640"/>
    <rect x="16" y="60" width="1" height="1" fill="#2d343e"/>
    <rect x="17" y="60" width="1" height="1" fill="#2f3640"/>
    <rect x="18" y="60" width="1" height="1" fill="#2d343e"/>
    <rect x="19" y="60" width="1" height="1" fill="#2c333d"/>
    <rect x="20" y="60" width="1" height="1" fill="#2c333d"/>
    <rect x="21" y="60" width="1" height="1" fill="#30333a"/>
    <rect x="22" y="60" width="1" height="1" fill="#010000"/>
    <rect x="23" y="60" width="1" height="1" fill="#010101"/>
    <rect x="24" y="60" width="1" height="1" fill="#010101"/>
    <rect x="25" y="60" width="1" height="1" fill="#010000"/>
    <rect x="26" y="60" width="1" height="1" fill="#010103"/>
    <rect x="27" y="60" width="1" height="1" fill="#2b323c"/>
    <rect x="28" y="60" width="1" height="1" fill="#2f3640"/>
    <rect x="29" y="60" width="1" height="1" fill="#28292e"/>
    <rect x="30" y="60" width="1" height="1" fill="#000000"/>
    <rect x="31" y="60" width="1" height="1" fill="#040203"/>
    <rect x="3" y="61" width="1" height="1" fill="#010100"/>
    <rect x="4" y="61" width="1" height="1" fill="#010100"/>
    <rect x="5" y="61" width="1" height="1" fill="#000000"/>
    <rect x="6" y="61" width="1" height="1" fill="#000000"/>
    <rect x="7" y="61" width="1" height="1" fill="#010100"/>
    <rect x="8" y="61" width="1" height="1" fill="#010100"/>
    <rect x="9" y="61" width="1" height="1" fill="#020200"/>
    <rect x="10" y="61" width="1" height="1" fill="#020200"/>
    <rect x="11" y="61" width="1" height="1" fill="#010100"/>
    <rect x="12" y="61" width="1" height="1" fill="#010100"/>
    <rect x="13" y="61" width="1" height="1" fill="#000000"/>
    <rect x="14" y="61" width="1" height="1" fill="#000000"/>
    <rect x="15" y="61" width="1" height="1" fill="#030301"/>
    <rect x="16" y="61" width="1" height="1" fill="#000000"/>
    <rect x="17" y="61" width="1" height="1" fill="#000000"/>
    <rect x="18" y="61" width="1" height="1" fill="#010100"/>
    <rect x="19" y="61" width="1" height="1" fill="#020200"/>
    <rect x="20" y="61" width="1" height="1" fill="#010100"/>
    <rect x="21" y="61" width="1" height="1" fill="#010100"/>
    <rect x="22" y="61" width="1" height="1" fill="#010004"/>
    <rect x="23" y="61" width="1" height="1" fill="#010101"/>
    <rect x="24" y="61" width="1" height="1" fill="#000000"/>
    <rect x="25" y="61" width="1" height="1" fill="#010002"/>
    <rect x="26" y="61" width="1" height="1" fill="#000000"/>
    <rect x="27" y="61" width="1" height="1" fill="#010000"/>
    <rect x="28" y="61" width="1" height="1" fill="#010000"/>
    <rect x="29" y="61" width="1" height="1" fill="#000004"/>
    <rect x="30" y="61" width="1" height="1" fill="#010200"/>
    <rect x="31" y="61" width="1" height="1" fill="#040301"/>
    <rect x="32" y="61" width="1" height="1" fill="#020003"/>
    <rect x="33" y="61" width="1" height="1" fill="#030200"/>
    <rect x="34" y="61" width="1" height="1" fill="#070707"/>
    <rect x="3" y="62" width="1" height="1" fill="#000000"/>
    <rect x="4" y="62" width="1" height="1" fill="#010101"/>
    <rect x="5" y="62" width="1" height="1" fill="#000000"/>
    <rect x="6" y="62" width="1" height="1" fill="#000000"/>
    <rect x="7" y="62" width="1" height="1" fill="#000000"/>
    <rect x="8" y="62" width="1" height="1" fill="#010101"/>
    <rect x="9" y="62" width="1" height="1" fill="#000000"/>
    <rect x="10" y="62" width="1" height="1" fill="#000000"/>
    <rect x="11" y="62" width="1" height="1" fill="#000000"/>
    <rect x="12" y="62" width="1" height="1" fill="#000000"/>
    <rect x="13" y="62" width="1" height="1" fill="#000000"/>
    <rect x="14" y="62" width="1" height="1" fill="#000000"/>
    <rect x="15" y="62" width="1" height="1" fill="#000000"/>
    <rect x="16" y="62" width="1" height="1" fill="#010101"/>
    <rect x="17" y="62" width="1" height="1" fill="#010101"/>
    <rect x="18" y="62" width="1" height="1" fill="#010101"/>
    <rect x="19" y="62" width="1" height="1" fill="#010101"/>
    <rect x="20" y="62" width="1" height="1" fill="#010101"/>
    <rect x="21" y="62" width="1" height="1" fill="#000000"/>
    <rect x="22" y="62" width="1" height="1" fill="#000000"/>
    <rect x="23" y="62" width="1" height="1" fill="#010101"/>
    <rect x="24" y="62" width="1" height="1" fill="#010101"/>
    <rect x="25" y="62" width="1" height="1" fill="#010101"/>
    <rect x="26" y="62" width="1" height="1" fill="#000000"/>
    <rect x="27" y="62" width="1" height="1" fill="#010101"/>
    <rect x="28" y="62" width="1" height="1" fill="#000000"/>
    <rect x="29" y="62" width="1" height="1" fill="#010101"/>
    <rect x="30" y="62" width="1" height="1" fill="#010101"/>
    <rect x="31" y="62" width="1" height="1" fill="#000000"/>
    <rect x="32" y="62" width="1" height="1" fill="#000000"/>
    <rect x="33" y="62" width="1" height="1" fill="#000000"/>
    <rect x="34" y="62" width="1" height="1" fill="#080808"/>
    <rect x="3" y="63" width="1" height="1" fill="#000000"/>
    <rect x="4" y="63" width="1" height="1" fill="#010101"/>
    <rect x="5" y="63" width="1" height="1" fill="#000000"/>
    <rect x="6" y="63" width="1" height="1" fill="#000000"/>
    <rect x="7" y="63" width="1" height="1" fill="#010101"/>
    <rect x="8" y="63" width="1" height="1" fill="#000000"/>
    <rect x="9" y="63" width="1" height="1" fill="#000000"/>
    <rect x="10" y="63" width="1" height="1" fill="#010101"/>
    <rect x="11" y="63" width="1" height="1" fill="#000000"/>
    <rect x="12" y="63" width="1" height="1" fill="#000000"/>
    <rect x="13" y="63" width="1" height="1" fill="#000000"/>
    <rect x="14" y="63" width="1" height="1" fill="#000000"/>
    <rect x="15" y="63" width="1" height="1" fill="#000000"/>
    <rect x="16" y="63" width="1" height="1" fill="#000000"/>
    <rect x="17" y="63" width="1" height="1" fill="#000000"/>
    <rect x="18" y="63" width="1" height="1" fill="#000000"/>
    <rect x="19" y="63" width="1" height="1" fill="#010101"/>
    <rect x="20" y="63" width="1" height="1" fill="#010101"/>
    <rect x="21" y="63" width="1" height="1" fill="#000000"/>
    <rect x="22" y="63" width="1" height="1" fill="#000000"/>
    <rect x="23" y="63" width="1" height="1" fill="#010101"/>
    <rect x="24" y="63" width="1" height="1" fill="#010101"/>
    <rect x="25" y="63" width="1" height="1" fill="#000000"/>
    <rect x="26" y="63" width="1" height="1" fill="#010101"/>
    <rect x="27" y="63" width="1" height="1" fill="#000000"/>
    <rect x="28" y="63" width="1" height="1" fill="#000000"/>
    <rect x="29" y="63" width="1" height="1" fill="#010101"/>
    <rect x="30" y="63" width="1" height="1" fill="#000000"/>
    <rect x="31" y="63" width="1" height="1" fill="#000000"/>
    <rect x="32" y="63" width="1" height="1" fill="#000000"/>
    <rect x="33" y="63" width="1" height="1" fill="#000000"/>
    <rect x="34" y="63" width="1" height="1" fill="#070707"/>
  </svg>
);

export const FollowUpAgent = ({ size = 160 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" shapeRendering="crispEdges" style={{ imageRendering: "pixelated" }}>
    <rect x="7" y="0" width="1" height="1" fill="#666168"/>
    <rect x="8" y="0" width="1" height="1" fill="#07050a"/>
    <rect x="9" y="0" width="1" height="1" fill="#010002"/>
    <rect x="10" y="0" width="1" height="1" fill="#050306"/>
    <rect x="11" y="0" width="1" height="1" fill="#030104"/>
    <rect x="12" y="0" width="1" height="1" fill="#040205"/>
    <rect x="13" y="0" width="1" height="1" fill="#030104"/>
    <rect x="14" y="0" width="1" height="1" fill="#020003"/>
    <rect x="15" y="0" width="1" height="1" fill="#030104"/>
    <rect x="16" y="0" width="1" height="1" fill="#030104"/>
    <rect x="17" y="0" width="1" height="1" fill="#030104"/>
    <rect x="18" y="0" width="1" height="1" fill="#020003"/>
    <rect x="19" y="0" width="1" height="1" fill="#020204"/>
    <rect x="20" y="0" width="1" height="1" fill="#010103"/>
    <rect x="21" y="0" width="1" height="1" fill="#030104"/>
    <rect x="22" y="0" width="1" height="1" fill="#030104"/>
    <rect x="23" y="0" width="1" height="1" fill="#040205"/>
    <rect x="24" y="0" width="1" height="1" fill="#020003"/>
    <rect x="25" y="0" width="1" height="1" fill="#010002"/>
    <rect x="26" y="0" width="1" height="1" fill="#020003"/>
    <rect x="27" y="0" width="1" height="1" fill="#030104"/>
    <rect x="28" y="0" width="1" height="1" fill="#040205"/>
    <rect x="29" y="0" width="1" height="1" fill="#030104"/>
    <rect x="30" y="0" width="1" height="1" fill="#040205"/>
    <rect x="31" y="0" width="1" height="1" fill="#070506"/>
    <rect x="32" y="0" width="1" height="1" fill="#010004"/>
    <rect x="7" y="1" width="1" height="1" fill="#030305"/>
    <rect x="8" y="1" width="1" height="1" fill="#010100"/>
    <rect x="9" y="1" width="1" height="1" fill="#000000"/>
    <rect x="10" y="1" width="1" height="1" fill="#000201"/>
    <rect x="11" y="1" width="1" height="1" fill="#000100"/>
    <rect x="12" y="1" width="1" height="1" fill="#000100"/>
    <rect x="13" y="1" width="1" height="1" fill="#000201"/>
    <rect x="14" y="1" width="1" height="1" fill="#000000"/>
    <rect x="15" y="1" width="1" height="1" fill="#000201"/>
    <rect x="16" y="1" width="1" height="1" fill="#000100"/>
    <rect x="17" y="1" width="1" height="1" fill="#000201"/>
    <rect x="18" y="1" width="1" height="1" fill="#000100"/>
    <rect x="19" y="1" width="1" height="1" fill="#010101"/>
    <rect x="20" y="1" width="1" height="1" fill="#010101"/>
    <rect x="21" y="1" width="1" height="1" fill="#000100"/>
    <rect x="22" y="1" width="1" height="1" fill="#000100"/>
    <rect x="23" y="1" width="1" height="1" fill="#000201"/>
    <rect x="24" y="1" width="1" height="1" fill="#000201"/>
    <rect x="25" y="1" width="1" height="1" fill="#000100"/>
    <rect x="26" y="1" width="1" height="1" fill="#000201"/>
    <rect x="27" y="1" width="1" height="1" fill="#000201"/>
    <rect x="28" y="1" width="1" height="1" fill="#000000"/>
    <rect x="29" y="1" width="1" height="1" fill="#010101"/>
    <rect x="30" y="1" width="1" height="1" fill="#000000"/>
    <rect x="31" y="1" width="1" height="1" fill="#000000"/>
    <rect x="32" y="1" width="1" height="1" fill="#010100"/>
    <rect x="7" y="2" width="1" height="1" fill="#050306"/>
    <rect x="8" y="2" width="1" height="1" fill="#010101"/>
    <rect x="9" y="2" width="1" height="1" fill="#000000"/>
    <rect x="10" y="2" width="1" height="1" fill="#000000"/>
    <rect x="11" y="2" width="1" height="1" fill="#000000"/>
    <rect x="12" y="2" width="1" height="1" fill="#000000"/>
    <rect x="13" y="2" width="1" height="1" fill="#010101"/>
    <rect x="14" y="2" width="1" height="1" fill="#010101"/>
    <rect x="15" y="2" width="1" height="1" fill="#010101"/>
    <rect x="16" y="2" width="1" height="1" fill="#000000"/>
    <rect x="17" y="2" width="1" height="1" fill="#010101"/>
    <rect x="18" y="2" width="1" height="1" fill="#000000"/>
    <rect x="19" y="2" width="1" height="1" fill="#000000"/>
    <rect x="20" y="2" width="1" height="1" fill="#000000"/>
    <rect x="21" y="2" width="1" height="1" fill="#000000"/>
    <rect x="22" y="2" width="1" height="1" fill="#010101"/>
    <rect x="23" y="2" width="1" height="1" fill="#010101"/>
    <rect x="24" y="2" width="1" height="1" fill="#000000"/>
    <rect x="25" y="2" width="1" height="1" fill="#000000"/>
    <rect x="26" y="2" width="1" height="1" fill="#000000"/>
    <rect x="27" y="2" width="1" height="1" fill="#000000"/>
    <rect x="28" y="2" width="1" height="1" fill="#010101"/>
    <rect x="29" y="2" width="1" height="1" fill="#010101"/>
    <rect x="30" y="2" width="1" height="1" fill="#010101"/>
    <rect x="31" y="2" width="1" height="1" fill="#000000"/>
    <rect x="32" y="2" width="1" height="1" fill="#000000"/>
    <rect x="33" y="2" width="1" height="1" fill="#f6c1af"/>
    <rect x="34" y="2" width="1" height="1" fill="#f6af99"/>
    <rect x="35" y="2" width="1" height="1" fill="#eaafab"/>
    <rect x="5" y="3" width="1" height="1" fill="#454249"/>
    <rect x="6" y="3" width="1" height="1" fill="#010004"/>
    <rect x="7" y="3" width="1" height="1" fill="#010103"/>
    <rect x="8" y="3" width="1" height="1" fill="#010101"/>
    <rect x="9" y="3" width="1" height="1" fill="#000000"/>
    <rect x="10" y="3" width="1" height="1" fill="#000000"/>
    <rect x="11" y="3" width="1" height="1" fill="#000000"/>
    <rect x="12" y="3" width="1" height="1" fill="#010101"/>
    <rect x="13" y="3" width="1" height="1" fill="#000000"/>
    <rect x="14" y="3" width="1" height="1" fill="#010101"/>
    <rect x="15" y="3" width="1" height="1" fill="#010101"/>
    <rect x="16" y="3" width="1" height="1" fill="#000000"/>
    <rect x="17" y="3" width="1" height="1" fill="#000000"/>
    <rect x="18" y="3" width="1" height="1" fill="#010101"/>
    <rect x="19" y="3" width="1" height="1" fill="#000000"/>
    <rect x="20" y="3" width="1" height="1" fill="#000000"/>
    <rect x="21" y="3" width="1" height="1" fill="#000000"/>
    <rect x="22" y="3" width="1" height="1" fill="#010101"/>
    <rect x="23" y="3" width="1" height="1" fill="#000000"/>
    <rect x="24" y="3" width="1" height="1" fill="#000000"/>
    <rect x="25" y="3" width="1" height="1" fill="#000000"/>
    <rect x="26" y="3" width="1" height="1" fill="#000000"/>
    <rect x="27" y="3" width="1" height="1" fill="#000000"/>
    <rect x="28" y="3" width="1" height="1" fill="#000000"/>
    <rect x="29" y="3" width="1" height="1" fill="#000000"/>
    <rect x="30" y="3" width="1" height="1" fill="#010101"/>
    <rect x="31" y="3" width="1" height="1" fill="#000000"/>
    <rect x="32" y="3" width="1" height="1" fill="#000000"/>
    <rect x="33" y="3" width="1" height="1" fill="#020100"/>
    <rect x="34" y="3" width="1" height="1" fill="#000200"/>
    <rect x="35" y="3" width="1" height="1" fill="#040207"/>
    <rect x="5" y="4" width="1" height="1" fill="#070707"/>
    <rect x="6" y="4" width="1" height="1" fill="#080808"/>
    <rect x="7" y="4" width="1" height="1" fill="#010101"/>
    <rect x="8" y="4" width="1" height="1" fill="#000000"/>
    <rect x="9" y="4" width="1" height="1" fill="#000000"/>
    <rect x="10" y="4" width="1" height="1" fill="#010101"/>
    <rect x="11" y="4" width="1" height="1" fill="#000000"/>
    <rect x="12" y="4" width="1" height="1" fill="#000000"/>
    <rect x="13" y="4" width="1" height="1" fill="#000000"/>
    <rect x="14" y="4" width="1" height="1" fill="#010101"/>
    <rect x="15" y="4" width="1" height="1" fill="#000000"/>
    <rect x="16" y="4" width="1" height="1" fill="#000000"/>
    <rect x="17" y="4" width="1" height="1" fill="#000000"/>
    <rect x="18" y="4" width="1" height="1" fill="#000000"/>
    <rect x="19" y="4" width="1" height="1" fill="#000000"/>
    <rect x="20" y="4" width="1" height="1" fill="#000000"/>
    <rect x="21" y="4" width="1" height="1" fill="#000000"/>
    <rect x="22" y="4" width="1" height="1" fill="#000000"/>
    <rect x="23" y="4" width="1" height="1" fill="#000000"/>
    <rect x="24" y="4" width="1" height="1" fill="#000000"/>
    <rect x="25" y="4" width="1" height="1" fill="#000000"/>
    <rect x="26" y="4" width="1" height="1" fill="#000000"/>
    <rect x="27" y="4" width="1" height="1" fill="#010101"/>
    <rect x="28" y="4" width="1" height="1" fill="#000000"/>
    <rect x="29" y="4" width="1" height="1" fill="#000000"/>
    <rect x="30" y="4" width="1" height="1" fill="#000000"/>
    <rect x="31" y="4" width="1" height="1" fill="#010101"/>
    <rect x="32" y="4" width="1" height="1" fill="#000000"/>
    <rect x="33" y="4" width="1" height="1" fill="#010101"/>
    <rect x="34" y="4" width="1" height="1" fill="#000000"/>
    <rect x="35" y="4" width="1" height="1" fill="#030106"/>
    <rect x="5" y="5" width="1" height="1" fill="#090909"/>
    <rect x="6" y="5" width="1" height="1" fill="#070707"/>
    <rect x="7" y="5" width="1" height="1" fill="#010101"/>
    <rect x="8" y="5" width="1" height="1" fill="#010101"/>
    <rect x="9" y="5" width="1" height="1" fill="#000000"/>
    <rect x="10" y="5" width="1" height="1" fill="#010101"/>
    <rect x="11" y="5" width="1" height="1" fill="#000000"/>
    <rect x="12" y="5" width="1" height="1" fill="#000000"/>
    <rect x="13" y="5" width="1" height="1" fill="#000000"/>
    <rect x="14" y="5" width="1" height="1" fill="#010101"/>
    <rect x="15" y="5" width="1" height="1" fill="#010101"/>
    <rect x="16" y="5" width="1" height="1" fill="#010101"/>
    <rect x="17" y="5" width="1" height="1" fill="#000000"/>
    <rect x="18" y="5" width="1" height="1" fill="#000000"/>
    <rect x="19" y="5" width="1" height="1" fill="#000000"/>
    <rect x="20" y="5" width="1" height="1" fill="#000000"/>
    <rect x="21" y="5" width="1" height="1" fill="#000000"/>
    <rect x="22" y="5" width="1" height="1" fill="#010101"/>
    <rect x="23" y="5" width="1" height="1" fill="#000000"/>
    <rect x="24" y="5" width="1" height="1" fill="#000000"/>
    <rect x="25" y="5" width="1" height="1" fill="#000000"/>
    <rect x="26" y="5" width="1" height="1" fill="#000000"/>
    <rect x="27" y="5" width="1" height="1" fill="#000000"/>
    <rect x="28" y="5" width="1" height="1" fill="#010101"/>
    <rect x="29" y="5" width="1" height="1" fill="#000000"/>
    <rect x="30" y="5" width="1" height="1" fill="#000000"/>
    <rect x="31" y="5" width="1" height="1" fill="#000000"/>
    <rect x="32" y="5" width="1" height="1" fill="#000000"/>
    <rect x="33" y="5" width="1" height="1" fill="#010101"/>
    <rect x="34" y="5" width="1" height="1" fill="#000000"/>
    <rect x="35" y="5" width="1" height="1" fill="#030106"/>
    <rect x="5" y="6" width="1" height="1" fill="#070707"/>
    <rect x="6" y="6" width="1" height="1" fill="#080808"/>
    <rect x="7" y="6" width="1" height="1" fill="#010101"/>
    <rect x="8" y="6" width="1" height="1" fill="#010101"/>
    <rect x="9" y="6" width="1" height="1" fill="#000000"/>
    <rect x="10" y="6" width="1" height="1" fill="#010101"/>
    <rect x="11" y="6" width="1" height="1" fill="#000000"/>
    <rect x="12" y="6" width="1" height="1" fill="#000000"/>
    <rect x="13" y="6" width="1" height="1" fill="#000000"/>
    <rect x="14" y="6" width="1" height="1" fill="#000000"/>
    <rect x="15" y="6" width="1" height="1" fill="#010101"/>
    <rect x="16" y="6" width="1" height="1" fill="#010101"/>
    <rect x="17" y="6" width="1" height="1" fill="#000000"/>
    <rect x="18" y="6" width="1" height="1" fill="#000000"/>
    <rect x="19" y="6" width="1" height="1" fill="#000000"/>
    <rect x="20" y="6" width="1" height="1" fill="#000000"/>
    <rect x="21" y="6" width="1" height="1" fill="#000000"/>
    <rect x="22" y="6" width="1" height="1" fill="#010101"/>
    <rect x="23" y="6" width="1" height="1" fill="#000000"/>
    <rect x="24" y="6" width="1" height="1" fill="#000000"/>
    <rect x="25" y="6" width="1" height="1" fill="#000000"/>
    <rect x="26" y="6" width="1" height="1" fill="#000000"/>
    <rect x="27" y="6" width="1" height="1" fill="#000000"/>
    <rect x="28" y="6" width="1" height="1" fill="#010101"/>
    <rect x="29" y="6" width="1" height="1" fill="#000000"/>
    <rect x="30" y="6" width="1" height="1" fill="#000000"/>
    <rect x="31" y="6" width="1" height="1" fill="#000000"/>
    <rect x="32" y="6" width="1" height="1" fill="#000000"/>
    <rect x="33" y="6" width="1" height="1" fill="#010101"/>
    <rect x="34" y="6" width="1" height="1" fill="#000000"/>
    <rect x="35" y="6" width="1" height="1" fill="#020005"/>
    <rect x="4" y="7" width="1" height="1" fill="#010004"/>
    <rect x="5" y="7" width="1" height="1" fill="#0b0b0b"/>
    <rect x="6" y="7" width="1" height="1" fill="#070707"/>
    <rect x="7" y="7" width="1" height="1" fill="#010101"/>
    <rect x="8" y="7" width="1" height="1" fill="#000000"/>
    <rect x="9" y="7" width="1" height="1" fill="#000000"/>
    <rect x="10" y="7" width="1" height="1" fill="#010101"/>
    <rect x="11" y="7" width="1" height="1" fill="#000000"/>
    <rect x="12" y="7" width="1" height="1" fill="#000000"/>
    <rect x="13" y="7" width="1" height="1" fill="#010101"/>
    <rect x="14" y="7" width="1" height="1" fill="#000000"/>
    <rect x="15" y="7" width="1" height="1" fill="#000000"/>
    <rect x="16" y="7" width="1" height="1" fill="#010101"/>
    <rect x="17" y="7" width="1" height="1" fill="#000000"/>
    <rect x="18" y="7" width="1" height="1" fill="#010101"/>
    <rect x="19" y="7" width="1" height="1" fill="#010101"/>
    <rect x="20" y="7" width="1" height="1" fill="#000000"/>
    <rect x="21" y="7" width="1" height="1" fill="#010101"/>
    <rect x="22" y="7" width="1" height="1" fill="#000000"/>
    <rect x="23" y="7" width="1" height="1" fill="#010101"/>
    <rect x="24" y="7" width="1" height="1" fill="#000000"/>
    <rect x="25" y="7" width="1" height="1" fill="#010101"/>
    <rect x="26" y="7" width="1" height="1" fill="#000000"/>
    <rect x="27" y="7" width="1" height="1" fill="#000000"/>
    <rect x="28" y="7" width="1" height="1" fill="#010101"/>
    <rect x="29" y="7" width="1" height="1" fill="#000000"/>
    <rect x="30" y="7" width="1" height="1" fill="#000000"/>
    <rect x="31" y="7" width="1" height="1" fill="#000000"/>
    <rect x="32" y="7" width="1" height="1" fill="#000000"/>
    <rect x="33" y="7" width="1" height="1" fill="#000000"/>
    <rect x="34" y="7" width="1" height="1" fill="#000000"/>
    <rect x="35" y="7" width="1" height="1" fill="#030106"/>
    <rect x="4" y="8" width="1" height="1" fill="#010000"/>
    <rect x="5" y="8" width="1" height="1" fill="#0a0a0a"/>
    <rect x="6" y="8" width="1" height="1" fill="#090909"/>
    <rect x="7" y="8" width="1" height="1" fill="#010101"/>
    <rect x="8" y="8" width="1" height="1" fill="#010101"/>
    <rect x="9" y="8" width="1" height="1" fill="#010101"/>
    <rect x="10" y="8" width="1" height="1" fill="#000000"/>
    <rect x="11" y="8" width="1" height="1" fill="#010101"/>
    <rect x="12" y="8" width="1" height="1" fill="#010101"/>
    <rect x="13" y="8" width="1" height="1" fill="#010101"/>
    <rect x="14" y="8" width="1" height="1" fill="#010101"/>
    <rect x="15" y="8" width="1" height="1" fill="#010101"/>
    <rect x="16" y="8" width="1" height="1" fill="#010101"/>
    <rect x="17" y="8" width="1" height="1" fill="#000000"/>
    <rect x="18" y="8" width="1" height="1" fill="#000000"/>
    <rect x="19" y="8" width="1" height="1" fill="#010101"/>
    <rect x="20" y="8" width="1" height="1" fill="#010101"/>
    <rect x="21" y="8" width="1" height="1" fill="#000000"/>
    <rect x="22" y="8" width="1" height="1" fill="#000000"/>
    <rect x="23" y="8" width="1" height="1" fill="#000000"/>
    <rect x="24" y="8" width="1" height="1" fill="#000000"/>
    <rect x="25" y="8" width="1" height="1" fill="#010101"/>
    <rect x="26" y="8" width="1" height="1" fill="#010101"/>
    <rect x="27" y="8" width="1" height="1" fill="#010101"/>
    <rect x="28" y="8" width="1" height="1" fill="#010101"/>
    <rect x="29" y="8" width="1" height="1" fill="#010101"/>
    <rect x="30" y="8" width="1" height="1" fill="#000000"/>
    <rect x="31" y="8" width="1" height="1" fill="#010101"/>
    <rect x="32" y="8" width="1" height="1" fill="#000000"/>
    <rect x="33" y="8" width="1" height="1" fill="#010101"/>
    <rect x="34" y="8" width="1" height="1" fill="#000000"/>
    <rect x="35" y="8" width="1" height="1" fill="#020005"/>
    <rect x="4" y="9" width="1" height="1" fill="#070709"/>
    <rect x="5" y="9" width="1" height="1" fill="#090909"/>
    <rect x="6" y="9" width="1" height="1" fill="#090909"/>
    <rect x="7" y="9" width="1" height="1" fill="#000000"/>
    <rect x="8" y="9" width="1" height="1" fill="#000000"/>
    <rect x="9" y="9" width="1" height="1" fill="#000000"/>
    <rect x="10" y="9" width="1" height="1" fill="#000000"/>
    <rect x="11" y="9" width="1" height="1" fill="#010101"/>
    <rect x="12" y="9" width="1" height="1" fill="#000000"/>
    <rect x="13" y="9" width="1" height="1" fill="#010101"/>
    <rect x="14" y="9" width="1" height="1" fill="#010101"/>
    <rect x="15" y="9" width="1" height="1" fill="#000000"/>
    <rect x="16" y="9" width="1" height="1" fill="#000000"/>
    <rect x="17" y="9" width="1" height="1" fill="#000000"/>
    <rect x="18" y="9" width="1" height="1" fill="#000000"/>
    <rect x="19" y="9" width="1" height="1" fill="#000000"/>
    <rect x="20" y="9" width="1" height="1" fill="#000000"/>
    <rect x="21" y="9" width="1" height="1" fill="#010101"/>
    <rect x="22" y="9" width="1" height="1" fill="#000000"/>
    <rect x="23" y="9" width="1" height="1" fill="#000000"/>
    <rect x="24" y="9" width="1" height="1" fill="#000000"/>
    <rect x="25" y="9" width="1" height="1" fill="#010101"/>
    <rect x="26" y="9" width="1" height="1" fill="#000000"/>
    <rect x="27" y="9" width="1" height="1" fill="#000000"/>
    <rect x="28" y="9" width="1" height="1" fill="#010101"/>
    <rect x="29" y="9" width="1" height="1" fill="#010101"/>
    <rect x="30" y="9" width="1" height="1" fill="#000000"/>
    <rect x="31" y="9" width="1" height="1" fill="#000000"/>
    <rect x="32" y="9" width="1" height="1" fill="#000000"/>
    <rect x="33" y="9" width="1" height="1" fill="#000000"/>
    <rect x="34" y="9" width="1" height="1" fill="#000000"/>
    <rect x="35" y="9" width="1" height="1" fill="#030106"/>
    <rect x="3" y="10" width="1" height="1" fill="#040205"/>
    <rect x="4" y="10" width="1" height="1" fill="#020403"/>
    <rect x="5" y="10" width="1" height="1" fill="#090909"/>
    <rect x="6" y="10" width="1" height="1" fill="#090909"/>
    <rect x="7" y="10" width="1" height="1" fill="#000000"/>
    <rect x="8" y="10" width="1" height="1" fill="#000000"/>
    <rect x="9" y="10" width="1" height="1" fill="#000000"/>
    <rect x="10" y="10" width="1" height="1" fill="#010101"/>
    <rect x="11" y="10" width="1" height="1" fill="#000000"/>
    <rect x="12" y="10" width="1" height="1" fill="#000000"/>
    <rect x="13" y="10" width="1" height="1" fill="#010101"/>
    <rect x="14" y="10" width="1" height="1" fill="#000000"/>
    <rect x="15" y="10" width="1" height="1" fill="#000000"/>
    <rect x="16" y="10" width="1" height="1" fill="#000000"/>
    <rect x="17" y="10" width="1" height="1" fill="#000000"/>
    <rect x="18" y="10" width="1" height="1" fill="#000000"/>
    <rect x="19" y="10" width="1" height="1" fill="#010101"/>
    <rect x="20" y="10" width="1" height="1" fill="#000000"/>
    <rect x="21" y="10" width="1" height="1" fill="#010101"/>
    <rect x="22" y="10" width="1" height="1" fill="#000000"/>
    <rect x="23" y="10" width="1" height="1" fill="#010101"/>
    <rect x="24" y="10" width="1" height="1" fill="#000000"/>
    <rect x="25" y="10" width="1" height="1" fill="#000000"/>
    <rect x="26" y="10" width="1" height="1" fill="#000000"/>
    <rect x="27" y="10" width="1" height="1" fill="#010101"/>
    <rect x="28" y="10" width="1" height="1" fill="#000000"/>
    <rect x="29" y="10" width="1" height="1" fill="#010101"/>
    <rect x="30" y="10" width="1" height="1" fill="#000000"/>
    <rect x="31" y="10" width="1" height="1" fill="#000000"/>
    <rect x="32" y="10" width="1" height="1" fill="#010101"/>
    <rect x="33" y="10" width="1" height="1" fill="#000000"/>
    <rect x="34" y="10" width="1" height="1" fill="#000000"/>
    <rect x="35" y="10" width="1" height="1" fill="#020005"/>
    <rect x="42" y="10" width="1" height="1" fill="#040207"/>
    <rect x="43" y="10" width="1" height="1" fill="#010000"/>
    <rect x="44" y="10" width="1" height="1" fill="#010002"/>
    <rect x="45" y="10" width="1" height="1" fill="#010103"/>
    <rect x="46" y="10" width="1" height="1" fill="#000002"/>
    <rect x="47" y="10" width="1" height="1" fill="#000002"/>
    <rect x="48" y="10" width="1" height="1" fill="#000002"/>
    <rect x="49" y="10" width="1" height="1" fill="#010002"/>
    <rect x="50" y="10" width="1" height="1" fill="#010002"/>
    <rect x="51" y="10" width="1" height="1" fill="#010002"/>
    <rect x="52" y="10" width="1" height="1" fill="#010002"/>
    <rect x="53" y="10" width="1" height="1" fill="#010002"/>
    <rect x="54" y="10" width="1" height="1" fill="#010002"/>
    <rect x="55" y="10" width="1" height="1" fill="#010002"/>
    <rect x="56" y="10" width="1" height="1" fill="#010002"/>
    <rect x="57" y="10" width="1" height="1" fill="#010002"/>
    <rect x="58" y="10" width="1" height="1" fill="#010002"/>
    <rect x="59" y="10" width="1" height="1" fill="#010002"/>
    <rect x="60" y="10" width="1" height="1" fill="#010002"/>
    <rect x="61" y="10" width="1" height="1" fill="#09090b"/>
    <rect x="3" y="11" width="1" height="1" fill="#010101"/>
    <rect x="4" y="11" width="1" height="1" fill="#030303"/>
    <rect x="5" y="11" width="1" height="1" fill="#0a0a0a"/>
    <rect x="6" y="11" width="1" height="1" fill="#090909"/>
    <rect x="7" y="11" width="1" height="1" fill="#010101"/>
    <rect x="8" y="11" width="1" height="1" fill="#000000"/>
    <rect x="9" y="11" width="1" height="1" fill="#000000"/>
    <rect x="10" y="11" width="1" height="1" fill="#000000"/>
    <rect x="11" y="11" width="1" height="1" fill="#000000"/>
    <rect x="12" y="11" width="1" height="1" fill="#000000"/>
    <rect x="13" y="11" width="1" height="1" fill="#010101"/>
    <rect x="14" y="11" width="1" height="1" fill="#010101"/>
    <rect x="15" y="11" width="1" height="1" fill="#000000"/>
    <rect x="16" y="11" width="1" height="1" fill="#000000"/>
    <rect x="17" y="11" width="1" height="1" fill="#010101"/>
    <rect x="18" y="11" width="1" height="1" fill="#010101"/>
    <rect x="19" y="11" width="1" height="1" fill="#000000"/>
    <rect x="20" y="11" width="1" height="1" fill="#010101"/>
    <rect x="21" y="11" width="1" height="1" fill="#000000"/>
    <rect x="22" y="11" width="1" height="1" fill="#010101"/>
    <rect x="23" y="11" width="1" height="1" fill="#000000"/>
    <rect x="24" y="11" width="1" height="1" fill="#010101"/>
    <rect x="25" y="11" width="1" height="1" fill="#000000"/>
    <rect x="26" y="11" width="1" height="1" fill="#010101"/>
    <rect x="27" y="11" width="1" height="1" fill="#000000"/>
    <rect x="28" y="11" width="1" height="1" fill="#010101"/>
    <rect x="29" y="11" width="1" height="1" fill="#010101"/>
    <rect x="30" y="11" width="1" height="1" fill="#000000"/>
    <rect x="31" y="11" width="1" height="1" fill="#010101"/>
    <rect x="32" y="11" width="1" height="1" fill="#010101"/>
    <rect x="33" y="11" width="1" height="1" fill="#010101"/>
    <rect x="34" y="11" width="1" height="1" fill="#000000"/>
    <rect x="35" y="11" width="1" height="1" fill="#020005"/>
    <rect x="42" y="11" width="1" height="1" fill="#000004"/>
    <rect x="43" y="11" width="1" height="1" fill="#020202"/>
    <rect x="44" y="11" width="1" height="1" fill="#020202"/>
    <rect x="45" y="11" width="1" height="1" fill="#010101"/>
    <rect x="46" y="11" width="1" height="1" fill="#000000"/>
    <rect x="47" y="11" width="1" height="1" fill="#010101"/>
    <rect x="48" y="11" width="1" height="1" fill="#010101"/>
    <rect x="49" y="11" width="1" height="1" fill="#000000"/>
    <rect x="50" y="11" width="1" height="1" fill="#010101"/>
    <rect x="51" y="11" width="1" height="1" fill="#010101"/>
    <rect x="52" y="11" width="1" height="1" fill="#000000"/>
    <rect x="53" y="11" width="1" height="1" fill="#010101"/>
    <rect x="54" y="11" width="1" height="1" fill="#010101"/>
    <rect x="55" y="11" width="1" height="1" fill="#010101"/>
    <rect x="56" y="11" width="1" height="1" fill="#010101"/>
    <rect x="57" y="11" width="1" height="1" fill="#010101"/>
    <rect x="58" y="11" width="1" height="1" fill="#010101"/>
    <rect x="59" y="11" width="1" height="1" fill="#000100"/>
    <rect x="60" y="11" width="1" height="1" fill="#000200"/>
    <rect x="61" y="11" width="1" height="1" fill="#070709"/>
    <rect x="3" y="12" width="1" height="1" fill="#000000"/>
    <rect x="4" y="12" width="1" height="1" fill="#030303"/>
    <rect x="5" y="12" width="1" height="1" fill="#0a0a0a"/>
    <rect x="6" y="12" width="1" height="1" fill="#0a0a0a"/>
    <rect x="7" y="12" width="1" height="1" fill="#000000"/>
    <rect x="8" y="12" width="1" height="1" fill="#000000"/>
    <rect x="9" y="12" width="1" height="1" fill="#000000"/>
    <rect x="10" y="12" width="1" height="1" fill="#000000"/>
    <rect x="11" y="12" width="1" height="1" fill="#010101"/>
    <rect x="12" y="12" width="1" height="1" fill="#000000"/>
    <rect x="13" y="12" width="1" height="1" fill="#000000"/>
    <rect x="14" y="12" width="1" height="1" fill="#010101"/>
    <rect x="15" y="12" width="1" height="1" fill="#000000"/>
    <rect x="16" y="12" width="1" height="1" fill="#000000"/>
    <rect x="17" y="12" width="1" height="1" fill="#000000"/>
    <rect x="18" y="12" width="1" height="1" fill="#000000"/>
    <rect x="19" y="12" width="1" height="1" fill="#010101"/>
    <rect x="20" y="12" width="1" height="1" fill="#000000"/>
    <rect x="21" y="12" width="1" height="1" fill="#010101"/>
    <rect x="22" y="12" width="1" height="1" fill="#010101"/>
    <rect x="23" y="12" width="1" height="1" fill="#010101"/>
    <rect x="24" y="12" width="1" height="1" fill="#010101"/>
    <rect x="25" y="12" width="1" height="1" fill="#000000"/>
    <rect x="26" y="12" width="1" height="1" fill="#000000"/>
    <rect x="27" y="12" width="1" height="1" fill="#010101"/>
    <rect x="28" y="12" width="1" height="1" fill="#000000"/>
    <rect x="29" y="12" width="1" height="1" fill="#010101"/>
    <rect x="30" y="12" width="1" height="1" fill="#010101"/>
    <rect x="31" y="12" width="1" height="1" fill="#000000"/>
    <rect x="32" y="12" width="1" height="1" fill="#000000"/>
    <rect x="33" y="12" width="1" height="1" fill="#000000"/>
    <rect x="34" y="12" width="1" height="1" fill="#010101"/>
    <rect x="35" y="12" width="1" height="1" fill="#040207"/>
    <rect x="40" y="12" width="1" height="1" fill="#65626b"/>
    <rect x="41" y="12" width="1" height="1" fill="#605e61"/>
    <rect x="42" y="12" width="1" height="1" fill="#7b7670"/>
    <rect x="43" y="12" width="1" height="1" fill="#7a7768"/>
    <rect x="44" y="12" width="1" height="1" fill="#7d7a6b"/>
    <rect x="45" y="12" width="1" height="1" fill="#7f7b6f"/>
    <rect x="46" y="12" width="1" height="1" fill="#7e7a6e"/>
    <rect x="47" y="12" width="1" height="1" fill="#7e7a6e"/>
    <rect x="48" y="12" width="1" height="1" fill="#7e7a6e"/>
    <rect x="49" y="12" width="1" height="1" fill="#7d796d"/>
    <rect x="50" y="12" width="1" height="1" fill="#807c70"/>
    <rect x="51" y="12" width="1" height="1" fill="#807c70"/>
    <rect x="52" y="12" width="1" height="1" fill="#7f7b6f"/>
    <rect x="53" y="12" width="1" height="1" fill="#817d71"/>
    <rect x="54" y="12" width="1" height="1" fill="#7e7a6e"/>
    <rect x="55" y="12" width="1" height="1" fill="#807c70"/>
    <rect x="56" y="12" width="1" height="1" fill="#817d71"/>
    <rect x="57" y="12" width="1" height="1" fill="#817d71"/>
    <rect x="58" y="12" width="1" height="1" fill="#7e7a6e"/>
    <rect x="59" y="12" width="1" height="1" fill="#7e7a6f"/>
    <rect x="60" y="12" width="1" height="1" fill="#807a6e"/>
    <rect x="61" y="12" width="1" height="1" fill="#807a6e"/>
    <rect x="62" y="12" width="1" height="1" fill="#686669"/>
    <rect x="63" y="12" width="1" height="1" fill="#6e6d73"/>
    <rect x="3" y="13" width="1" height="1" fill="#000000"/>
    <rect x="4" y="13" width="1" height="1" fill="#040404"/>
    <rect x="5" y="13" width="1" height="1" fill="#0b090a"/>
    <rect x="6" y="13" width="1" height="1" fill="#0b090a"/>
    <rect x="7" y="13" width="1" height="1" fill="#010101"/>
    <rect x="8" y="13" width="1" height="1" fill="#010101"/>
    <rect x="9" y="13" width="1" height="1" fill="#010101"/>
    <rect x="10" y="13" width="1" height="1" fill="#010101"/>
    <rect x="11" y="13" width="1" height="1" fill="#000000"/>
    <rect x="12" y="13" width="1" height="1" fill="#000000"/>
    <rect x="13" y="13" width="1" height="1" fill="#000000"/>
    <rect x="14" y="13" width="1" height="1" fill="#000100"/>
    <rect x="15" y="13" width="1" height="1" fill="#000100"/>
    <rect x="16" y="13" width="1" height="1" fill="#000300"/>
    <rect x="17" y="13" width="1" height="1" fill="#000000"/>
    <rect x="18" y="13" width="1" height="1" fill="#000000"/>
    <rect x="19" y="13" width="1" height="1" fill="#000000"/>
    <rect x="20" y="13" width="1" height="1" fill="#000000"/>
    <rect x="21" y="13" width="1" height="1" fill="#000000"/>
    <rect x="22" y="13" width="1" height="1" fill="#010101"/>
    <rect x="23" y="13" width="1" height="1" fill="#000000"/>
    <rect x="24" y="13" width="1" height="1" fill="#010101"/>
    <rect x="25" y="13" width="1" height="1" fill="#010101"/>
    <rect x="26" y="13" width="1" height="1" fill="#010101"/>
    <rect x="27" y="13" width="1" height="1" fill="#000000"/>
    <rect x="28" y="13" width="1" height="1" fill="#000000"/>
    <rect x="29" y="13" width="1" height="1" fill="#000000"/>
    <rect x="30" y="13" width="1" height="1" fill="#010101"/>
    <rect x="31" y="13" width="1" height="1" fill="#010101"/>
    <rect x="32" y="13" width="1" height="1" fill="#000000"/>
    <rect x="33" y="13" width="1" height="1" fill="#000000"/>
    <rect x="34" y="13" width="1" height="1" fill="#000000"/>
    <rect x="35" y="13" width="1" height="1" fill="#030106"/>
    <rect x="40" y="13" width="1" height="1" fill="#040207"/>
    <rect x="41" y="13" width="1" height="1" fill="#030102"/>
    <rect x="42" y="13" width="1" height="1" fill="#fdf6e4"/>
    <rect x="43" y="13" width="1" height="1" fill="#ebdfc9"/>
    <rect x="44" y="13" width="1" height="1" fill="#ece0c8"/>
    <rect x="45" y="13" width="1" height="1" fill="#ede1c9"/>
    <rect x="46" y="13" width="1" height="1" fill="#ece0c8"/>
    <rect x="47" y="13" width="1" height="1" fill="#ece0c8"/>
    <rect x="48" y="13" width="1" height="1" fill="#ede1c9"/>
    <rect x="49" y="13" width="1" height="1" fill="#ede1c9"/>
    <rect x="50" y="13" width="1" height="1" fill="#ede1c9"/>
    <rect x="51" y="13" width="1" height="1" fill="#ede1c9"/>
    <rect x="52" y="13" width="1" height="1" fill="#ede1c9"/>
    <rect x="53" y="13" width="1" height="1" fill="#ede1c9"/>
    <rect x="54" y="13" width="1" height="1" fill="#ede1c9"/>
    <rect x="55" y="13" width="1" height="1" fill="#ede1c9"/>
    <rect x="56" y="13" width="1" height="1" fill="#ece0c8"/>
    <rect x="57" y="13" width="1" height="1" fill="#ebdfc7"/>
    <rect x="58" y="13" width="1" height="1" fill="#ebdfc9"/>
    <rect x="59" y="13" width="1" height="1" fill="#ede1cb"/>
    <rect x="60" y="13" width="1" height="1" fill="#ece0ca"/>
    <rect x="61" y="13" width="1" height="1" fill="#ede3ca"/>
    <rect x="62" y="13" width="1" height="1" fill="#050409"/>
    <rect x="63" y="13" width="1" height="1" fill="#020204"/>
    <rect x="3" y="14" width="1" height="1" fill="#010101"/>
    <rect x="4" y="14" width="1" height="1" fill="#040404"/>
    <rect x="5" y="14" width="1" height="1" fill="#0b090a"/>
    <rect x="6" y="14" width="1" height="1" fill="#0b090a"/>
    <rect x="7" y="14" width="1" height="1" fill="#000000"/>
    <rect x="8" y="14" width="1" height="1" fill="#010101"/>
    <rect x="9" y="14" width="1" height="1" fill="#010101"/>
    <rect x="10" y="14" width="1" height="1" fill="#000000"/>
    <rect x="11" y="14" width="1" height="1" fill="#010101"/>
    <rect x="12" y="14" width="1" height="1" fill="#010101"/>
    <rect x="13" y="14" width="1" height="1" fill="#090000"/>
    <rect x="14" y="14" width="1" height="1" fill="#78483a"/>
    <rect x="15" y="14" width="1" height="1" fill="#6f4132"/>
    <rect x="16" y="14" width="1" height="1" fill="#030200"/>
    <rect x="17" y="14" width="1" height="1" fill="#000000"/>
    <rect x="18" y="14" width="1" height="1" fill="#000000"/>
    <rect x="19" y="14" width="1" height="1" fill="#000000"/>
    <rect x="20" y="14" width="1" height="1" fill="#000000"/>
    <rect x="21" y="14" width="1" height="1" fill="#000000"/>
    <rect x="22" y="14" width="1" height="1" fill="#000000"/>
    <rect x="23" y="14" width="1" height="1" fill="#000000"/>
    <rect x="24" y="14" width="1" height="1" fill="#000000"/>
    <rect x="25" y="14" width="1" height="1" fill="#010101"/>
    <rect x="26" y="14" width="1" height="1" fill="#000000"/>
    <rect x="27" y="14" width="1" height="1" fill="#000000"/>
    <rect x="28" y="14" width="1" height="1" fill="#000000"/>
    <rect x="29" y="14" width="1" height="1" fill="#000000"/>
    <rect x="30" y="14" width="1" height="1" fill="#010101"/>
    <rect x="31" y="14" width="1" height="1" fill="#000000"/>
    <rect x="32" y="14" width="1" height="1" fill="#010101"/>
    <rect x="33" y="14" width="1" height="1" fill="#000000"/>
    <rect x="34" y="14" width="1" height="1" fill="#000000"/>
    <rect x="35" y="14" width="1" height="1" fill="#030106"/>
    <rect x="40" y="14" width="1" height="1" fill="#020005"/>
    <rect x="41" y="14" width="1" height="1" fill="#020001"/>
    <rect x="42" y="14" width="1" height="1" fill="#fff8e6"/>
    <rect x="43" y="14" width="1" height="1" fill="#eee2cc"/>
    <rect x="44" y="14" width="1" height="1" fill="#ede1c9"/>
    <rect x="45" y="14" width="1" height="1" fill="#ede1c9"/>
    <rect x="46" y="14" width="1" height="1" fill="#ede1c9"/>
    <rect x="47" y="14" width="1" height="1" fill="#ece0c8"/>
    <rect x="48" y="14" width="1" height="1" fill="#ece0c8"/>
    <rect x="49" y="14" width="1" height="1" fill="#ece0c8"/>
    <rect x="50" y="14" width="1" height="1" fill="#ede1c9"/>
    <rect x="51" y="14" width="1" height="1" fill="#ede1c9"/>
    <rect x="52" y="14" width="1" height="1" fill="#eee2ca"/>
    <rect x="53" y="14" width="1" height="1" fill="#ede1c9"/>
    <rect x="54" y="14" width="1" height="1" fill="#ede1c9"/>
    <rect x="55" y="14" width="1" height="1" fill="#ede1c9"/>
    <rect x="56" y="14" width="1" height="1" fill="#ece0c8"/>
    <rect x="57" y="14" width="1" height="1" fill="#eadec6"/>
    <rect x="58" y="14" width="1" height="1" fill="#ece0ca"/>
    <rect x="59" y="14" width="1" height="1" fill="#ede1cb"/>
    <rect x="60" y="14" width="1" height="1" fill="#ece0ca"/>
    <rect x="61" y="14" width="1" height="1" fill="#ede3ca"/>
    <rect x="62" y="14" width="1" height="1" fill="#040308"/>
    <rect x="63" y="14" width="1" height="1" fill="#040406"/>
    <rect x="3" y="15" width="1" height="1" fill="#010101"/>
    <rect x="4" y="15" width="1" height="1" fill="#040404"/>
    <rect x="5" y="15" width="1" height="1" fill="#0c0a0b"/>
    <rect x="6" y="15" width="1" height="1" fill="#0b090a"/>
    <rect x="7" y="15" width="1" height="1" fill="#000000"/>
    <rect x="8" y="15" width="1" height="1" fill="#010101"/>
    <rect x="9" y="15" width="1" height="1" fill="#010101"/>
    <rect x="10" y="15" width="1" height="1" fill="#000000"/>
    <rect x="11" y="15" width="1" height="1" fill="#010101"/>
    <rect x="12" y="15" width="1" height="1" fill="#010101"/>
    <rect x="13" y="15" width="1" height="1" fill="#110000"/>
    <rect x="14" y="15" width="1" height="1" fill="#fb9d81"/>
    <rect x="15" y="15" width="1" height="1" fill="#f69a83"/>
    <rect x="16" y="15" width="1" height="1" fill="#080204"/>
    <rect x="17" y="15" width="1" height="1" fill="#000000"/>
    <rect x="18" y="15" width="1" height="1" fill="#000000"/>
    <rect x="19" y="15" width="1" height="1" fill="#000000"/>
    <rect x="20" y="15" width="1" height="1" fill="#000000"/>
    <rect x="21" y="15" width="1" height="1" fill="#000000"/>
    <rect x="22" y="15" width="1" height="1" fill="#010000"/>
    <rect x="23" y="15" width="1" height="1" fill="#000000"/>
    <rect x="24" y="15" width="1" height="1" fill="#000000"/>
    <rect x="25" y="15" width="1" height="1" fill="#010100"/>
    <rect x="26" y="15" width="1" height="1" fill="#000000"/>
    <rect x="27" y="15" width="1" height="1" fill="#000000"/>
    <rect x="28" y="15" width="1" height="1" fill="#000000"/>
    <rect x="29" y="15" width="1" height="1" fill="#000000"/>
    <rect x="30" y="15" width="1" height="1" fill="#010100"/>
    <rect x="31" y="15" width="1" height="1" fill="#000000"/>
    <rect x="32" y="15" width="1" height="1" fill="#010101"/>
    <rect x="33" y="15" width="1" height="1" fill="#000000"/>
    <rect x="34" y="15" width="1" height="1" fill="#000000"/>
    <rect x="35" y="15" width="1" height="1" fill="#030106"/>
    <rect x="40" y="15" width="1" height="1" fill="#010004"/>
    <rect x="41" y="15" width="1" height="1" fill="#020001"/>
    <rect x="42" y="15" width="1" height="1" fill="#fef7e5"/>
    <rect x="43" y="15" width="1" height="1" fill="#eee2cc"/>
    <rect x="44" y="15" width="1" height="1" fill="#ede1c9"/>
    <rect x="45" y="15" width="1" height="1" fill="#ede1c9"/>
    <rect x="46" y="15" width="1" height="1" fill="#ede1c9"/>
    <rect x="47" y="15" width="1" height="1" fill="#ece0c8"/>
    <rect x="48" y="15" width="1" height="1" fill="#ece0c8"/>
    <rect x="49" y="15" width="1" height="1" fill="#ece0c8"/>
    <rect x="50" y="15" width="1" height="1" fill="#ede1c9"/>
    <rect x="51" y="15" width="1" height="1" fill="#ede1c9"/>
    <rect x="52" y="15" width="1" height="1" fill="#ece0c8"/>
    <rect x="53" y="15" width="1" height="1" fill="#ede1c9"/>
    <rect x="54" y="15" width="1" height="1" fill="#ede1c9"/>
    <rect x="55" y="15" width="1" height="1" fill="#ede1c9"/>
    <rect x="56" y="15" width="1" height="1" fill="#ece0c8"/>
    <rect x="57" y="15" width="1" height="1" fill="#ebdfc7"/>
    <rect x="58" y="15" width="1" height="1" fill="#ece0ca"/>
    <rect x="59" y="15" width="1" height="1" fill="#ebdfc9"/>
    <rect x="60" y="15" width="1" height="1" fill="#ece0ca"/>
    <rect x="61" y="15" width="1" height="1" fill="#efe5cc"/>
    <rect x="62" y="15" width="1" height="1" fill="#040308"/>
    <rect x="63" y="15" width="1" height="1" fill="#040406"/>
    <rect x="3" y="16" width="1" height="1" fill="#030301"/>
    <rect x="4" y="16" width="1" height="1" fill="#030301"/>
    <rect x="5" y="16" width="1" height="1" fill="#0c0a0b"/>
    <rect x="6" y="16" width="1" height="1" fill="#0a0809"/>
    <rect x="7" y="16" width="1" height="1" fill="#000000"/>
    <rect x="8" y="16" width="1" height="1" fill="#010101"/>
    <rect x="9" y="16" width="1" height="1" fill="#000000"/>
    <rect x="10" y="16" width="1" height="1" fill="#000000"/>
    <rect x="11" y="16" width="1" height="1" fill="#000000"/>
    <rect x="12" y="16" width="1" height="1" fill="#010101"/>
    <rect x="13" y="16" width="1" height="1" fill="#110000"/>
    <rect x="14" y="16" width="1" height="1" fill="#faa789"/>
    <rect x="15" y="16" width="1" height="1" fill="#f8a480"/>
    <rect x="16" y="16" width="1" height="1" fill="#030007"/>
    <rect x="17" y="16" width="1" height="1" fill="#030000"/>
    <rect x="18" y="16" width="1" height="1" fill="#030000"/>
    <rect x="19" y="16" width="1" height="1" fill="#000400"/>
    <rect x="20" y="16" width="1" height="1" fill="#000300"/>
    <rect x="21" y="16" width="1" height="1" fill="#020100"/>
    <rect x="22" y="16" width="1" height="1" fill="#020100"/>
    <rect x="23" y="16" width="1" height="1" fill="#010000"/>
    <rect x="24" y="16" width="1" height="1" fill="#000300"/>
    <rect x="25" y="16" width="1" height="1" fill="#000300"/>
    <rect x="26" y="16" width="1" height="1" fill="#000200"/>
    <rect x="27" y="16" width="1" height="1" fill="#000200"/>
    <rect x="28" y="16" width="1" height="1" fill="#000300"/>
    <rect x="29" y="16" width="1" height="1" fill="#010000"/>
    <rect x="30" y="16" width="1" height="1" fill="#040000"/>
    <rect x="31" y="16" width="1" height="1" fill="#010100"/>
    <rect x="32" y="16" width="1" height="1" fill="#000000"/>
    <rect x="33" y="16" width="1" height="1" fill="#000000"/>
    <rect x="34" y="16" width="1" height="1" fill="#000000"/>
    <rect x="35" y="16" width="1" height="1" fill="#010004"/>
    <rect x="40" y="16" width="1" height="1" fill="#010005"/>
    <rect x="41" y="16" width="1" height="1" fill="#010101"/>
    <rect x="42" y="16" width="1" height="1" fill="#fcf5e3"/>
    <rect x="43" y="16" width="1" height="1" fill="#ebdfc9"/>
    <rect x="44" y="16" width="1" height="1" fill="#ece0c8"/>
    <rect x="45" y="16" width="1" height="1" fill="#ebdfc7"/>
    <rect x="46" y="16" width="1" height="1" fill="#ede1c9"/>
    <rect x="47" y="16" width="1" height="1" fill="#ede1cb"/>
    <rect x="48" y="16" width="1" height="1" fill="#ede1cb"/>
    <rect x="49" y="16" width="1" height="1" fill="#ede1c9"/>
    <rect x="50" y="16" width="1" height="1" fill="#ede1c9"/>
    <rect x="51" y="16" width="1" height="1" fill="#ede1cb"/>
    <rect x="52" y="16" width="1" height="1" fill="#ede1c9"/>
    <rect x="53" y="16" width="1" height="1" fill="#ede1c9"/>
    <rect x="54" y="16" width="1" height="1" fill="#ece0c8"/>
    <rect x="55" y="16" width="1" height="1" fill="#ede1c9"/>
    <rect x="56" y="16" width="1" height="1" fill="#ece0c8"/>
    <rect x="57" y="16" width="1" height="1" fill="#ece0c8"/>
    <rect x="58" y="16" width="1" height="1" fill="#ebdfc9"/>
    <rect x="59" y="16" width="1" height="1" fill="#ebdfc9"/>
    <rect x="60" y="16" width="1" height="1" fill="#ede1cb"/>
    <rect x="61" y="16" width="1" height="1" fill="#ede3ca"/>
    <rect x="62" y="16" width="1" height="1" fill="#040308"/>
    <rect x="63" y="16" width="1" height="1" fill="#030305"/>
    <rect x="3" y="17" width="1" height="1" fill="#000000"/>
    <rect x="4" y="17" width="1" height="1" fill="#060604"/>
    <rect x="5" y="17" width="1" height="1" fill="#0c0a0b"/>
    <rect x="6" y="17" width="1" height="1" fill="#0c0a0b"/>
    <rect x="7" y="17" width="1" height="1" fill="#000000"/>
    <rect x="8" y="17" width="1" height="1" fill="#000000"/>
    <rect x="9" y="17" width="1" height="1" fill="#000000"/>
    <rect x="10" y="17" width="1" height="1" fill="#000000"/>
    <rect x="11" y="17" width="1" height="1" fill="#000000"/>
    <rect x="12" y="17" width="1" height="1" fill="#000000"/>
    <rect x="13" y="17" width="1" height="1" fill="#140300"/>
    <rect x="14" y="17" width="1" height="1" fill="#f9a286"/>
    <rect x="15" y="17" width="1" height="1" fill="#f39c7e"/>
    <rect x="16" y="17" width="1" height="1" fill="#ac7d69"/>
    <rect x="17" y="17" width="1" height="1" fill="#ad8675"/>
    <rect x="18" y="17" width="1" height="1" fill="#a67c6e"/>
    <rect x="19" y="17" width="1" height="1" fill="#a07b69"/>
    <rect x="20" y="17" width="1" height="1" fill="#9d7868"/>
    <rect x="21" y="17" width="1" height="1" fill="#a47969"/>
    <rect x="22" y="17" width="1" height="1" fill="#a4786b"/>
    <rect x="23" y="17" width="1" height="1" fill="#a17666"/>
    <rect x="24" y="17" width="1" height="1" fill="#9c7765"/>
    <rect x="25" y="17" width="1" height="1" fill="#997464"/>
    <rect x="26" y="17" width="1" height="1" fill="#997462"/>
    <rect x="27" y="17" width="1" height="1" fill="#9a7565"/>
    <rect x="28" y="17" width="1" height="1" fill="#9b7664"/>
    <rect x="29" y="17" width="1" height="1" fill="#9e7265"/>
    <rect x="30" y="17" width="1" height="1" fill="#a7796a"/>
    <rect x="31" y="17" width="1" height="1" fill="#050503"/>
    <rect x="32" y="17" width="1" height="1" fill="#000000"/>
    <rect x="34" y="17" width="1" height="1" fill="#949198"/>
    <rect x="40" y="17" width="1" height="1" fill="#010005"/>
    <rect x="41" y="17" width="1" height="1" fill="#010101"/>
    <rect x="42" y="17" width="1" height="1" fill="#fffae8"/>
    <rect x="43" y="17" width="1" height="1" fill="#ece0ca"/>
    <rect x="44" y="17" width="1" height="1" fill="#ece0c8"/>
    <rect x="45" y="17" width="1" height="1" fill="#ece0c8"/>
    <rect x="46" y="17" width="1" height="1" fill="#ede1c9"/>
    <rect x="47" y="17" width="1" height="1" fill="#ede1cb"/>
    <rect x="48" y="17" width="1" height="1" fill="#ede1cb"/>
    <rect x="49" y="17" width="1" height="1" fill="#ede1c9"/>
    <rect x="50" y="17" width="1" height="1" fill="#ede1c9"/>
    <rect x="51" y="17" width="1" height="1" fill="#eee2cc"/>
    <rect x="52" y="17" width="1" height="1" fill="#eee2ca"/>
    <rect x="53" y="17" width="1" height="1" fill="#ede1c9"/>
    <rect x="54" y="17" width="1" height="1" fill="#ece0c8"/>
    <rect x="55" y="17" width="1" height="1" fill="#ede1c9"/>
    <rect x="56" y="17" width="1" height="1" fill="#ede1c9"/>
    <rect x="57" y="17" width="1" height="1" fill="#ece0c8"/>
    <rect x="58" y="17" width="1" height="1" fill="#ede1cb"/>
    <rect x="59" y="17" width="1" height="1" fill="#ece0ca"/>
    <rect x="60" y="17" width="1" height="1" fill="#ece0ca"/>
    <rect x="61" y="17" width="1" height="1" fill="#ede3ca"/>
    <rect x="62" y="17" width="1" height="1" fill="#050409"/>
    <rect x="63" y="17" width="1" height="1" fill="#030305"/>
    <rect x="3" y="18" width="1" height="1" fill="#4e4e4e"/>
    <rect x="4" y="18" width="1" height="1" fill="#030303"/>
    <rect x="5" y="18" width="1" height="1" fill="#0a0a0a"/>
    <rect x="6" y="18" width="1" height="1" fill="#0a0a0a"/>
    <rect x="7" y="18" width="1" height="1" fill="#000000"/>
    <rect x="8" y="18" width="1" height="1" fill="#000000"/>
    <rect x="9" y="18" width="1" height="1" fill="#010101"/>
    <rect x="10" y="18" width="1" height="1" fill="#000000"/>
    <rect x="11" y="18" width="1" height="1" fill="#000000"/>
    <rect x="12" y="18" width="1" height="1" fill="#000000"/>
    <rect x="13" y="18" width="1" height="1" fill="#140300"/>
    <rect x="14" y="18" width="1" height="1" fill="#f9a487"/>
    <rect x="15" y="18" width="1" height="1" fill="#fba58a"/>
    <rect x="16" y="18" width="1" height="1" fill="#f8a78c"/>
    <rect x="17" y="18" width="1" height="1" fill="#f8a48a"/>
    <rect x="18" y="18" width="1" height="1" fill="#f7a389"/>
    <rect x="19" y="18" width="1" height="1" fill="#f8a48a"/>
    <rect x="20" y="18" width="1" height="1" fill="#f7a389"/>
    <rect x="21" y="18" width="1" height="1" fill="#f6a288"/>
    <rect x="22" y="18" width="1" height="1" fill="#f8a48a"/>
    <rect x="23" y="18" width="1" height="1" fill="#f8a48a"/>
    <rect x="24" y="18" width="1" height="1" fill="#f7a389"/>
    <rect x="25" y="18" width="1" height="1" fill="#f7a389"/>
    <rect x="26" y="18" width="1" height="1" fill="#f8a48a"/>
    <rect x="27" y="18" width="1" height="1" fill="#f8a48a"/>
    <rect x="28" y="18" width="1" height="1" fill="#f6a288"/>
    <rect x="29" y="18" width="1" height="1" fill="#f9a487"/>
    <rect x="30" y="18" width="1" height="1" fill="#f79d82"/>
    <rect x="31" y="18" width="1" height="1" fill="#020100"/>
    <rect x="32" y="18" width="1" height="1" fill="#030200"/>
    <rect x="40" y="18" width="1" height="1" fill="#000004"/>
    <rect x="41" y="18" width="1" height="1" fill="#000000"/>
    <rect x="42" y="18" width="1" height="1" fill="#fff8e6"/>
    <rect x="43" y="18" width="1" height="1" fill="#ede1cb"/>
    <rect x="44" y="18" width="1" height="1" fill="#ece0c8"/>
    <rect x="45" y="18" width="1" height="1" fill="#ede2ce"/>
    <rect x="46" y="18" width="1" height="1" fill="#a1998e"/>
    <rect x="47" y="18" width="1" height="1" fill="#928c7e"/>
    <rect x="48" y="18" width="1" height="1" fill="#bab3a0"/>
    <rect x="49" y="18" width="1" height="1" fill="#ede2cc"/>
    <rect x="50" y="18" width="1" height="1" fill="#eee3cd"/>
    <rect x="51" y="18" width="1" height="1" fill="#9a9488"/>
    <rect x="52" y="18" width="1" height="1" fill="#9e948a"/>
    <rect x="53" y="18" width="1" height="1" fill="#faeed8"/>
    <rect x="54" y="18" width="1" height="1" fill="#ede1cb"/>
    <rect x="55" y="18" width="1" height="1" fill="#e9ddc7"/>
    <rect x="56" y="18" width="1" height="1" fill="#a09a8e"/>
    <rect x="57" y="18" width="1" height="1" fill="#9f958b"/>
    <rect x="58" y="18" width="1" height="1" fill="#e6dac2"/>
    <rect x="59" y="18" width="1" height="1" fill="#ece0c8"/>
    <rect x="60" y="18" width="1" height="1" fill="#ece0c8"/>
    <rect x="61" y="18" width="1" height="1" fill="#ede3ca"/>
    <rect x="62" y="18" width="1" height="1" fill="#040404"/>
    <rect x="63" y="18" width="1" height="1" fill="#030305"/>
    <rect x="3" y="19" width="1" height="1" fill="#5b5b5b"/>
    <rect x="4" y="19" width="1" height="1" fill="#0c0c0c"/>
    <rect x="5" y="19" width="1" height="1" fill="#0d0d0d"/>
    <rect x="6" y="19" width="1" height="1" fill="#0c0c0c"/>
    <rect x="7" y="19" width="1" height="1" fill="#000000"/>
    <rect x="8" y="19" width="1" height="1" fill="#000000"/>
    <rect x="9" y="19" width="1" height="1" fill="#000000"/>
    <rect x="10" y="19" width="1" height="1" fill="#010101"/>
    <rect x="11" y="19" width="1" height="1" fill="#000000"/>
    <rect x="12" y="19" width="1" height="1" fill="#000000"/>
    <rect x="13" y="19" width="1" height="1" fill="#140300"/>
    <rect x="14" y="19" width="1" height="1" fill="#faa588"/>
    <rect x="15" y="19" width="1" height="1" fill="#fba58a"/>
    <rect x="16" y="19" width="1" height="1" fill="#f6a58a"/>
    <rect x="17" y="19" width="1" height="1" fill="#f9a58b"/>
    <rect x="18" y="19" width="1" height="1" fill="#f9a58b"/>
    <rect x="19" y="19" width="1" height="1" fill="#f9a58b"/>
    <rect x="20" y="19" width="1" height="1" fill="#f8a48a"/>
    <rect x="21" y="19" width="1" height="1" fill="#f8a48a"/>
    <rect x="22" y="19" width="1" height="1" fill="#faa68c"/>
    <rect x="23" y="19" width="1" height="1" fill="#f8a48a"/>
    <rect x="24" y="19" width="1" height="1" fill="#f8a48a"/>
    <rect x="25" y="19" width="1" height="1" fill="#f8a48a"/>
    <rect x="26" y="19" width="1" height="1" fill="#f8a48a"/>
    <rect x="27" y="19" width="1" height="1" fill="#f7a389"/>
    <rect x="28" y="19" width="1" height="1" fill="#f6a288"/>
    <rect x="29" y="19" width="1" height="1" fill="#f8a587"/>
    <rect x="30" y="19" width="1" height="1" fill="#fda68a"/>
    <rect x="31" y="19" width="1" height="1" fill="#070604"/>
    <rect x="32" y="19" width="1" height="1" fill="#030200"/>
    <rect x="40" y="19" width="1" height="1" fill="#000004"/>
    <rect x="41" y="19" width="1" height="1" fill="#010101"/>
    <rect x="42" y="19" width="1" height="1" fill="#fffbe9"/>
    <rect x="43" y="19" width="1" height="1" fill="#ede1cb"/>
    <rect x="44" y="19" width="1" height="1" fill="#ede1c9"/>
    <rect x="45" y="19" width="1" height="1" fill="#eedec7"/>
    <rect x="46" y="19" width="1" height="1" fill="#070302"/>
    <rect x="47" y="19" width="1" height="1" fill="#000200"/>
    <rect x="48" y="19" width="1" height="1" fill="#5b544c"/>
    <rect x="49" y="19" width="1" height="1" fill="#ebe1c8"/>
    <rect x="50" y="19" width="1" height="1" fill="#ece2c9"/>
    <rect x="51" y="19" width="1" height="1" fill="#050608"/>
    <rect x="52" y="19" width="1" height="1" fill="#000002"/>
    <rect x="53" y="19" width="1" height="1" fill="#faefdd"/>
    <rect x="54" y="19" width="1" height="1" fill="#eee2cc"/>
    <rect x="55" y="19" width="1" height="1" fill="#ede1cb"/>
    <rect x="56" y="19" width="1" height="1" fill="#020202"/>
    <rect x="57" y="19" width="1" height="1" fill="#060405"/>
    <rect x="58" y="19" width="1" height="1" fill="#ebe4ca"/>
    <rect x="59" y="19" width="1" height="1" fill="#ede1c9"/>
    <rect x="60" y="19" width="1" height="1" fill="#ede1c9"/>
    <rect x="61" y="19" width="1" height="1" fill="#eee4cb"/>
    <rect x="62" y="19" width="1" height="1" fill="#040404"/>
    <rect x="63" y="19" width="1" height="1" fill="#030305"/>
    <rect x="0" y="20" width="1" height="1" fill="#020204"/>
    <rect x="1" y="20" width="1" height="1" fill="#040205"/>
    <rect x="2" y="20" width="1" height="1" fill="#3e3c3f"/>
    <rect x="3" y="20" width="1" height="1" fill="#51514f"/>
    <rect x="4" y="20" width="1" height="1" fill="#4b4b49"/>
    <rect x="5" y="20" width="1" height="1" fill="#4e4e4c"/>
    <rect x="6" y="20" width="1" height="1" fill="#4d4d4b"/>
    <rect x="7" y="20" width="1" height="1" fill="#4c4c4a"/>
    <rect x="8" y="20" width="1" height="1" fill="#515151"/>
    <rect x="9" y="20" width="1" height="1" fill="#000000"/>
    <rect x="10" y="20" width="1" height="1" fill="#000000"/>
    <rect x="11" y="20" width="1" height="1" fill="#000000"/>
    <rect x="12" y="20" width="1" height="1" fill="#010100"/>
    <rect x="13" y="20" width="1" height="1" fill="#160500"/>
    <rect x="14" y="20" width="1" height="1" fill="#faa489"/>
    <rect x="15" y="20" width="1" height="1" fill="#f9a589"/>
    <rect x="16" y="20" width="1" height="1" fill="#f9a589"/>
    <rect x="17" y="20" width="1" height="1" fill="#f9a58b"/>
    <rect x="18" y="20" width="1" height="1" fill="#f9a58b"/>
    <rect x="19" y="20" width="1" height="1" fill="#f6a588"/>
    <rect x="20" y="20" width="1" height="1" fill="#1b0000"/>
    <rect x="21" y="20" width="1" height="1" fill="#0f0100"/>
    <rect x="22" y="20" width="1" height="1" fill="#6b3e29"/>
    <rect x="23" y="20" width="1" height="1" fill="#fba189"/>
    <rect x="24" y="20" width="1" height="1" fill="#f8a48a"/>
    <rect x="25" y="20" width="1" height="1" fill="#f8a48a"/>
    <rect x="26" y="20" width="1" height="1" fill="#f8a48a"/>
    <rect x="27" y="20" width="1" height="1" fill="#f9a58b"/>
    <rect x="28" y="20" width="1" height="1" fill="#f4ab8a"/>
    <rect x="29" y="20" width="1" height="1" fill="#180400"/>
    <rect x="30" y="20" width="1" height="1" fill="#110200"/>
    <rect x="31" y="20" width="1" height="1" fill="#010101"/>
    <rect x="32" y="20" width="1" height="1" fill="#010101"/>
    <rect x="40" y="20" width="1" height="1" fill="#000004"/>
    <rect x="41" y="20" width="1" height="1" fill="#000000"/>
    <rect x="42" y="20" width="1" height="1" fill="#fff9e7"/>
    <rect x="43" y="20" width="1" height="1" fill="#eee2cc"/>
    <rect x="44" y="20" width="1" height="1" fill="#eee2ca"/>
    <rect x="45" y="20" width="1" height="1" fill="#efe3cb"/>
    <rect x="46" y="20" width="1" height="1" fill="#070604"/>
    <rect x="47" y="20" width="1" height="1" fill="#010000"/>
    <rect x="48" y="20" width="1" height="1" fill="#585246"/>
    <rect x="49" y="20" width="1" height="1" fill="#ede1c9"/>
    <rect x="50" y="20" width="1" height="1" fill="#eee2ca"/>
    <rect x="51" y="20" width="1" height="1" fill="#040404"/>
    <rect x="52" y="20" width="1" height="1" fill="#000200"/>
    <rect x="53" y="20" width="1" height="1" fill="#fdf8e4"/>
    <rect x="54" y="20" width="1" height="1" fill="#eee2ca"/>
    <rect x="55" y="20" width="1" height="1" fill="#eadec6"/>
    <rect x="56" y="20" width="1" height="1" fill="#030301"/>
    <rect x="57" y="20" width="1" height="1" fill="#080607"/>
    <rect x="58" y="20" width="1" height="1" fill="#ebe1c6"/>
    <rect x="59" y="20" width="1" height="1" fill="#ebe1c8"/>
    <rect x="60" y="20" width="1" height="1" fill="#ede1c9"/>
    <rect x="61" y="20" width="1" height="1" fill="#eae0c7"/>
    <rect x="62" y="20" width="1" height="1" fill="#040404"/>
    <rect x="63" y="20" width="1" height="1" fill="#030305"/>
    <rect x="0" y="21" width="1" height="1" fill="#050505"/>
    <rect x="1" y="21" width="1" height="1" fill="#000000"/>
    <rect x="2" y="21" width="1" height="1" fill="#4f4f4f"/>
    <rect x="3" y="21" width="1" height="1" fill="#4f4f4d"/>
    <rect x="4" y="21" width="1" height="1" fill="#4f4f4d"/>
    <rect x="5" y="21" width="1" height="1" fill="#4e4e4c"/>
    <rect x="6" y="21" width="1" height="1" fill="#4d4d4b"/>
    <rect x="7" y="21" width="1" height="1" fill="#4b4b49"/>
    <rect x="8" y="21" width="1" height="1" fill="#494949"/>
    <rect x="9" y="21" width="1" height="1" fill="#000000"/>
    <rect x="10" y="21" width="1" height="1" fill="#000000"/>
    <rect x="11" y="21" width="1" height="1" fill="#010101"/>
    <rect x="12" y="21" width="1" height="1" fill="#010100"/>
    <rect x="13" y="21" width="1" height="1" fill="#160500"/>
    <rect x="14" y="21" width="1" height="1" fill="#faa489"/>
    <rect x="15" y="21" width="1" height="1" fill="#f9a589"/>
    <rect x="16" y="21" width="1" height="1" fill="#f9a589"/>
    <rect x="17" y="21" width="1" height="1" fill="#f9a58b"/>
    <rect x="18" y="21" width="1" height="1" fill="#f8a48a"/>
    <rect x="19" y="21" width="1" height="1" fill="#f8a287"/>
    <rect x="20" y="21" width="1" height="1" fill="#0b0001"/>
    <rect x="21" y="21" width="1" height="1" fill="#020300"/>
    <rect x="22" y="21" width="1" height="1" fill="#4e2f1b"/>
    <rect x="23" y="21" width="1" height="1" fill="#faa388"/>
    <rect x="24" y="21" width="1" height="1" fill="#f8a48a"/>
    <rect x="25" y="21" width="1" height="1" fill="#f8a48a"/>
    <rect x="26" y="21" width="1" height="1" fill="#f9a58b"/>
    <rect x="27" y="21" width="1" height="1" fill="#f9a58b"/>
    <rect x="28" y="21" width="1" height="1" fill="#f1ab89"/>
    <rect x="29" y="21" width="1" height="1" fill="#060407"/>
    <rect x="30" y="21" width="1" height="1" fill="#000002"/>
    <rect x="31" y="21" width="1" height="1" fill="#000000"/>
    <rect x="32" y="21" width="1" height="1" fill="#010101"/>
    <rect x="40" y="21" width="1" height="1" fill="#000004"/>
    <rect x="41" y="21" width="1" height="1" fill="#010101"/>
    <rect x="42" y="21" width="1" height="1" fill="#fffae8"/>
    <rect x="43" y="21" width="1" height="1" fill="#ede1cb"/>
    <rect x="44" y="21" width="1" height="1" fill="#eee2ca"/>
    <rect x="45" y="21" width="1" height="1" fill="#eee2c8"/>
    <rect x="46" y="21" width="1" height="1" fill="#f1e8d7"/>
    <rect x="47" y="21" width="1" height="1" fill="#fdf8e5"/>
    <rect x="48" y="21" width="1" height="1" fill="#f3ecd9"/>
    <rect x="49" y="21" width="1" height="1" fill="#ede1c9"/>
    <rect x="50" y="21" width="1" height="1" fill="#ede1c9"/>
    <rect x="51" y="21" width="1" height="1" fill="#fdf7e9"/>
    <rect x="52" y="21" width="1" height="1" fill="#fbf6e2"/>
    <rect x="53" y="21" width="1" height="1" fill="#eae0c5"/>
    <rect x="54" y="21" width="1" height="1" fill="#ede1c9"/>
    <rect x="55" y="21" width="1" height="1" fill="#f1e5cd"/>
    <rect x="56" y="21" width="1" height="1" fill="#f9f4e1"/>
    <rect x="57" y="21" width="1" height="1" fill="#fef7e5"/>
    <rect x="58" y="21" width="1" height="1" fill="#ede3c8"/>
    <rect x="59" y="21" width="1" height="1" fill="#ece0c8"/>
    <rect x="60" y="21" width="1" height="1" fill="#ece0c8"/>
    <rect x="61" y="21" width="1" height="1" fill="#eae0c7"/>
    <rect x="62" y="21" width="1" height="1" fill="#040404"/>
    <rect x="63" y="21" width="1" height="1" fill="#030305"/>
    <rect x="0" y="22" width="1" height="1" fill="#010101"/>
    <rect x="1" y="22" width="1" height="1" fill="#010101"/>
    <rect x="2" y="22" width="1" height="1" fill="#4b4b4b"/>
    <rect x="3" y="22" width="1" height="1" fill="#4f4f4d"/>
    <rect x="4" y="22" width="1" height="1" fill="#4f4f4d"/>
    <rect x="5" y="22" width="1" height="1" fill="#4e4e4c"/>
    <rect x="6" y="22" width="1" height="1" fill="#4d4d4b"/>
    <rect x="7" y="22" width="1" height="1" fill="#4e4e4c"/>
    <rect x="8" y="22" width="1" height="1" fill="#4e4e4e"/>
    <rect x="9" y="22" width="1" height="1" fill="#000000"/>
    <rect x="10" y="22" width="1" height="1" fill="#000000"/>
    <rect x="11" y="22" width="1" height="1" fill="#000000"/>
    <rect x="12" y="22" width="1" height="1" fill="#000000"/>
    <rect x="13" y="22" width="1" height="1" fill="#160500"/>
    <rect x="14" y="22" width="1" height="1" fill="#fba58a"/>
    <rect x="15" y="22" width="1" height="1" fill="#f9a589"/>
    <rect x="16" y="22" width="1" height="1" fill="#f9a589"/>
    <rect x="17" y="22" width="1" height="1" fill="#f9a58b"/>
    <rect x="18" y="22" width="1" height="1" fill="#f9a58b"/>
    <rect x="19" y="22" width="1" height="1" fill="#f8a587"/>
    <rect x="20" y="22" width="1" height="1" fill="#080000"/>
    <rect x="21" y="22" width="1" height="1" fill="#000000"/>
    <rect x="22" y="22" width="1" height="1" fill="#4b2c1a"/>
    <rect x="23" y="22" width="1" height="1" fill="#faa28a"/>
    <rect x="24" y="22" width="1" height="1" fill="#f9a589"/>
    <rect x="25" y="22" width="1" height="1" fill="#f9a589"/>
    <rect x="26" y="22" width="1" height="1" fill="#f9a58b"/>
    <rect x="27" y="22" width="1" height="1" fill="#f9a58b"/>
    <rect x="28" y="22" width="1" height="1" fill="#f1a888"/>
    <rect x="29" y="22" width="1" height="1" fill="#050507"/>
    <rect x="30" y="22" width="1" height="1" fill="#000000"/>
    <rect x="31" y="22" width="1" height="1" fill="#000000"/>
    <rect x="32" y="22" width="1" height="1" fill="#010101"/>
    <rect x="40" y="22" width="1" height="1" fill="#000004"/>
    <rect x="41" y="22" width="1" height="1" fill="#000000"/>
    <rect x="42" y="22" width="1" height="1" fill="#fef7e5"/>
    <rect x="43" y="22" width="1" height="1" fill="#eee2cc"/>
    <rect x="44" y="22" width="1" height="1" fill="#eee2ca"/>
    <rect x="45" y="22" width="1" height="1" fill="#ede1cb"/>
    <rect x="46" y="22" width="1" height="1" fill="#ede1cb"/>
    <rect x="47" y="22" width="1" height="1" fill="#ede1c9"/>
    <rect x="48" y="22" width="1" height="1" fill="#ede1cb"/>
    <rect x="49" y="22" width="1" height="1" fill="#ece0c8"/>
    <rect x="50" y="22" width="1" height="1" fill="#ede1c9"/>
    <rect x="51" y="22" width="1" height="1" fill="#ede1cb"/>
    <rect x="52" y="22" width="1" height="1" fill="#eee2cc"/>
    <rect x="53" y="22" width="1" height="1" fill="#ede1cb"/>
    <rect x="54" y="22" width="1" height="1" fill="#ece0ca"/>
    <rect x="55" y="22" width="1" height="1" fill="#ede1cb"/>
    <rect x="56" y="22" width="1" height="1" fill="#ece0ca"/>
    <rect x="57" y="22" width="1" height="1" fill="#efe0cb"/>
    <rect x="58" y="22" width="1" height="1" fill="#ede1c9"/>
    <rect x="59" y="22" width="1" height="1" fill="#ece0ca"/>
    <rect x="60" y="22" width="1" height="1" fill="#ede1cb"/>
    <rect x="61" y="22" width="1" height="1" fill="#ece2c9"/>
    <rect x="62" y="22" width="1" height="1" fill="#040404"/>
    <rect x="63" y="22" width="1" height="1" fill="#030305"/>
    <rect x="0" y="23" width="1" height="1" fill="#010101"/>
    <rect x="1" y="23" width="1" height="1" fill="#010101"/>
    <rect x="2" y="23" width="1" height="1" fill="#4b4b4b"/>
    <rect x="3" y="23" width="1" height="1" fill="#51514f"/>
    <rect x="4" y="23" width="1" height="1" fill="#51514f"/>
    <rect x="5" y="23" width="1" height="1" fill="#4f4f4d"/>
    <rect x="6" y="23" width="1" height="1" fill="#4f4f4d"/>
    <rect x="7" y="23" width="1" height="1" fill="#4c4c4a"/>
    <rect x="8" y="23" width="1" height="1" fill="#4d4d4d"/>
    <rect x="9" y="23" width="1" height="1" fill="#000000"/>
    <rect x="10" y="23" width="1" height="1" fill="#000000"/>
    <rect x="11" y="23" width="1" height="1" fill="#000000"/>
    <rect x="12" y="23" width="1" height="1" fill="#000000"/>
    <rect x="13" y="23" width="1" height="1" fill="#160500"/>
    <rect x="14" y="23" width="1" height="1" fill="#fba58a"/>
    <rect x="15" y="23" width="1" height="1" fill="#f9a589"/>
    <rect x="16" y="23" width="1" height="1" fill="#f9a589"/>
    <rect x="17" y="23" width="1" height="1" fill="#f9a58b"/>
    <rect x="18" y="23" width="1" height="1" fill="#f9a58b"/>
    <rect x="19" y="23" width="1" height="1" fill="#f8a587"/>
    <rect x="20" y="23" width="1" height="1" fill="#080000"/>
    <rect x="21" y="23" width="1" height="1" fill="#000000"/>
    <rect x="22" y="23" width="1" height="1" fill="#482b19"/>
    <rect x="23" y="23" width="1" height="1" fill="#f9a38a"/>
    <rect x="24" y="23" width="1" height="1" fill="#f9a589"/>
    <rect x="25" y="23" width="1" height="1" fill="#f9a589"/>
    <rect x="26" y="23" width="1" height="1" fill="#faa68c"/>
    <rect x="27" y="23" width="1" height="1" fill="#f9a58b"/>
    <rect x="28" y="23" width="1" height="1" fill="#f1a888"/>
    <rect x="29" y="23" width="1" height="1" fill="#050507"/>
    <rect x="30" y="23" width="1" height="1" fill="#000000"/>
    <rect x="31" y="23" width="1" height="1" fill="#000000"/>
    <rect x="32" y="23" width="1" height="1" fill="#010101"/>
    <rect x="40" y="23" width="1" height="1" fill="#000004"/>
    <rect x="41" y="23" width="1" height="1" fill="#000000"/>
    <rect x="42" y="23" width="1" height="1" fill="#fdf6e4"/>
    <rect x="43" y="23" width="1" height="1" fill="#eee2cc"/>
    <rect x="44" y="23" width="1" height="1" fill="#eee2ca"/>
    <rect x="45" y="23" width="1" height="1" fill="#ede1c9"/>
    <rect x="46" y="23" width="1" height="1" fill="#ede1c9"/>
    <rect x="47" y="23" width="1" height="1" fill="#ede1c9"/>
    <rect x="48" y="23" width="1" height="1" fill="#ede1c9"/>
    <rect x="49" y="23" width="1" height="1" fill="#ede1c9"/>
    <rect x="50" y="23" width="1" height="1" fill="#ede1c9"/>
    <rect x="51" y="23" width="1" height="1" fill="#ede1cb"/>
    <rect x="52" y="23" width="1" height="1" fill="#ece0ca"/>
    <rect x="53" y="23" width="1" height="1" fill="#ede1cb"/>
    <rect x="54" y="23" width="1" height="1" fill="#eee2cc"/>
    <rect x="55" y="23" width="1" height="1" fill="#ede1cb"/>
    <rect x="56" y="23" width="1" height="1" fill="#ece0ca"/>
    <rect x="57" y="23" width="1" height="1" fill="#ede1cb"/>
    <rect x="58" y="23" width="1" height="1" fill="#ede1cb"/>
    <rect x="59" y="23" width="1" height="1" fill="#ece0ca"/>
    <rect x="60" y="23" width="1" height="1" fill="#ede1cb"/>
    <rect x="61" y="23" width="1" height="1" fill="#ece2c9"/>
    <rect x="62" y="23" width="1" height="1" fill="#040404"/>
    <rect x="63" y="23" width="1" height="1" fill="#030305"/>
    <rect x="0" y="24" width="1" height="1" fill="#010101"/>
    <rect x="1" y="24" width="1" height="1" fill="#000000"/>
    <rect x="2" y="24" width="1" height="1" fill="#4a4a4a"/>
    <rect x="3" y="24" width="1" height="1" fill="#505050"/>
    <rect x="4" y="24" width="1" height="1" fill="#4f4f4f"/>
    <rect x="5" y="24" width="1" height="1" fill="#4f4f4d"/>
    <rect x="6" y="24" width="1" height="1" fill="#4f4f4d"/>
    <rect x="7" y="24" width="1" height="1" fill="#4b4b49"/>
    <rect x="8" y="24" width="1" height="1" fill="#4c4c4c"/>
    <rect x="9" y="24" width="1" height="1" fill="#000000"/>
    <rect x="10" y="24" width="1" height="1" fill="#000000"/>
    <rect x="11" y="24" width="1" height="1" fill="#000000"/>
    <rect x="12" y="24" width="1" height="1" fill="#000000"/>
    <rect x="13" y="24" width="1" height="1" fill="#1b0a03"/>
    <rect x="14" y="24" width="1" height="1" fill="#f9a388"/>
    <rect x="15" y="24" width="1" height="1" fill="#f9a589"/>
    <rect x="16" y="24" width="1" height="1" fill="#f9a589"/>
    <rect x="17" y="24" width="1" height="1" fill="#f9a58b"/>
    <rect x="18" y="24" width="1" height="1" fill="#f8a48a"/>
    <rect x="19" y="24" width="1" height="1" fill="#f8a587"/>
    <rect x="20" y="24" width="1" height="1" fill="#0a0000"/>
    <rect x="21" y="24" width="1" height="1" fill="#020202"/>
    <rect x="22" y="24" width="1" height="1" fill="#4b2e1c"/>
    <rect x="23" y="24" width="1" height="1" fill="#f9a38a"/>
    <rect x="24" y="24" width="1" height="1" fill="#f9a589"/>
    <rect x="25" y="24" width="1" height="1" fill="#f9a589"/>
    <rect x="26" y="24" width="1" height="1" fill="#f8a48a"/>
    <rect x="27" y="24" width="1" height="1" fill="#f8a48a"/>
    <rect x="28" y="24" width="1" height="1" fill="#f1a888"/>
    <rect x="29" y="24" width="1" height="1" fill="#050507"/>
    <rect x="30" y="24" width="1" height="1" fill="#000000"/>
    <rect x="31" y="24" width="1" height="1" fill="#010101"/>
    <rect x="32" y="24" width="1" height="1" fill="#010101"/>
    <rect x="40" y="24" width="1" height="1" fill="#000004"/>
    <rect x="41" y="24" width="1" height="1" fill="#000000"/>
    <rect x="42" y="24" width="1" height="1" fill="#fffbe9"/>
    <rect x="43" y="24" width="1" height="1" fill="#eee2cc"/>
    <rect x="44" y="24" width="1" height="1" fill="#eee2ca"/>
    <rect x="45" y="24" width="1" height="1" fill="#ede1c9"/>
    <rect x="46" y="24" width="1" height="1" fill="#ece0c8"/>
    <rect x="47" y="24" width="1" height="1" fill="#ece0c8"/>
    <rect x="48" y="24" width="1" height="1" fill="#ede1c9"/>
    <rect x="49" y="24" width="1" height="1" fill="#ede1c9"/>
    <rect x="50" y="24" width="1" height="1" fill="#ede1c9"/>
    <rect x="51" y="24" width="1" height="1" fill="#ede1cb"/>
    <rect x="52" y="24" width="1" height="1" fill="#ede1cb"/>
    <rect x="53" y="24" width="1" height="1" fill="#ede1cb"/>
    <rect x="54" y="24" width="1" height="1" fill="#ede1cb"/>
    <rect x="55" y="24" width="1" height="1" fill="#ede1cb"/>
    <rect x="56" y="24" width="1" height="1" fill="#ede1cb"/>
    <rect x="57" y="24" width="1" height="1" fill="#ede1cb"/>
    <rect x="58" y="24" width="1" height="1" fill="#ece0ca"/>
    <rect x="59" y="24" width="1" height="1" fill="#ebdfc9"/>
    <rect x="60" y="24" width="1" height="1" fill="#ede1cb"/>
    <rect x="61" y="24" width="1" height="1" fill="#ede3ca"/>
    <rect x="62" y="24" width="1" height="1" fill="#040404"/>
    <rect x="63" y="24" width="1" height="1" fill="#040406"/>
    <rect x="0" y="25" width="1" height="1" fill="#020202"/>
    <rect x="1" y="25" width="1" height="1" fill="#010101"/>
    <rect x="2" y="25" width="1" height="1" fill="#4a4a4a"/>
    <rect x="3" y="25" width="1" height="1" fill="#4f4f4d"/>
    <rect x="4" y="25" width="1" height="1" fill="#4f4f4d"/>
    <rect x="5" y="25" width="1" height="1" fill="#505050"/>
    <rect x="6" y="25" width="1" height="1" fill="#4f4f4f"/>
    <rect x="7" y="25" width="1" height="1" fill="#4c4c4c"/>
    <rect x="8" y="25" width="1" height="1" fill="#4c4c4c"/>
    <rect x="9" y="25" width="1" height="1" fill="#000000"/>
    <rect x="10" y="25" width="1" height="1" fill="#000200"/>
    <rect x="11" y="25" width="1" height="1" fill="#080607"/>
    <rect x="12" y="25" width="1" height="1" fill="#080204"/>
    <rect x="13" y="25" width="1" height="1" fill="#230b07"/>
    <rect x="14" y="25" width="1" height="1" fill="#fda78e"/>
    <rect x="15" y="25" width="1" height="1" fill="#f8a48a"/>
    <rect x="16" y="25" width="1" height="1" fill="#f9a58b"/>
    <rect x="17" y="25" width="1" height="1" fill="#f8a78a"/>
    <rect x="18" y="25" width="1" height="1" fill="#f6a588"/>
    <rect x="19" y="25" width="1" height="1" fill="#f7a78e"/>
    <rect x="20" y="25" width="1" height="1" fill="#130700"/>
    <rect x="21" y="25" width="1" height="1" fill="#090305"/>
    <rect x="22" y="25" width="1" height="1" fill="#572615"/>
    <rect x="23" y="25" width="1" height="1" fill="#f7a486"/>
    <rect x="24" y="25" width="1" height="1" fill="#f8a48a"/>
    <rect x="25" y="25" width="1" height="1" fill="#f8a48a"/>
    <rect x="26" y="25" width="1" height="1" fill="#f8a48a"/>
    <rect x="27" y="25" width="1" height="1" fill="#f7a389"/>
    <rect x="28" y="25" width="1" height="1" fill="#f5a38d"/>
    <rect x="29" y="25" width="1" height="1" fill="#0c0809"/>
    <rect x="30" y="25" width="1" height="1" fill="#0a0408"/>
    <rect x="31" y="25" width="1" height="1" fill="#020200"/>
    <rect x="32" y="25" width="1" height="1" fill="#010100"/>
    <rect x="40" y="25" width="1" height="1" fill="#030106"/>
    <rect x="41" y="25" width="1" height="1" fill="#020001"/>
    <rect x="42" y="25" width="1" height="1" fill="#fffcec"/>
    <rect x="43" y="25" width="1" height="1" fill="#ece2c9"/>
    <rect x="44" y="25" width="1" height="1" fill="#eee2cc"/>
    <rect x="45" y="25" width="1" height="1" fill="#ede1cb"/>
    <rect x="46" y="25" width="1" height="1" fill="#ede1cb"/>
    <rect x="47" y="25" width="1" height="1" fill="#ece0c8"/>
    <rect x="48" y="25" width="1" height="1" fill="#efe3cb"/>
    <rect x="49" y="25" width="1" height="1" fill="#ede1c9"/>
    <rect x="50" y="25" width="1" height="1" fill="#eee2ca"/>
    <rect x="51" y="25" width="1" height="1" fill="#ebe4ca"/>
    <rect x="52" y="25" width="1" height="1" fill="#eee2cc"/>
    <rect x="53" y="25" width="1" height="1" fill="#eee2cc"/>
    <rect x="54" y="25" width="1" height="1" fill="#eee2cc"/>
    <rect x="55" y="25" width="1" height="1" fill="#eee2cc"/>
    <rect x="56" y="25" width="1" height="1" fill="#eee2cc"/>
    <rect x="57" y="25" width="1" height="1" fill="#ede1cb"/>
    <rect x="58" y="25" width="1" height="1" fill="#ede1cb"/>
    <rect x="59" y="25" width="1" height="1" fill="#ece1cd"/>
    <rect x="60" y="25" width="1" height="1" fill="#ede1cb"/>
    <rect x="61" y="25" width="1" height="1" fill="#ece0c8"/>
    <rect x="62" y="25" width="1" height="1" fill="#060606"/>
    <rect x="63" y="25" width="1" height="1" fill="#040406"/>
    <rect x="0" y="26" width="1" height="1" fill="#020202"/>
    <rect x="1" y="26" width="1" height="1" fill="#010101"/>
    <rect x="2" y="26" width="1" height="1" fill="#4a4a4a"/>
    <rect x="3" y="26" width="1" height="1" fill="#4f4f4d"/>
    <rect x="4" y="26" width="1" height="1" fill="#4f4f4d"/>
    <rect x="5" y="26" width="1" height="1" fill="#4f4f4f"/>
    <rect x="6" y="26" width="1" height="1" fill="#4e4e4e"/>
    <rect x="7" y="26" width="1" height="1" fill="#4b4b4b"/>
    <rect x="8" y="26" width="1" height="1" fill="#4c4c4c"/>
    <rect x="9" y="26" width="1" height="1" fill="#000000"/>
    <rect x="10" y="26" width="1" height="1" fill="#000104"/>
    <rect x="11" y="26" width="1" height="1" fill="#ffa185"/>
    <rect x="12" y="26" width="1" height="1" fill="#f9a792"/>
    <rect x="13" y="26" width="1" height="1" fill="#fba58e"/>
    <rect x="14" y="26" width="1" height="1" fill="#f9a589"/>
    <rect x="15" y="26" width="1" height="1" fill="#faa68c"/>
    <rect x="16" y="26" width="1" height="1" fill="#f9a58b"/>
    <rect x="17" y="26" width="1" height="1" fill="#f8a78c"/>
    <rect x="18" y="26" width="1" height="1" fill="#f8a78c"/>
    <rect x="19" y="26" width="1" height="1" fill="#f6a587"/>
    <rect x="20" y="26" width="1" height="1" fill="#faa48b"/>
    <rect x="21" y="26" width="1" height="1" fill="#f8a38e"/>
    <rect x="22" y="26" width="1" height="1" fill="#f3a287"/>
    <rect x="23" y="26" width="1" height="1" fill="#f6a58a"/>
    <rect x="24" y="26" width="1" height="1" fill="#f9a58b"/>
    <rect x="25" y="26" width="1" height="1" fill="#f8a48a"/>
    <rect x="26" y="26" width="1" height="1" fill="#f8a48a"/>
    <rect x="27" y="26" width="1" height="1" fill="#f7a389"/>
    <rect x="28" y="26" width="1" height="1" fill="#f99f85"/>
    <rect x="29" y="26" width="1" height="1" fill="#f5a189"/>
    <rect x="30" y="26" width="1" height="1" fill="#f8a68e"/>
    <rect x="31" y="26" width="1" height="1" fill="#040402"/>
    <rect x="32" y="26" width="1" height="1" fill="#010100"/>
    <rect x="40" y="26" width="1" height="1" fill="#030106"/>
    <rect x="41" y="26" width="1" height="1" fill="#020001"/>
    <rect x="42" y="26" width="1" height="1" fill="#fffef0"/>
    <rect x="43" y="26" width="1" height="1" fill="#ece4cd"/>
    <rect x="44" y="26" width="1" height="1" fill="#ebe3cc"/>
    <rect x="45" y="26" width="1" height="1" fill="#eee2cc"/>
    <rect x="46" y="26" width="1" height="1" fill="#ede1cb"/>
    <rect x="47" y="26" width="1" height="1" fill="#ece0c8"/>
    <rect x="48" y="26" width="1" height="1" fill="#e9ddc5"/>
    <rect x="49" y="26" width="1" height="1" fill="#eae4ce"/>
    <rect x="50" y="26" width="1" height="1" fill="#e9e3cd"/>
    <rect x="51" y="26" width="1" height="1" fill="#ebe3cc"/>
    <rect x="52" y="26" width="1" height="1" fill="#ebe5cd"/>
    <rect x="53" y="26" width="1" height="1" fill="#e9e5cc"/>
    <rect x="54" y="26" width="1" height="1" fill="#eae4ce"/>
    <rect x="55" y="26" width="1" height="1" fill="#e9e4ce"/>
    <rect x="56" y="26" width="1" height="1" fill="#ebe5cf"/>
    <rect x="57" y="26" width="1" height="1" fill="#eae4ce"/>
    <rect x="58" y="26" width="1" height="1" fill="#e8e3cf"/>
    <rect x="59" y="26" width="1" height="1" fill="#e9e3cd"/>
    <rect x="60" y="26" width="1" height="1" fill="#e9e1ca"/>
    <rect x="61" y="26" width="1" height="1" fill="#ece0c8"/>
    <rect x="62" y="26" width="1" height="1" fill="#060606"/>
    <rect x="63" y="26" width="1" height="1" fill="#020204"/>
    <rect x="0" y="27" width="1" height="1" fill="#020202"/>
    <rect x="1" y="27" width="1" height="1" fill="#000000"/>
    <rect x="2" y="27" width="1" height="1" fill="#4a4a4a"/>
    <rect x="3" y="27" width="1" height="1" fill="#4f4f4d"/>
    <rect x="4" y="27" width="1" height="1" fill="#50504e"/>
    <rect x="5" y="27" width="1" height="1" fill="#504f4d"/>
    <rect x="6" y="27" width="1" height="1" fill="#4e4d4b"/>
    <rect x="7" y="27" width="1" height="1" fill="#4c4c4a"/>
    <rect x="8" y="27" width="1" height="1" fill="#4d4d4b"/>
    <rect x="9" y="27" width="1" height="1" fill="#010100"/>
    <rect x="10" y="27" width="1" height="1" fill="#030708"/>
    <rect x="11" y="27" width="1" height="1" fill="#faa68e"/>
    <rect x="12" y="27" width="1" height="1" fill="#faa48b"/>
    <rect x="13" y="27" width="1" height="1" fill="#faa48b"/>
    <rect x="14" y="27" width="1" height="1" fill="#f9a58b"/>
    <rect x="15" y="27" width="1" height="1" fill="#f7a68b"/>
    <rect x="16" y="27" width="1" height="1" fill="#f7a68b"/>
    <rect x="17" y="27" width="1" height="1" fill="#f7a68b"/>
    <rect x="18" y="27" width="1" height="1" fill="#f9a88d"/>
    <rect x="19" y="27" width="1" height="1" fill="#faa68c"/>
    <rect x="20" y="27" width="1" height="1" fill="#f8a48a"/>
    <rect x="21" y="27" width="1" height="1" fill="#f8a48a"/>
    <rect x="22" y="27" width="1" height="1" fill="#f6a68f"/>
    <rect x="23" y="27" width="1" height="1" fill="#f4a48b"/>
    <rect x="24" y="27" width="1" height="1" fill="#f5a685"/>
    <rect x="25" y="27" width="1" height="1" fill="#f5a685"/>
    <rect x="26" y="27" width="1" height="1" fill="#f4a584"/>
    <rect x="27" y="27" width="1" height="1" fill="#f4a584"/>
    <rect x="28" y="27" width="1" height="1" fill="#f9a382"/>
    <rect x="29" y="27" width="1" height="1" fill="#f8a587"/>
    <rect x="30" y="27" width="1" height="1" fill="#fba284"/>
    <rect x="31" y="27" width="1" height="1" fill="#020200"/>
    <rect x="32" y="27" width="1" height="1" fill="#010100"/>
    <rect x="42" y="27" width="1" height="1" fill="#000002"/>
    <rect x="43" y="27" width="1" height="1" fill="#050304"/>
    <rect x="44" y="27" width="1" height="1" fill="#030301"/>
    <rect x="45" y="27" width="1" height="1" fill="#f2e6ce"/>
    <rect x="46" y="27" width="1" height="1" fill="#ece0ca"/>
    <rect x="47" y="27" width="1" height="1" fill="#ede2cc"/>
    <rect x="48" y="27" width="1" height="1" fill="#615f53"/>
    <rect x="49" y="27" width="1" height="1" fill="#000000"/>
    <rect x="50" y="27" width="1" height="1" fill="#040402"/>
    <rect x="51" y="27" width="1" height="1" fill="#000000"/>
    <rect x="52" y="27" width="1" height="1" fill="#020202"/>
    <rect x="53" y="27" width="1" height="1" fill="#030303"/>
    <rect x="54" y="27" width="1" height="1" fill="#010101"/>
    <rect x="55" y="27" width="1" height="1" fill="#030303"/>
    <rect x="56" y="27" width="1" height="1" fill="#000000"/>
    <rect x="57" y="27" width="1" height="1" fill="#020202"/>
    <rect x="58" y="27" width="1" height="1" fill="#010101"/>
    <rect x="59" y="27" width="1" height="1" fill="#020200"/>
    <rect x="60" y="27" width="1" height="1" fill="#030301"/>
    <rect x="61" y="27" width="1" height="1" fill="#0d0b0c"/>
    <rect x="0" y="28" width="1" height="1" fill="#030303"/>
    <rect x="1" y="28" width="1" height="1" fill="#000000"/>
    <rect x="2" y="28" width="1" height="1" fill="#4b4b4b"/>
    <rect x="3" y="28" width="1" height="1" fill="#50504e"/>
    <rect x="4" y="28" width="1" height="1" fill="#4f4f4d"/>
    <rect x="5" y="28" width="1" height="1" fill="#4f4e4c"/>
    <rect x="6" y="28" width="1" height="1" fill="#4f4e4c"/>
    <rect x="7" y="28" width="1" height="1" fill="#4f4f4d"/>
    <rect x="8" y="28" width="1" height="1" fill="#525250"/>
    <rect x="9" y="28" width="1" height="1" fill="#010100"/>
    <rect x="10" y="28" width="1" height="1" fill="#000002"/>
    <rect x="11" y="28" width="1" height="1" fill="#f8a28b"/>
    <rect x="12" y="28" width="1" height="1" fill="#f8a78c"/>
    <rect x="13" y="28" width="1" height="1" fill="#f8a78c"/>
    <rect x="14" y="28" width="1" height="1" fill="#f9a58b"/>
    <rect x="15" y="28" width="1" height="1" fill="#f7a68b"/>
    <rect x="16" y="28" width="1" height="1" fill="#f7a68b"/>
    <rect x="17" y="28" width="1" height="1" fill="#f7a68b"/>
    <rect x="18" y="28" width="1" height="1" fill="#f7a68b"/>
    <rect x="19" y="28" width="1" height="1" fill="#f8a78c"/>
    <rect x="20" y="28" width="1" height="1" fill="#f8a78c"/>
    <rect x="21" y="28" width="1" height="1" fill="#f9a58b"/>
    <rect x="22" y="28" width="1" height="1" fill="#fba489"/>
    <rect x="23" y="28" width="1" height="1" fill="#f6a98b"/>
    <rect x="24" y="28" width="1" height="1" fill="#f6a685"/>
    <rect x="25" y="28" width="1" height="1" fill="#f7a786"/>
    <rect x="26" y="28" width="1" height="1" fill="#f7a786"/>
    <rect x="27" y="28" width="1" height="1" fill="#faaa89"/>
    <rect x="28" y="28" width="1" height="1" fill="#f7a58d"/>
    <rect x="29" y="28" width="1" height="1" fill="#f89f81"/>
    <rect x="30" y="28" width="1" height="1" fill="#f89f81"/>
    <rect x="31" y="28" width="1" height="1" fill="#040402"/>
    <rect x="32" y="28" width="1" height="1" fill="#010100"/>
    <rect x="42" y="28" width="1" height="1" fill="#000002"/>
    <rect x="43" y="28" width="1" height="1" fill="#010000"/>
    <rect x="44" y="28" width="1" height="1" fill="#020200"/>
    <rect x="45" y="28" width="1" height="1" fill="#faeed8"/>
    <rect x="46" y="28" width="1" height="1" fill="#f0e4cc"/>
    <rect x="47" y="28" width="1" height="1" fill="#e8dcc4"/>
    <rect x="48" y="28" width="1" height="1" fill="#534f43"/>
    <rect x="49" y="28" width="1" height="1" fill="#000000"/>
    <rect x="50" y="28" width="1" height="1" fill="#000000"/>
    <rect x="51" y="28" width="1" height="1" fill="#000000"/>
    <rect x="52" y="28" width="1" height="1" fill="#000000"/>
    <rect x="53" y="28" width="1" height="1" fill="#000000"/>
    <rect x="54" y="28" width="1" height="1" fill="#000000"/>
    <rect x="55" y="28" width="1" height="1" fill="#000000"/>
    <rect x="56" y="28" width="1" height="1" fill="#000000"/>
    <rect x="57" y="28" width="1" height="1" fill="#000000"/>
    <rect x="58" y="28" width="1" height="1" fill="#000000"/>
    <rect x="59" y="28" width="1" height="1" fill="#010101"/>
    <rect x="60" y="28" width="1" height="1" fill="#000000"/>
    <rect x="61" y="28" width="1" height="1" fill="#080607"/>
    <rect x="0" y="29" width="1" height="1" fill="#080609"/>
    <rect x="1" y="29" width="1" height="1" fill="#060405"/>
    <rect x="2" y="29" width="1" height="1" fill="#4f4f4f"/>
    <rect x="3" y="29" width="1" height="1" fill="#505050"/>
    <rect x="4" y="29" width="1" height="1" fill="#4e4e4e"/>
    <rect x="5" y="29" width="1" height="1" fill="#4f4f4d"/>
    <rect x="6" y="29" width="1" height="1" fill="#51514f"/>
    <rect x="7" y="29" width="1" height="1" fill="#4e4e4e"/>
    <rect x="8" y="29" width="1" height="1" fill="#404b45"/>
    <rect x="9" y="29" width="1" height="1" fill="#080607"/>
    <rect x="10" y="29" width="1" height="1" fill="#030300"/>
    <rect x="11" y="29" width="1" height="1" fill="#fba38d"/>
    <rect x="12" y="29" width="1" height="1" fill="#f8a78c"/>
    <rect x="13" y="29" width="1" height="1" fill="#f7a68b"/>
    <rect x="14" y="29" width="1" height="1" fill="#f7a68b"/>
    <rect x="15" y="29" width="1" height="1" fill="#f7a68b"/>
    <rect x="16" y="29" width="1" height="1" fill="#f7a68b"/>
    <rect x="17" y="29" width="1" height="1" fill="#f8a68e"/>
    <rect x="18" y="29" width="1" height="1" fill="#f9a78f"/>
    <rect x="19" y="29" width="1" height="1" fill="#f9a58b"/>
    <rect x="20" y="29" width="1" height="1" fill="#f9a58b"/>
    <rect x="21" y="29" width="1" height="1" fill="#fba58a"/>
    <rect x="22" y="29" width="1" height="1" fill="#d0978e"/>
    <rect x="23" y="29" width="1" height="1" fill="#000200"/>
    <rect x="24" y="29" width="1" height="1" fill="#020202"/>
    <rect x="25" y="29" width="1" height="1" fill="#020202"/>
    <rect x="26" y="29" width="1" height="1" fill="#030303"/>
    <rect x="27" y="29" width="1" height="1" fill="#020202"/>
    <rect x="28" y="29" width="1" height="1" fill="#0d0405"/>
    <rect x="29" y="29" width="1" height="1" fill="#f5a282"/>
    <rect x="30" y="29" width="1" height="1" fill="#faa588"/>
    <rect x="31" y="29" width="1" height="1" fill="#050402"/>
    <rect x="32" y="29" width="1" height="1" fill="#010101"/>
    <rect x="42" y="29" width="1" height="1" fill="#363138"/>
    <rect x="43" y="29" width="1" height="1" fill="#2e292f"/>
    <rect x="44" y="29" width="1" height="1" fill="#000100"/>
    <rect x="45" y="29" width="1" height="1" fill="#f4e5d2"/>
    <rect x="46" y="29" width="1" height="1" fill="#3d352a"/>
    <rect x="47" y="29" width="1" height="1" fill="#38382e"/>
    <rect x="48" y="29" width="1" height="1" fill="#171516"/>
    <rect x="49" y="29" width="1" height="1" fill="#2e2c31"/>
    <rect x="50" y="29" width="1" height="1" fill="#29272c"/>
    <rect x="51" y="29" width="1" height="1" fill="#2e2c31"/>
    <rect x="52" y="29" width="1" height="1" fill="#312f34"/>
    <rect x="53" y="29" width="1" height="1" fill="#2d2b30"/>
    <rect x="54" y="29" width="1" height="1" fill="#302f34"/>
    <rect x="55" y="29" width="1" height="1" fill="#302f34"/>
    <rect x="56" y="29" width="1" height="1" fill="#2f2d32"/>
    <rect x="57" y="29" width="1" height="1" fill="#2f2d32"/>
    <rect x="58" y="29" width="1" height="1" fill="#323035"/>
    <rect x="59" y="29" width="1" height="1" fill="#2f2d32"/>
    <rect x="60" y="29" width="1" height="1" fill="#333136"/>
    <rect x="61" y="29" width="1" height="1" fill="#484349"/>
    <rect x="2" y="30" width="1" height="1" fill="#080808"/>
    <rect x="3" y="30" width="1" height="1" fill="#010101"/>
    <rect x="4" y="30" width="1" height="1" fill="#010101"/>
    <rect x="5" y="30" width="1" height="1" fill="#010100"/>
    <rect x="6" y="30" width="1" height="1" fill="#010100"/>
    <rect x="7" y="30" width="1" height="1" fill="#000000"/>
    <rect x="8" y="30" width="1" height="1" fill="#070400"/>
    <rect x="9" y="30" width="1" height="1" fill="#fd9b7e"/>
    <rect x="10" y="30" width="1" height="1" fill="#f7a58f"/>
    <rect x="11" y="30" width="1" height="1" fill="#f8a68e"/>
    <rect x="12" y="30" width="1" height="1" fill="#f7a68b"/>
    <rect x="13" y="30" width="1" height="1" fill="#f7a68b"/>
    <rect x="14" y="30" width="1" height="1" fill="#f9a88d"/>
    <rect x="15" y="30" width="1" height="1" fill="#f8a78c"/>
    <rect x="16" y="30" width="1" height="1" fill="#f8a78c"/>
    <rect x="17" y="30" width="1" height="1" fill="#f8a68e"/>
    <rect x="18" y="30" width="1" height="1" fill="#f8a68e"/>
    <rect x="19" y="30" width="1" height="1" fill="#faa68c"/>
    <rect x="20" y="30" width="1" height="1" fill="#f9a58b"/>
    <rect x="21" y="30" width="1" height="1" fill="#f9a388"/>
    <rect x="22" y="30" width="1" height="1" fill="#d49b92"/>
    <rect x="23" y="30" width="1" height="1" fill="#010300"/>
    <rect x="24" y="30" width="1" height="1" fill="#000000"/>
    <rect x="25" y="30" width="1" height="1" fill="#000000"/>
    <rect x="26" y="30" width="1" height="1" fill="#000000"/>
    <rect x="27" y="30" width="1" height="1" fill="#000000"/>
    <rect x="28" y="30" width="1" height="1" fill="#0d0405"/>
    <rect x="29" y="30" width="1" height="1" fill="#f7a084"/>
    <rect x="30" y="30" width="1" height="1" fill="#f8a384"/>
    <rect x="31" y="30" width="1" height="1" fill="#070604"/>
    <rect x="32" y="30" width="1" height="1" fill="#000000"/>
    <rect x="44" y="30" width="1" height="1" fill="#040605"/>
    <rect x="45" y="30" width="1" height="1" fill="#f4e8ce"/>
    <rect x="46" y="30" width="1" height="1" fill="#080100"/>
    <rect x="47" y="30" width="1" height="1" fill="#010000"/>
    <rect x="48" y="30" width="1" height="1" fill="#4b484f"/>
    <rect x="2" y="31" width="1" height="1" fill="#090909"/>
    <rect x="3" y="31" width="1" height="1" fill="#020202"/>
    <rect x="4" y="31" width="1" height="1" fill="#000000"/>
    <rect x="5" y="31" width="1" height="1" fill="#000000"/>
    <rect x="6" y="31" width="1" height="1" fill="#010100"/>
    <rect x="7" y="31" width="1" height="1" fill="#000000"/>
    <rect x="8" y="31" width="1" height="1" fill="#070000"/>
    <rect x="9" y="31" width="1" height="1" fill="#fc9c83"/>
    <rect x="10" y="31" width="1" height="1" fill="#fda790"/>
    <rect x="11" y="31" width="1" height="1" fill="#f6a98b"/>
    <rect x="12" y="31" width="1" height="1" fill="#faa98e"/>
    <rect x="13" y="31" width="1" height="1" fill="#f8a98b"/>
    <rect x="14" y="31" width="1" height="1" fill="#fbaa8f"/>
    <rect x="15" y="31" width="1" height="1" fill="#faaa8f"/>
    <rect x="16" y="31" width="1" height="1" fill="#f9a78f"/>
    <rect x="17" y="31" width="1" height="1" fill="#f8a78c"/>
    <rect x="18" y="31" width="1" height="1" fill="#f9a88d"/>
    <rect x="19" y="31" width="1" height="1" fill="#f9a589"/>
    <rect x="20" y="31" width="1" height="1" fill="#f8a48a"/>
    <rect x="21" y="31" width="1" height="1" fill="#fba78b"/>
    <rect x="22" y="31" width="1" height="1" fill="#c9978e"/>
    <rect x="23" y="31" width="1" height="1" fill="#000100"/>
    <rect x="24" y="31" width="1" height="1" fill="#000100"/>
    <rect x="25" y="31" width="1" height="1" fill="#000000"/>
    <rect x="26" y="31" width="1" height="1" fill="#000100"/>
    <rect x="27" y="31" width="1" height="1" fill="#000000"/>
    <rect x="28" y="31" width="1" height="1" fill="#0b0505"/>
    <rect x="29" y="31" width="1" height="1" fill="#f6a788"/>
    <rect x="30" y="31" width="1" height="1" fill="#f69d7d"/>
    <rect x="31" y="31" width="1" height="1" fill="#020001"/>
    <rect x="32" y="31" width="1" height="1" fill="#000000"/>
    <rect x="44" y="31" width="1" height="1" fill="#000201"/>
    <rect x="45" y="31" width="1" height="1" fill="#fff9ea"/>
    <rect x="46" y="31" width="1" height="1" fill="#131007"/>
    <rect x="47" y="31" width="1" height="1" fill="#070506"/>
    <rect x="48" y="31" width="1" height="1" fill="#48454c"/>
    <rect x="4" y="32" width="1" height="1" fill="#000004"/>
    <rect x="5" y="32" width="1" height="1" fill="#000000"/>
    <rect x="6" y="32" width="1" height="1" fill="#545454"/>
    <rect x="7" y="32" width="1" height="1" fill="#4c4b49"/>
    <rect x="8" y="32" width="1" height="1" fill="#544b4c"/>
    <rect x="9" y="32" width="1" height="1" fill="#1f1f27"/>
    <rect x="10" y="32" width="1" height="1" fill="#1b1c17"/>
    <rect x="11" y="32" width="1" height="1" fill="#1c1d18"/>
    <rect x="12" y="32" width="1" height="1" fill="#1f201b"/>
    <rect x="13" y="32" width="1" height="1" fill="#21221d"/>
    <rect x="14" y="32" width="1" height="1" fill="#21221d"/>
    <rect x="15" y="32" width="1" height="1" fill="#202022"/>
    <rect x="16" y="32" width="1" height="1" fill="#1c1b20"/>
    <rect x="17" y="32" width="1" height="1" fill="#020300"/>
    <rect x="18" y="32" width="1" height="1" fill="#030000"/>
    <rect x="19" y="32" width="1" height="1" fill="#ecb4a7"/>
    <rect x="20" y="32" width="1" height="1" fill="#f5aa8b"/>
    <rect x="21" y="32" width="1" height="1" fill="#f6a58a"/>
    <rect x="22" y="32" width="1" height="1" fill="#f49f80"/>
    <rect x="23" y="32" width="1" height="1" fill="#f6a786"/>
    <rect x="24" y="32" width="1" height="1" fill="#f5a584"/>
    <rect x="25" y="32" width="1" height="1" fill="#f9a688"/>
    <rect x="26" y="32" width="1" height="1" fill="#f5a584"/>
    <rect x="27" y="32" width="1" height="1" fill="#f5a284"/>
    <rect x="28" y="32" width="1" height="1" fill="#f39e7f"/>
    <rect x="29" y="32" width="1" height="1" fill="#020401"/>
    <rect x="30" y="32" width="1" height="1" fill="#050503"/>
    <rect x="44" y="32" width="1" height="1" fill="#040605"/>
    <rect x="45" y="32" width="1" height="1" fill="#010000"/>
    <rect x="4" y="33" width="1" height="1" fill="#050304"/>
    <rect x="5" y="33" width="1" height="1" fill="#060201"/>
    <rect x="6" y="33" width="1" height="1" fill="#585453"/>
    <rect x="7" y="33" width="1" height="1" fill="#4a4947"/>
    <rect x="8" y="33" width="1" height="1" fill="#494544"/>
    <rect x="9" y="33" width="1" height="1" fill="#211c20"/>
    <rect x="10" y="33" width="1" height="1" fill="#1f1e1a"/>
    <rect x="11" y="33" width="1" height="1" fill="#1f1e1a"/>
    <rect x="12" y="33" width="1" height="1" fill="#1f1e1a"/>
    <rect x="13" y="33" width="1" height="1" fill="#201f1b"/>
    <rect x="14" y="33" width="1" height="1" fill="#21201c"/>
    <rect x="15" y="33" width="1" height="1" fill="#1f1e1c"/>
    <rect x="16" y="33" width="1" height="1" fill="#211f20"/>
    <rect x="17" y="33" width="1" height="1" fill="#020300"/>
    <rect x="18" y="33" width="1" height="1" fill="#060200"/>
    <rect x="19" y="33" width="1" height="1" fill="#e9b4a2"/>
    <rect x="20" y="33" width="1" height="1" fill="#fba08d"/>
    <rect x="21" y="33" width="1" height="1" fill="#faa68c"/>
    <rect x="22" y="33" width="1" height="1" fill="#f8a68e"/>
    <rect x="23" y="33" width="1" height="1" fill="#f6a587"/>
    <rect x="24" y="33" width="1" height="1" fill="#f5a487"/>
    <rect x="25" y="33" width="1" height="1" fill="#f5a487"/>
    <rect x="26" y="33" width="1" height="1" fill="#f6a587"/>
    <rect x="27" y="33" width="1" height="1" fill="#f4a386"/>
    <rect x="28" y="33" width="1" height="1" fill="#edab89"/>
    <rect x="29" y="33" width="1" height="1" fill="#080202"/>
    <rect x="30" y="33" width="1" height="1" fill="#000000"/>
    <rect x="44" y="33" width="1" height="1" fill="#020403"/>
    <rect x="45" y="33" width="1" height="1" fill="#040605"/>
    <rect x="4" y="34" width="1" height="1" fill="#010004"/>
    <rect x="5" y="34" width="1" height="1" fill="#020003"/>
    <rect x="6" y="34" width="1" height="1" fill="#514f50"/>
    <rect x="7" y="34" width="1" height="1" fill="#51504e"/>
    <rect x="8" y="34" width="1" height="1" fill="#50504e"/>
    <rect x="9" y="34" width="1" height="1" fill="#1f1f1d"/>
    <rect x="10" y="34" width="1" height="1" fill="#1d1d1b"/>
    <rect x="11" y="34" width="1" height="1" fill="#1d1d1b"/>
    <rect x="12" y="34" width="1" height="1" fill="#1c1b19"/>
    <rect x="13" y="34" width="1" height="1" fill="#1d1916"/>
    <rect x="14" y="34" width="1" height="1" fill="#271d11"/>
    <rect x="15" y="34" width="1" height="1" fill="#291d11"/>
    <rect x="16" y="34" width="1" height="1" fill="#2f2317"/>
    <rect x="17" y="34" width="1" height="1" fill="#040300"/>
    <rect x="18" y="34" width="1" height="1" fill="#000200"/>
    <rect x="19" y="34" width="1" height="1" fill="#e0ac9f"/>
    <rect x="20" y="34" width="1" height="1" fill="#faa48b"/>
    <rect x="21" y="34" width="1" height="1" fill="#faa68c"/>
    <rect x="22" y="34" width="1" height="1" fill="#faa68c"/>
    <rect x="23" y="34" width="1" height="1" fill="#f9a58b"/>
    <rect x="24" y="34" width="1" height="1" fill="#f9a58b"/>
    <rect x="25" y="34" width="1" height="1" fill="#f9a58b"/>
    <rect x="26" y="34" width="1" height="1" fill="#f9a58d"/>
    <rect x="27" y="34" width="1" height="1" fill="#f9a58d"/>
    <rect x="28" y="34" width="1" height="1" fill="#eea28b"/>
    <rect x="29" y="34" width="1" height="1" fill="#09040a"/>
    <rect x="30" y="34" width="1" height="1" fill="#110f14"/>
    <rect x="6" y="35" width="1" height="1" fill="#010300"/>
    <rect x="7" y="35" width="1" height="1" fill="#030200"/>
    <rect x="8" y="35" width="1" height="1" fill="#010100"/>
    <rect x="9" y="35" width="1" height="1" fill="#000000"/>
    <rect x="10" y="35" width="1" height="1" fill="#000000"/>
    <rect x="11" y="35" width="1" height="1" fill="#000000"/>
    <rect x="12" y="35" width="1" height="1" fill="#030200"/>
    <rect x="13" y="35" width="1" height="1" fill="#130000"/>
    <rect x="14" y="35" width="1" height="1" fill="#f4987f"/>
    <rect x="15" y="35" width="1" height="1" fill="#f5a08c"/>
    <rect x="16" y="35" width="1" height="1" fill="#f09b87"/>
    <rect x="17" y="35" width="1" height="1" fill="#0b0900"/>
    <rect x="18" y="35" width="1" height="1" fill="#000300"/>
    <rect x="19" y="35" width="1" height="1" fill="#f3bbaa"/>
    <rect x="20" y="35" width="1" height="1" fill="#f8a690"/>
    <rect x="21" y="35" width="1" height="1" fill="#f8a88d"/>
    <rect x="22" y="35" width="1" height="1" fill="#f7a78c"/>
    <rect x="23" y="35" width="1" height="1" fill="#f7a78c"/>
    <rect x="24" y="35" width="1" height="1" fill="#f7a78e"/>
    <rect x="25" y="35" width="1" height="1" fill="#f6a68d"/>
    <rect x="26" y="35" width="1" height="1" fill="#f6a68b"/>
    <rect x="27" y="35" width="1" height="1" fill="#f6a68b"/>
    <rect x="28" y="35" width="1" height="1" fill="#f3a893"/>
    <rect x="6" y="36" width="1" height="1" fill="#000000"/>
    <rect x="7" y="36" width="1" height="1" fill="#000100"/>
    <rect x="8" y="36" width="1" height="1" fill="#44543a"/>
    <rect x="9" y="36" width="1" height="1" fill="#45553a"/>
    <rect x="10" y="36" width="1" height="1" fill="#44543a"/>
    <rect x="11" y="36" width="1" height="1" fill="#3f4f34"/>
    <rect x="12" y="36" width="1" height="1" fill="#3d4c35"/>
    <rect x="13" y="36" width="1" height="1" fill="#3c4937"/>
    <rect x="14" y="36" width="1" height="1" fill="#020003"/>
    <rect x="15" y="36" width="1" height="1" fill="#040500"/>
    <rect x="16" y="36" width="1" height="1" fill="#0a0a08"/>
    <rect x="17" y="36" width="1" height="1" fill="#020401"/>
    <rect x="18" y="36" width="1" height="1" fill="#020403"/>
    <rect x="19" y="36" width="1" height="1" fill="#040700"/>
    <rect x="20" y="36" width="1" height="1" fill="#070a00"/>
    <rect x="21" y="36" width="1" height="1" fill="#060803"/>
    <rect x="22" y="36" width="1" height="1" fill="#060805"/>
    <rect x="23" y="36" width="1" height="1" fill="#050702"/>
    <rect x="24" y="36" width="1" height="1" fill="#050702"/>
    <rect x="25" y="36" width="1" height="1" fill="#040603"/>
    <rect x="26" y="36" width="1" height="1" fill="#030500"/>
    <rect x="27" y="36" width="1" height="1" fill="#010300"/>
    <rect x="28" y="36" width="1" height="1" fill="#0c0701"/>
    <rect x="6" y="37" width="1" height="1" fill="#030303"/>
    <rect x="7" y="37" width="1" height="1" fill="#010700"/>
    <rect x="8" y="37" width="1" height="1" fill="#40512f"/>
    <rect x="9" y="37" width="1" height="1" fill="#3d4e2a"/>
    <rect x="10" y="37" width="1" height="1" fill="#3c4d2b"/>
    <rect x="11" y="37" width="1" height="1" fill="#3c4d29"/>
    <rect x="12" y="37" width="1" height="1" fill="#3c4d2d"/>
    <rect x="13" y="37" width="1" height="1" fill="#414f36"/>
    <rect x="14" y="37" width="1" height="1" fill="#060004"/>
    <rect x="15" y="37" width="1" height="1" fill="#000303"/>
    <rect x="16" y="37" width="1" height="1" fill="#000205"/>
    <rect x="17" y="37" width="1" height="1" fill="#000102"/>
    <rect x="18" y="37" width="1" height="1" fill="#000004"/>
    <rect x="19" y="37" width="1" height="1" fill="#000200"/>
    <rect x="20" y="37" width="1" height="1" fill="#000200"/>
    <rect x="21" y="37" width="1" height="1" fill="#000102"/>
    <rect x="22" y="37" width="1" height="1" fill="#000104"/>
    <rect x="23" y="37" width="1" height="1" fill="#000102"/>
    <rect x="24" y="37" width="1" height="1" fill="#000102"/>
    <rect x="25" y="37" width="1" height="1" fill="#000104"/>
    <rect x="26" y="37" width="1" height="1" fill="#000203"/>
    <rect x="27" y="37" width="1" height="1" fill="#000105"/>
    <rect x="28" y="37" width="1" height="1" fill="#030802"/>
    <rect x="6" y="38" width="1" height="1" fill="#010000"/>
    <rect x="7" y="38" width="1" height="1" fill="#000400"/>
    <rect x="8" y="38" width="1" height="1" fill="#3a502a"/>
    <rect x="9" y="38" width="1" height="1" fill="#3b512b"/>
    <rect x="10" y="38" width="1" height="1" fill="#3c522c"/>
    <rect x="11" y="38" width="1" height="1" fill="#3c522c"/>
    <rect x="12" y="38" width="1" height="1" fill="#3b512b"/>
    <rect x="13" y="38" width="1" height="1" fill="#3e4e33"/>
    <rect x="14" y="38" width="1" height="1" fill="#010000"/>
    <rect x="15" y="38" width="1" height="1" fill="#000000"/>
    <rect x="16" y="38" width="1" height="1" fill="#010000"/>
    <rect x="17" y="38" width="1" height="1" fill="#000000"/>
    <rect x="18" y="38" width="1" height="1" fill="#000002"/>
    <rect x="19" y="38" width="1" height="1" fill="#000100"/>
    <rect x="20" y="38" width="1" height="1" fill="#030207"/>
    <rect x="21" y="38" width="1" height="1" fill="#010101"/>
    <rect x="22" y="38" width="1" height="1" fill="#010101"/>
    <rect x="23" y="38" width="1" height="1" fill="#000000"/>
    <rect x="24" y="38" width="1" height="1" fill="#050507"/>
    <rect x="25" y="38" width="1" height="1" fill="#000000"/>
    <rect x="26" y="38" width="1" height="1" fill="#000004"/>
    <rect x="27" y="38" width="1" height="1" fill="#020005"/>
    <rect x="28" y="38" width="1" height="1" fill="#060105"/>
    <rect x="4" y="39" width="1" height="1" fill="#040404"/>
    <rect x="5" y="39" width="1" height="1" fill="#020401"/>
    <rect x="6" y="39" width="1" height="1" fill="#394c2e"/>
    <rect x="7" y="39" width="1" height="1" fill="#3a4d2d"/>
    <rect x="8" y="39" width="1" height="1" fill="#3c522c"/>
    <rect x="9" y="39" width="1" height="1" fill="#3c522c"/>
    <rect x="10" y="39" width="1" height="1" fill="#3b512b"/>
    <rect x="11" y="39" width="1" height="1" fill="#3a502a"/>
    <rect x="12" y="39" width="1" height="1" fill="#3b512b"/>
    <rect x="13" y="39" width="1" height="1" fill="#3b512b"/>
    <rect x="14" y="39" width="1" height="1" fill="#394f2b"/>
    <rect x="15" y="39" width="1" height="1" fill="#3a5431"/>
    <rect x="16" y="39" width="1" height="1" fill="#1f1f1d"/>
    <rect x="17" y="39" width="1" height="1" fill="#1b1c16"/>
    <rect x="18" y="39" width="1" height="1" fill="#4d5548"/>
    <rect x="19" y="39" width="1" height="1" fill="#4e5647"/>
    <rect x="20" y="39" width="1" height="1" fill="#030200"/>
    <rect x="21" y="39" width="1" height="1" fill="#000000"/>
    <rect x="22" y="39" width="1" height="1" fill="#010101"/>
    <rect x="23" y="39" width="1" height="1" fill="#000000"/>
    <rect x="24" y="39" width="1" height="1" fill="#070707"/>
    <rect x="25" y="39" width="1" height="1" fill="#51524d"/>
    <rect x="26" y="39" width="1" height="1" fill="#585d57"/>
    <rect x="27" y="39" width="1" height="1" fill="#3c562f"/>
    <rect x="28" y="39" width="1" height="1" fill="#354a2b"/>
    <rect x="29" y="39" width="1" height="1" fill="#020204"/>
    <rect x="30" y="39" width="1" height="1" fill="#020202"/>
    <rect x="4" y="40" width="1" height="1" fill="#030502"/>
    <rect x="5" y="40" width="1" height="1" fill="#040003"/>
    <rect x="6" y="40" width="1" height="1" fill="#3a5029"/>
    <rect x="7" y="40" width="1" height="1" fill="#3c502b"/>
    <rect x="8" y="40" width="1" height="1" fill="#3b512b"/>
    <rect x="9" y="40" width="1" height="1" fill="#3c522c"/>
    <rect x="10" y="40" width="1" height="1" fill="#3b512b"/>
    <rect x="11" y="40" width="1" height="1" fill="#3b512b"/>
    <rect x="12" y="40" width="1" height="1" fill="#3c522c"/>
    <rect x="13" y="40" width="1" height="1" fill="#3e542e"/>
    <rect x="14" y="40" width="1" height="1" fill="#3c522e"/>
    <rect x="15" y="40" width="1" height="1" fill="#394f2b"/>
    <rect x="16" y="40" width="1" height="1" fill="#1a1a18"/>
    <rect x="17" y="40" width="1" height="1" fill="#181914"/>
    <rect x="18" y="40" width="1" height="1" fill="#4c584a"/>
    <rect x="19" y="40" width="1" height="1" fill="#535b4e"/>
    <rect x="20" y="40" width="1" height="1" fill="#030305"/>
    <rect x="21" y="40" width="1" height="1" fill="#000000"/>
    <rect x="22" y="40" width="1" height="1" fill="#000000"/>
    <rect x="23" y="40" width="1" height="1" fill="#000000"/>
    <rect x="24" y="40" width="1" height="1" fill="#0e0e0c"/>
    <rect x="25" y="40" width="1" height="1" fill="#555651"/>
    <rect x="26" y="40" width="1" height="1" fill="#515652"/>
    <rect x="27" y="40" width="1" height="1" fill="#3a502c"/>
    <rect x="28" y="40" width="1" height="1" fill="#374d27"/>
    <rect x="29" y="40" width="1" height="1" fill="#020202"/>
    <rect x="30" y="40" width="1" height="1" fill="#020202"/>
    <rect x="4" y="41" width="1" height="1" fill="#030305"/>
    <rect x="5" y="41" width="1" height="1" fill="#040300"/>
    <rect x="6" y="41" width="1" height="1" fill="#40572d"/>
    <rect x="7" y="41" width="1" height="1" fill="#3d532d"/>
    <rect x="8" y="41" width="1" height="1" fill="#3c502d"/>
    <rect x="9" y="41" width="1" height="1" fill="#3c502d"/>
    <rect x="10" y="41" width="1" height="1" fill="#3b512b"/>
    <rect x="11" y="41" width="1" height="1" fill="#3c522c"/>
    <rect x="12" y="41" width="1" height="1" fill="#3c522c"/>
    <rect x="13" y="41" width="1" height="1" fill="#3c522c"/>
    <rect x="14" y="41" width="1" height="1" fill="#3b512d"/>
    <rect x="15" y="41" width="1" height="1" fill="#3c522c"/>
    <rect x="16" y="41" width="1" height="1" fill="#201f1a"/>
    <rect x="17" y="41" width="1" height="1" fill="#1d1d1b"/>
    <rect x="18" y="41" width="1" height="1" fill="#535851"/>
    <rect x="19" y="41" width="1" height="1" fill="#52554c"/>
    <rect x="20" y="41" width="1" height="1" fill="#000403"/>
    <rect x="21" y="41" width="1" height="1" fill="#000000"/>
    <rect x="22" y="41" width="1" height="1" fill="#000000"/>
    <rect x="23" y="41" width="1" height="1" fill="#000000"/>
    <rect x="24" y="41" width="1" height="1" fill="#0c0b09"/>
    <rect x="25" y="41" width="1" height="1" fill="#525453"/>
    <rect x="26" y="41" width="1" height="1" fill="#50524f"/>
    <rect x="27" y="41" width="1" height="1" fill="#394e2d"/>
    <rect x="28" y="41" width="1" height="1" fill="#3c522b"/>
    <rect x="29" y="41" width="1" height="1" fill="#030102"/>
    <rect x="30" y="41" width="1" height="1" fill="#000000"/>
    <rect x="2" y="42" width="1" height="1" fill="#040203"/>
    <rect x="3" y="42" width="1" height="1" fill="#020204"/>
    <rect x="4" y="42" width="1" height="1" fill="#425633"/>
    <rect x="5" y="42" width="1" height="1" fill="#3e522d"/>
    <rect x="6" y="42" width="1" height="1" fill="#41582c"/>
    <rect x="7" y="42" width="1" height="1" fill="#3c522c"/>
    <rect x="8" y="42" width="1" height="1" fill="#3d512e"/>
    <rect x="9" y="42" width="1" height="1" fill="#3d512e"/>
    <rect x="10" y="42" width="1" height="1" fill="#3c522c"/>
    <rect x="11" y="42" width="1" height="1" fill="#3c522c"/>
    <rect x="12" y="42" width="1" height="1" fill="#3c522c"/>
    <rect x="13" y="42" width="1" height="1" fill="#3c522c"/>
    <rect x="14" y="42" width="1" height="1" fill="#3b512d"/>
    <rect x="15" y="42" width="1" height="1" fill="#3c5329"/>
    <rect x="16" y="42" width="1" height="1" fill="#40572d"/>
    <rect x="17" y="42" width="1" height="1" fill="#3a532c"/>
    <rect x="18" y="42" width="1" height="1" fill="#3c502d"/>
    <rect x="19" y="42" width="1" height="1" fill="#3e5730"/>
    <rect x="20" y="42" width="1" height="1" fill="#050600"/>
    <rect x="21" y="42" width="1" height="1" fill="#000000"/>
    <rect x="22" y="42" width="1" height="1" fill="#000000"/>
    <rect x="23" y="42" width="1" height="1" fill="#000000"/>
    <rect x="24" y="42" width="1" height="1" fill="#020a00"/>
    <rect x="25" y="42" width="1" height="1" fill="#3b512d"/>
    <rect x="26" y="42" width="1" height="1" fill="#3d5231"/>
    <rect x="27" y="42" width="1" height="1" fill="#3d512e"/>
    <rect x="28" y="42" width="1" height="1" fill="#3b512a"/>
    <rect x="29" y="42" width="1" height="1" fill="#030102"/>
    <rect x="30" y="42" width="1" height="1" fill="#010101"/>
    <rect x="2" y="43" width="1" height="1" fill="#010101"/>
    <rect x="3" y="43" width="1" height="1" fill="#040005"/>
    <rect x="4" y="43" width="1" height="1" fill="#3d562e"/>
    <rect x="5" y="43" width="1" height="1" fill="#3e522d"/>
    <rect x="6" y="43" width="1" height="1" fill="#3b4f2c"/>
    <rect x="7" y="43" width="1" height="1" fill="#3b512d"/>
    <rect x="8" y="43" width="1" height="1" fill="#3c522e"/>
    <rect x="9" y="43" width="1" height="1" fill="#3b512d"/>
    <rect x="10" y="43" width="1" height="1" fill="#3c502d"/>
    <rect x="11" y="43" width="1" height="1" fill="#3d512e"/>
    <rect x="12" y="43" width="1" height="1" fill="#3d512e"/>
    <rect x="13" y="43" width="1" height="1" fill="#3d512e"/>
    <rect x="14" y="43" width="1" height="1" fill="#3d532d"/>
    <rect x="15" y="43" width="1" height="1" fill="#3e542e"/>
    <rect x="16" y="43" width="1" height="1" fill="#3c522c"/>
    <rect x="17" y="43" width="1" height="1" fill="#3b512d"/>
    <rect x="18" y="43" width="1" height="1" fill="#3a502c"/>
    <rect x="19" y="43" width="1" height="1" fill="#364e2c"/>
    <rect x="20" y="43" width="1" height="1" fill="#000300"/>
    <rect x="21" y="43" width="1" height="1" fill="#050006"/>
    <rect x="22" y="43" width="1" height="1" fill="#030106"/>
    <rect x="23" y="43" width="1" height="1" fill="#000004"/>
    <rect x="24" y="43" width="1" height="1" fill="#000600"/>
    <rect x="25" y="43" width="1" height="1" fill="#3c522e"/>
    <rect x="26" y="43" width="1" height="1" fill="#3d532d"/>
    <rect x="27" y="43" width="1" height="1" fill="#3b512b"/>
    <rect x="28" y="43" width="1" height="1" fill="#38512a"/>
    <rect x="29" y="43" width="1" height="1" fill="#010103"/>
    <rect x="30" y="43" width="1" height="1" fill="#010006"/>
    <rect x="2" y="44" width="1" height="1" fill="#000000"/>
    <rect x="3" y="44" width="1" height="1" fill="#040005"/>
    <rect x="4" y="44" width="1" height="1" fill="#3a532b"/>
    <rect x="5" y="44" width="1" height="1" fill="#3e522d"/>
    <rect x="6" y="44" width="1" height="1" fill="#3d512e"/>
    <rect x="7" y="44" width="1" height="1" fill="#3c522e"/>
    <rect x="8" y="44" width="1" height="1" fill="#3b512d"/>
    <rect x="9" y="44" width="1" height="1" fill="#3a502c"/>
    <rect x="10" y="44" width="1" height="1" fill="#3b4f2c"/>
    <rect x="11" y="44" width="1" height="1" fill="#3d512e"/>
    <rect x="12" y="44" width="1" height="1" fill="#3e522f"/>
    <rect x="13" y="44" width="1" height="1" fill="#3e522f"/>
    <rect x="14" y="44" width="1" height="1" fill="#3d532d"/>
    <rect x="15" y="44" width="1" height="1" fill="#3d532d"/>
    <rect x="16" y="44" width="1" height="1" fill="#3c522c"/>
    <rect x="17" y="44" width="1" height="1" fill="#3b512d"/>
    <rect x="18" y="44" width="1" height="1" fill="#3b512d"/>
    <rect x="19" y="44" width="1" height="1" fill="#3d532f"/>
    <rect x="20" y="44" width="1" height="1" fill="#3f5137"/>
    <rect x="21" y="44" width="1" height="1" fill="#3a502c"/>
    <rect x="22" y="44" width="1" height="1" fill="#3a4b2b"/>
    <rect x="23" y="44" width="1" height="1" fill="#394a2a"/>
    <rect x="24" y="44" width="1" height="1" fill="#3f5330"/>
    <rect x="25" y="44" width="1" height="1" fill="#3c5130"/>
    <rect x="26" y="44" width="1" height="1" fill="#3c522c"/>
    <rect x="27" y="44" width="1" height="1" fill="#3a502a"/>
    <rect x="28" y="44" width="1" height="1" fill="#394f29"/>
    <rect x="29" y="44" width="1" height="1" fill="#3d5030"/>
    <rect x="30" y="44" width="1" height="1" fill="#3c4f2f"/>
    <rect x="31" y="44" width="1" height="1" fill="#030106"/>
    <rect x="32" y="44" width="1" height="1" fill="#080609"/>
    <rect x="2" y="45" width="1" height="1" fill="#010101"/>
    <rect x="3" y="45" width="1" height="1" fill="#030004"/>
    <rect x="4" y="45" width="1" height="1" fill="#3b512b"/>
    <rect x="5" y="45" width="1" height="1" fill="#3d512c"/>
    <rect x="6" y="45" width="1" height="1" fill="#3d512c"/>
    <rect x="7" y="45" width="1" height="1" fill="#3c522e"/>
    <rect x="8" y="45" width="1" height="1" fill="#3a502c"/>
    <rect x="9" y="45" width="1" height="1" fill="#394d2a"/>
    <rect x="10" y="45" width="1" height="1" fill="#3b4f2a"/>
    <rect x="11" y="45" width="1" height="1" fill="#3b512b"/>
    <rect x="12" y="45" width="1" height="1" fill="#3d532c"/>
    <rect x="13" y="45" width="1" height="1" fill="#3d532c"/>
    <rect x="14" y="45" width="1" height="1" fill="#3c522e"/>
    <rect x="15" y="45" width="1" height="1" fill="#3e522f"/>
    <rect x="16" y="45" width="1" height="1" fill="#3c502d"/>
    <rect x="17" y="45" width="1" height="1" fill="#3c522e"/>
    <rect x="18" y="45" width="1" height="1" fill="#3c522e"/>
    <rect x="19" y="45" width="1" height="1" fill="#3b512d"/>
    <rect x="20" y="45" width="1" height="1" fill="#3b512d"/>
    <rect x="21" y="45" width="1" height="1" fill="#3a502c"/>
    <rect x="22" y="45" width="1" height="1" fill="#3a502c"/>
    <rect x="23" y="45" width="1" height="1" fill="#3c522e"/>
    <rect x="24" y="45" width="1" height="1" fill="#3b512d"/>
    <rect x="25" y="45" width="1" height="1" fill="#3b512d"/>
    <rect x="26" y="45" width="1" height="1" fill="#3b512d"/>
    <rect x="27" y="45" width="1" height="1" fill="#3c522e"/>
    <rect x="28" y="45" width="1" height="1" fill="#3d512e"/>
    <rect x="29" y="45" width="1" height="1" fill="#394f29"/>
    <rect x="30" y="45" width="1" height="1" fill="#3c5329"/>
    <rect x="31" y="45" width="1" height="1" fill="#070705"/>
    <rect x="32" y="45" width="1" height="1" fill="#010100"/>
    <rect x="2" y="46" width="1" height="1" fill="#000000"/>
    <rect x="3" y="46" width="1" height="1" fill="#030004"/>
    <rect x="4" y="46" width="1" height="1" fill="#3b512b"/>
    <rect x="5" y="46" width="1" height="1" fill="#3d512c"/>
    <rect x="6" y="46" width="1" height="1" fill="#3d512c"/>
    <rect x="7" y="46" width="1" height="1" fill="#394f2b"/>
    <rect x="8" y="46" width="1" height="1" fill="#3a502c"/>
    <rect x="9" y="46" width="1" height="1" fill="#3e5131"/>
    <rect x="10" y="46" width="1" height="1" fill="#010200"/>
    <rect x="11" y="46" width="1" height="1" fill="#000200"/>
    <rect x="12" y="46" width="1" height="1" fill="#3a5029"/>
    <rect x="13" y="46" width="1" height="1" fill="#3c512a"/>
    <rect x="14" y="46" width="1" height="1" fill="#3b512d"/>
    <rect x="15" y="46" width="1" height="1" fill="#3d512e"/>
    <rect x="16" y="46" width="1" height="1" fill="#3d512e"/>
    <rect x="17" y="46" width="1" height="1" fill="#3c522e"/>
    <rect x="18" y="46" width="1" height="1" fill="#3c522e"/>
    <rect x="19" y="46" width="1" height="1" fill="#3b512d"/>
    <rect x="20" y="46" width="1" height="1" fill="#3b512d"/>
    <rect x="21" y="46" width="1" height="1" fill="#3b512d"/>
    <rect x="22" y="46" width="1" height="1" fill="#3b512d"/>
    <rect x="23" y="46" width="1" height="1" fill="#3b512d"/>
    <rect x="24" y="46" width="1" height="1" fill="#3c522e"/>
    <rect x="25" y="46" width="1" height="1" fill="#3b512d"/>
    <rect x="26" y="46" width="1" height="1" fill="#3c522e"/>
    <rect x="27" y="46" width="1" height="1" fill="#3b512d"/>
    <rect x="28" y="46" width="1" height="1" fill="#38532a"/>
    <rect x="29" y="46" width="1" height="1" fill="#36492b"/>
    <rect x="30" y="46" width="1" height="1" fill="#354b27"/>
    <rect x="31" y="46" width="1" height="1" fill="#010100"/>
    <rect x="32" y="46" width="1" height="1" fill="#010100"/>
    <rect x="2" y="47" width="1" height="1" fill="#000000"/>
    <rect x="3" y="47" width="1" height="1" fill="#030004"/>
    <rect x="4" y="47" width="1" height="1" fill="#39522a"/>
    <rect x="5" y="47" width="1" height="1" fill="#3c522c"/>
    <rect x="6" y="47" width="1" height="1" fill="#3b512b"/>
    <rect x="7" y="47" width="1" height="1" fill="#3a502a"/>
    <rect x="8" y="47" width="1" height="1" fill="#3c522c"/>
    <rect x="9" y="47" width="1" height="1" fill="#394d2a"/>
    <rect x="10" y="47" width="1" height="1" fill="#010100"/>
    <rect x="11" y="47" width="1" height="1" fill="#020200"/>
    <rect x="12" y="47" width="1" height="1" fill="#344d25"/>
    <rect x="13" y="47" width="1" height="1" fill="#3a502a"/>
    <rect x="14" y="47" width="1" height="1" fill="#3c522e"/>
    <rect x="15" y="47" width="1" height="1" fill="#3c522e"/>
    <rect x="16" y="47" width="1" height="1" fill="#3d532f"/>
    <rect x="17" y="47" width="1" height="1" fill="#3b512d"/>
    <rect x="18" y="47" width="1" height="1" fill="#3c522e"/>
    <rect x="19" y="47" width="1" height="1" fill="#3c522e"/>
    <rect x="20" y="47" width="1" height="1" fill="#3b512d"/>
    <rect x="21" y="47" width="1" height="1" fill="#3c522e"/>
    <rect x="22" y="47" width="1" height="1" fill="#3b512d"/>
    <rect x="23" y="47" width="1" height="1" fill="#3c522e"/>
    <rect x="24" y="47" width="1" height="1" fill="#3c522e"/>
    <rect x="25" y="47" width="1" height="1" fill="#3c522e"/>
    <rect x="26" y="47" width="1" height="1" fill="#3c522e"/>
    <rect x="27" y="47" width="1" height="1" fill="#3a502c"/>
    <rect x="28" y="47" width="1" height="1" fill="#364e2a"/>
    <rect x="29" y="47" width="1" height="1" fill="#060407"/>
    <rect x="30" y="47" width="1" height="1" fill="#364b2a"/>
    <rect x="31" y="47" width="1" height="1" fill="#010100"/>
    <rect x="32" y="47" width="1" height="1" fill="#020200"/>
    <rect x="2" y="48" width="1" height="1" fill="#000000"/>
    <rect x="3" y="48" width="1" height="1" fill="#030005"/>
    <rect x="4" y="48" width="1" height="1" fill="#3b542c"/>
    <rect x="5" y="48" width="1" height="1" fill="#3a502a"/>
    <rect x="6" y="48" width="1" height="1" fill="#3b512b"/>
    <rect x="7" y="48" width="1" height="1" fill="#394f29"/>
    <rect x="8" y="48" width="1" height="1" fill="#3b512b"/>
    <rect x="9" y="48" width="1" height="1" fill="#3f532e"/>
    <rect x="10" y="48" width="1" height="1" fill="#000000"/>
    <rect x="11" y="48" width="1" height="1" fill="#000000"/>
    <rect x="12" y="48" width="1" height="1" fill="#355027"/>
    <rect x="13" y="48" width="1" height="1" fill="#3b512b"/>
    <rect x="14" y="48" width="1" height="1" fill="#3c522e"/>
    <rect x="15" y="48" width="1" height="1" fill="#3c522e"/>
    <rect x="16" y="48" width="1" height="1" fill="#3b512d"/>
    <rect x="17" y="48" width="1" height="1" fill="#3b512d"/>
    <rect x="18" y="48" width="1" height="1" fill="#3c522e"/>
    <rect x="19" y="48" width="1" height="1" fill="#3d532f"/>
    <rect x="20" y="48" width="1" height="1" fill="#3b512d"/>
    <rect x="21" y="48" width="1" height="1" fill="#3c522e"/>
    <rect x="22" y="48" width="1" height="1" fill="#3c522e"/>
    <rect x="23" y="48" width="1" height="1" fill="#3c522e"/>
    <rect x="24" y="48" width="1" height="1" fill="#3c522e"/>
    <rect x="25" y="48" width="1" height="1" fill="#3a502c"/>
    <rect x="26" y="48" width="1" height="1" fill="#3b512d"/>
    <rect x="27" y="48" width="1" height="1" fill="#384e2a"/>
    <rect x="28" y="48" width="1" height="1" fill="#344d26"/>
    <rect x="29" y="48" width="1" height="1" fill="#020403"/>
    <rect x="30" y="48" width="1" height="1" fill="#364f28"/>
    <rect x="31" y="48" width="1" height="1" fill="#010100"/>
    <rect x="32" y="48" width="1" height="1" fill="#000000"/>
    <rect x="2" y="49" width="1" height="1" fill="#000000"/>
    <rect x="3" y="49" width="1" height="1" fill="#040006"/>
    <rect x="4" y="49" width="1" height="1" fill="#39522a"/>
    <rect x="5" y="49" width="1" height="1" fill="#3b512b"/>
    <rect x="6" y="49" width="1" height="1" fill="#3c522c"/>
    <rect x="7" y="49" width="1" height="1" fill="#3b512b"/>
    <rect x="8" y="49" width="1" height="1" fill="#3b512b"/>
    <rect x="9" y="49" width="1" height="1" fill="#374b26"/>
    <rect x="10" y="49" width="1" height="1" fill="#000000"/>
    <rect x="11" y="49" width="1" height="1" fill="#010100"/>
    <rect x="12" y="49" width="1" height="1" fill="#355027"/>
    <rect x="13" y="49" width="1" height="1" fill="#3a502a"/>
    <rect x="14" y="49" width="1" height="1" fill="#3a502c"/>
    <rect x="15" y="49" width="1" height="1" fill="#3c522e"/>
    <rect x="16" y="49" width="1" height="1" fill="#3c522e"/>
    <rect x="17" y="49" width="1" height="1" fill="#3c522e"/>
    <rect x="18" y="49" width="1" height="1" fill="#3c522e"/>
    <rect x="19" y="49" width="1" height="1" fill="#3d532f"/>
    <rect x="20" y="49" width="1" height="1" fill="#3c522e"/>
    <rect x="21" y="49" width="1" height="1" fill="#3c522e"/>
    <rect x="22" y="49" width="1" height="1" fill="#3c522e"/>
    <rect x="23" y="49" width="1" height="1" fill="#3c522e"/>
    <rect x="24" y="49" width="1" height="1" fill="#3c522e"/>
    <rect x="25" y="49" width="1" height="1" fill="#3b512d"/>
    <rect x="26" y="49" width="1" height="1" fill="#3a502c"/>
    <rect x="27" y="49" width="1" height="1" fill="#3a502c"/>
    <rect x="28" y="49" width="1" height="1" fill="#38512a"/>
    <rect x="29" y="49" width="1" height="1" fill="#020401"/>
    <rect x="30" y="49" width="1" height="1" fill="#38532a"/>
    <rect x="31" y="49" width="1" height="1" fill="#010100"/>
    <rect x="32" y="49" width="1" height="1" fill="#010100"/>
    <rect x="2" y="50" width="1" height="1" fill="#010101"/>
    <rect x="3" y="50" width="1" height="1" fill="#010000"/>
    <rect x="4" y="50" width="1" height="1" fill="#b38a6a"/>
    <rect x="5" y="50" width="1" height="1" fill="#c5a483"/>
    <rect x="6" y="50" width="1" height="1" fill="#c7a987"/>
    <rect x="7" y="50" width="1" height="1" fill="#c19e7e"/>
    <rect x="8" y="50" width="1" height="1" fill="#c39b81"/>
    <rect x="9" y="50" width="1" height="1" fill="#bf9f78"/>
    <rect x="10" y="50" width="1" height="1" fill="#020100"/>
    <rect x="11" y="50" width="1" height="1" fill="#010000"/>
    <rect x="12" y="50" width="1" height="1" fill="#364f27"/>
    <rect x="13" y="50" width="1" height="1" fill="#37512a"/>
    <rect x="14" y="50" width="1" height="1" fill="#3c522e"/>
    <rect x="15" y="50" width="1" height="1" fill="#3c522c"/>
    <rect x="16" y="50" width="1" height="1" fill="#3c522c"/>
    <rect x="17" y="50" width="1" height="1" fill="#3d532d"/>
    <rect x="18" y="50" width="1" height="1" fill="#3d532d"/>
    <rect x="19" y="50" width="1" height="1" fill="#3d532f"/>
    <rect x="20" y="50" width="1" height="1" fill="#3d532f"/>
    <rect x="21" y="50" width="1" height="1" fill="#3c522e"/>
    <rect x="22" y="50" width="1" height="1" fill="#3d512e"/>
    <rect x="23" y="50" width="1" height="1" fill="#3d512e"/>
    <rect x="24" y="50" width="1" height="1" fill="#3d512e"/>
    <rect x="25" y="50" width="1" height="1" fill="#3c502d"/>
    <rect x="26" y="50" width="1" height="1" fill="#3b512d"/>
    <rect x="27" y="50" width="1" height="1" fill="#3a502c"/>
    <rect x="28" y="50" width="1" height="1" fill="#375029"/>
    <rect x="29" y="50" width="1" height="1" fill="#060000"/>
    <rect x="30" y="50" width="1" height="1" fill="#d2a98d"/>
    <rect x="31" y="50" width="1" height="1" fill="#060604"/>
    <rect x="32" y="50" width="1" height="1" fill="#020200"/>
    <rect x="2" y="51" width="1" height="1" fill="#020202"/>
    <rect x="3" y="51" width="1" height="1" fill="#070101"/>
    <rect x="4" y="51" width="1" height="1" fill="#ff9b7f"/>
    <rect x="5" y="51" width="1" height="1" fill="#faa388"/>
    <rect x="6" y="51" width="1" height="1" fill="#f9a388"/>
    <rect x="7" y="51" width="1" height="1" fill="#faa489"/>
    <rect x="8" y="51" width="1" height="1" fill="#f9a28e"/>
    <rect x="9" y="51" width="1" height="1" fill="#f6a182"/>
    <rect x="10" y="51" width="1" height="1" fill="#040301"/>
    <rect x="11" y="51" width="1" height="1" fill="#030102"/>
    <rect x="12" y="51" width="1" height="1" fill="#344d25"/>
    <rect x="13" y="51" width="1" height="1" fill="#365029"/>
    <rect x="14" y="51" width="1" height="1" fill="#3c522e"/>
    <rect x="15" y="51" width="1" height="1" fill="#3d532d"/>
    <rect x="16" y="51" width="1" height="1" fill="#3d532d"/>
    <rect x="17" y="51" width="1" height="1" fill="#3d532d"/>
    <rect x="18" y="51" width="1" height="1" fill="#3d532d"/>
    <rect x="19" y="51" width="1" height="1" fill="#3c522e"/>
    <rect x="20" y="51" width="1" height="1" fill="#3c522e"/>
    <rect x="21" y="51" width="1" height="1" fill="#3c522e"/>
    <rect x="22" y="51" width="1" height="1" fill="#3d512e"/>
    <rect x="23" y="51" width="1" height="1" fill="#3d512e"/>
    <rect x="24" y="51" width="1" height="1" fill="#3d512e"/>
    <rect x="25" y="51" width="1" height="1" fill="#3d512e"/>
    <rect x="26" y="51" width="1" height="1" fill="#3a502c"/>
    <rect x="27" y="51" width="1" height="1" fill="#3a502c"/>
    <rect x="28" y="51" width="1" height="1" fill="#375029"/>
    <rect x="29" y="51" width="1" height="1" fill="#050304"/>
    <rect x="30" y="51" width="1" height="1" fill="#eb907b"/>
    <rect x="31" y="51" width="1" height="1" fill="#030301"/>
    <rect x="32" y="51" width="1" height="1" fill="#020200"/>
    <rect x="2" y="52" width="1" height="1" fill="#000000"/>
    <rect x="3" y="52" width="1" height="1" fill="#020401"/>
    <rect x="4" y="52" width="1" height="1" fill="#f8a78a"/>
    <rect x="5" y="52" width="1" height="1" fill="#f4a388"/>
    <rect x="6" y="52" width="1" height="1" fill="#f7a689"/>
    <rect x="7" y="52" width="1" height="1" fill="#f6a683"/>
    <rect x="8" y="52" width="1" height="1" fill="#f5a38d"/>
    <rect x="9" y="52" width="1" height="1" fill="#f6a789"/>
    <rect x="10" y="52" width="1" height="1" fill="#050402"/>
    <rect x="11" y="52" width="1" height="1" fill="#010100"/>
    <rect x="12" y="52" width="1" height="1" fill="#39522a"/>
    <rect x="13" y="52" width="1" height="1" fill="#38522b"/>
    <rect x="14" y="52" width="1" height="1" fill="#3c522e"/>
    <rect x="15" y="52" width="1" height="1" fill="#3d512e"/>
    <rect x="16" y="52" width="1" height="1" fill="#3e522f"/>
    <rect x="17" y="52" width="1" height="1" fill="#3d532f"/>
    <rect x="18" y="52" width="1" height="1" fill="#3d532f"/>
    <rect x="19" y="52" width="1" height="1" fill="#3d532d"/>
    <rect x="20" y="52" width="1" height="1" fill="#3e542e"/>
    <rect x="21" y="52" width="1" height="1" fill="#3b512b"/>
    <rect x="22" y="52" width="1" height="1" fill="#3b512d"/>
    <rect x="23" y="52" width="1" height="1" fill="#3b512d"/>
    <rect x="24" y="52" width="1" height="1" fill="#3c522e"/>
    <rect x="25" y="52" width="1" height="1" fill="#3c522e"/>
    <rect x="26" y="52" width="1" height="1" fill="#3a502c"/>
    <rect x="27" y="52" width="1" height="1" fill="#394f2b"/>
    <rect x="28" y="52" width="1" height="1" fill="#334b27"/>
    <rect x="29" y="52" width="1" height="1" fill="#020403"/>
    <rect x="30" y="52" width="1" height="1" fill="#f09c84"/>
    <rect x="31" y="52" width="1" height="1" fill="#060503"/>
    <rect x="32" y="52" width="1" height="1" fill="#020200"/>
    <rect x="2" y="53" width="1" height="1" fill="#010101"/>
    <rect x="3" y="53" width="1" height="1" fill="#040500"/>
    <rect x="4" y="53" width="1" height="1" fill="#f5a58c"/>
    <rect x="5" y="53" width="1" height="1" fill="#faa38f"/>
    <rect x="6" y="53" width="1" height="1" fill="#faa48d"/>
    <rect x="7" y="53" width="1" height="1" fill="#f9a589"/>
    <rect x="8" y="53" width="1" height="1" fill="#f7a492"/>
    <rect x="9" y="53" width="1" height="1" fill="#f3987d"/>
    <rect x="10" y="53" width="1" height="1" fill="#010000"/>
    <rect x="11" y="53" width="1" height="1" fill="#020200"/>
    <rect x="12" y="53" width="1" height="1" fill="#385129"/>
    <rect x="13" y="53" width="1" height="1" fill="#3b552e"/>
    <rect x="14" y="53" width="1" height="1" fill="#3d532f"/>
    <rect x="15" y="53" width="1" height="1" fill="#3d512e"/>
    <rect x="16" y="53" width="1" height="1" fill="#3c502d"/>
    <rect x="17" y="53" width="1" height="1" fill="#3d532f"/>
    <rect x="18" y="53" width="1" height="1" fill="#3d532f"/>
    <rect x="19" y="53" width="1" height="1" fill="#3d532d"/>
    <rect x="20" y="53" width="1" height="1" fill="#3c522c"/>
    <rect x="21" y="53" width="1" height="1" fill="#3b512b"/>
    <rect x="22" y="53" width="1" height="1" fill="#3b512d"/>
    <rect x="23" y="53" width="1" height="1" fill="#3b512d"/>
    <rect x="24" y="53" width="1" height="1" fill="#3c522e"/>
    <rect x="25" y="53" width="1" height="1" fill="#3b512d"/>
    <rect x="26" y="53" width="1" height="1" fill="#394f2b"/>
    <rect x="27" y="53" width="1" height="1" fill="#384e2a"/>
    <rect x="28" y="53" width="1" height="1" fill="#385129"/>
    <rect x="29" y="53" width="1" height="1" fill="#070707"/>
    <rect x="30" y="53" width="1" height="1" fill="#f2a088"/>
    <rect x="31" y="53" width="1" height="1" fill="#050402"/>
    <rect x="32" y="53" width="1" height="1" fill="#000000"/>
    <rect x="2" y="54" width="1" height="1" fill="#837e82"/>
    <rect x="3" y="54" width="1" height="1" fill="#848285"/>
    <rect x="4" y="54" width="1" height="1" fill="#050503"/>
    <rect x="5" y="54" width="1" height="1" fill="#030301"/>
    <rect x="6" y="54" width="1" height="1" fill="#030301"/>
    <rect x="7" y="54" width="1" height="1" fill="#020202"/>
    <rect x="8" y="54" width="1" height="1" fill="#050402"/>
    <rect x="9" y="54" width="1" height="1" fill="#030301"/>
    <rect x="10" y="54" width="1" height="1" fill="#000000"/>
    <rect x="11" y="54" width="1" height="1" fill="#010000"/>
    <rect x="12" y="54" width="1" height="1" fill="#3c552d"/>
    <rect x="13" y="54" width="1" height="1" fill="#3e532c"/>
    <rect x="14" y="54" width="1" height="1" fill="#3c502d"/>
    <rect x="15" y="54" width="1" height="1" fill="#3d512c"/>
    <rect x="16" y="54" width="1" height="1" fill="#3d512c"/>
    <rect x="17" y="54" width="1" height="1" fill="#3d532d"/>
    <rect x="18" y="54" width="1" height="1" fill="#3d532d"/>
    <rect x="19" y="54" width="1" height="1" fill="#3d532d"/>
    <rect x="20" y="54" width="1" height="1" fill="#3b512b"/>
    <rect x="21" y="54" width="1" height="1" fill="#3c522e"/>
    <rect x="22" y="54" width="1" height="1" fill="#3b512b"/>
    <rect x="23" y="54" width="1" height="1" fill="#3b512b"/>
    <rect x="24" y="54" width="1" height="1" fill="#3a502c"/>
    <rect x="25" y="54" width="1" height="1" fill="#3b512d"/>
    <rect x="26" y="54" width="1" height="1" fill="#3a502c"/>
    <rect x="27" y="54" width="1" height="1" fill="#394f2b"/>
    <rect x="28" y="54" width="1" height="1" fill="#3a532c"/>
    <rect x="29" y="54" width="1" height="1" fill="#060606"/>
    <rect x="30" y="54" width="1" height="1" fill="#6e4940"/>
    <rect x="31" y="54" width="1" height="1" fill="#4b494e"/>
    <rect x="32" y="54" width="1" height="1" fill="#4d4b50"/>
    <rect x="4" y="55" width="1" height="1" fill="#040404"/>
    <rect x="5" y="55" width="1" height="1" fill="#000000"/>
    <rect x="6" y="55" width="1" height="1" fill="#010100"/>
    <rect x="7" y="55" width="1" height="1" fill="#000000"/>
    <rect x="8" y="55" width="1" height="1" fill="#020100"/>
    <rect x="9" y="55" width="1" height="1" fill="#040601"/>
    <rect x="10" y="55" width="1" height="1" fill="#3a572b"/>
    <rect x="11" y="55" width="1" height="1" fill="#385328"/>
    <rect x="12" y="55" width="1" height="1" fill="#395026"/>
    <rect x="13" y="55" width="1" height="1" fill="#3b5029"/>
    <rect x="14" y="55" width="1" height="1" fill="#3c502d"/>
    <rect x="15" y="55" width="1" height="1" fill="#3d512c"/>
    <rect x="16" y="55" width="1" height="1" fill="#3e522d"/>
    <rect x="17" y="55" width="1" height="1" fill="#3d532d"/>
    <rect x="18" y="55" width="1" height="1" fill="#3c522c"/>
    <rect x="19" y="55" width="1" height="1" fill="#3b512b"/>
    <rect x="20" y="55" width="1" height="1" fill="#3b512b"/>
    <rect x="21" y="55" width="1" height="1" fill="#3b512d"/>
    <rect x="22" y="55" width="1" height="1" fill="#3c522c"/>
    <rect x="23" y="55" width="1" height="1" fill="#3a502a"/>
    <rect x="24" y="55" width="1" height="1" fill="#394f2b"/>
    <rect x="25" y="55" width="1" height="1" fill="#394f2b"/>
    <rect x="26" y="55" width="1" height="1" fill="#3c522e"/>
    <rect x="27" y="55" width="1" height="1" fill="#3a502c"/>
    <rect x="28" y="55" width="1" height="1" fill="#364e2a"/>
    <rect x="29" y="55" width="1" height="1" fill="#030106"/>
    <rect x="30" y="55" width="1" height="1" fill="#050000"/>
    <rect x="4" y="56" width="1" height="1" fill="#070705"/>
    <rect x="5" y="56" width="1" height="1" fill="#000000"/>
    <rect x="6" y="56" width="1" height="1" fill="#000200"/>
    <rect x="7" y="56" width="1" height="1" fill="#000000"/>
    <rect x="8" y="56" width="1" height="1" fill="#020001"/>
    <rect x="9" y="56" width="1" height="1" fill="#040601"/>
    <rect x="10" y="56" width="1" height="1" fill="#3c552d"/>
    <rect x="11" y="56" width="1" height="1" fill="#3c5128"/>
    <rect x="12" y="56" width="1" height="1" fill="#3a532c"/>
    <rect x="13" y="56" width="1" height="1" fill="#39522b"/>
    <rect x="14" y="56" width="1" height="1" fill="#3c522c"/>
    <rect x="15" y="56" width="1" height="1" fill="#3e532c"/>
    <rect x="16" y="56" width="1" height="1" fill="#3e532c"/>
    <rect x="17" y="56" width="1" height="1" fill="#3d532d"/>
    <rect x="18" y="56" width="1" height="1" fill="#3b512b"/>
    <rect x="19" y="56" width="1" height="1" fill="#3b5029"/>
    <rect x="20" y="56" width="1" height="1" fill="#3c502d"/>
    <rect x="21" y="56" width="1" height="1" fill="#3e5131"/>
    <rect x="22" y="56" width="1" height="1" fill="#121b0a"/>
    <rect x="23" y="56" width="1" height="1" fill="#080e02"/>
    <rect x="24" y="56" width="1" height="1" fill="#18211e"/>
    <rect x="25" y="56" width="1" height="1" fill="#2a3433"/>
    <rect x="26" y="56" width="1" height="1" fill="#263031"/>
    <rect x="27" y="56" width="1" height="1" fill="#060d05"/>
    <rect x="28" y="56" width="1" height="1" fill="#060c02"/>
    <rect x="29" y="56" width="1" height="1" fill="#030303"/>
    <rect x="30" y="56" width="1" height="1" fill="#000100"/>
    <rect x="4" y="57" width="1" height="1" fill="#111015"/>
    <rect x="5" y="57" width="1" height="1" fill="#131116"/>
    <rect x="6" y="57" width="1" height="1" fill="#020200"/>
    <rect x="7" y="57" width="1" height="1" fill="#000000"/>
    <rect x="8" y="57" width="1" height="1" fill="#040509"/>
    <rect x="9" y="57" width="1" height="1" fill="#010506"/>
    <rect x="10" y="57" width="1" height="1" fill="#3d5032"/>
    <rect x="11" y="57" width="1" height="1" fill="#3e5133"/>
    <rect x="12" y="57" width="1" height="1" fill="#405333"/>
    <rect x="13" y="57" width="1" height="1" fill="#3f5232"/>
    <rect x="14" y="57" width="1" height="1" fill="#425535"/>
    <rect x="15" y="57" width="1" height="1" fill="#435336"/>
    <rect x="16" y="57" width="1" height="1" fill="#425237"/>
    <rect x="17" y="57" width="1" height="1" fill="#435434"/>
    <rect x="18" y="57" width="1" height="1" fill="#425333"/>
    <rect x="19" y="57" width="1" height="1" fill="#3e5133"/>
    <rect x="20" y="57" width="1" height="1" fill="#3d5032"/>
    <rect x="21" y="57" width="1" height="1" fill="#3b4d33"/>
    <rect x="22" y="57" width="1" height="1" fill="#0a0f08"/>
    <rect x="23" y="57" width="1" height="1" fill="#010100"/>
    <rect x="24" y="57" width="1" height="1" fill="#13161d"/>
    <rect x="25" y="57" width="1" height="1" fill="#282f39"/>
    <rect x="26" y="57" width="1" height="1" fill="#292d39"/>
    <rect x="27" y="57" width="1" height="1" fill="#020204"/>
    <rect x="28" y="57" width="1" height="1" fill="#000000"/>
    <rect x="29" y="57" width="1" height="1" fill="#06030a"/>
    <rect x="30" y="57" width="1" height="1" fill="#0f0d12"/>
    <rect x="6" y="58" width="1" height="1" fill="#060405"/>
    <rect x="7" y="58" width="1" height="1" fill="#030301"/>
    <rect x="8" y="58" width="1" height="1" fill="#29323b"/>
    <rect x="9" y="58" width="1" height="1" fill="#2d303f"/>
    <rect x="10" y="58" width="1" height="1" fill="#303342"/>
    <rect x="11" y="58" width="1" height="1" fill="#2e3643"/>
    <rect x="12" y="58" width="1" height="1" fill="#2d3341"/>
    <rect x="13" y="58" width="1" height="1" fill="#2e3442"/>
    <rect x="14" y="58" width="1" height="1" fill="#2b3340"/>
    <rect x="15" y="58" width="1" height="1" fill="#2e3440"/>
    <rect x="16" y="58" width="1" height="1" fill="#2e3440"/>
    <rect x="17" y="58" width="1" height="1" fill="#303342"/>
    <rect x="18" y="58" width="1" height="1" fill="#2f3241"/>
    <rect x="19" y="58" width="1" height="1" fill="#2f313e"/>
    <rect x="20" y="58" width="1" height="1" fill="#00030c"/>
    <rect x="21" y="58" width="1" height="1" fill="#000002"/>
    <rect x="22" y="58" width="1" height="1" fill="#010101"/>
    <rect x="23" y="58" width="1" height="1" fill="#000000"/>
    <rect x="24" y="58" width="1" height="1" fill="#13131b"/>
    <rect x="25" y="58" width="1" height="1" fill="#2b2f3a"/>
    <rect x="26" y="58" width="1" height="1" fill="#272936"/>
    <rect x="27" y="58" width="1" height="1" fill="#030104"/>
    <rect x="28" y="58" width="1" height="1" fill="#060606"/>
    <rect x="6" y="59" width="1" height="1" fill="#060604"/>
    <rect x="7" y="59" width="1" height="1" fill="#010101"/>
    <rect x="8" y="59" width="1" height="1" fill="#282e3c"/>
    <rect x="9" y="59" width="1" height="1" fill="#2b313d"/>
    <rect x="10" y="59" width="1" height="1" fill="#2c323e"/>
    <rect x="11" y="59" width="1" height="1" fill="#2d333f"/>
    <rect x="12" y="59" width="1" height="1" fill="#2d333f"/>
    <rect x="13" y="59" width="1" height="1" fill="#2d333f"/>
    <rect x="14" y="59" width="1" height="1" fill="#2d333f"/>
    <rect x="15" y="59" width="1" height="1" fill="#2d333f"/>
    <rect x="16" y="59" width="1" height="1" fill="#2c323e"/>
    <rect x="17" y="59" width="1" height="1" fill="#2c323e"/>
    <rect x="18" y="59" width="1" height="1" fill="#2c323e"/>
    <rect x="19" y="59" width="1" height="1" fill="#2a303c"/>
    <rect x="20" y="59" width="1" height="1" fill="#000002"/>
    <rect x="21" y="59" width="1" height="1" fill="#000000"/>
    <rect x="22" y="59" width="1" height="1" fill="#000000"/>
    <rect x="23" y="59" width="1" height="1" fill="#000000"/>
    <rect x="24" y="59" width="1" height="1" fill="#111119"/>
    <rect x="25" y="59" width="1" height="1" fill="#2a2e39"/>
    <rect x="26" y="59" width="1" height="1" fill="#282c38"/>
    <rect x="27" y="59" width="1" height="1" fill="#020204"/>
    <rect x="28" y="59" width="1" height="1" fill="#060606"/>
    <rect x="6" y="60" width="1" height="1" fill="#070705"/>
    <rect x="7" y="60" width="1" height="1" fill="#000000"/>
    <rect x="8" y="60" width="1" height="1" fill="#2a303e"/>
    <rect x="9" y="60" width="1" height="1" fill="#2c323e"/>
    <rect x="10" y="60" width="1" height="1" fill="#2b313d"/>
    <rect x="11" y="60" width="1" height="1" fill="#2c323e"/>
    <rect x="12" y="60" width="1" height="1" fill="#2d333f"/>
    <rect x="13" y="60" width="1" height="1" fill="#2c323e"/>
    <rect x="14" y="60" width="1" height="1" fill="#2c323e"/>
    <rect x="15" y="60" width="1" height="1" fill="#2c323e"/>
    <rect x="16" y="60" width="1" height="1" fill="#2c323e"/>
    <rect x="17" y="60" width="1" height="1" fill="#2b313d"/>
    <rect x="18" y="60" width="1" height="1" fill="#2a303c"/>
    <rect x="19" y="60" width="1" height="1" fill="#2a303c"/>
    <rect x="20" y="60" width="1" height="1" fill="#000002"/>
    <rect x="21" y="60" width="1" height="1" fill="#000000"/>
    <rect x="22" y="60" width="1" height="1" fill="#010101"/>
    <rect x="23" y="60" width="1" height="1" fill="#000000"/>
    <rect x="24" y="60" width="1" height="1" fill="#14141c"/>
    <rect x="25" y="60" width="1" height="1" fill="#2a2e39"/>
    <rect x="26" y="60" width="1" height="1" fill="#292d39"/>
    <rect x="27" y="60" width="1" height="1" fill="#020204"/>
    <rect x="28" y="60" width="1" height="1" fill="#050505"/>
    <rect x="6" y="61" width="1" height="1" fill="#07080a"/>
    <rect x="7" y="61" width="1" height="1" fill="#040404"/>
    <rect x="8" y="61" width="1" height="1" fill="#282e3c"/>
    <rect x="9" y="61" width="1" height="1" fill="#2a313b"/>
    <rect x="10" y="61" width="1" height="1" fill="#2c323e"/>
    <rect x="11" y="61" width="1" height="1" fill="#2d333f"/>
    <rect x="12" y="61" width="1" height="1" fill="#2c323e"/>
    <rect x="13" y="61" width="1" height="1" fill="#2b313d"/>
    <rect x="14" y="61" width="1" height="1" fill="#2b313d"/>
    <rect x="15" y="61" width="1" height="1" fill="#2a303c"/>
    <rect x="16" y="61" width="1" height="1" fill="#2b313d"/>
    <rect x="17" y="61" width="1" height="1" fill="#2b323c"/>
    <rect x="18" y="61" width="1" height="1" fill="#2c333d"/>
    <rect x="19" y="61" width="1" height="1" fill="#2a303c"/>
    <rect x="20" y="61" width="1" height="1" fill="#000002"/>
    <rect x="21" y="61" width="1" height="1" fill="#000000"/>
    <rect x="22" y="61" width="1" height="1" fill="#000000"/>
    <rect x="23" y="61" width="1" height="1" fill="#010101"/>
    <rect x="24" y="61" width="1" height="1" fill="#14141c"/>
    <rect x="25" y="61" width="1" height="1" fill="#2a2e39"/>
    <rect x="26" y="61" width="1" height="1" fill="#292d39"/>
    <rect x="27" y="61" width="1" height="1" fill="#000002"/>
    <rect x="28" y="61" width="1" height="1" fill="#050505"/>
    <rect x="4" y="62" width="1" height="1" fill="#040507"/>
    <rect x="5" y="62" width="1" height="1" fill="#010000"/>
    <rect x="6" y="62" width="1" height="1" fill="#242730"/>
    <rect x="7" y="62" width="1" height="1" fill="#272b36"/>
    <rect x="8" y="62" width="1" height="1" fill="#292f3d"/>
    <rect x="9" y="62" width="1" height="1" fill="#2a313b"/>
    <rect x="10" y="62" width="1" height="1" fill="#2a303c"/>
    <rect x="11" y="62" width="1" height="1" fill="#2a303c"/>
    <rect x="12" y="62" width="1" height="1" fill="#2a303c"/>
    <rect x="13" y="62" width="1" height="1" fill="#2b313d"/>
    <rect x="14" y="62" width="1" height="1" fill="#2b313d"/>
    <rect x="15" y="62" width="1" height="1" fill="#2b313d"/>
    <rect x="16" y="62" width="1" height="1" fill="#2b313d"/>
    <rect x="17" y="62" width="1" height="1" fill="#2b323c"/>
    <rect x="18" y="62" width="1" height="1" fill="#2a313b"/>
    <rect x="19" y="62" width="1" height="1" fill="#292f3b"/>
    <rect x="20" y="62" width="1" height="1" fill="#000002"/>
    <rect x="21" y="62" width="1" height="1" fill="#000000"/>
    <rect x="22" y="62" width="1" height="1" fill="#000000"/>
    <rect x="23" y="62" width="1" height="1" fill="#000000"/>
    <rect x="24" y="62" width="1" height="1" fill="#13131b"/>
    <rect x="25" y="62" width="1" height="1" fill="#2a2e39"/>
    <rect x="26" y="62" width="1" height="1" fill="#282c38"/>
    <rect x="27" y="62" width="1" height="1" fill="#020204"/>
    <rect x="28" y="62" width="1" height="1" fill="#050505"/>
    <rect x="4" y="63" width="1" height="1" fill="#040404"/>
    <rect x="5" y="63" width="1" height="1" fill="#020001"/>
    <rect x="6" y="63" width="1" height="1" fill="#272b37"/>
    <rect x="7" y="63" width="1" height="1" fill="#262c3a"/>
    <rect x="8" y="63" width="1" height="1" fill="#282f39"/>
    <rect x="9" y="63" width="1" height="1" fill="#282f39"/>
    <rect x="10" y="63" width="1" height="1" fill="#2b2f3a"/>
    <rect x="11" y="63" width="1" height="1" fill="#2b2f3a"/>
    <rect x="12" y="63" width="1" height="1" fill="#292f3d"/>
    <rect x="13" y="63" width="1" height="1" fill="#2b313d"/>
    <rect x="14" y="63" width="1" height="1" fill="#2e3140"/>
    <rect x="15" y="63" width="1" height="1" fill="#2d313d"/>
    <rect x="16" y="63" width="1" height="1" fill="#2b2e3d"/>
    <rect x="17" y="63" width="1" height="1" fill="#2c2f38"/>
    <rect x="18" y="63" width="1" height="1" fill="#2b2e37"/>
    <rect x="19" y="63" width="1" height="1" fill="#292d39"/>
    <rect x="20" y="63" width="1" height="1" fill="#010101"/>
    <rect x="21" y="63" width="1" height="1" fill="#000000"/>
    <rect x="22" y="63" width="1" height="1" fill="#010101"/>
    <rect x="23" y="63" width="1" height="1" fill="#010101"/>
    <rect x="24" y="63" width="1" height="1" fill="#141519"/>
    <rect x="25" y="63" width="1" height="1" fill="#2a2c39"/>
    <rect x="26" y="63" width="1" height="1" fill="#252c34"/>
    <rect x="27" y="63" width="1" height="1" fill="#010000"/>
    <rect x="28" y="63" width="1" height="1" fill="#060606"/>
  </svg>
);

// ─── Interactive Flow Diagram ─────────────────────────────────────────────────

function InteractiveFlowDiagram({ steps }: { steps: FlowStep[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1); // integer steps: 1, 2, 3
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  };
  const onMouseUp = () => setDragging(false);

  return (
    <div style={{ position:"relative", flex:1, background:"#F9F9F8", borderRadius:14, border:"1px solid #E8E6E0", overflow:"hidden" }}>
      {/* Controls */}
      <div style={{ position:"absolute", top:12, right:12, zIndex:10, display:"flex", flexDirection:"column", gap:6 }}>
        <button onClick={() => setZoom(z => Math.min(3, z + 1))} style={{ width:30, height:30, borderRadius:8, border:"1px solid #E8E6E0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#8A8680" }}><ZoomIn size={13} /></button>
        <button onClick={() => setZoom(z => Math.max(1, z - 1))} style={{ width:30, height:30, borderRadius:8, border:"1px solid #E8E6E0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#8A8680" }}><ZoomOut size={13} /></button>
        <button onClick={() => { setZoom(1); setOffset({ x:0, y:0 }); }} style={{ width:30, height:30, borderRadius:8, border:"1px solid #E8E6E0", background:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#8A8680" }}><Move size={13} /></button>
      </div>

      {/* Hint */}
      <div style={{ position:"absolute", bottom:10, left:12, fontSize:9, color:"#C4C2BC", fontFamily:"'DM Sans',sans-serif", letterSpacing:"0.5px" }}>
        Drag to pan · +/- to zoom
      </div>

      {/* Canvas — pan only, no fractional scale */}
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{ width:"100%", height:"100%", cursor: dragging ? "grabbing" : "grab", userSelect:"none", overflow:"hidden" }}
      >
        <div style={{ transform:`translate(${offset.x}px, ${offset.y}px)`, paddingTop:24, display:"flex", flexDirection:"column", alignItems:"center", gap:0, width:"100%" }}>
          {steps.map((step, i) => (
            <div key={step.id} style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
              <div
                className="preview-flow-node"
                style={{
                  width: zoom === 1 ? 220 : zoom === 2 ? 280 : 340,
                  padding:"12px 16px", borderRadius:12,
                  border:`1.5px solid ${step.border}`,
                  background: step.bg,
                  transition:"all .15s",
                  display:"flex", alignItems:"center", gap:10,
                }}
              >
                <div style={{ width:30, height:30, borderRadius:8, background:"rgba(255,255,255,.8)", border:`1px solid ${step.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:step.color, flexShrink:0 }}>
                  {step.icon}
                </div>
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

// ─── Preview Screen ──────────────────────────────────────────────────────────

interface PreviewConfig {
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;
  accentBg: string;
  stats: { label: string; value: string }[];
  howItWorks: { icon: React.ReactNode; label: string; desc: string }[];
  agent: React.ReactNode;
  steps: FlowStep[];
  onStart: () => void;
  onBack: () => void;
  backLabel: string;
}

function PreviewScreen({
  title, subtitle, description, accentColor, accentBg,
  stats, howItWorks, agent, steps, onStart, onBack, backLabel,
}: PreviewConfig) {
  return (
    <div style={{ display:"flex", height:"100%", background:"#F9F9F8", fontFamily:"'DM Sans',sans-serif", overflow:"hidden" }}>

      {/* LEFT PANEL */}
      <div style={{ width:360, flexShrink:0, background:"#FFFFFF", borderRight:"1px solid #E8E6E0", display:"flex", flexDirection:"column", overflowY:"auto" }}>
        {/* Back */}
        <div style={{ padding:"24px 28px 0" }}>
          <button className="lf-back" onClick={onBack} style={{
            display:"flex", alignItems:"center", gap:6, padding:"7px 14px",
            borderRadius:9, border:"1px solid #E8E6E0", background:"#FFFFFF",
            fontSize:12, color:"#8A8680", cursor:"pointer", fontFamily:"'DM Sans',sans-serif",
            marginBottom:24, transition:"background .15s",
          }}>
            <ArrowLeft size={13} strokeWidth={1.5} /> {backLabel}
          </button>
        </div>

        {/* Agent + stats */}
        <div style={{ padding:"0 28px 24px", display:"flex", flexDirection:"column", alignItems:"center", borderBottom:"1px solid #F2F1EE" }}>
          <div style={{ width:120, height:120, borderRadius:20, background:accentBg, border:`1px solid ${accentColor}22`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
            {agent}
          </div>
          <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:20, fontWeight:400, color:"#1A1916", marginBottom:4, textAlign:"center" }}>{title}</div>
          <div style={{ fontSize:11, color:"#8A8680", fontWeight:300, fontStyle:"italic", marginBottom:20, textAlign:"center" }}>{subtitle}</div>

          {/* Stats row */}
          <div style={{ display:"flex", gap:8, width:"100%" }}>
            {stats.map(s => (
              <div key={s.label} style={{ flex:1, padding:"10px 12px", borderRadius:10, background:"#F9F9F8", border:"1px solid #E8E6E0", textAlign:"center" }}>
                <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:16, color:accentColor, marginBottom:2 }}>{s.value}</div>
                <div style={{ fontSize:9, color:"#8A8680", fontWeight:300, textTransform:"uppercase", letterSpacing:"0.8px" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div style={{ padding:"24px 28px", borderBottom:"1px solid #F2F1EE" }}>
          <div style={{ fontSize:9, color:"#8A8680", textTransform:"uppercase", letterSpacing:"1px", fontWeight:400, marginBottom:10 }}>About this flow</div>
          <p style={{ fontSize:12, color:"#4A4845", lineHeight:1.8, fontWeight:300, margin:0 }}>{description}</p>
        </div>

        {/* How it works */}
        <div style={{ padding:"24px 28px", flex:1 }}>
          <div style={{ fontSize:9, color:"#8A8680", textTransform:"uppercase", letterSpacing:"1px", fontWeight:400, marginBottom:14 }}>How it works</div>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {howItWorks.map((step, i) => (
              <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ width:28, height:28, borderRadius:8, background:accentBg, border:`1px solid ${accentColor}33`, display:"flex", alignItems:"center", justifyContent:"center", color:accentColor, flexShrink:0 }}>
                  {step.icon}
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:500, color:"#1A1916", marginBottom:2 }}>{step.label}</div>
                  <div style={{ fontSize:11, color:"#8A8680", fontWeight:300, lineHeight:1.6 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding:"20px 28px 28px" }}>
          <button
            className="start-btn"
            onClick={onStart}
            style={{
              width:"100%", padding:"13px", borderRadius:11, border:"none",
              background:"#1A1916", color:"#fff", fontSize:13, cursor:"pointer",
              fontFamily:"'DM Sans',sans-serif", fontWeight:500,
              transition:"all .2s", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            }}
          >
            Start Configuration <ChevronRight size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* RIGHT PANEL — Interactive flow diagram */}
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

// ─── Panels (unchanged) ───────────────────────────────────────────────────────

function InfoBanner({ text }: { text: string }) {
  return (
    <div style={{ padding:"10px 12px", borderRadius:9, background:"#F7F6F3", border:"1px solid #E8E6E0", fontSize:11, color:"#8A8680", lineHeight:1.6, fontWeight:300, marginBottom:18, fontStyle:"italic" }}>
      {text}
    </div>
  );
}

function SaveBtn({ label, icon, onClick, saving, saved }: {
  label: string; icon?: React.ReactNode;
  onClick: () => void; saving: boolean; saved: boolean;
}) {
  return (
    <button className="lf-btn" onClick={onClick} disabled={saving}
      style={{ width:"100%", padding:"11px", borderRadius:9, border:"none", background: saved ? "#1D9E75" : "#1A1916", color:"#fff", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .2s", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
      {saving ? <Loader2 size={13} strokeWidth={2} style={{ animation:"spin 1s linear infinite" }} /> : saved ? <Check size={13} strokeWidth={2.5} /> : icon}
      {saving ? "Saving..." : saved ? "Saved!" : label}
    </button>
  );
}

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

interface PanelProps {
  config: AutomationConfig;
  onChange: (key: keyof AutomationConfig, value: string | string[]) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}

function TriggerPanel({ config, onChange, onSave, saving, saved }: PanelProps) {
  return (
    <>
      <InfoBanner text="Connect your WhatsApp Business account so LeadFlow can receive messages from your leads." />
      <div style={{ marginBottom:14 }}>
        <label style={labelStyle}>Client ID</label>
        <input value={config.wa_client_id} onChange={e => onChange("wa_client_id", e.target.value)} placeholder="e.g. 1234567890" style={inputStyle} />
      </div>
      <div style={{ marginBottom:14 }}>
        <label style={labelStyle}>Client Secret</label>
        <input type="password" value={config.wa_client_secret} onChange={e => onChange("wa_client_secret", e.target.value)} placeholder="e.g. EAAxxxxxxxx..." style={inputStyle} />
      </div>
      <SaveBtn label="Connect" icon={<Wifi size={13} strokeWidth={1.5} />} onClick={onSave} saving={saving} saved={saved} />
    </>
  );
}

function TypingPanel({ config, onChange, onSave, saving, saved }: PanelProps) {
  return (
    <>
      <InfoBanner text="Makes your AI agent show a typing indicator before replying — so leads feel like they're talking to a real person." />
      <div style={{ marginBottom:14 }}>
        <label style={labelStyle}>WhatsApp Access Token</label>
        <input type="password" value={config.wa_access_token} onChange={e => onChange("wa_access_token", e.target.value)} placeholder="EAAxxxxxxxx..." style={inputStyle} />
      </div>
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
      <div style={{ marginBottom:14 }}>
        <label style={labelStyle}>Agent Name</label>
        <input value={config.agent_name} onChange={e => onChange("agent_name", e.target.value)} placeholder="e.g. Sarah, Alex, Max..." style={inputStyle} />
      </div>
      <div style={{ marginBottom:20 }}>
        <label style={labelStyle}>Writing Style</label>
        <p style={{ fontSize:10, color:"#8A8680", fontWeight:300, marginBottom:10, fontStyle:"italic" }}>Pick the style that best matches how you talk to your leads:</p>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {styles.map((s) => (
            <div key={s.key} className="style-opt" onClick={() => onChange("writing_style", s.key)}
              style={{ padding:"11px 13px", borderRadius:10, cursor:"pointer", transition:"all .15s", border:`1.5px solid ${config.writing_style === s.key ? "#4A46B5" : "#E8E6E0"}`, background: config.writing_style === s.key ? "#EEEDF8" : "#FAFAF9" }}>
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
      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>Script Preview</label>
        <textarea value={config.script1_text} onChange={e => onChange("script1_text", e.target.value)} style={{ ...textareaStyle, height:220 }} />
      </div>
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
      <div style={{ marginBottom:14 }}>
        <label style={labelStyle}>Lead Magnet Link</label>
        <input value={config.lead_magnet_link} onChange={e => onChange("lead_magnet_link", e.target.value)} placeholder="https://..." style={inputStyle} />
      </div>
      <p style={{ fontSize:10, color:"#8A8680", fontWeight:300, marginBottom:20, lineHeight:1.6 }}>
        Can be a PDF, video, Google Doc, Notion page, or any link. Make sure it's publicly accessible.
      </p>
      <SaveBtn label="Save Changes" icon={<Link size={13} strokeWidth={1.5} />} onClick={onSave} saving={saving} saved={saved} />
    </>
  );
}

function Script2Panel({ config, onChange, onSave, saving, saved }: PanelProps) {
  return (
    <>
      <InfoBanner text="This script was auto-filled from your onboarding info. Review it and adjust anything that doesn't feel right." />
      <div style={{ marginBottom:16 }}>
        <label style={labelStyle}>Script Preview</label>
        <textarea value={config.script2_text} onChange={e => onChange("script2_text", e.target.value)} style={{ ...textareaStyle, height:220 }} />
      </div>
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
      <div style={{ marginBottom:14 }}>
        <label style={labelStyle}>Event Name</label>
        <input value={config.booking_event_name} onChange={e => onChange("booking_event_name", e.target.value)} placeholder="e.g. Free Strategy Call, Discovery Call..." style={inputStyle} />
      </div>
      <div style={{ marginBottom:14 }}>
        <label style={labelStyle}>Host Name</label>
        <input value={config.booking_host} onChange={e => onChange("booking_host", e.target.value)} placeholder="e.g. John from CleanCo" style={inputStyle} />
      </div>
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
            <div key={day} onClick={() => toggleDay(day)}
              style={{ padding:"6px 12px", borderRadius:8, border:`1.5px solid ${(config.booking_days||[]).includes(day) ? "#4A46B5" : "#E8E6E0"}`, background: (config.booking_days||[]).includes(day) ? "#EEEDF8" : "#FAFAF9", fontSize:11, color: (config.booking_days||[]).includes(day) ? "#4A46B5" : "#8A8680", cursor:"pointer", fontWeight: (config.booking_days||[]).includes(day) ? 500 : 300, transition:"all .15s" }}>
              {day}
            </div>
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
      <div style={{ marginBottom:14 }}>
        <label style={labelStyle}>WhatsApp Access Token</label>
        <input type="password" value={config.wa_access_token} onChange={e => onChange("wa_access_token", e.target.value)} placeholder="EAAxxxxxxxx..." style={inputStyle} />
      </div>
      <div style={{ marginBottom:14 }}>
        <label style={labelStyle}>Business Account ID</label>
        <input value={config.wa_business_account_id} onChange={e => onChange("wa_business_account_id", e.target.value)} placeholder="e.g. 1408732614201335" style={inputStyle} />
      </div>
      <SaveBtn label="Connect" icon={<Wifi size={13} strokeWidth={1.5} />} onClick={onSave} saving={saving} saved={saved} />
    </>
  );
}

function RightPanel({ step, config, onChange, onSave, saving, saved }: {
  step: FlowStep; config: AutomationConfig;
  onChange: (key: keyof AutomationConfig, value: string | string[]) => void;
  onSave: () => void; saving: boolean; saved: boolean;
}) {
  return (
    <div style={{ width:440, flexShrink:0, background:"#FFFFFF", borderLeft:"1px solid #E8E6E0", padding:"28px 26px", overflowY:"auto", fontFamily:"'DM Sans',sans-serif" }}>
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
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>Message / Content</label>
            <textarea defaultValue={step.content} style={{ ...textareaStyle, height:100 }} />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={labelStyle}>Send Delay</label>
            <select style={selectStyle}>
              <option>Immediately</option><option>After 5 minutes</option><option>After 1 hour</option><option>After 24 hours</option>
            </select>
          </div>
          <SaveBtn label="Save Changes" onClick={onSave} saving={saving} saved={saved} />
        </>
      )}
    </div>
  );
}

// ─── Flow Editor (unchanged) ──────────────────────────────────────────────────

function FlowEditor({ title, subtitle, steps, onBack, backLabel = "Back", config, onChange, onSave, onPublish, saving, saved, publishing, publishDone }: {
  title: string; subtitle: string; steps: FlowStep[]; onBack: () => void; backLabel?: string;
  config: AutomationConfig;
  onChange: (key: keyof AutomationConfig, value: string | string[]) => void;
  onSave: () => void; onPublish: () => void;
  saving: boolean; saved: boolean; publishing: boolean; publishDone: boolean;
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
            <button className="lf-ghost" style={{ padding:"8px 16px", borderRadius:9, border:"1px solid #E8E6E0", background:"#FFFFFF", fontSize:12, color:"#8A8680", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"background .15s" }}>
              Test Flow
            </button>
            <button className="lf-btn" onClick={onPublish} disabled={publishing}
              style={{ padding:"8px 18px", borderRadius:9, border:"none", background: publishDone ? "#1D9E75" : "#1A1916", fontSize:12, color:"#fff", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .2s", display:"flex", alignItems:"center", gap:6 }}>
              {publishing ? <Loader2 size={13} strokeWidth={2} style={{ animation:"spin 1s linear infinite" }} /> : publishDone ? <Check size={13} strokeWidth={2.5} /> : null}
              {publishing ? "Publishing..." : publishDone ? "Published!" : "Publish"}
            </button>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", maxWidth:520, margin:"0 auto" }}>
          {steps.map((step, i) => (
            <div key={step.id} style={{ display:"flex", flexDirection:"column", alignItems:"center", width:"100%" }}>
              <div className="lf-step" onClick={() => setSelected(step.id)}
                style={{ width:"100%", padding:"16px 18px", borderRadius:14, border:`1.5px solid ${selected === step.id ? step.color : step.border}`, background: selected === step.id ? step.bg : "#FFFFFF", cursor:"pointer", transition:"all .18s", boxShadow: selected === step.id ? `0 6px 20px ${step.color}18` : "0 1px 4px rgba(0,0,0,.05)", position:"relative", overflow:"hidden" }}>
                {step.live && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:step.color, borderRadius:"14px 14px 0 0" }} />}
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
      <RightPanel step={selectedStep} config={config} onChange={onChange} onSave={onSave} saving={saving} saved={saved} />
    </div>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────

function ChoiceCard({ icon, color, iconBg, title, description, bullets, agent, onClick }: {
  icon: React.ReactNode; color: string; iconBg: string;
  title: string; description: string; bullets: string[];
  agent?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <div className="lf-card" onClick={onClick} style={{ background:"#FFFFFF", border:"1px solid #E8E6E0", borderRadius:18, padding:"32px 28px", cursor:"pointer", transition:"box-shadow .2s,transform .2s", flex:1, display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
        <div style={{ width:56, height:56, borderRadius:14, background:iconBg, display:"flex", alignItems:"center", justifyContent:"center", color }}>{icon}</div>
        {agent && (
          <div style={{ opacity:0.9 }}>{agent}</div>
        )}
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
          bullets={["Trigger","Typing Animation","AI Agent","Script 1","Lead Magnet","Script 2","Booking","Reply Node"]}
          agent={<BookingAgent size={52} />}
          onClick={() => onSelect("lead-flow-preview")}
        />
        <ChoiceCard
          icon={<Bot size={24} strokeWidth={1.5} />}
          color="#1D9E75" iconBg="#E1F5EE"
          title="Follow-Up Flow"
          description="Configure agents that re-engage cold leads and confirm bookings to maximise show-up rates."
          bullets={["Follow-Up Automation","Follow-Up Agent"]}
          agent={<FollowUpAgent size={52} />}
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
          bullets={["Scheduled Trigger","Time-based delays","Re-engage message"]}
          agent={<FollowUpAgent size={52} />}
          onClick={() => onSelect("followup-automation-preview")}
        />
        <ChoiceCard
          icon={<Bot size={24} strokeWidth={1.5} />}
          color="#378ADD" iconBg="#E6F1FB"
          title="Follow-Up Agent"
          description="AI agent takes over when a lead replies — responding intelligently to guide them toward booking."
          bullets={["Trigger Agent Reply","AI-powered responses","WhatsApp integration"]}
          agent={<FollowUpAgent size={52} />}
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
      const { data } = await supabase
        .from("account_leadflow_automations")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (data) {
        setConfig(prev => ({
          ...prev,
          ...Object.fromEntries(
            Object.keys(EMPTY_CONFIG).map(k => [k, (data as any)[k] ?? (EMPTY_CONFIG as any)[k]])
          ),
        }));
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
    setSaving(true);
    setSaved(false);
    await supabase
      .from("account_leadflow_automations")
      .upsert({ user_id: userId, ...config }, { onConflict: "user_id" });
    if (config.wa_client_id) {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: client } = await supabase
        .from("clients")
        .upsert({
          wa_phone_number_id: config.wa_client_id,
          wa_access_token: config.wa_access_token || "",
          email: user?.email || "",
          full_name: user?.user_metadata?.full_name || "",
          plan: "free",
        }, { onConflict: "wa_phone_number_id" })
        .select("id")
        .single();
      if (client) {
        await supabase
          .from("account_leadflow_automations")
          .update({ client_id: client.id })
          .eq("user_id", userId);
      }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const onPublish = async () => {
    if (!userId) return;
    setPublishing(true);
    await supabase
      .from("account_leadflow_automations")
      .upsert({ user_id: userId, ...config }, { onConflict: "user_id" });
    const { data: onboarding } = await supabase
      .from("accounts_leadflow")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    try {
      await fetch(N8N_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, onboarding: onboarding || {}, automation: config, published_at: new Date().toISOString() }),
      });
      setPublishDone(true);
      setTimeout(() => setPublishDone(false), 3000);
    } catch (e) {
      console.error("Webhook error:", e);
    }
    setPublishing(false);
  };

  const editorProps = { config, onChange, onSave, onPublish, saving, saved, publishing, publishDone };

  // Shared preview how-it-works icons
  const leadHowItWorks = [
    { icon:<Wifi size={13} strokeWidth={1.5}/>,          label:"Connect WhatsApp",    desc:"Link your WhatsApp Business account as the trigger for all incoming leads." },
    { icon:<Bot size={13} strokeWidth={1.5}/>,            label:"AI Agent greets",     desc:"Your agent sends a human-like welcome, qualifies the lead with Script 1." },
    { icon:<Gift size={13} strokeWidth={1.5}/>,           label:"Lead Magnet sent",    desc:"The lead magnet link is delivered automatically after qualification." },
    { icon:<Calendar size={13} strokeWidth={1.5}/>,       label:"Booking confirmed",   desc:"Script 2 follows up and guides the lead to book a call automatically." },
  ];

  const followupAutoHowItWorks = [
    { icon:<Clock size={13} strokeWidth={1.5}/>,          label:"Scheduled trigger",   desc:"Set a delay and the flow fires automatically at the right time." },
    { icon:<MessageSquare size={13} strokeWidth={1.5}/>,  label:"Re-engage message",   desc:"A personalised follow-up message is sent to bring the lead back." },
  ];

  const followupAgentHowItWorks = [
    { icon:<Bot size={13} strokeWidth={1.5}/>,            label:"Lead replies",        desc:"When a lead replies, the AI agent takes over the conversation instantly." },
    { icon:<MessageCircle size={13} strokeWidth={1.5}/>,  label:"AI responds",         desc:"The agent replies intelligently based on the lead's message to push toward booking." },
  ];

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ height:"100%", display:"flex", flexDirection:"column" }}>

        {view === "home" && <HomeScreen onSelect={setView} />}

        {view === "lead-flow-preview" && (
          <PreviewScreen
            title="Lead Flow"
            subtitle="Your main lead automation sequence"
            description="Set up the full sequence that greets every lead, qualifies them, delivers your lead magnet, and books the call — completely on autopilot. Your agent handles everything so you don't have to."
            accentColor="#4A46B5"
            accentBg="#EEEDF8"
            stats={[
              { label:"Steps", value:"8" },
              { label:"Automated", value:"100%" },
              { label:"Channel", value:"WA" },
            ]}
            howItWorks={leadHowItWorks}
            agent={<BookingAgent size={80} />}
            steps={LEAD_FLOW_STEPS}
            onStart={() => setView("lead-flow")}
            onBack={() => setView("home")}
            backLabel="Back to Lead Flow"
          />
        )}

        {view === "lead-flow" && (
          <FlowEditor
            title="Lead Flow"
            subtitle="Your main lead automation sequence"
            steps={LEAD_FLOW_STEPS}
            onBack={() => setView("lead-flow-preview")}
            backLabel="Back to Preview"
            {...editorProps}
          />
        )}

        {view === "followup-home" && <FollowUpHome onSelect={setView} onBack={() => setView("home")} />}

        {view === "followup-automation-preview" && (
          <PreviewScreen
            title="Follow-Up Automation"
            subtitle="Scheduled time-based follow-up messages"
            description="Send perfectly timed follow-up messages to leads who haven't responded. Set your delay once and let the automation re-engage them automatically — no manual work needed."
            accentColor="#BA7517"
            accentBg="#FDF3E1"
            stats={[
              { label:"Steps", value:"2" },
              { label:"Type", value:"Auto" },
              { label:"Channel", value:"WA" },
            ]}
            howItWorks={followupAutoHowItWorks}
            agent={<FollowUpAgent size={80} />}
            steps={FOLLOWUP_AUTO_STEPS}
            onStart={() => setView("followup-automation")}
            onBack={() => setView("followup-home")}
            backLabel="Back to Follow-Up Flow"
          />
        )}

        {view === "followup-automation" && (
          <FlowEditor
            title="Follow-Up Automation"
            subtitle="Scheduled time-based follow-up messages"
            steps={FOLLOWUP_AUTO_STEPS}
            onBack={() => setView("followup-automation-preview")}
            backLabel="Back to Preview"
            {...editorProps}
          />
        )}

        {view === "followup-agent-preview" && (
          <PreviewScreen
            title="Follow-Up Agent"
            subtitle="AI agent replies to re-engage your leads"
            description="When a lead replies, your AI agent takes over instantly — responding intelligently based on the conversation to guide them toward booking a call with you."
            accentColor="#378ADD"
            accentBg="#E6F1FB"
            stats={[
              { label:"Steps", value:"2" },
              { label:"Type", value:"AI" },
              { label:"Channel", value:"WA" },
            ]}
            howItWorks={followupAgentHowItWorks}
            agent={<FollowUpAgent size={80} />}
            steps={FOLLOWUP_AGENT_STEPS}
            onStart={() => setView("followup-agent")}
            onBack={() => setView("followup-home")}
            backLabel="Back to Follow-Up Flow"
          />
        )}

        {view === "followup-agent" && (
          <FlowEditor
            title="Follow-Up Agent"
            subtitle="AI agent replies to re-engage your leads"
            steps={FOLLOWUP_AGENT_STEPS}
            onBack={() => setView("followup-agent-preview")}
            backLabel="Back to Preview"
            {...editorProps}
          />
        )}

      </div>
    </>
  );
}
