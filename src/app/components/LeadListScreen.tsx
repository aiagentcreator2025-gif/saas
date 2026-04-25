import { useState } from "react";
import { Search, Download, ChevronUp } from "lucide-react";

interface Lead {
  id: number;
  name: string;
  phone: string;
  status: "booked" | "magnet_sent" | "new" | "no_show" | "closed";
  step: string;
  date: string;
  source: string;
}

const LEADS: Lead[] = [
  { id: 1, name: "Ahmed Karimi", phone: "+1 555 0101", status: "booked", step: "Booking", date: "Apr 25, 2026", source: "WhatsApp" },
  { id: 2, name: "Sara Moreira", phone: "+1 555 0102", status: "magnet_sent", step: "Lead Magnet", date: "Apr 24, 2026", source: "WhatsApp" },
  { id: 3, name: "John Davidson", phone: "+1 555 0103", status: "booked", step: "Booking", date: "Apr 24, 2026", source: "WhatsApp" },
  { id: 4, name: "Maria Santos", phone: "+1 555 0104", status: "new", step: "Script 1", date: "Apr 23, 2026", source: "WhatsApp" },
  { id: 5, name: "Chris Lee", phone: "+1 555 0105", status: "no_show", step: "Booking", date: "Apr 22, 2026", source: "WhatsApp" },
  { id: 6, name: "Fatima Al-Hassan", phone: "+1 555 0106", status: "closed", step: "Closed", date: "Apr 21, 2026", source: "WhatsApp" },
  { id: 7, name: "Lucas Petit", phone: "+1 555 0107", status: "magnet_sent", step: "Script 2", date: "Apr 20, 2026", source: "WhatsApp" },
  { id: 8, name: "Emma Wilson", phone: "+1 555 0108", status: "booked", step: "Booking", date: "Apr 19, 2026", source: "WhatsApp" },
];

const STATUS_CONFIG = {
  booked: { label: "Booked", color: "#6366F1", bg: "#EEF2FF" },
  magnet_sent: { label: "Magnet Sent", color: "#10B981", bg: "#ECFDF5" },
  new: { label: "New", color: "#3B82F6", bg: "#EFF6FF" },
  no_show: { label: "No Show", color: "#EF4444", bg: "#FFF1F2" },
  closed: { label: "Closed", color: "#6B7280", bg: "#F3F4F6" },
};

export function LeadListScreen() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = LEADS.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search);
    const matchFilter = filter === "all" || l.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F1117", letterSpacing: "-0.4px", marginBottom: 3 }}>Lead List</h1>
          <p style={{ fontSize: 12, color: "#6B7280" }}>{LEADS.length} total leads in your pipeline</p>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 9, border: "1px solid #E5E7EB", background: "#fff", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer" }}>
          <Download size={14} /> Export
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 280 }}>
          <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." style={{ width: "100%", padding: "9px 12px 9px 32px", border: "1.5px solid #E5E7EB", borderRadius: 9, fontSize: 12, color: "#0F1117", background: "#fff", outline: "none" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[{ key: "all", label: "All" }, { key: "booked", label: "Booked" }, { key: "magnet_sent", label: "Magnet Sent" }, { key: "new", label: "New" }, { key: "no_show", label: "No Show" }].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: "7px 13px", borderRadius: 8, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer", background: filter === f.key ? "#6366F1" : "#F3F4F6", color: filter === f.key ? "#fff" : "#6B7280", transition: "all 0.15s" }}>{f.label}</button>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr", padding: "11px 18px", borderBottom: "1px solid #E5E7EB", background: "#FAFBFE" }}>
          {["Name", "Phone", "Status", "Flow Step", "Date", "Source"].map(col => (
            <div key={col} style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 4 }}>
              {col}<ChevronUp size={9} color="#D1D5DB" />
            </div>
          ))}
        </div>
        {filtered.map((lead, i) => {
          const s = STATUS_CONFIG[lead.status];
          return (
            <div key={lead.id} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr 1fr", padding: "13px 18px", borderBottom: i < filtered.length - 1 ? "1px solid #F3F4F6" : "none", cursor: "pointer", transition: "background 0.12s" }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "#FAFBFE"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#EEF2FF,#E0E7FF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#6366F1", flexShrink: 0 }}>
                  {lead.name.split(" ").map(n => n[0]).join("")}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#0F1117" }}>{lead.name}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", fontSize: 12, color: "#6B7280" }}>{lead.phone}</div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: s.bg, padding: "3px 9px", borderRadius: 20 }}>{s.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", fontSize: 12, color: "#374151", fontWeight: 500 }}>{lead.step}</div>
              <div style={{ display: "flex", alignItems: "center", fontSize: 11, color: "#9CA3AF" }}>{lead.date}</div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#10B981", background: "#ECFDF5", padding: "3px 9px", borderRadius: 20 }}>{lead.source}</span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ padding: "40px", textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>No leads found</div>}
      </div>
    </div>
  );
}
