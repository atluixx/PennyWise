/* Adapted from EasyUI Alert by Suraj Maurya (MIT).
   https://github.com/Surajmaurya1/easyui */
import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export function Alert({ message, error, onDismiss }: { message: string; error: boolean; onDismiss: () => void }) {
  const reduced = useReducedMotion();
  return <AnimatePresence>
    {message && <motion.div className={`easy-alert${error ? ' error' : ''}`}
      role={error ? 'alert' : 'status'} initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: reduced ? 0 : 0.2 }}>
      <span>{message}</span><button type="button" onClick={onDismiss} aria-label="Dismiss notification">×</button>
    </motion.div>}
  </AnimatePresence>;
}
