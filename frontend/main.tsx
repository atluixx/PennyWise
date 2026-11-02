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
