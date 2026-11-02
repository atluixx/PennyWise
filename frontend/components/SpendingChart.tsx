/* Donut arc geometry adapted from EasyUI DonutChart by Suraj Maurya, MIT license.
   https://github.com/Surajmaurya1/easyui */
import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type Datum = { label: string; value: number; color: string };
const point = (cx: number, cy: number, r: number, a: number) => ({ x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) });
function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const a = point(cx, cy, r, start), b = point(cx, cy, r, end);
  return `M${a.x.toFixed(2)} ${a.y.toFixed(2)}A${r} ${r} 0 ${end - start > Math.PI ? 1 : 0} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}
const format = (value: number) => value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
export function SpendingChart({ data }: { data: Datum[] }) {
  const [active, setActive] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (!total) return <p className="chart-empty">Your spending breakdown will appear here after you add an expense.</p>;
  let angle = 0;
  const slices = data.map((item) => {
    const start = angle;
    angle += item.value / total * Math.PI * 2;
    return { ...item, start, end: Math.min(angle, start + Math.PI * 2 - 0.0001) };
  });
  const selected = active === null ? null : data[active];
  return <div className="spending-chart">
    <div className="donut-wrap">
      <svg viewBox="0 0 220 220" role="img" aria-label={`Expenses by category. Total ${format(total)}.`}>
        <circle cx="110" cy="110" r="88" fill="none" className="donut-track" strokeWidth="22" />
        {slices.map((slice, index) => <motion.path key={`${index}-${slice.label}`}
          d={arcPath(110, 110, 88, slice.start, slice.end)} fill="none" stroke={slice.color} strokeWidth="22"
          initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1, opacity: active === null || active === index ? 1 : 0.35 }}
          transition={{ duration: reduced ? 0 : 0.55 }} onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)} />)}
      </svg>
      <div className="donut-center" aria-hidden="true"><span>{selected?.label || 'Total spent'}</span><strong>{format(selected?.value ?? total)}</strong></div>
    </div>
    <ul className="chart-legend" aria-label="Expense categories">
      {data.map((item, i) => <li key={`${i}-${item.label}`}>
        <button type="button" onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(i)} onBlur={() => setActive(null)}>
          <span className="legend-dot" style={{backgroundColor:item.color}} aria-hidden="true" />
          <span className="legend-name">{item.label}</span><strong>{format(item.value)}</strong><span className="legend-percent">{Math.round(item.value / total * 100)}%</span>
        </button>
      </li>)}
    </ul>
  </div>;
}
