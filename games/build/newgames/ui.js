export function el(tag, text = '', cls = '') { const node = document.createElement(tag); node.textContent = text; if (cls)
    node.className = cls; return node; }
export function button(text, action, cls = 'secondary') { const b = el('button', text, cls); b.type = 'button'; b.onclick = action; return b; }
export function link(text, href, cls = '') { const a = el('a', text, cls); a.href = href; return a; }
export function select(name, options, value, changed) { const s = el('select'); s.setAttribute('aria-label', name); for (const [value, text] of options) {
    const o = el('option', text);
    o.value = value;
    s.append(o);
} s.value = value; s.onchange = () => changed(s.value); return s; }
export function label(text, control) { const l = el('label', text); l.append(control); return l; }
const dialog = document.getElementById('dialog');
let origin = null;
export function modal(title, nodes) { if (!dialog.open)
    origin = document.activeElement; dialog.replaceChildren(); const top = el('div', '', 'dialog-head'), h = el('h2', title); h.id = 'modal-title'; const close = button('×', () => dialog.close(), 'icon'); close.setAttribute('aria-label', 'Close dialog'); top.append(h, close); dialog.append(top, ...nodes); dialog.setAttribute('aria-labelledby', h.id); if (!dialog.open)
    dialog.showModal(); dialog.onclose = () => origin?.focus(); }
export function closeModal() { dialog.close(); }
export function confirm(title, text, action) { const actions = el('div', '', 'actions'); actions.append(button('Cancel', closeModal), button('Confirm', () => { closeModal(); action(); }, 'primary')); modal(title, [el('p', text), actions]); }
let timer;
export function notify(text) { const toast = document.getElementById('toast'); toast.textContent = text; toast.classList.add('show'); clearTimeout(timer); timer = setTimeout(() => toast.classList.remove('show'), 5000); }
export async function copy(text) { try {
    await navigator.clipboard.writeText(text);
    notify('Copied.');
}
catch {
    const area = el('textarea');
    area.value = text;
    area.readOnly = true;
    area.rows = 8;
    area.setAttribute('aria-label', 'Text to copy');
    modal('Copy this text.', [area]);
    area.select();
} }
export async function share(text) { if (navigator.share) {
    try {
        await navigator.share({ text });
        return;
    }
    catch (e) {
        if (e instanceof Error && e.name === 'AbortError')
            return;
    }
} await copy(text); }
