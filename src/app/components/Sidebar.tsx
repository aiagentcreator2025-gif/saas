import { useState, useEffect } from "react";
import { LayoutDashboard, GitBranch, Calendar, Users, Settings, LogOut, MessageSquare, Bot } from "lucide-react";
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
        
        .sb-item:hover {
          background: rgba(255,255,255,0.35) !important;
          color: #1A1916 !important;
        }
        .sb-item:hover span { opacity: 1 !important; }
        .sb-bottom-item:hover {
          background: rgba(255,255,255,0.35) !important;
          color: #1A1916 !important;
        }
        .sb-bottom-item:hover span { opacity: 1 !important; }

        .sb-active-item {
          background: rgba(255,255,255,0.55) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.8),
            0 2px 8px rgba(99,102,241,0.1) !important;
          border: 1px solid rgba(255,255,255,0.6) !important;
        }
      `}</style>

    {/* Outer wrapper — the colored bg that glass refracts */}
<div style={{
  width: 240,
  flexShrink: 0,
  height: "100vh",
  position: "sticky",
  top: 0,
  zIndex: 10,
  padding: "12px 10px",
  display: "flex",
  flexDirection: "column",
  fontFamily: "'DM Sans', sans-serif",
  background: "#EDEEF5",
  overflow: "hidden",
}}>

        {/* Background texture orbs for depth */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <div style={{ position: "absolute", top: -60, left: -40, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.3), transparent 70%)", filter: "blur(50px)" }}/>
<div style={{ position: "absolute", top: "30%", right: -60, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%)", filter: "blur(45px)" }}/>
<div style={{ position: "absolute", bottom: 60, left: -30, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.25), transparent 70%)", filter: "blur(45px)" }}/>
<div style={{ position: "absolute", bottom: -40, right: -20, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, rgba(196,181,253,0.22), transparent 70%)", filter: "blur(40px)" }}/>
        </div>

        {/* The glass card */}
        <div style={{
          flex: 1,
          position: "relative",
          zIndex: 1,
          borderRadius: 24,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          // Glass body
          backdropFilter: "blur(28px) saturate(180%) brightness(1.06)",
          WebkitBackdropFilter: "blur(28px) saturate(180%) brightness(1.06)",
          background: "linear-gradient(145deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.25) 100%)",
          border: "1px solid rgba(255,255,255,0.65)",
          boxShadow: `
            inset 0 1.5px 0 rgba(255,255,255,0.9),
            inset 0 -1px 0 rgba(255,255,255,0.1),
            inset 1px 0 0 rgba(255,255,255,0.5),
            inset -1px 0 0 rgba(255,255,255,0.15),
            0 8px 32px rgba(99,102,241,0.18),
            0 2px 8px rgba(0,0,0,0.08)
          `,
        }}>

          {/* Specular sweep — top-left light hit */}
          <div style={{ position: "absolute", inset: 0, borderRadius: 24, background: "linear-gradient(145deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 35%, transparent 55%)", pointerEvents: "none", zIndex: 0 }}/>
          {/* Top rim highlight */}
          <div style={{ position: "absolute", top: 1, left: "10%", right: "10%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,1) 30%, rgba(255,255,255,1) 70%, transparent)", borderRadius: "50%", pointerEvents: "none", zIndex: 2 }}/>

          {/* Logo */}
          <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid rgba(255,255,255,0.3)", position: "relative", zIndex: 1 }}>
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
              <span style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 16, fontWeight: 400, color: "#1A1916", letterSpacing: "-0.3px" }}>LeadFlow</span>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "14px 10px", overflowY: "auto", position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(100,80,180,0.6)", padding: "0 10px", marginBottom: 8, fontWeight: 500 }}>
              Menu
            </div>
            <NavItem icon={<LayoutDashboard size={15} strokeWidth={1.6}/>} label="Dashboard"     active={active==="dashboard"}     onClick={()=>onNav("dashboard")}/>
            <NavItem icon={<GitBranch       size={15} strokeWidth={1.6}/>} label="Lead Flow"     active={active==="leadflow"}      onClick={()=>onNav("leadflow")}/>
            <NavItem icon={<Calendar        size={15} strokeWidth={1.6}/>} label="Calendar"      active={active==="calendar"}      onClick={()=>onNav("calendar")}/>
            <NavItem icon={<Users           size={15} strokeWidth={1.6}/>} label="Lead List"     active={active==="leadlist"}      onClick={()=>onNav("leadlist")}/>
            <NavItem icon={<MessageSquare   size={15} strokeWidth={1.6}/>} label="Conversations" active={active==="conversations"} onClick={()=>onNav("conversations")}/>
            <NavItem icon={<Bot             size={15} strokeWidth={1.6}/>} label="My Agent"      active={active==="my-agent"}     onClick={()=>onNav("my-agent")}/>
          </nav>

          {/* Bottom */}
          <div style={{ padding: "10px 10px 14px", borderTop: "1px solid rgba(255,255,255,0.3)", position: "relative", zIndex: 1 }}>
            <BottomItem icon={<Settings size={15} strokeWidth={1.6}/>} label="Settings" onClick={()=>onNav("settings")} active={active==="settings"}/>
            <BottomItem icon={<LogOut   size={15} strokeWidth={1.6}/>} label="Sign out" onClick={handleSignOut}         active={false}/>

            {/* Account pill — glass on glass */}
            <div style={{
              marginTop: 10, padding: "10px",
              background: "rgba(255,255,255,0.35)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderRadius: 14,
              display: "flex", alignItems: "center", gap: 9,
              border: "1px solid rgba(255,255,255,0.55)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
            }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.7)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#4A46B5", flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#1A1916", lineHeight: 1.3 }}>My Account</div>
                <div style={{ fontSize: 10, color: "rgba(80,60,140,0.7)", fontWeight: 300, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email}</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <div
      className={active ? "sb-active-item" : "sb-item"}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "8px 10px", borderRadius: 10,
        fontSize: 13, fontWeight: active ? 500 : 400,
        color: active ? "#3730a3" : "rgba(60,40,120,0.75)",
        background: "transparent",
        cursor: "pointer", marginBottom: 2,
        transition: "all 0.14s",
        border: "1px solid transparent",
      }}
    >
      <span style={{ opacity: active ? 1 : 0.65, display: "flex" }}>{icon}</span>
      {label}
    </div>
  );
}

function BottomItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <div
      className={active ? "sb-active-item" : "sb-bottom-item"}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 9,
        padding: "8px 10px", borderRadius: 10,
        fontSize: 13, fontWeight: 400,
        color: active ? "#3730a3" : "rgba(60,40,120,0.75)",
        background: "transparent",
        cursor: "pointer", marginBottom: 2,
        transition: "all 0.14s",
        border: "1px solid transparent",
      }}
    >
      <span style={{ opacity: active ? 1 : 0.65, display: "flex" }}>{icon}</span>
      {label}
    </div>
  );
}
