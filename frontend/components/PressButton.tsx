/* Adapted from EasyUI PressButton by Suraj Maurya, MIT license.
   https://github.com/Surajmaurya1/easyui */
import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export function PressButton({ children }: { children: React.ReactNode }) {
  const [pressed, setPressed] = useState(false);
  const reduced = useReducedMotion();
  return <motion.button type="submit" className="secondary"
    onTapStart={() => setPressed(true)} onTap={() => setPressed(false)}
    onTapCancel={() => setPressed(false)}
    animate={reduced ? {} : { scaleX: pressed ? 0.96 : 1, scaleY: pressed ? 0.936 : 1 }}
    transition={{ type: 'spring', stiffness: 450, damping: 32 }}>
    {children}
  </motion.button>;
}
