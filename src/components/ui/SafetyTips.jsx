import React from 'react';
import { ShieldCheck } from 'lucide-react';

const DEFAULT_TIPS = [
  "Inspect the product in person whenever possible before paying.",
  "Meet sellers in safe, public locations during daylight hours.",
  "Never share OTPs, card PINs, or bank passwords with anyone.",
  "Pay only after you have received and verified the item.",
  "Use ThriftLink in-app chat — avoid switching to anonymous channels.",
  "If a deal looks too good to be true, it probably is.",
  "Report suspicious sellers or listings using the Report button.",
];

const SafetyTips = ({ title = 'Safety Tips', tips = DEFAULT_TIPS, compact = false }) => (
  <aside className="tl-safety" aria-label={title}>
    <h4>
      <ShieldCheck size={18} />
      {title}
    </h4>
    <ul style={{ marginTop: compact ? 4 : 8 }}>
      {tips.map((tip, i) => (
        <li key={i}>{tip}</li>
      ))}
    </ul>
  </aside>
);

export default SafetyTips;
