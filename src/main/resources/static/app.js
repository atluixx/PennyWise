'use strict';
const $ = (selector) => document.querySelector(selector);
const state = { token: sessionStorage.getItem('pennywise-token'), categories: [], transactions: [], registering: false };
let messageTimer;
function notify(message, error = false) {
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
function element(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text != null) node.textContent = text; return node; }
function button(label, action) { const el = element('button', 'text-button', label); el.type = 'button'; el.addEventListener('click', action); return el; }
function money(value) { return Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function signOut() { state.token = null; sessionStorage.removeItem('pennywise-token'); $('#dashboard').hidden = true; $('#logout').hidden = true; $('#auth-view').hidden = false; }
function showDashboard() { $('#auth-view').hidden = true; $('#dashboard').hidden = false; $('#logout').hidden = false; }
function resetTransaction() { const form = $('#transaction-form'); form.reset(); form.elements.id.value = ''; form.elements.transactionDate.value = new Date().toLocaleDateString('en-CA'); $('#transaction-heading').textContent = 'Add a transaction'; $('#save-transaction').textContent = 'Add transaction'; $('#cancel-edit').hidden = true; }
function renderCategories() {
  const select = $('#category-select'); const selected = select.value; select.replaceChildren();
  if (!state.categories.length) { const option = element('option', '', 'Create a category first'); option.value = ''; select.append(option); }
  for (const category of state.categories) { const option = element('option', '', category.name); option.value = category.id; select.append(option); }
  if ([...select.options].some(option => option.value === selected)) select.value = selected;
  const list = $('#categories'); list.replaceChildren();
  if (!state.categories.length) list.append(element('p', 'empty', 'No categories yet.'));
  for (const category of state.categories) {
    const row = element('div', 'category-item'); row.append(element('span', '', category.name));
    const actions = element('div', 'row-actions');
    actions.append(button('Rename', async () => { const name = prompt('New category name:', category.name); if (name === null) return; try { await api(`/categories/${category.id}`, { method: 'PUT', body: JSON.stringify({ name }) }); await refresh(); notify('Category updated.'); } catch (e) { notify(e.message, true); } }));
    actions.append(button('Delete', async () => { if (!confirm(`Delete ${category.name}?`)) return; try { await api(`/categories/${category.id}`, { method: 'DELETE' }); await refresh(); notify('Category deleted.'); } catch (e) { notify(e.message.includes('conflicts') ? 'Delete this category’s transactions first.' : e.message, true); } }));
    row.append(actions); list.append(row);
  }
}
function renderTransactions() {
  const rows = $('#transactions'); rows.replaceChildren();
  const items = state.transactions.filter(item => item.transactionDate.startsWith($('#month').value)).sort((a, b) => b.transactionDate.localeCompare(a.transactionDate) || b.id - a.id);
  $('#transaction-count').textContent = `${items.length} ${items.length === 1 ? 'entry' : 'entries'}`;
  if (!items.length) rows.append(element('p', 'empty', 'No transactions this month. Add your first entry to get started.'));
  for (const item of items) {
    const category = state.categories.find(c => c.id === item.categoryId);
    const row = element('div', 'row'); const info = element('div');
    info.append(element('div', 'row-name', item.description || category?.name || 'Transaction'));
    info.append(element('div', 'row-meta', `${category?.name || 'Category'} · ${item.transactionDate}`)); row.append(info);
    const right = element('div', 'row-actions'); right.append(element('span', 'row-amount', `${item.type === 'INCOME' ? '+' : '−'}${money(item.amount)}`));
    right.append(button('Edit', () => { const f = $('#transaction-form'); for (const key of ['id','type','amount','transactionDate','description','categoryId']) f.elements[key].value = item[key] ?? ''; $('#transaction-heading').textContent = 'Edit transaction'; $('#save-transaction').textContent = 'Save changes'; $('#cancel-edit').hidden = false; f.elements.amount.focus(); }));
    right.append(button('Delete', async () => { if (!confirm('Delete this transaction?')) return; try { await api(`/transactions/${item.id}`, { method: 'DELETE' }); await refresh(); notify('Transaction deleted.'); } catch (e) { notify(e.message, true); } })); row.append(right); rows.append(row);
  }
}
function renderSummary(summary) {
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
$('#month').addEventListener('change', () => refresh().catch(e => notify(e.message, true)));
$('#cancel-edit').addEventListener('click', resetTransaction);
$('#category-form').addEventListener('submit', async event => { event.preventDefault(); const f = event.currentTarget; try { await api('/categories', { method: 'POST', body: JSON.stringify({ name: f.elements.name.value }) }); f.reset(); await refresh(); notify('Category added.'); } catch (e) { notify(e.message, true); } });
$('#transaction-form').addEventListener('submit', async event => { event.preventDefault(); const f = event.currentTarget; const id = f.elements.id.value; const payload = { type: f.elements.type.value, amount: f.elements.amount.value, categoryId: Number(f.elements.categoryId.value), transactionDate: f.elements.transactionDate.value, description: f.elements.description.value || null }; const submit = $('#save-transaction'); submit.disabled = true; try { await api(id ? `/transactions/${id}` : '/transactions', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) }); resetTransaction(); await refresh(); notify(id ? 'Transaction updated.' : 'Transaction added.'); } catch (e) { notify(e.message, true); } finally { submit.disabled = false; } });
$('#month').value = new Date().toLocaleDateString('en-CA').slice(0, 7); resetTransaction();
if (state.token) { showDashboard(); refresh().catch(e => notify(e.message, true)); }
