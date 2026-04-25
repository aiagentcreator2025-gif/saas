import { useState } from "react";
import { Plus, Settings, Zap, MessageSquare, Gift, Phone, Calendar } from "lucide-react";

interface FlowStep {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  content: string;
  live: boolean;
}

const INITIAL_STEPS: FlowStep[] = [
  { id: "1", label: "Trigger", sublabel: "WhatsApp Connection", color: "#8B5CF6", bg: "#F5F3FF", border: "#DDD6FE", icon: <Zap size={16} />, content: "When a new lead messages on WhatsApp", live: true },
  { id: "2", label: "Script 1", sublabel: "Welcome Message", color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE", icon: <MessageSquare size={16} />, content: "Hello {name}! Welcome to our service. Let me send you something valuable...", live: true },
  { id: "3", label: "Lead Magnet", sublabel: "Send Resource", color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0", icon: <Gift size={16} />, content: "Sending free guide: '5 Ways to Grow Your Business in 2025'", live: true },
  { id: "4", label: "Script 2", sublabel: "Closing Message", color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A", icon: <Phone size={16} />, content: "Did you get a chance to check it out? I'd love to show you how we can help...", live: false },
  { id: "5", label: "Booking", sublabel: "Schedule Call", color: "#EF4444", bg: "#FFF1F2", border: "#FECDD3", icon: <Calendar size={16} />, content: "Here's my calendar link to book a free strategy call:", live: false },
];

export function LeadFlowScreen() {
  const [steps] = useState<FlowStep[]>(INITIAL_STEPS);
  const [selected, setSelected] = useState<string | null>("1");
  const selectedStep = steps.find(s => s.id === selected);

  return (
    <div style={{ display: "flex", height: "100vh", background: "#F8F9FC" }}>
      <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F1117", letterSpacing: "-0.4px", marginBottom: 3 }}>Lead Flow</h1>
            <p style={{ fontSize: 12, color: "#6B7280" }}>Customize your lead automation sequence</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ padding: "8px 16px", borderRadius: 9, border: "1px solid #E5E7EB", background: "#fff", fontSize: 12, fontWeight: 600, color: "#374151", cursor: "pointer" }}>Test Flow</button>
            <button style={{ padding: "8px 16px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }}>Publish</button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 500, margin: "0 auto" }}>
          {steps.map((step, i) => (
            <div key={step.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
              <div onClick={() => setSelected(step.id)} style={{
                width: "100%", padding: "16px 18px", borderRadius: 14,
                border: `2px solid ${selected === step.id ? step.color : step.border}`,
                background: selected === step.id ? step.bg : "#fff",
                cursor: "pointer", transition: "all 0.18s",
                boxShadow: selected === step.id ? `0 8px 24px ${step.color}22` : "0 1px 4px rgba(0,0,0,0.06)",
                position: "relative", overflow: "hidden",
              }}>
                {step.live && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${step.color},${step.color}88)` }} />}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: step.bg, color: step.color, border: `1.5px solid ${step.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {step.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0F1117" }}>{step.label}</div>
                      <div style={{ fontSize: 10, color: "#6B7280" }}>{step.sublabel}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {step.live ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 9, fontWeight: 700, color: "#10B981", background: "rgba(16,185,129,0.1)", padding: "3px 9px", borderRadius: 20 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                        Live
                      </div>
                    ) : (
                      <div style={{ fontSize: 9, fontWeight: 600, color: "#9CA3AF", background: "#F3F4F6", padding: "3px 9px", borderRadius: 20 }}>Draft</div>
                    )}
                    <Settings size={14} color="#9CA3AF" />
                  </div>
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: "#6B7280", lineHeight: 1.5, paddingLeft: 44 }}>{step.content}</div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "4px 0" }}>
                  <div style={{ width: 2, height: 20, background: "linear-gradient(180deg,#E5E7EB,#D1D5DB)" }} />
                  <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid #E5E7EB", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9CA3AF" }}>
                    <Plus size={12} />
                  </div>
                  <div style={{ width: 2, height: 20, background: "linear-gradient(180deg,#D1D5DB,#E5E7EB)" }} />
                </div>
              )}
            </div>
          ))}
          <button style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, border: "2px dashed #D1D5DB", background: "#fff", fontSize: 12, fontWeight: 600, color: "#9CA3AF", cursor: "pointer", width: "100%", justifyContent: "center" }}>
            <Plus size={14} /> Add Step
          </button>
        </div>
      </div>

      <div style={{ width: 300, background: "#fff", borderLeft: "1px solid #E5E7EB", padding: "24px 20px", overflowY: "auto" }}>
        {selectedStep ? (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F1117", marginBottom: 4 }}>{selectedStep.label} Settings</div>
              <div style={{ fontSize: 11, color: "#6B7280" }}>Configure this step</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Step Type</label>
              <div style={{ padding: "9px 12px", borderRadius: 9, border: `1.5px solid ${selectedStep.border}`, background: selectedStep.bg, fontSize: 12, fontWeight: 600, color: selectedStep.color, display: "flex", alignItems: "center", gap: 8 }}>
                {selectedStep.icon}{selectedStep.sublabel}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Message / Content</label>
              <textarea defaultValue={selectedStep.content} style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 9, fontSize: 12, color: "#0F1117", background: "#FAFBFE", outline: "none", resize: "none", height: 100, lineHeight: 1.5, fontFamily: "inherit" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Send Delay</label>
              <select style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #E5E7EB", borderRadius: 9, fontSize: 12, color: "#0F1117", background: "#fff", outline: "none" }}>
                <option>Immediately</option>
                <option>After 5 minutes</option>
                <option>After 1 hour</option>
                <option>After 24 hours</option>
              </select>
            </div>
            <button style={{ width: "100%", padding: "11px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Save Changes</button>
          </>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#9CA3AF" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>👆</div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>Click a step to configure it</div>
          </div>
        )}
      </div>
    </div>
  );
}
