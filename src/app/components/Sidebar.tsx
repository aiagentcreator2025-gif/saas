import { useState, useEffect } from "react";
import { LayoutDashboard, Calendar, Users, Settings, LogOut,
         MessageSquare, Bot, Workflow, Lock, Sparkles } from "lucide-react";
import { Screen } from "../App";
import { supabase } from "../supabaseClient";

interface Props {
  active: Screen;
  onNav: (s: Screen) => void;
  agentCertified: boolean;
}

export function Sidebar({ active, onNav, agentCertified }: Props) {
  const [email, setEmail] = useState("...");
  const [initials, setInitials] = useState("U");
  const [showLockTooltip, setShowLockTooltip] = useState(false);

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

  const handleWorkflowClick = () => {
    if (!agentCertified) {
      setShowLockTooltip(true);
      setTimeout(() => setShowLockTooltip(false), 2800);
      return;
    }
    onNav("my-workflows");
  };

  return (
    <div style={{
      width: 240, flexShrink: 0, height: "100vh", position: "sticky",
      top: 0, zIndex: 10, padding: "12px 10px", display: "flex",
      flexDirection: "column", fontFamily: "'DM Sans', sans-serif",
      background: "transparent", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        .sb-item { transition: all 0.14s; }
        .sb-item:hover { background: rgba(255,255,255,0.4) !important; color: #1A1916 !important; }
        .sb-item:hover span { opacity: 1 !important; }
        .sb-bottom-item { transition: all 0.14s; }
        .sb-bottom-item:hover { background: rgba(255,255,255,0.4) !important; color: #1A1916 !important; }
        .sb-bottom-item:hover span { opacity: 1 !important; }
        .sb-active-item {
          background: rgba(255,255,255,0.55) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 8px rgba(99,102,241,0.1) !important;
          border: 1px solid rgba(255,255,255,0.6) !important;
        }
        .sb-locked:hover { background: rgba(255,255,255,0.18) !important; cursor: not-allowed !important; }
        @keyframes lockShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-3px)} 40%{transform:translateX(3px)} 60%{transform:translateX(-2px)} 80%{transform:translateX(2px)} }
        @keyframes tooltipFade { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
        @keyframes sectionDivider { from{width:0;opacity:0} to{width:100%;opacity:1} }
      `}</style>

      {/* Glass card */}
      <div style={{
        flex: 1, position: "relative", zIndex: 1, borderRadius: 24,
        display: "flex", flexDirection: "column", overflow: "hidden",
        backdropFilter: "blur(48px) saturate(180%) brightness(1.02)",
        WebkitBackdropFilter: "blur(48px) saturate(180%) brightness(1.02)",
        background: "linear-gradient(145deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.1) 100%)",
        border: "1px solid rgba(255,255,255,0.6)",
        boxShadow: `
          inset 0 1.5px 0 rgba(255,255,255,0.85),
          inset 0 -1px 0 rgba(255,255,255,0.05),
          inset 1px 0 0 rgba(255,255,255,0.4),
          inset -1px 0 0 rgba(255,255,255,0.08),
          0 4px 24px rgba(0,0,0,0.05),
          0 1px 4px rgba(0,0,0,0.03)
        `,
      }}>
        {/* Glass shine overlays */}
        <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: "linear-gradient(145deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.03) 35%, transparent 55%)", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "absolute", top: 1, left: "10%", right: "10%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.95) 30%, rgba(255,255,255,0.95) 70%, transparent)", borderRadius: "50%", pointerEvents: "none", zIndex: 2 }} />

        {/* Logo */}
        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid rgba(255,255,255,0.25)", position: "relative", zIndex: 1 }}>
          <img
            src="https://raw.githubusercontent.com/aiagentcreator2025-gif/app/main/LeadFlow_transparent%20(4).png"
            alt="LeadFlow"
            style={{ height: 54, objectFit: "contain", display: "block" }}
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              el.style.display = "none";
              const fallback = el.nextSibling as HTMLElement;
              if (fallback) fallback.style.display = "flex";
            }}
          />
          <div style={{ display: "none", alignItems: "center", gap: 9 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="#4A46B5">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <span style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 16, color: "#1A1916" }}>LeadFlow</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "14px 10px", overflowY: "auto", position: "relative", zIndex: 1 }}>

          {/* Main section */}
          <div style={{ fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: "rgba(100,80,180,0.5)", padding: "0 10px", marginBottom: 8, fontWeight: 500 }}>Main</div>

          <NavItem icon={<LayoutDashboard size={15} strokeWidth={1.6} />} label="Dashboard" active={active === "dashboard"} onClick={() => onNav("dashboard")} />

<NavItem
  icon={<Sparkles size={15} strokeWidth={1.6} />}
  label="Co-Founder AI"
  active={active === "cofounder"}
  onClick={() => onNav("cofounder")}
/>

          {/* Agent section */}
          <div style={{ marginTop: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: "rgba(100,80,180,0.5)", padding: "0 10px", marginBottom: 8, fontWeight: 500 }}>Your AI Employee</div>
            <NavItem
              icon={<Bot size={15} strokeWidth={1.6} />}
              label="My Agent"
              active={active === "my-agent"}
              onClick={() => onNav("my-agent")}
              badge={agentCertified ? undefined : "Build first"}
            />

            {/* My Workflows — locked or unlocked */}
            <div style={{ position: "relative" }}>
              <div
                className={agentCertified ? (active === "my-workflows" ? "sb-active-item" : "sb-item") : "sb-locked"}
                onClick={handleWorkflowClick}
                style={{
                  display: "flex", alignItems: "center", gap: 9,
                  padding: "8px 10px", borderRadius: 10,
                  fontSize: 13, fontWeight: active === "my-workflows" ? 500 : 400,
                  color: agentCertified
                    ? (active === "my-workflows" ? "#3730a3" : "rgba(60,40,120,0.75)")
                    : "rgba(60,40,120,0.35)",
                  background: "transparent", cursor: agentCertified ? "pointer" : "not-allowed",
                  marginBottom: 2, border: "1px solid transparent",
                  transition: "all 0.14s",
                  animation: showLockTooltip ? "lockShake 0.4s ease" : "none",
                }}
              >
                <span style={{ opacity: agentCertified ? (active === "my-workflows" ? 1 : 0.65) : 0.3, display: "flex" }}>
                  {agentCertified ? <Workflow size={15} strokeWidth={1.6} /> : <Lock size={15} strokeWidth={1.6} />}
                </span>
                My Workflows
                {!agentCertified && (
                  <span style={{
                    marginLeft: "auto", fontSize: 8, fontWeight: 700,
                    padding: "2px 7px", borderRadius: 20,
                    background: "rgba(99,102,241,0.08)",
                    color: "rgba(99,102,241,0.4)",
                    border: "1px solid rgba(99,102,241,0.12)",
                    letterSpacing: "0.3px",
                  }}>🔒 Locked</span>
                )}
              </div>

              {/* Lock tooltip */}
              {showLockTooltip && (
                <div style={{
                  position: "absolute", left: "calc(100% + 10px)", top: "50%",
                  transform: "translateY(-50%)", zIndex: 100,
                  background: "rgba(17,24,39,0.92)", backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10, padding: "10px 14px",
                  fontSize: 11, color: "#fff", fontWeight: 500,
                  lineHeight: 1.5, whiteSpace: "nowrap" as const,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                  animation: "tooltipFade 0.2s ease both",
                  pointerEvents: "none",
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 2, color: "#F59E0B" }}>🔒 Agent not certified yet</div>
                  <div style={{ color: "rgba(255,255,255,0.6)" }}>Approve your agent in My Agent first</div>
                  {/* Arrow */}
                  <div style={{
                    position: "absolute", left: -5, top: "50%",
                    width: 8, height: 8, background: "rgba(17,24,39,0.92)",
                    border: "1px solid rgba(255,255,255,0.1)", borderRight: "none", borderTop: "none",
                    transform: "translateY(-50%) rotate(45deg)",
                  }} />
                </div>
              )}
            </div>
          </div>

          {/* Tools section */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: "rgba(100,80,180,0.5)", padding: "0 10px", marginBottom: 8, fontWeight: 500 }}>Tools</div>
            <NavItem icon={<Calendar size={15} strokeWidth={1.6} />} label="Calendar" active={active === "calendar"} onClick={() => onNav("calendar")} />
            <NavItem icon={<Users size={15} strokeWidth={1.6} />} label="Lead List" active={active === "leadlist"} onClick={() => onNav("leadlist")} />
            <NavItem icon={<MessageSquare size={15} strokeWidth={1.6} />} label="Conversations" active={active === "conversations"} onClick={() => onNav("conversations")} />
          </div>
        </nav>

        {/* Bottom */}
        <div style={{ padding: "10px 10px 14px", borderTop: "1px solid rgba(255,255,255,0.25)", position: "relative", zIndex: 1 }}>
          <BottomItem icon={<Settings size={15} strokeWidth={1.6} />} label="Settings" onClick={() => onNav("settings")} active={active === "settings"} />
          <BottomItem icon={<LogOut size={15} strokeWidth={1.6} />} label="Sign out" onClick={handleSignOut} active={false} />
          <div style={{
            marginTop: 10, padding: "10px",
            background: "rgba(255,255,255,0.25)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            borderRadius: 14, display: "flex", alignItems: "center", gap: 9,
            border: "1px solid rgba(255,255,255,0.45)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.6)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 600, color: "#4A46B5", flexShrink: 0,
            }}>
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#1A1916", lineHeight: 1.3 }}>My Account</div>
              <div style={{ fontSize: 10, color: "rgba(80,60,140,0.7)", fontWeight: 300, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{email}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, badge }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void; badge?: string;
}) {
  return (
    <div
      className={active ? "sb-active-item" : "sb-item"}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "8px 10px", borderRadius: 10,
        fontSize: 13, fontWeight: active ? 500 : 400,
        color: active ? "#3730a3" : "rgba(60,40,120,0.75)",
        background: "transparent", cursor: "pointer",
        marginBottom: 2, transition: "all 0.14s",
        border: "1px solid transparent",
      }}
    >
      <span style={{ opacity: active ? 1 : 0.65, display: "flex" }}>{icon}</span>
      {label}
      {badge && (
        <span style={{
          marginLeft: "auto", fontSize: 8, fontWeight: 700,
          padding: "2px 7px", borderRadius: 20,
          background: "rgba(99,102,241,0.08)",
          color: "rgba(99,102,241,0.5)",
          border: "1px solid rgba(99,102,241,0.12)",
        }}>{badge}</span>
      )}
    </div>
  );
}

function BottomItem({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <div
      className={active ? "sb-active-item" : "sb-bottom-item"}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "8px 10px", borderRadius: 10,
        fontSize: 13, fontWeight: 400,
        color: active ? "#3730a3" : "rgba(60,40,120,0.75)",
        background: "transparent", cursor: "pointer",
        marginBottom: 2, transition: "all 0.14s",
        border: "1px solid transparent",
      }}
    >
      <span style={{ opacity: active ? 1 : 0.65, display: "flex" }}>{icon}</span>
      {label}
    </div>
  );
}
