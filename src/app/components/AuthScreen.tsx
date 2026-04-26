import { useState } from "react";
import { supabase } from "../supabaseClient";

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  .auth-btn:hover { opacity: .85; }
  .auth-toggle:hover { opacity: .7; }
`;

interface Props {
  onAuth: () => void;
}

export function AuthScreen({ onAuth }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
  setLoading(true);
  setError("");
  const { error } = mode === "login"
    ? await supabase.auth.signInWithPassword({ email, password })
    : await supabase.auth.signUp({ email, password });
  setLoading(false);
  if (error) {
    setError(error.message);
  } else {
    onAuth();
  }
};

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ minHeight: "100vh", background: "#F9F9F8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ width: 420, background: "#fff", borderRadius: 20, border: "1px solid #E8E6E0", padding: "40px 40px" }}>
          
          <div style={{ marginBottom: 32, textAlign: "center" }}>
            <img
              src="https://raw.githubusercontent.com/aiagentcreator2025-gif/app/main/LeadFlow_transparent%20(4).png"
              alt="LeadFlow"
              style={{ height: 52, objectFit: "contain" }}
            />
          </div>

          <h1 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 22, fontWeight: 400, color: "#1A1916", marginBottom: 6, textAlign: "center" }}>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p style={{ fontSize: 12, color: "#8A8680", fontWeight: 300, textAlign: "center", marginBottom: 28 }}>
            {mode === "login" ? "Sign in to your LeadFlow account" : "Start automating your lead flow"}
          </p>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 9, color: "#8A8680", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6, fontWeight: 400 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #E8E6E0", borderRadius: 10, fontSize: 13, color: "#1A1916", background: "#F9F9F8", outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: "block", fontSize: 9, color: "#8A8680", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6, fontWeight: 400 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #E8E6E0", borderRadius: 10, fontSize: 13, color: "#1A1916", background: "#F9F9F8", outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }}
            />
          </div>

          {error && <div style={{ fontSize: 12, color: "#D85A30", marginBottom: 14, textAlign: "center" }}>{error}</div>}

          <button
            className="auth-btn"
            onClick={handle}
            disabled={loading}
            style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "#1A1916", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "opacity .15s" }}
          >
            {loading ? "..." : mode === "login" ? "Sign in" : "Create account"}
          </button>

          <div style={{ textAlign: "center", marginTop: 18 }}>
            <span style={{ fontSize: 12, color: "#8A8680" }}>
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            </span>
            <span
              className="auth-toggle"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              style={{ fontSize: 12, color: "#4A46B5", cursor: "pointer", fontWeight: 500, transition: "opacity .15s" }}
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
