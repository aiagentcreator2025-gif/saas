import { Plus } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);
const BOOKINGS = [
  { day: 1, hour: 9, name: "Ahmed K.", color: "#6366F1", bg: "#EEF2FF" },
  { day: 3, hour: 11, name: "Sara M.", color: "#10B981", bg: "#ECFDF5" },
  { day: 5, hour: 14, name: "John D.", color: "#F59E0B", bg: "#FFFBEB" },
];

export function CalendarScreen() {
  const stats = [
    { label: "This Week", value: "3", color: "#6366F1" },
    { label: "Confirmed", value: "2", color: "#10B981" },
    { label: "No-shows", value: "0", color: "#EF4444" },
    { label: "Total Booked", value: "34", color: "#0F1117" },
  ];

  return (
    <div style={{ padding: "28px 32px", animation: "fadeUp 0.3s ease" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F1117", letterSpacing: "-0.4px", marginBottom: 3 }}>Calendar</h1>
          <p style={{ fontSize: 12, color: "#6B7280" }}>Manage your booked calls</p>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.3)" }}>
          <Plus size={14} /> Add Booking
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 22 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "14px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 9, color: "#9CA3AF", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: "-1px", lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", fontSize: 14 }}>‹</button>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0F1117" }}>April 2026</span>
          <button style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", fontSize: 14 }}>›</button>
          <button style={{ padding: "5px 13px", borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", fontSize: 11, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Today</button>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["Day", "Week", "Month"].map(v => (
            <button key={v} style={{ padding: "5px 12px", borderRadius: 8, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", background: v === "Week" ? "#6366F1" : "#F3F4F6", color: v === "Week" ? "#fff" : "#6B7280" }}>{v}</button>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "60px repeat(7,1fr)", borderBottom: "1px solid #E5E7EB" }}>
          <div />
          {DAYS.map((d, i) => (
            <div key={d} style={{ padding: "12px 6px", textAlign: "center", borderLeft: "1px solid #F3F4F6" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>{d}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: i === 4 ? "#6366F1" : "#0F1117", width: 32, height: 32, borderRadius: "50%", background: i === 4 ? "#EEF2FF" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", margin: "4px auto 0" }}>{21 + i}</div>
            </div>
          ))}
        </div>
        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          {HOURS.map(h => (
            <div key={h} style={{ display: "grid", gridTemplateColumns: "60px repeat(7,1fr)", minHeight: 56 }}>
              <div style={{ padding: "4px 8px 0", textAlign: "right", fontSize: 9, color: "#D1D5DB", fontWeight: 500, borderTop: "1px solid #F3F4F6" }}>
                {h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM`}
              </div>
              {DAYS.map((_, di) => {
                const booking = BOOKINGS.find(b => b.day === di && b.hour === h);
                return (
                  <div key={di} style={{ borderTop: "1px solid #F3F4F6", borderLeft: "1px solid #F3F4F6", position: "relative", padding: "2px" }}>
                    {booking && (
                      <div style={{ background: booking.bg, border: `1.5px solid ${booking.color}33`, borderLeft: `3px solid ${booking.color}`, borderRadius: 6, padding: "4px 6px", fontSize: 10, fontWeight: 600, color: booking.color }}>
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
  );
}

export function BookingFormScreen() {
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 32px", animation: "fadeUp 0.3s ease" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.3px", marginBottom: 3 }}>Booking Form</h2>
          <p style={{ fontSize: 12, color: "#6B7280" }}>Customize your public booking page and share it with leads.</p>
        </div>
        <button style={{ padding: "8px 16px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.3)" }}>Publish</button>
      </div>
      {[
        { icon: "👤", title: "Your Identity", fields: ["Your name", "Your title", "Photo URL"] },
        { icon: "✍️", title: "Page Content", fields: ["Headline", "Description"] },
        { icon: "📅", title: "Availability", fields: [] },
        { icon: "💬", title: "Qualification Questions", fields: [] },
      ].map(card => (
        <div key={card.title} style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", marginBottom: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 16px", borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{card.icon}</div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#0F1117" }}>{card.title}</span>
          </div>
          <div style={{ padding: 16 }}>
            {card.fields.map(f => (
              <div key={f} style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 9, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>{f}</label>
                <input style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #E5E7EB", borderRadius: 9, fontSize: 12, color: "#0F1117", background: "#FAFBFE", outline: "none" }} placeholder={`Enter ${f.toLowerCase()}...`} />
              </div>
            ))}
            {card.fields.length === 0 && <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", padding: "12px 0" }}>Configure options here</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SettingsScreen() {
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 32px", animation: "fadeUp 0.3s ease" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ background: "linear-gradient(135deg,#4F46E5 0%,#6366F1 60%,#8B5CF6 100%)", borderRadius: 16, padding: "26px", marginBottom: 14, display: "flex", alignItems: "center", gap: 18, position: "relative", overflow: "hidden", boxShadow: "0 8px 32px rgba(99,102,241,0.25)" }}>
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
              <div style={{ width: 24, height: 24, borderRadius: 7, background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>
                {["🏢", "💎", "📣", "🎙️"][i]}
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
