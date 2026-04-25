import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

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
    <div style={{ padding: "28px 32px" }}>
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
          <button style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeft size={14} color="#6B7280" /></button>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0F1117" }}>April 2026</span>
          <button style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #E5E7EB", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={14} color="#6B7280" /></button>
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
