import { useState, useEffect } from "react";
import { LayoutDashboard, GitBranch, Calendar, Users, Settings, LogOut, FileText, MessageSquare } from "lucide-react";
import { Screen } from "../App";
import { supabase } from "../supabaseClient";

interface Props {
  active: Screen;
  onNav: (s: Screen) => void;
}

export function Sidebar({ active, onNav }: Props) {
  const [email, setEmail] = useState("...");
  const [initials, setInitials] = useState("U");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setEmail(session.user.email);
        setInitials(session.user.email[0].toUpperCase());
      }
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .sb-item:hover { background: #F2F1EE !important; color: #1A1916 !important; }
        .sb-item:hover span { opacity: 1 !important; }
        .sb-bottom-item:hover { background: #F2F1EE !important; color: #1A1916 !important; }
        .sb-bottom-item:hover span { opacity: 1 !important; }
      `}</style>

      <div style={{
        width: 220, flexShrink: 0,
        background: "#FFFFFF",
        borderRight: "1px solid #E8E6E0",
        display: "flex", flexDirection: "column",
        height: "100vh",
        position: "sticky", top: 0,
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* Logo */}
        <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid #E8E6E0" }}>
          <img
            src="https://raw.githubusercontent.com/aiagentcreator2025-gif/app/main/LeadFlow_transparent%20(4).png"
            alt="LeadFlow"
            style={{ height: 60, objectFit: "contain", display: "block" }}
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              el.style.display = "none";
              const fallback = el.nextSibling as HTMLElement;
              if (fallback) fallback.style.display = "flex";
            }}
          />
          <div style={{ display: "none", alignItems: "center", gap: 9 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#EEEDF8", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="#4A46B5">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <span style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 16, fontWeight: 400, color: "#1A1916", letterSpacing: "-0.3px" }}>
              LeadFlow
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "14px 10px" }}>
          <div style={{ fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "#C4C2BC", padding: "0 10px", marginBottom: 8, fontWeight: 400 }}>
            Menu
          </div>
          <NavItem icon={<LayoutDashboard size={15} strokeWidth={1.6} />} label="Dashboard"     active={active === "dashboard"}     onClick={() => onNav("dashboard")} />
          <NavItem icon={<GitBranch       size={15} strokeWidth={1.6} />} label="Lead Flow"     active={active === "leadflow"}      onClick={() => onNav("leadflow")} />
          <NavItem icon={<Calendar        size={15} strokeWidth={1.6} />} label="Calendar"      active={active === "calendar"}      onClick={() => onNav("calendar")} />
          <NavItem icon={<FileText        size={15} strokeWidth={1.6} />} label="Booking Form"  active={active === "booking-form"}  onClick={() => onNav("booking-form")} />
          <NavItem icon={<Users           size={15} strokeWidth={1.6} />} label="Lead List"     active={active === "leadlist"}      onClick={() => onNav("leadlist")} />
          <NavItem icon={<MessageSquare   size={15} strokeWidth={1.6} />} label="Conversations" active={active === "conversations"} onClick={() => onNav("conversations")} />
        </nav>

        {/* Bottom */}
        <div style={{ padding: "10px 10px 18px", borderTop: "1px solid #E8E6E0" }}>
          <BottomItem icon={<Settings size={15} strokeWidth={1.6} />} label="Settings"  onClick={() => onNav("settings")} active={active === "settings"} />
          <BottomItem icon={<LogOut   size={15} strokeWidth={1.6} />} label="Sign out"  onClick={handleSignOut}           active={false} />

          <div style={{ marginTop: 10, padding: "10px 10px", background: "#F7F6F3", borderRadius: 10, display: "flex", alignItems: "center", gap: 9, border: "1px solid #E8E6E0" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#EEEDF8", border: "1px solid #DDD9F5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, color: "#4A46B5", flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#1A1916", lineHeight: 1.3 }}>My Account</div>
              <div style={{ fontSize: 10, color: "#8A8680", fontWeight: 300, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email}</div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

function NavItem({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <div
      className={active ? "" : "sb-item"}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "8px 10px", borderRadius: 8,
        fontSize: 13, fontWeight: 400,
        color:      active ? "#4A46B5" : "#8A8680",
        background: active ? "#EEEDF8" : "transparent",
        cursor: "pointer", marginBottom: 2, transition: "all 0.14s",
      }}
    >
      <span style={{ opacity: active ? 1 : 0.7, display: "flex" }}>{icon}</span>
      {label}
    </div>
  );
}

function BottomItem({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <div
      className={active ? "" : "sb-bottom-item"}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "8px 10px", borderRadius: 8,
        fontSize: 13, fontWeight: 400,
        color:      active ? "#4A46B5" : "#8A8680",
        background: active ? "#EEEDF8" : "transparent",
        cursor: "pointer", marginBottom: 2, transition: "all 0.14s",
      }}
    >
      <span style={{ opacity: active ? 1 : 0.7, display: "flex" }}>{icon}</span>
      {label}
    </div>
  );
}
