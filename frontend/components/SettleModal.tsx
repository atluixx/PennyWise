/* Adapted from EasyUI SettleModal by Suraj Maurya (MIT).
   https://github.com/Surajmaurya1/easyui */
import React, { useEffect, useId, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export type DialogOptions = {
  title: string;
  description: string;
  confirmLabel: string;
  initialValue?: string;
  destructive?: boolean;
};

export function SettleModal({ options, onClose }: { options: DialogOptions; onClose: (value: string | boolean | null) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(options.initialValue ?? '');
  const titleId = useId();
  const descriptionId = useId();
  const reduceMotion = useReducedMotion();
  const isPrompt = options.initialValue !== undefined;

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    (isPrompt ? input.current : cancelButton.current)?.focus();
    return () => { if (element.open) element.close(); if (previous?.isConnected) previous.focus(); };
  }, [isPrompt]);

  return <dialog ref={dialog} className="settle-dialog" aria-labelledby={titleId} aria-describedby={descriptionId}
    onCancel={event => { event.preventDefault(); onClose(null); }}>
    <motion.div className="settle-panel" initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}>
      <h2 id={titleId}>{options.title}</h2>
      <p id={descriptionId}>{options.description}</p>
      <form onSubmit={event => { event.preventDefault(); if (isPrompt && !value.trim()) { input.current?.setCustomValidity('Enter a category name.'); input.current?.reportValidity(); return; } onClose(isPrompt ? value.trim() : true); }}>
        {isPrompt && <label>Category name<input ref={input} value={value} required maxLength={255}
          onChange={event => { event.currentTarget.setCustomValidity(''); setValue(event.currentTarget.value); }} /></label>}
        <div className="settle-actions">
          <button type="button" ref={cancelButton} className="settle-cancel" onClick={() => onClose(null)}>Cancel</button>
          <button type="submit" className={options.destructive ? 'settle-confirm destructive' : 'settle-confirm'}>{options.confirmLabel}</button>
        </div>
      </form>
    </motion.div>
  </dialog>;
}
