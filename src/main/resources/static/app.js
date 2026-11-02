'use strict';
const $ = (selector) => document.querySelector(selector);
const state = { token: sessionStorage.getItem('pennywise-token'), categories: [], transactions: [], registering: false };
let messageTimer;
const themeToggle = $('#theme-toggle');
function updateThemeButton() {
  const dark = document.documentElement.dataset.theme === 'dark';
  themeToggle.textContent = dark ? 'Light mode' : 'Dark mode';
  themeToggle.setAttribute('aria-pressed', String(dark));
  themeToggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
}
themeToggle.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('pennywise-theme', theme); } catch { /* Storage is optional. */ }
  updateThemeButton();
});
updateThemeButton();
function notify(message, error = false) {
  if (window.pennywiseNotify) { window.pennywiseNotify(message, error); return; }
  const box = $('#message'); box.textContent = message; box.classList.toggle('error', error); box.hidden = false;
  clearTimeout(messageTimer); messageTimer = setTimeout(() => { box.hidden = true; }, 6000);
}
async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (state.token) headers.set('Authorization', `Bearer ${state.token}`);
  if (options.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(path, { ...options, headers });
  if (response.status === 401 && state.token && !path.startsWith('/auth/')) {
    signOut(); throw new Error('Your session expired. Please sign in again.');
  }
  if (!response.ok) {
    let data; try { data = await response.json(); } catch { /* no error body */ }
    const details = data?.fieldErrors ? Object.values(data.fieldErrors).join('. ') : '';
    throw new Error(details || data?.message || `Request failed (${response.status}).`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
function openDialog(options) {
  if (!window.pennywiseDialog) { notify('The dialog is still loading. Please try again.', true); return Promise.resolve(null); }
  return window.pennywiseDialog(options);
}
function element(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; }
function button(label, action) { const el = element('button', 'text-button', label); el.type = 'button'; el.addEventListener('click', action); return el; }
function money(value) { return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function signOut() { state.categories = []; state.transactions = []; window.pennywiseSummary = { categories: [] }; window.dispatchEvent(new CustomEvent('pennywise:summary', { detail: window.pennywiseSummary })); state.token = null; sessionStorage.removeItem('pennywise-token'); $('#dashboard').hidden = true; $('#logout').hidden = true; $('#auth-view').hidden = false; resetTransaction(); }
function showDashboard() { $('#auth-view').hidden = true; $('#dashboard').hidden = false; $('#logout').hidden = false; }
let entryStep = 0;
function showEntryStep(step, focus = false) {
  entryStep = step;
  document.querySelectorAll('[data-entry-step]').forEach(section => { section.hidden = Number(section.dataset.entryStep) !== step; });
  $('#entry-progress').textContent = `${step + 1} of 3`;
  $('#entry-progress-fill').style.width = `${(step + 1) * 100 / 3}%`;
  $('#entry-back').hidden = step === 0;
  $('#save-transaction').textContent = step === 2 ? ($('#transaction-form').elements.id.value ? 'Save changes' : 'Add transaction') : 'Continue';
  if (step === 2) {
    const form = $('#transaction-form');
    const category = form.elements.categoryId.selectedOptions[0];
    $('#entry-recap').textContent = `${form.elements.type.value === 'INCOME' ? 'Income' : 'Expense'} · ${money(form.elements.amount.value)} · ${category?.textContent || ''}`;
  }
  if (focus) document.querySelector(`[data-entry-step="${step}"] h3`).focus();
}
function resetTransaction() { const form = $('#transaction-form'); form.reset(); form.elements.id.value = ''; form.elements.categoryId.value = ''; form.elements.transactionDate.value = new Date().toLocaleDateString('en-CA'); form.elements.type.dispatchEvent(new Event('change', { bubbles: true })); form.elements.categoryId.dispatchEvent(new Event('change', { bubbles: true })); $('#transaction-heading').textContent = 'Add a transaction'; $('#cancel-edit').hidden = true; showEntryStep(0); }
function renderCategories() {
  const select = $('#category-select'); const selected = select.value; select.replaceChildren();
  const option = element('option', '', state.categories.length ? 'Choose a category' : 'Create a category first'); option.value = ''; select.append(option);
  $('#entry-category-empty').hidden = state.categories.length > 0;
  for (const category of state.categories) { const option = element('option', '', category.name); option.value = category.id; select.append(option); }
  if ([...select.options].some(option => option.value === selected)) select.value = selected;
  const shortcuts = $('#category-shortcuts'); shortcuts.replaceChildren();
  for (const category of state.categories) { const chip = button(category.name, () => { select.value = String(category.id); select.dispatchEvent(new Event('change', { bubbles: true })); }); chip.className = 'category-chip'; chip.setAttribute('aria-pressed', String(select.value === String(category.id))); shortcuts.append(chip); }
  const list = $('#categories'); list.replaceChildren();
  if (!state.categories.length) list.append(element('p', 'empty', 'No categories yet.'));
  for (const category of state.categories) {
    const row = element('div', 'category-item'); row.append(element('span', '', category.name));
    const actions = element('div', 'row-actions');
    actions.append(button('Rename', async () => { const name = await openDialog({ title: 'Rename category', description: 'Choose a new name for this category.', confirmLabel: 'Save name', initialValue: category.name }); if (typeof name !== 'string') return; try { await api(`/categories/${category.id}`, { method: 'PUT', body: JSON.stringify({ name }) }); await refresh(); notify('Category updated.'); } catch (e) { notify(e.message, true); } }));
    actions.append(button('Delete', async () => { if (!await openDialog({ title: 'Delete category?', description: `Delete ${category.name}? Categories with transactions cannot be deleted.`, confirmLabel: 'Delete category', destructive: true })) return; try { await api(`/categories/${category.id}`, { method: 'DELETE' }); await refresh(); notify('Category deleted.'); } catch (e) { notify(e.message.includes('conflicts') ? 'Delete this category’s transactions first.' : e.message, true); } }));
    row.append(actions); list.append(row);
  }
}
function renderTransactions() {
  const rows = $('#transactions'); rows.replaceChildren();
  const items = state.transactions.filter(item => item.transactionDate.startsWith($('#month').value) && ($('#transaction-filter').value === 'ALL' || item.type === $('#transaction-filter').value)).sort((a, b) => b.transactionDate.localeCompare(a.transactionDate) || b.id - a.id);
  $('#transaction-count').textContent = `${items.length} ${items.length === 1 ? 'entry' : 'entries'}`;
  if (!items.length) rows.append(element('p', 'empty', $('#transaction-filter').value === 'ALL' ? 'No transactions this month. Add your first entry to get started.' : 'No transactions match this filter for the selected month.'));
  for (const item of items) {
    const category = state.categories.find(c => c.id === item.categoryId);
    const row = element('div', 'row'); const info = element('div');
    info.append(element('div', 'row-name', item.description || category?.name || 'Transaction'));
    info.append(element('div', 'row-meta', `${category?.name || 'Category'} · ${item.transactionDate}`)); row.append(info);
    const right = element('div', 'row-actions'); right.append(element('span', 'row-amount', `${item.type === 'INCOME' ? '+' : '−'}${money(item.amount)}`));
    right.append(button('Edit', () => { const f = $('#transaction-form'); for (const key of ['id','type','amount','transactionDate','description','categoryId']) f.elements[key].value = item[key] ?? ''; f.elements.type.dispatchEvent(new Event('change', { bubbles: true })); f.elements.categoryId.dispatchEvent(new Event('change', { bubbles: true })); $('#transaction-heading').textContent = 'Edit transaction'; $('#cancel-edit').hidden = false; showEntryStep(0, true); }));
    right.append(button('Delete', async () => { if (!await openDialog({ title: 'Delete transaction?', description: 'This transaction will be permanently removed.', confirmLabel: 'Delete transaction', destructive: true })) return; try { await api(`/transactions/${item.id}`, { method: 'DELETE' }); await refresh(); notify('Transaction deleted.'); } catch (e) { notify(e.message, true); } })); row.append(right); rows.append(row);
  }
}
function renderSummary(summary) {
  window.pennywiseSummary = summary; window.dispatchEvent(new CustomEvent('pennywise:summary', { detail: summary }));
  const income = Number(summary.totalIncome), expense = Number(summary.totalExpenses), max = Math.max(income, expense);
  $('#income-bar').style.width = `${max ? income / max * 100 : 0}%`; $('#expense-bar').style.width = `${max ? expense / max * 100 : 0}%`;
  $('#income-bar-value').textContent = money(income); $('#expense-bar-value').textContent = money(expense);
  $('#cashflow-chart').setAttribute('aria-label', `Income ${money(income)} and expenses ${money(expense)} for ${summary.month}.`);
  $('#income').textContent = money(summary.totalIncome); $('#expenses').textContent = money(summary.totalExpenses); $('#balance').textContent = money(summary.balance);
  const rows = $('#category-totals'); rows.replaceChildren();
  if (!summary.categories.length) rows.append(element('p', 'empty', 'Category totals will appear once you add a transaction.'));
  for (const item of summary.categories) { const row = element('div', 'row'); const info = element('div'); info.append(element('div', 'row-name', item.categoryName), element('div', 'row-meta', `Income ${money(item.income)} · Expenses ${money(item.expenses)}`)); row.append(info, element('span', 'row-amount', money(item.balance))); rows.append(row); }
}
async function refresh() {
  const [categories, transactions, summary] = await Promise.all([api('/categories'), api('/transactions'), api(`/summary?month=${encodeURIComponent($('#month').value)}`)]);
  state.categories = categories; state.transactions = transactions; renderCategories(); renderTransactions(); renderSummary(summary);
}
$('#auth-switch').addEventListener('click', () => { state.registering = !state.registering; $('#auth-title').textContent = state.registering ? 'Create your account' : 'Welcome back'; $('#auth-description').textContent = state.registering ? 'Start keeping track of your money.' : 'Sign in to see your finances.'; $('#auth-submit').textContent = state.registering ? 'Create account' : 'Sign in'; $('#switch-copy').textContent = state.registering ? 'Already have an account?' : 'New to PennyWise?'; $('#auth-switch').textContent = state.registering ? 'Sign in' : 'Create an account'; $('#auth-form').elements.password.autocomplete = state.registering ? 'new-password' : 'current-password'; });
$('#auth-form').addEventListener('submit', async event => { event.preventDefault(); const f = event.currentTarget; const payload = JSON.stringify({ email: f.elements.email.value, password: f.elements.password.value }); $('#auth-submit').disabled = true; try { if (state.registering) { await api('/auth/register', { method: 'POST', body: payload }); state.registering = false; } const result = await api('/auth/login', { method: 'POST', body: payload }); state.token = result.accessToken; sessionStorage.setItem('pennywise-token', state.token); f.reset(); showDashboard(); await refresh(); } catch (e) { notify(e.message, true); } finally { $('#auth-submit').disabled = false; } });
$('#logout').addEventListener('click', signOut);
$('#category-select').addEventListener('change', () => { for (const [index, chip] of [...$('#category-shortcuts').children].entries()) chip.setAttribute('aria-pressed', String(String(state.categories[index]?.id) === $('#category-select').value)); });
$('#transaction-filter').addEventListener('change', renderTransactions);
$('#month').addEventListener('change', () => refresh().catch(e => notify(e.message, true)));
$('#cancel-edit').addEventListener('click', resetTransaction);
$('#entry-back').addEventListener('click', () => showEntryStep(Math.max(0, entryStep - 1), true));
$('#category-form').addEventListener('submit', async event => { event.preventDefault(); const f = event.currentTarget; try { await api('/categories', { method: 'POST', body: JSON.stringify({ name: f.elements.name.value }) }); f.reset(); await refresh(); notify('Category added.'); } catch (e) { notify(e.message, true); } });
$('#transaction-form').addEventListener('submit', async event => { event.preventDefault(); const f = event.currentTarget;
  const field = entryStep === 0 ? f.elements.amount : entryStep === 1 ? f.elements.categoryId : f.elements.transactionDate;
  if (!field.reportValidity()) return;
  if (entryStep < 2) { showEntryStep(entryStep + 1, true); return; }
  const id = f.elements.id.value; const payload = { type: f.elements.type.value, amount: f.elements.amount.value, categoryId: Number(f.elements.categoryId.value), transactionDate: f.elements.transactionDate.value, description: f.elements.description.value || null }; const submit = $('#save-transaction'); submit.disabled = true; try { await api(id ? `/transactions/${id}` : '/transactions', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) }); resetTransaction(); await refresh(); notify(id ? 'Transaction updated.' : 'Transaction added.'); } catch (e) { notify(e.message, true); } finally { submit.disabled = false; } });
$('#month').value = new Date().toLocaleDateString('en-CA').slice(0, 7); resetTransaction();
if (state.token) { showDashboard(); refresh().catch(e => notify(e.message, true)); }
