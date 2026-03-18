// ft-ui.js — v3.1
// REGRA: abrirModal() é SÍNCRONO na injeção. NUNCA use "await abrirModal()".
// Adicione listeners imediatamente após a chamada.
//
// v3.1 — Correções de segurança (auditoria):
//   #1 CRÍTICO: toast() — msg interpolado em innerHTML sem escape.
//      Fix: slot vazio no HTML; msg via textContent.
//   #2 CRÍTICO: confirmar() — msg/labelOK sem escape.
//      Fix: placeholders vazios; textos via textContent após injetar.
//   #3 MÉDIO: renderEmpty() — titulo/sub sem escape.
//      Fix: textContent após injetar esqueleto.
//   #4 BAIXO: renderTutorial() — titulo/passos sem escape.
//      Fix: textContent + createElement para cada <li>.
import { ico } from './ft-icons.js';

export function toast(msg, tipo = 'info') {
    const wrap = document.getElementById('ft-toast');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = `ft-toast-item ft-toast-${tipo}`;
    const imap = { sucesso: ico.check, erro: ico.warn, aviso: ico.tip, info: ico.info };
    // FIX #1: slot vazio — msg nunca passa por innerHTML.
    el.innerHTML = `<span class="ft-t-ico">${imap[tipo] || ico.info}</span><span></span>`;
    el.querySelector('span:last-child').textContent = msg;
    wrap.appendChild(el);
    requestAnimationFrame(() => el.classList.add('on'));
    setTimeout(() => { el.classList.remove('on'); setTimeout(() => el.remove(), 350); }, 3400);
}

export function setLoading(show) {
    const el = document.getElementById('ft-loading');
    if (el) el.style.display = show ? 'flex' : 'none';
}

let _r1 = null;
export function abrirModal(html, { largo = false } = {}) {
    const ov = document.getElementById('ft-modal');
    const bx = document.getElementById('ft-modal-box');
    if (!ov || !bx) return Promise.resolve(null);
    bx.innerHTML = html;
    bx.classList.toggle('largo', largo);
    ov.classList.add('open');
    requestAnimationFrame(() =>
        bx.querySelector('input:not([type=hidden]),select,textarea')?.focus()
    );
    return new Promise(r => { _r1 = r; });
}
export function fecharModal(v = null) {
    document.getElementById('ft-modal')?.classList.remove('open');
    if (_r1) { _r1(v); _r1 = null; }
}

let _r2 = null;
export function abrirModal2(html) {
    const ov = document.getElementById('ft-modal-2');
    const bx = document.getElementById('ft-modal-2-box');
    if (!ov || !bx) return Promise.resolve(null);
    bx.innerHTML = html;
    ov.classList.add('open');
    requestAnimationFrame(() =>
        bx.querySelector('input:not([type=hidden]),select,textarea')?.focus()
    );
    return new Promise(r => { _r2 = r; });
}
export function fecharModal2(v = null) {
    document.getElementById('ft-modal-2')?.classList.remove('open');
    if (_r2) { _r2(v); _r2 = null; }
}

export function confirmar(msg, { labelOK = 'Confirmar', perigo = true } = {}) {
    // FIX #2: slots vazios no HTML — msg e labelOK via textContent.
    const html = `
        <div class="ft-mhd">
            <span class="ft-mhd-title">Confirmar ação</span>
        </div>
        <div class="ft-mbody ft-confirm-body">
            <div class="ft-cfm-ico ${perigo ? 'danger' : 'info'}">${perigo ? ico.warn : ico.info}</div>
            <p class="ft-cfm-msg"></p>
        </div>
        <div class="ft-mft">
            <button class="ft-btn ft-btn-ghost" id="_cfmN">Cancelar</button>
            <button class="ft-btn ${perigo ? 'ft-btn-danger' : 'ft-btn-primary'}" id="_cfmY"></button>
        </div>`;
    const p = abrirModal(html);
    // Textos do usuário atribuídos via textContent — sem risco de XSS.
    // Usa getElementById (IDs únicos no modal) em vez de querySelector global,
    // que poderia selecionar um elemento em outro modal aberto simultaneamente.
    const bx = document.getElementById('ft-modal-box');
    if (bx) bx.querySelector('.ft-cfm-msg').textContent = msg;
    const btnY = document.getElementById('_cfmY');
    if (btnY) btnY.textContent = labelOK;
    document.getElementById('_cfmY')?.addEventListener('click', () => fecharModal(true),  { once: true });
    document.getElementById('_cfmN')?.addEventListener('click', () => fecharModal(false), { once: true });
    return p;
}

export function renderEmpty(el, icoSvg, titulo, sub = '', acao = null) {
    if (!el) return;
    // FIX #3: titulo, sub e acao.label via textContent — sem interpolação em innerHTML.
    el.innerHTML = `
        <div class="ft-empty">
            <div class="ft-empty-ico">${icoSvg}</div>
            <div class="ft-empty-title"></div>
            ${sub ? '<p class="ft-empty-sub"></p>' : ''}
            ${acao ? `<button class="ft-btn ft-btn-primary" id="_emptyBtn">
                <span class="ft-bico">${ico.plus}</span><span></span>
            </button>` : ''}
        </div>`;
    el.querySelector('.ft-empty-title').textContent = titulo;
    if (sub) el.querySelector('.ft-empty-sub').textContent = sub;
    if (acao) {
        // FIX: el.querySelector garante escopo no contêiner correto.
        // document.getElementById global retornaria o primeiro #_emptyBtn
        // no DOM se duas seções renderizarem empty state simultaneamente.
        const emptyBtn = el.querySelector('#_emptyBtn');
        if (emptyBtn) {
            const btnSpan = emptyBtn.querySelector('span:last-child');
            if (btnSpan) btnSpan.textContent = acao.label;
            emptyBtn.addEventListener('click', acao.fn, { once: true });
        }
    }
}

export function renderTutorial(secId, chave, icoSvg, titulo, passos) {
    if (localStorage.getItem('ft_tut_' + chave)) return;
    const sec = document.getElementById(secId);
    if (!sec) return;
    const tid = `_tut_${chave}`;
    if (document.getElementById(tid)) return;
    const el = document.createElement('div');
    el.id = tid; el.className = 'ft-tutorial';
    // FIX #4: titulo via textContent; passos via createElement — sem interpolação.
    el.innerHTML = `
        <div class="ft-tut-hd">
            <span class="ft-tut-ico">${icoSvg}</span>
            <span class="ft-tut-title"></span>
            <button class="ft-tut-close" id="_tc_${chave}" aria-label="Fechar">${ico.close}</button>
        </div>
        <ol class="ft-tut-list"></ol>`;
    el.querySelector('.ft-tut-title').textContent = titulo;
    const ol = el.querySelector('.ft-tut-list');
    passos.forEach(passo => {
        const li = document.createElement('li');
        li.textContent = passo;
        ol.appendChild(li);
    });
    sec.insertBefore(el, sec.firstChild);
    document.getElementById(`_tc_${chave}`)?.addEventListener('click', () => {
        el.classList.add('out');
        setTimeout(() => el.remove(), 300);
        localStorage.setItem('ft_tut_' + chave, '1');
    }, { once: true });
}

export function debounce(fn, ms = 260) {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

export function initModalOverlay() {
    document.getElementById('ft-modal')?.addEventListener('click', e => {
        if (e.target.id === 'ft-modal') fecharModal(null);
    });
    document.getElementById('ft-modal-2')?.addEventListener('click', e => {
        if (e.target.id === 'ft-modal-2') fecharModal2(null);
    });
}
