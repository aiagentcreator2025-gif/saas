import { Calendar, Plus } from "lucide-react";

export function CalendarScreen() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = Array.from({ length: 12 }, (_, i) => i + 8);

  return (
    <div style={{ animation: "fadeUp 0.3s ease" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { label: "This week", value: "0", color: "#2563EB" },
          { label: "Confirmed", value: "0", color: "#10B981" },
          { label: "No-shows", value: "0", color: "#EF4444" },
          { label: "Total booked", value: "0", color: "#0F1117" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB", padding: "13px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, letterSpacing: "-0.8px", lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", fontSize: 14 }}>‹</button>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0F1117", minWidth: 180 }}>April 2026</span>
          <button style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", fontSize: 14 }}>›</button>
          <button style={{ padding: "5px 13px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Today</button>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, background: "#2563EB", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", boxShadow: "0 3px 12px rgba(37,99,235,0.25)" }}>
          <Plus size={12} /> Add booking
        </button>
      </div>
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "52px repeat(7,1fr)", borderBottom: "1px solid #E5E7EB" }}>
          <div />
          {days.map(d => (
            <div key={d} style={{ padding: "10px 6px", textAlign: "center", fontSize: 9, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.4px" }}>
              {d}
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0F1117", marginTop: 2 }}>—</div>
            </div>
          ))}
        </div>
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {hours.map(h => (
            <div key={h} style={{ display: "grid", gridTemplateColumns: "52px repeat(7,1fr)" }}>
              <div style={{ padding: "0 5px", textAlign: "right", fontSize: 9, color: "#D1D5DB", fontWeight: 500, height: 52, display: "flex", alignItems: "flex-start", paddingTop: 3, borderTop: "1px solid #F3F4F6" }}>
                {h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h-12} PM`}
              </div>
              {days.map(d => (
                <div key={d} style={{ height: 52, borderTop: "1px solid #F3F4F6", borderLeft: "1px solid #F3F4F6" }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BookingFormScreen() {
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", animation: "fadeUp 0.3s ease" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px", marginBottom: 3 }}>Booking Form</h2>
          <p style={{ fontSize: 11, color: "#6B7280" }}>Customize your public booking page and share it with leads.</p>
        </div>
        <button style={{ padding: "8px 16px", borderRadius: 9, border: "none", background: "#2563EB", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", boxShadow: "0 3px 12px rgba(37,99,235,0.25)" }}>Publish</button>
      </div>
      {[
        { icon: "👤", title: "Your Identity", fields: ["Your name", "Your title", "Photo URL"] },
        { icon: "✍️", title: "Page Content", fields: ["Headline", "Description"] },
        { icon: "📅", title: "Availability", fields: [] },
        { icon: "💬", title: "Qualification Questions", fields: [] },
      ].map(card => (
        <div key={card.title} style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", marginBottom: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 16px", borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{card.icon}</div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#0F1117" }}>{card.title}</span>
          </div>
          <div style={{ padding: 16 }}>
            {card.fields.map(f => (
              <div key={f} style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>{f}</label>
                <input style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #E5E7EB", borderRadius: 9, fontSize: 12, color: "#0F1117", background: "#FAFBFE", outline: "none" }} placeholder={`Enter ${f.toLowerCase()}...`} />
              </div>
            ))}
            {card.fields.length === 0 && (
              <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", padding: "12px 0" }}>Configure options here</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SettingsScreen() {
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", animation: "fadeUp 0.3s ease" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ background: "linear-gradient(135deg,#1E40AF 0%,#2563EB 60%,#3B82F6 100%)", borderRadius: 16, padding: "26px", marginBottom: 14, display: "flex", alignItems: "center", gap: 18, position: "relative", overflow: "hidden", boxShadow: "0 8px 32px rgba(37,99,235,0.25)" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.18)", border: "2px solid rgba(255,255,255,0.28)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#fff", flexShrink: 0 }}>U</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 19, fontWeight: 700, color: "#fff", marginBottom: 5 }}>My Business</div>
          <div style={{ display: "inline-flex", alignItems: "center", padding: "3px 11px", borderRadius: 20, background: "rgba(255,255,255,0.14)", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.88)" }}>Industry</div>
        </div>
        <button style={{ padding: "7px 13px", borderRadius: 9, border: "1.5px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.78)", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>↺ Redo onboarding</button>
      </div>
      {["Business", "Offer & Audience", "Sales & Follow-up", "Agent Voice & Style"].map((sec, i) => (
        <div key={sec} style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", marginBottom: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 20px", borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: "#0F1117" }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>
                {["🏢","💎","📣","🎙️"][i]}
              </div>
              {sec}
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 7, border: "1px solid #E5E7EB", background: "#F9FAFB", fontSize: 10, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>✎ Edit</button>
          </div>
          <div style={{ padding: "12px 20px" }}>
            <p style={{ fontSize: 11, color: "#9CA3AF", fontStyle: "italic" }}>Not set — click Edit to configure</p>
          </div>
        </div>
      ))}
    </div>
  );
}
