import { useState, useEffect } from "react";
import { Plus, User, FileText, Calendar, MessageSquare, Building2,
         Target, Megaphone, Mic, ChevronRight, Check, X } from "lucide-react";
import { supabase } from "../supabaseClient";

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
// ─── Booking Form ─────────────────────────────────────────────────────────────

export function BookingFormScreen() {
  const sections = [
    { Icon: User,          iconColor:"#4F46E5", iconBg:"#EEF2FF", title:"Your Identity",          fields:["Your name","Your title","Photo URL"] },
    { Icon: FileText,      iconColor:"#2563EB", iconBg:"#EFF6FF", title:"Page Content",            fields:["Headline","Description"] },
    { Icon: Calendar,      iconColor:"#059669", iconBg:"#ECFDF5", title:"Availability",            fields:[] },
    { Icon: MessageSquare, iconColor:"#D97706", iconBg:"#FFFBEB", title:"Qualification Questions", fields:[] },
  ];

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ maxWidth:680, margin:"0 auto", padding:"32px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif", background:"#EDEEF5", minHeight:"100vh" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:28 }}>
          <div>
            <h1 style={{ fontSize:24, fontWeight:800, color:"#111827", letterSpacing:"-0.5px", marginBottom:4 }}>Booking Form</h1>
            <p style={{ fontSize:13, color:"#9CA3AF" }}>Customize your public booking page and share it with leads.</p>
          </div>
          <button className="cal-btn" style={{ padding:"8px 18px", borderRadius:9, border:"none", background:"#4F46E5", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"background .15s" }}>Publish</button>
        </div>
        {sections.map(sec => (
          <div key={sec.title} className="form-card" style={{ background:"#FFFFFF", borderRadius:14, border:"1px solid #E5E7EB", marginBottom:12, overflow:"hidden", transition:"box-shadow .2s" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 18px", borderBottom:"1px solid #F3F4F6" }}>
              <div style={{ width:28, height:28, borderRadius:8, background:sec.iconBg, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <sec.Icon size={13} strokeWidth={1.5} color={sec.iconColor} />
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:"#111827" }}>{sec.title}</span>
            </div>
            <div style={{ padding:"16px 18px" }}>
              {sec.fields.map(f => (
                <div key={f} style={{ marginBottom:14 }}>
                  <label style={{ display:"block", fontSize:10, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6, fontWeight:700 }}>{f}</label>
                  <input style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #E5E7EB", borderRadius:9, fontSize:12, color:"#111827", background:"#F9FAFB", outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif" }} placeholder={`Enter ${f.toLowerCase()}...`} />
                </div>
              ))}
              {sec.fields.length === 0 && (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0" }}>
                  <p style={{ fontSize:11, color:"#9CA3AF" }}>Configure options here</p>
                  <ChevronRight size={14} strokeWidth={1.5} color="#D1D5DB" />
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

interface AccountData {
  business_name: string; industry: string; main_offer: string;
  price: string; ideal_client: string; top_result: string;
  lead_magnet_title: string; lead_magnet_description: string;
  years_experience: string; clients_helped: string; biggest_win: string;
  how_you_close: string; sales_cycle: string; main_objection: string;
}

function EditableField({ label, value, onSave }: { label: string; value: string; onSave: (val: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const save = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:10, color:"#9CA3AF", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6, fontWeight:700 }}>{label}</label>
      {editing ? (
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <input value={draft} onChange={e => setDraft(e.target.value)} autoFocus
            style={{ flex:1, padding:"8px 12px", border:"1.5px solid #4F46E5", borderRadius:9, fontSize:12, color:"#111827", background:"#FFFFFF", outline:"none", fontFamily:"'Plus Jakarta Sans',sans-serif" }} />
          <button onClick={save} style={{ width:30, height:30, borderRadius:8, border:"none", background:"#4F46E5", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Check size={12} strokeWidth={2} />
          </button>
          <button onClick={cancel} style={{ width:30, height:30, borderRadius:8, border:"1px solid #E5E7EB", background:"#fff", color:"#6B7280", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <X size={12} strokeWidth={2} />
          </button>
        </div>
      ) : (
        <div onClick={() => { setDraft(value); setEditing(true); }}
          style={{ padding:"8px 12px", border:"1.5px solid #E5E7EB", borderRadius:9, fontSize:12, color: value ? "#111827" : "#D1D5DB", background:"#F9FAFB", cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", fontStyle: value ? "normal" : "italic" }}>
          {value || "Not set — click to edit"}
        </div>
      )}
    </div>
  );
}

export function SettingsScreen() {
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase.from("accounts_leadflow").select("*").eq("user_id", user.id).single();
      if (data) setAccount(data);
      setLoading(false);
    };
    load();
  }, []);

  const updateField = async (key: keyof AccountData, value: string) => {
    if (!userId) return;
    setAccount(prev => prev ? { ...prev, [key]: value } : prev);
    await supabase.from("accounts_leadflow").update({ [key]: value }).eq("user_id", userId);
  };

  const val = (key: keyof AccountData) => account?.[key] || "";

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#EDEEF5", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#9CA3AF", fontSize:13 }}>Loading...</div>
  );

  const initials = val("business_name") ? val("business_name").split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) : "?";

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ maxWidth:680, margin:"0 auto", padding:"32px 40px", fontFamily:"'Plus Jakarta Sans',sans-serif", background:"#EDEEF5", minHeight:"100vh" }}>
        <div style={{ background:"#4F46E5", borderRadius:16, padding:"28px", marginBottom:16, display:"flex", alignItems:"center", gap:18, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:"rgba(255,255,255,.08)" }} />
          <div style={{ position:"absolute", bottom:-60, left:-20, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,.05)" }} />
          <div style={{ width:52, height:52, borderRadius:"50%", background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:800, color:"#fff", flexShrink:0 }}>
            {initials}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:18, fontWeight:800, color:"#fff", marginBottom:6 }}>{val("business_name") || "My Business"}</div>
            <div style={{ display:"inline-flex", alignItems:"center", padding:"3px 11px", borderRadius:20, background:"rgba(255,255,255,.15)", fontSize:10, fontWeight:600, color:"rgba(255,255,255,.8)" }}>
              {val("industry") || "Industry not set"}
            </div>
          </div>
        </div>

        <SectionCard icon={<Building2 size={13} strokeWidth={1.5} color="#4F46E5" />} iconBg="#EEF2FF" title="Business">
          <EditableField label="Business Name" value={val("business_name")} onSave={v => updateField("business_name", v)} />
          <EditableField label="Industry" value={val("industry")} onSave={v => updateField("industry", v)} />
        </SectionCard>
        <SectionCard icon={<Target size={13} strokeWidth={1.5} color="#059669" />} iconBg="#ECFDF5" title="Offer & Audience">
          <EditableField label="Main Offer / Service" value={val("main_offer")} onSave={v => updateField("main_offer", v)} />
          <EditableField label="Price" value={val("price")} onSave={v => updateField("price", v)} />
          <EditableField label="Ideal Client" value={val("ideal_client")} onSave={v => updateField("ideal_client", v)} />
          <EditableField label="#1 Result You Get Clients" value={val("top_result")} onSave={v => updateField("top_result", v)} />
        </SectionCard>
        <SectionCard icon={<Megaphone size={13} strokeWidth={1.5} color="#D97706" />} iconBg="#FFFBEB" title="Lead Magnet">
          <EditableField label="Lead Magnet Title" value={val("lead_magnet_title")} onSave={v => updateField("lead_magnet_title", v)} />
          <EditableField label="What's Inside" value={val("lead_magnet_description")} onSave={v => updateField("lead_magnet_description", v)} />
        </SectionCard>
        <SectionCard icon={<User size={13} strokeWidth={1.5} color="#2563EB" />} iconBg="#EFF6FF" title="Proof & Credibility">
          <EditableField label="Years of Experience" value={val("years_experience")} onSave={v => updateField("years_experience", v)} />
          <EditableField label="Clients Helped" value={val("clients_helped")} onSave={v => updateField("clients_helped", v)} />
          <EditableField label="Biggest Client Win" value={val("biggest_win")} onSave={v => updateField("biggest_win", v)} />
        </SectionCard>
        <SectionCard icon={<Mic size={13} strokeWidth={1.5} color="#DC2626" />} iconBg="#FEF2F2" title="Sales Process">
          <EditableField label="How You Close Clients" value={val("how_you_close")} onSave={v => updateField("how_you_close", v)} />
          <EditableField label="Average Sales Cycle" value={val("sales_cycle")} onSave={v => updateField("sales_cycle", v)} />
          <EditableField label="Main Objection You Face" value={val("main_objection")} onSave={v => updateField("main_objection", v)} />
        </SectionCard>
      </div>
    </>
  );
}

function SectionCard({ icon, iconBg, title, children }: { icon: React.ReactNode; iconBg: string; title: string; children: React.ReactNode }) {
  return (
    <div className="set-card" style={{ background:"#FFFFFF", borderRadius:14, border:"1px solid #E5E7EB", marginBottom:10, overflow:"hidden", transition:"box-shadow .2s" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 18px", borderBottom:"1px solid #F3F4F6" }}>
        <div style={{ width:28, height:28, borderRadius:8, background:iconBg, display:"flex", alignItems:"center", justifyContent:"center" }}>{icon}</div>
        <span style={{ fontSize:13, fontWeight:700, color:"#111827" }}>{title}</span>
      </div>
      <div style={{ padding:"16px 18px" }}>{children}</div>
    </div>
  );
}
