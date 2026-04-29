import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export function NotificationPopup({ userId }: { userId: string }) {
  const [payload, setPayload] = useState<Record<string, any> | null>(null);
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
        (event) => {
          let data = event.new.fields;
          if (typeof data === "string") {
            try { data = JSON.parse(data); } catch { return; }
          }
          if (!data) return;
          setPayload(data);
          setNotifId(event.new.id);
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

        {/* CLOSE */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <button onClick={dismiss} style={{
            background: "none", border: "none", fontSize: 18,
            cursor: "pointer", color: "#aaa", padding: 0, lineHeight: 1
          }}>×</button>
        </div>

        {/* RENDER EVERY KEY FROM SUPABASE FIELDS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 400, overflowY: "auto" }}>
          {Object.entries(payload).map(([key, value]) => (
            <div key={key} style={{
              background: "#f9f9f9", borderRadius: 10, padding: "10px 14px"
            }}>
              <p style={{
                fontSize: 11, fontWeight: 700, color: "#888",
                textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 4px"
              }}>
                {key.replace(/_/g, " ")}
              </p>
              <p style={{ fontSize: 13, color: "#1a1a1a", margin: 0 }}>
                {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
              </p>
            </div>
          ))}
        </div>

        <button onClick={dismiss} style={{
          marginTop: 16, width: "100%", padding: "10px",
          background: "#1a1a1a", color: "#fff", border: "none",
          borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer"
        }}>
          Got it
        </button>
      </div>
    </div>
  );
}
