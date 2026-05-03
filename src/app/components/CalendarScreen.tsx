import { useState } from "react";
import { Plus, ZoomIn } from "lucide-react";

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .cal-btn:hover { background: #4338CA !important; }
  .cal-ghost:hover { background: #F3F4F6 !important; }
  .cal-period:hover { background: #E5E7EB !important; }
  .cal-cell:hover { background: #F9FAFB !important; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 4px; }
`;

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);
const BOOKINGS = [
  { day:1, hour:9,  name:"Ahmed K.", color:"#4F46E5", bg:"#EEF2FF" },
  { day:3, hour:11, name:"Sara M.",  color:"#059669", bg:"#ECFDF5" },
  { day:5, hour:14, name:"John D.",  color:"#D97706", bg:"#FFFBEB" },
];

export function CalendarScreen() {
  const [view, setView] = useState<"Day"|"Week"|"Month">("Week");

  const stats = [
    { label:"This Week",    value:"3",  color:"#4F46E5" },
    { label:"Confirmed",    value:"2",  color:"#059669" },
    { label:"No-shows",     value:"0",  color:"#DC2626" },
    { label:"Total Booked", value:"34", color:"#111827" },
  ];

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ padding:"32px", background:"#EDEEF5", minHeight:"100vh", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24 }}>
          <div>
            <h1 style={{ fontSize:24, fontWeight:800, color:"#111827", letterSpacing:"-0.5px", marginBottom:4 }}>Calendar</h1>
            <p style={{ fontSize:13, color:"#9CA3AF" }}>Manage your booked calls</p>
          </div>
          <button className="cal-btn" style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 18px", borderRadius:9, border:"none", background:"#4F46E5", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"background .15s" }}>
            <Plus size={13} strokeWidth={2} /> Add Booking
          </button>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
          {stats.map(s => (
            <div key={s.label} style={{ background:"#FFFFFF", borderRadius:14, border:"1px solid #E5E7EB", padding:"16px 20px", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
              <div style={{ fontSize:10, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8, fontWeight:600 }}>{s.label}</div>
              <div style={{ fontSize:28, fontWeight:800, color:s.color, letterSpacing:"-1px", lineHeight:1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button className="cal-ghost" style={{ width:30, height:30, borderRadius:8, border:"1px solid #E5E7EB", background:"#FFFFFF", cursor:"pointer", fontSize:14, color:"#6B7280", display:"flex", alignItems:"center", justifyContent:"center", transition:"background .15s" }}>‹</button>
            <span style={{ fontSize:15, fontWeight:700, color:"#111827" }}>April 2026</span>
            <button className="cal-ghost" style={{ width:30, height:30, borderRadius:8, border:"1px solid #E5E7EB", background:"#FFFFFF", cursor:"pointer", fontSize:14, color:"#6B7280", display:"flex", alignItems:"center", justifyContent:"center", transition:"background .15s" }}>›</button>
            <button className="cal-ghost" style={{ padding:"5px 13px", borderRadius:8, border:"1px solid #E5E7EB", background:"#FFFFFF", fontSize:11, fontWeight:600, color:"#6B7280", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"background .15s" }}>Today</button>
          </div>
          <div style={{ display:"flex", gap:4, background:"#F3F4F6", borderRadius:10, padding:4 }}>
            {(["Day","Week","Month"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding:"5px 14px", borderRadius:7, border:"none", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all .15s", background: view===v ? "#FFFFFF" : "transparent", color: view===v ? "#111827" : "#9CA3AF", boxShadow: view===v ? "0 1px 4px rgba(0,0,0,.08)" : "none" }}>{v}</button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div style={{ background:"#FFFFFF", borderRadius:16, border:"1px solid #E5E7EB", overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          {/* Day headers */}
          <div style={{ display:"grid", gridTemplateColumns:"64px repeat(7,1fr)", borderBottom:"1px solid #E5E7EB" }}>
            <div />
            {DAYS.map((d, i) => (
              <div key={d} style={{ padding:"12px 6px", textAlign:"center", borderLeft:"1px solid #F3F4F6" }}>
                <div style={{ fontSize:9, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"1px", marginBottom:4, fontWeight:700 }}>{d}</div>
                <div style={{ fontSize:16, fontWeight:800, color: i===4 ? "#4F46E5" : "#111827", width:32, height:32, borderRadius:"50%", background: i===4 ? "#EEF2FF" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto" }}>{21+i}</div>
              </div>
            ))}
          </div>

          {/* Time rows */}
          <div style={{ maxHeight:440, overflowY:"auto" }}>
            {HOURS.map(h => (
              <div key={h} style={{ display:"grid", gridTemplateColumns:"64px repeat(7,1fr)", minHeight:56 }}>
                <div style={{ padding:"6px 10px 0", textAlign:"right", fontSize:9, color:"#D1D5DB", fontWeight:600, borderTop:"1px solid #F3F4F6", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {h < 12 ? `${h}:00 AM` : h===12 ? "12:00 PM" : `${h-12}:00 PM`}
                </div>
                {DAYS.map((_, di) => {
                  const booking = BOOKINGS.find(b => b.day===di && b.hour===h);
                  return (
                    <div key={di} className="cal-cell" style={{ borderTop:"1px solid #F3F4F6", borderLeft:"1px solid #F3F4F6", position:"relative", padding:3, transition:"background .15s" }}>
                      {booking && (
                        <div style={{ background:booking.bg, borderLeft:`2.5px solid ${booking.color}`, borderRadius:6, padding:"5px 8px", fontSize:11, fontWeight:700, color:booking.color, cursor:"pointer" }}>
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
