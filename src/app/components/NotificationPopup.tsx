import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

type NotifField = {
  field: string;
  issue: string;
  current: string;
  example: string;
};

type NotifPayload = {
  type: "approved" | "error";
  fields?: NotifField[];
  prompt_id?: string;
};

export function NotificationPopup({ userId }: { userId: string }) {
  const [payload, setPayload] = useState<NotifPayload | null>(null);
  const [visible, setVisible] = useState(false);
  const [notifId, setNotifId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setPayload(payload.new.fields);
          setNotifId(payload.new.id);
          setVisible(true);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const dismiss = async () => {
    if (notifId) {
      await supabase.from("notifications").update({ read: true }).eq("id", notifId);
    }
    setVisible(false);
  };

  if (!visible || !payload) return null;

  // APPROVED
  if (payload.type === "approved") {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, fontFamily: "'Plus Jakarta Sans', sans-serif"
      }}>
        <div style={{
          background: "#fff", borderRadius: 16, padding: "24px 28px",
          width: "100%", maxWidth: 480, boxShadow: "0 8px 32px rgba(0,0,0,0.12)"
        }}>
          <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", margin: "0 0 6px" }}>
              Your agent is ready!
            </p>
            <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
              Your WhatsApp sales agent prompt has been built and scored. Go check it out.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={dismiss} style={{
              flex: 1, padding: "10px",
              background: "#f5f5f5", color: "#888", border: "none",
              borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer"
            }}>
              Later
            </button>
            <button
              onClick={() => {
                dismiss();
                window.location.href = `/prompt/${payload.prompt_id}`;
              }}
              style={{
                flex: 2, padding: "10px",
                background: "#1a1a1a", color: "#fff", border: "none",
                borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer"
              }}
            >
              View my agent →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ERROR
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "24px 28px",
        width: "100%", maxWidth: 480, boxShadow: "0 8px 32px rgba(0,0,0,0.12)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>
              Some fields need fixing
            </p>
            <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>
              Please update these before we can generate your agent
            </p>
          </div>
          <button onClick={dismiss} style={{
            background: "none", border: "none", fontSize: 18,
            cursor: "pointer", color: "#aaa", padding: 0, lineHeight: 1
          }}>x</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflowY: "auto" }}>
          {(payload.fields ?? []).map((f, i) => (
            <div key={i} style={{
              background: "#FFF8F8", border: "0.5px solid #F7C1C1",
              borderRadius: 10, padding: "10px 14px"
            }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#A32D2D", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {f.field.replace(/_/g, " ")}
              </p>
              <p style={{ fontSize: 13, color: "#444", margin: "0 0 4px" }}>{f.issue}</p>
              <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
                Example: <span style={{ color: "#1D9E75", fontStyle: "italic" }}>{f.example}</span>
              </p>
            </div>
          ))}
        </div>
        <button onClick={dismiss} style={{
          marginTop: 16, width: "100%", padding: "10px",
          background: "#1a1a1a", color: "#fff", border: "none",
          borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer"
        }}>
          Got it — I'll fix it
        </button>
      </div>
    </div>
  );
}
