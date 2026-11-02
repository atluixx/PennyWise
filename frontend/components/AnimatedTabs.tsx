/* Adapted from EasyUI AnimatedTabs by Suraj Maurya, MIT license.
   https://github.com/Surajmaurya1/easyui */
import React, { useState, useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface TabItem { id: string; label: string }
interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab?: string;
  defaultTab?: string;
  onChange?: (id: string) => void;
  label: string;
}

export function AnimatedTabs({ tabs, activeTab: controlled, defaultTab, onChange, label }: AnimatedTabsProps) {
  const [internal, setInternal] = useState(defaultTab || tabs[0]?.id || '');
  const active = controlled ?? internal;
  const layoutId = useId();
  const reduced = useReducedMotion();
  return <div className="easy-tabs" role="group" aria-label={label}>
    {tabs.map(tab => <button type="button" className="easy-tab" key={tab.id}
      aria-pressed={active === tab.id} onClick={() => {
        if (controlled === undefined) setInternal(tab.id);
        onChange?.(tab.id);
      }}>
      {active === tab.id && <motion.span className="easy-tab-indicator" layoutId={layoutId}
        transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 430, damping: 34 }} />}
      <span className="easy-tab-label">{tab.label}</span>
    </button>)}
  </div>;
}
