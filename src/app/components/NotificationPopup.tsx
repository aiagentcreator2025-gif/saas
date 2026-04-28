import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

type NotifField = {
  field: string;
  issue: string;
  current: string;
  example: string;
};

export function NotificationPopup({ userId }: { userId: string }) {
  const [fields, setFields] = useState<NotifField[]>([]);
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
          setFields(payload.new.fields);
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

  if (!visible) return null;

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
          {fields.map((f, i) => (
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
