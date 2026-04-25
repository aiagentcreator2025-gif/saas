import { LayoutDashboard, GitBranch, Calendar, Users, Settings, LogOut, FileText } from "lucide-react";
import { Screen } from "../App";

interface Props {
  active: Screen;
  onNav: (s: Screen) => void;
}

export function Sidebar({ active, onNav }: Props) {
  return (
    <div style={{
      width: 220, flexShrink: 0,
      background: "#fff",
      borderRight: "1px solid #E5E7EB",
      display: "flex", flexDirection: "column",
      height: "100vh",
      position: "sticky", top: 0,
    }}>
      <div style={{ padding: "22px 18px 16px", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "linear-gradient(135deg,#6366F1,#8B5CF6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
          }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="white">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#0F1117", letterSpacing: "-0.3px" }}>LeadFlow</span>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "12px 10px" }}>
        <NavItem icon={<LayoutDashboard size={16}/>} label="Dashboard" active={active === "dashboard"} onClick={() => onNav("dashboard")} />
        <NavItem icon={<GitBranch size={16}/>} label="Lead Flow" active={active === "leadflow"} onClick={() => onNav("leadflow")} />
        <NavItem icon={<Calendar size={16}/>} label="Calendar" active={active === "calendar"} onClick={() => onNav("calendar")} />
        <NavItem icon={<FileText size={16}/>} label="Booking Form" active={active === "booking-form"} onClick={() => onNav("booking-form")} />
        <NavItem icon={<Users size={16}/>} label="Lead List" active={active === "leadlist"} onClick={() => onNav("leadlist")} />
      </nav>

      <div style={{ padding: "10px 10px 16px", borderTop: "1px solid #F3F4F6" }}>
        <NavItem icon={<Settings size={16}/>} label="Settings" active={active === "settings"} onClick={() => onNav("settings")} />
        <NavItem icon={<LogOut size={16}/>} label="Sign out" active={false} onClick={() => {}} />
        <div style={{
          marginTop: 10, padding: "10px 12px",
          background: "linear-gradient(135deg,#EEF2FF,#F5F3FF)",
          borderRadius: 10, display: "flex", alignItems: "center", gap: 9,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "linear-gradient(135deg,#6366F1,#8B5CF6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff",
          }}>U</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0F1117" }}>My Account</div>
            <div style={{ fontSize: 10, color: "#6B7280" }}>user@leadflow.io</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "9px 12px", borderRadius: 9,
        fontSize: 13, fontWeight: active ? 600 : 500,
        color: active ? "#6366F1" : "#4B5563",
        background: active ? "#EEF2FF" : "transparent",
        cursor: "pointer", marginBottom: 2, transition: "all 0.14s",
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "#F9FAFB"; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
    >
      <span style={{ opacity: active ? 1 : 0.55 }}>{icon}</span>
      {label}
    </div>
  );
}
