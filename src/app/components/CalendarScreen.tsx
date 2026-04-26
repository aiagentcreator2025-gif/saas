import { useState } from "react";
import { Plus, User, FileText, Calendar, MessageSquare, Building2, Target, Megaphone, Mic, ChevronRight } from "lucide-react";

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  .cal-btn:hover    { opacity: .8; }
  .cal-ghost:hover  { background: #F2F1EE !important; }
  .cal-row:hover    { background: #F7F6F3 !important; }
  .cal-period:hover { background: #E8E6E0 !important; }
  .form-card:hover  { box-shadow: 0 4px 16px rgba(0,0,0,.06) !important; }
  .set-card:hover   { box-shadow: 0 4px 16px rgba(0,0,0,.06) !important; }
`;

const DAYS  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);
const BOOKINGS = [
  { day:1, hour:9,  name:"Ahmed K.", color:"#4A46B5", bg:"#EEEDF8" },
  { day:3, hour:11, name:"Sara M.",  color:"#1D9E75", bg:"#E1F5EE" },
  { day:5, hour:14, name:"John D.",  color:"#BA7517", bg:"#FDF3E1" },
];

// ─── Calendar ─────────────────────────────────────────────────────────────────

export function CalendarScreen() {
  const [view, setView] = useState<"Day"|"Week"|"Month">("Week");

  const stats = [
    { label:"This Week",   value:"3",  color:"#4A46B5" },
    { label:"Confirmed",   value:"2",  color:"#1D9E75" },
    { label:"No-shows",    value:"0",  color:"#D85A30" },
    { label:"Total Booked",value:"34", color:"#1A1916" },
  ];

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ padding:"32px 40px", background:"#F9F9F8", minHeight:"100vh", fontFamily:"'DM Sans',sans-serif" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24 }}>
          <div>
            <h1 style={{ fontFamily:"'Libre Baskerville',serif", fontSize:24, fontWeight:400, color:"#1A1916", letterSpacing:"-0.4px", marginBottom:4 }}>Calendar</h1>
            <p style={{ fontSize:12, color:"#8A8680", fontWeight:300, fontStyle:"italic" }}>Manage your booked calls</p>
          </div>
          <button className="cal-btn" style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 18px", borderRadius:9, border:"none", background:"#1A1916", color:"#fff", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"opacity .15s" }}>
            <Plus size={13} strokeWidth={1.5} /> Add Booking
          </button>
        </div>

        {/* Stat cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background:"#FFFFFF", borderRadius:14, border:"1px solid #E8E6E0", padding:"16px 20px" }}>
              <div style={{ fontSize:9, color:"#8A8680", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8, fontWeight:400 }}>{s.label}</div>
              <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:28, fontWeight:400, color:s.color, letterSpacing:"-1px", lineHeight:1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button className="cal-ghost" style={{ width:30, height:30, borderRadius:8, border:"1px solid #E8E6E0", background:"#FFFFFF", cursor:"pointer", fontSize:14, color:"#8A8680", display:"flex", alignItems:"center", justifyContent:"center", transition:"background .15s" }}>‹</button>
            <span style={{ fontFamily:"'Libre Baskerville',serif", fontSize:15, fontWeight:400, color:"#1A1916" }}>April 2026</span>
            <button className="cal-ghost" style={{ width:30, height:30, borderRadius:8, border:"1px solid #E8E6E0", background:"#FFFFFF", cursor:"pointer", fontSize:14, color:"#8A8680", display:"flex", alignItems:"center", justifyContent:"center", transition:"background .15s" }}>›</button>
            <button className="cal-ghost" style={{ padding:"5px 13px", borderRadius:8, border:"1px solid #E8E6E0", background:"#FFFFFF", fontSize:11, color:"#8A8680", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"background .15s" }}>Today</button>
          </div>
          <div style={{ display:"flex", gap:4 }}>
            {(["Day","Week","Month"] as const).map(v => (
              <button key={v} className={view!==v?"cal-period":""} onClick={() => setView(v)} style={{ padding:"5px 12px", borderRadius:8, border:"none", fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s", background:view===v ? "#1A1916" : "#F2F1EE", color:view===v ? "#fff" : "#8A8680" }}>{v}</button>
            ))}
          </div>
        </div>

        {/* Calendar grid */}
        <div style={{ background:"#FFFFFF", borderRadius:14, border:"1px solid #E8E6E0", overflow:"hidden" }}>
          {/* Day headers */}
          <div style={{ display:"grid", gridTemplateColumns:"60px repeat(7,1fr)", borderBottom:"1px solid #E8E6E0" }}>
            <div />
            {DAYS.map((d, i) => (
              <div key={d} style={{ padding:"12px 6px", textAlign:"center", borderLeft:"1px solid #F2F1EE" }}>
                <div style={{ fontSize:9, color:"#8A8680", textTransform:"uppercase", letterSpacing:"1px", marginBottom:4, fontWeight:400 }}>{d}</div>
                <div style={{
                  fontFamily:"'Libre Baskerville',serif", fontSize:17, fontWeight:400,
                  color: i===4 ? "#4A46B5" : "#1A1916",
                  width:30, height:30, borderRadius:"50%",
                  background: i===4 ? "#EEEDF8" : "transparent",
                  display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto",
                }}>{21+i}</div>
              </div>
            ))}
          </div>

          {/* Time slots */}
          <div style={{ maxHeight:420, overflowY:"auto" }}>
            {HOURS.map(h => (
              <div key={h} style={{ display:"grid", gridTemplateColumns:"60px repeat(7,1fr)", minHeight:54 }}>
                <div style={{ padding:"4px 10px 0", textAlign:"right", fontSize:9, color:"#C4C2BC", fontWeight:300, borderTop:"1px solid #F2F1EE", fontFamily:"'DM Sans',sans-serif" }}>
                  {h < 12 ? `${h}:00 AM` : h===12 ? "12:00 PM" : `${h-12}:00 PM`}
                </div>
                {DAYS.map((_, di) => {
                  const booking = BOOKINGS.find(b => b.day===di && b.hour===h);
                  return (
                    <div key={di} style={{ borderTop:"1px solid #F2F1EE", borderLeft:"1px solid #F2F1EE", position:"relative", padding:3 }}>
                      {booking && (
                        <div style={{ background:booking.bg, borderLeft:`2.5px solid ${booking.color}`, borderRadius:6, padding:"4px 8px", fontSize:10, color:booking.color, fontWeight:500, cursor:"pointer" }}>
                          {booking.name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Booking Form ─────────────────────────────────────────────────────────────

export function BookingFormScreen() {
  const sections = [
    { Icon: User,         iconColor:"#4A46B5", iconBg:"#EEEDF8", title:"Your Identity",           fields:["Your name","Your title","Photo URL"] },
    { Icon: FileText,     iconColor:"#378ADD", iconBg:"#E6F1FB", title:"Page Content",             fields:["Headline","Description"] },
    { Icon: Calendar,     iconColor:"#1D9E75", iconBg:"#E1F5EE", title:"Availability",             fields:[] },
    { Icon: MessageSquare,iconColor:"#BA7517", iconBg:"#FDF3E1", title:"Qualification Questions",  fields:[] },
  ];

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ maxWidth:680, margin:"0 auto", padding:"32px 40px", fontFamily:"'DM Sans',sans-serif", background:"#F9F9F8", minHeight:"100vh" }}>

        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28 }}>
          <div>
            <h1 style={{ fontFamily:"'Libre Baskerville',serif", fontSize:24, fontWeight:400, color:"#1A1916", letterSpacing:"-0.4px", marginBottom:4 }}>Booking Form</h1>
            <p style={{ fontSize:12, color:"#8A8680", fontWeight:300, fontStyle:"italic" }}>Customize your public booking page and share it with leads.</p>
          </div>
          <button className="cal-btn" style={{ padding:"8px 18px", borderRadius:9, border:"none", background:"#1A1916", color:"#fff", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"opacity .15s" }}>
            Publish
          </button>
        </div>

        {sections.map(sec => (
          <div key={sec.title} className="form-card" style={{ background:"#FFFFFF", borderRadius:14, border:"1px solid #E8E6E0", marginBottom:12, overflow:"hidden", transition:"box-shadow .2s" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 18px", borderBottom:"1px solid #F2F1EE" }}>
              <div style={{ width:28, height:28, borderRadius:8, background:sec.iconBg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <sec.Icon size={13} strokeWidth={1.5} color={sec.iconColor} />
              </div>
              <span style={{ fontFamily:"'Libre Baskerville',serif", fontSize:13, fontWeight:400, color:"#1A1916" }}>{sec.title}</span>
            </div>
            <div style={{ padding:"16px 18px" }}>
              {sec.fields.map(f => (
                <div key={f} style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:9, color:"#8A8680", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6, fontWeight:400 }}>{f}</label>
                  <input style={{ width:"100%", padding:"9px 12px", border:"1px solid #E8E6E0", borderRadius:9, fontSize:12, color:"#1A1916", background:"#F9F9F8", outline:"none", fontFamily:"'DM Sans',sans-serif", fontWeight:300 }} placeholder={`Enter ${f.toLowerCase()}...`} />
                </div>
              ))}
              {sec.fields.length === 0 && (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0" }}>
                  <p style={{ fontSize:11, color:"#8A8680", fontWeight:300, fontStyle:"italic" }}>Configure options here</p>
                  <ChevronRight size={14} strokeWidth={1.5} color="#C4C2BC" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function SettingsScreen() {
  const sections = [
    { Icon: Building2,  iconColor:"#4A46B5", iconBg:"#EEEDF8", title:"Business"              },
    { Icon: Target,     iconColor:"#1D9E75", iconBg:"#E1F5EE", title:"Offer & Audience"      },
    { Icon: Megaphone,  iconColor:"#BA7517", iconBg:"#FDF3E1", title:"Sales & Follow-up"     },
    { Icon: Mic,        iconColor:"#378ADD", iconBg:"#E6F1FB", title:"Agent Voice & Style"   },
  ];

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ maxWidth:680, margin:"0 auto", padding:"32px 40px", fontFamily:"'DM Sans',sans-serif", background:"#F9F9F8", minHeight:"100vh" }}>

        {/* Profile banner */}
        <div style={{ background:"#1A1916", borderRadius:16, padding:"28px 28px", marginBottom:16, display:"flex", alignItems:"center", gap:18, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,.04)" }} />
          <div style={{ position:"absolute", bottom:-60, left:-20, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,.03)" }} />
          <div style={{ width:52, height:52, borderRadius:"50%", background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Libre Baskerville',serif", fontSize:20, fontWeight:400, color:"#fff", flexShrink:0 }}>
            U
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Libre Baskerville',serif", fontSize:18, fontWeight:400, color:"#fff", marginBottom:6 }}>My Business</div>
            <div style={{ display:"inline-flex", alignItems:"center", padding:"3px 11px", borderRadius:20, background:"rgba(255,255,255,.1)", fontSize:10, color:"rgba(255,255,255,.6)", fontWeight:300, fontStyle:"italic" }}>Industry</div>
          </div>
          <button style={{ padding:"7px 14px", borderRadius:9, border:"1px solid rgba(255,255,255,.15)", background:"rgba(255,255,255,.07)", color:"rgba(255,255,255,.6)", fontSize:10, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"opacity .15s" }}>
            ↺ Redo onboarding
          </button>
        </div>

        {sections.map(sec => (
          <div key={sec.title} className="set-card" style={{ background:"#FFFFFF", borderRadius:14, border:"1px solid #E8E6E0", marginBottom:10, overflow:"hidden", transition:"box-shadow .2s" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 18px", borderBottom:"1px solid #F2F1EE" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:sec.iconBg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <sec.Icon size={13} strokeWidth={1.5} color={sec.iconColor} />
                </div>
                <span style={{ fontFamily:"'Libre Baskerville',serif", fontSize:13, fontWeight:400, color:"#1A1916" }}>{sec.title}</span>
              </div>
              <button className="cal-ghost" style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:8, border:"1px solid #E8E6E0", background:"#FFFFFF", fontSize:10, color:"#8A8680", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"background .15s" }}>
                ✎ Edit
              </button>
            </div>
            <div style={{ padding:"12px 18px" }}>
              <p style={{ fontSize:11, color:"#8A8680", fontWeight:300, fontStyle:"italic" }}>Not set — click Edit to configure</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
