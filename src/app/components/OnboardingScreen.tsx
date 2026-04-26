import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  .ob-btn:hover { opacity: .85; }
  .ob-back:hover { background: #F2F1EE !important; }
`;

interface Props {
  onComplete: () => void;
}

const STEPS = [
  {
    title: "Your Business",
    subtitle: "Let's start with the basics",
    fields: [
      { key: "business_name", label: "Business name", placeholder: "e.g. Ahmed Coaching" },
      { key: "industry", label: "Industry", placeholder: "e.g. Business coaching, Real estate..." },
    ]
  },
  {
    title: "Offer & Audience",
    subtitle: "Tell us about what you sell",
    fields: [
      { key: "main_offer", label: "Main offer / service", placeholder: "e.g. 1-on-1 business coaching program" },
      { key: "price", label: "Price", placeholder: "e.g. $2,000 / month" },
      { key: "ideal_client", label: "Ideal client", placeholder: "e.g. Entrepreneurs doing $5k-$20k/month" },
      { key: "top_result", label: "#1 result you get clients", placeholder: "e.g. Double revenue in 90 days" },
    ]
  },
  {
    title: "Lead Magnet",
    subtitle: "What do you offer for free to attract leads?",
    fields: [
      { key: "lead_magnet_title", label: "Lead magnet title", placeholder: "e.g. Free guide: 5 ways to grow your business" },
      { key: "lead_magnet_description", label: "What's inside", placeholder: "Briefly describe what's in your lead magnet..." },
    ]
  },
  {
    title: "Proof & Credibility",
    subtitle: "Help us understand your track record",
    fields: [
      { key: "years_experience", label: "Years of experience", placeholder: "e.g. 5 years" },
      { key: "clients_helped", label: "Number of clients helped", placeholder: "e.g. 120+ clients" },
      { key: "biggest_win", label: "Biggest client win / testimonial", placeholder: "e.g. Helped John go from $3k to $15k/month in 60 days" },
    ]
  },
  {
    title: "Sales Process",
    subtitle: "How do you currently close clients?",
    fields: [
      { key: "how_you_close", label: "How do you close clients", placeholder: "e.g. Discovery call then proposal" },
      { key: "sales_cycle", label: "Average sales cycle", placeholder: "e.g. 3-7 days from first contact" },
      { key: "main_objection", label: "Main objection you face", placeholder: "e.g. Price, need to think about it..." },
    ]
  },
];

export function OnboardingScreen({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const update = (key: string, val: string) => setData(prev => ({ ...prev, [key]: val }));

  const next = async () => {
    if (!isLast) { setStep(s => s + 1); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("accounts_leadflow").upsert({
      user_id: user.id,
      ...data,
      onboarding_completed: true,
    });
    setLoading(false);
    onComplete();
  };

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ minHeight: "100vh", background: "#F9F9F8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ width: 520, background: "#fff", borderRadius: 20, border: "1px solid #E8E6E0", padding: "40px 40px" }}>

          {/* Progress */}
          <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 10, background: i <= step ? "#4A46B5" : "#E8E6E0", transition: "background .3s" }} />
            ))}
          </div>

          {/* Step label */}
          <div style={{ fontSize: 9, color: "#8A8680", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 8, fontWeight: 400 }}>
            Step {step + 1} of {STEPS.length}
          </div>

          <h1 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 22, fontWeight: 400, color: "#1A1916", marginBottom: 4 }}>
            {current.title}
          </h1>
          <p style={{ fontSize: 12, color: "#8A8680", fontWeight: 300, fontStyle: "italic", marginBottom: 28 }}>
            {current.subtitle}
          </p>

          {/* Fields */}
          {current.fields.map(f => (
            <div key={f.key} style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 9, color: "#8A8680", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 6, fontWeight: 400 }}>{f.label}</label>
              <input
                value={data[f.key] || ""}
                onChange={e => update(f.key, e.target.value)}
                placeholder={f.placeholder}
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #E8E6E0", borderRadius: 10, fontSize: 13, color: "#1A1916", background: "#F9F9F8", outline: "none", fontFamily: "'DM Sans', sans-serif", fontWeight: 300, boxSizing: "border-box" }}
              />
            </div>
          ))}

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
            {step > 0 && (
              <button
                className="ob-back"
                onClick={() => setStep(s => s - 1)}
                style={{ padding: "11px 20px", borderRadius: 10, border: "1px solid #E8E6E0", background: "#fff", fontSize: 13, color: "#8A8680", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "background .15s" }}
              >
                Back
              </button>
            )}
            <button
              className="ob-btn"
              onClick={next}
              disabled={loading}
              style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "#1A1916", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "opacity .15s" }}
            >
              {loading ? "Saving..." : isLast ? "Finish setup →" : "Continue →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
