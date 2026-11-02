import React from 'react';
import { createRoot } from 'react-dom/client';
import { AnimatedTabs } from './components/AnimatedTabs';

const controls = [
  { target: 'type-tabs', input: 'transaction-type', label: 'Transaction type', tabs: [{id: 'EXPENSE', label: 'Expense'}, {id: 'INCOME', label: 'Income'}] },
  { target: 'filter-tabs', input: 'transaction-filter', label: 'Filter transactions', tabs: [{id: 'ALL', label: 'All'}, {id: 'EXPENSE', label: 'Expenses'}, {id: 'INCOME', label: 'Income'}] },
];
for (const control of controls) {
  const target = document.getElementById(control.target);
  const input = document.getElementById(control.input) as HTMLInputElement | null;
  if (!target || !input) continue;
  function Control() {
    const [value, setValue] = React.useState(input!.value);
    React.useEffect(() => {
      const update = () => setValue(input!.value);
      input!.addEventListener('change', update);
      return () => input!.removeEventListener('change', update);
    }, []);
    return <AnimatedTabs tabs={control.tabs} label={control.label} activeTab={value}
      onChange={next => { input!.value = next; input!.dispatchEvent(new Event('change', { bubbles: true })); }} />;
  }
  createRoot(target).render(<Control />);
}

import { PressButton } from './components/PressButton';
const categoryButton = document.getElementById('category-submit');
if (categoryButton) createRoot(categoryButton).render(<PressButton>Add</PressButton>);

import { SpendingChart } from './components/SpendingChart';
type Summary = { categories: {categoryName: string; expenses: number}[] };
declare global { interface Window { pennywiseSummary?: Summary } }
const chartRoot = document.getElementById('spending-chart');
if (chartRoot) {
  const colors = ['#315b47', '#789d79', '#d39b71', '#7b8d9d', '#b797b2', '#b6a069', '#587e76'];
  function Chart() {
    const [summary, setSummary] = React.useState<Summary | undefined>(window.pennywiseSummary);
    React.useEffect(() => {
      const update = (event: Event) => setSummary((event as CustomEvent<Summary>).detail);
      window.addEventListener('pennywise:summary', update);
      if (window.pennywiseSummary) setSummary(window.pennywiseSummary);
      return () => window.removeEventListener('pennywise:summary', update);
    }, []);
    const data = (summary?.categories || []).filter(item => Number(item.expenses) > 0)
      .sort((a, b) => Number(b.expenses) - Number(a.expenses))
      .map((item, index) => ({ label: item.categoryName, value: Number(item.expenses), color: colors[index % colors.length] }));
    return <SpendingChart data={data} />;
  }
  createRoot(chartRoot).render(<Chart />);
}

import { SettleModal, type DialogOptions } from './components/SettleModal';
declare global { interface Window { pennywiseDialog?: (options: DialogOptions) => Promise<string | boolean | null> } }
const dialogHost = document.getElementById('dialog-host');
if (dialogHost) {
  const dialogRoot = createRoot(dialogHost);
  let pending: ((value: string | boolean | null) => void) | null = null;
  window.pennywiseDialog = options => new Promise(resolve => {
    if (pending) { resolve(null); return; }
    pending = resolve;
    dialogRoot.render(<SettleModal options={options} onClose={value => {
      dialogRoot.render(null);
      const complete = pending;
      pending = null;
      complete?.(value);
    }} />);
  });
}

import { Alert } from './components/Alert';
const alertHost = document.getElementById('message');
if (alertHost) {
  function Notifications() {
    const [notice, setNotice] = React.useState({ message: '', error: false });
    React.useEffect(() => {
      const show = (event: Event) => setNotice((event as CustomEvent<{message: string; error: boolean}>).detail);
      window.addEventListener('pennywise:notice', show);
      return () => window.removeEventListener('pennywise:notice', show);
    }, []);
    React.useEffect(() => {
      if (!notice.message) return;
      const timer = window.setTimeout(() => setNotice({message: '', error: false}), 6000);
      return () => window.clearTimeout(timer);
    }, [notice]);
    return <Alert message={notice.message} error={notice.error} onDismiss={() => setNotice({message: '', error: false})} />;
  }
  alertHost.hidden = false;
  createRoot(alertHost).render(<Notifications />);
  window.pennywiseNotify = (message, error) => window.dispatchEvent(new CustomEvent('pennywise:notice', {detail: {message, error}}));
}
declare global { interface Window { pennywiseNotify?: (message: string, error: boolean) => void } }
