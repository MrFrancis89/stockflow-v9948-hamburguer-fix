// toast.js — StockFlow Pro v9.9.6
// ══════════════════════════════════════════════════════════════════
// v9.7.4 — mostrarAlertaElegante removido; innerText → textContent
// v9.9.6 — mostrarToastUndo(): toast com botão "Desfazer" e barra
//   de progresso. Padrão Gmail/Google Docs para ações destrutivas.
//
//   mostrarToast(msg)
//     Notificação simples, 3s, sem interação.
//
//   mostrarToastUndo(msg, onUndo, duracaoMs?)
//     Toast com botão "Desfazer" e barra de progresso animada.
//     • duracaoMs: janela de desfazer (padrão: 8000ms)
//     • onUndo: callback executado se o usuário apertar "Desfazer"
//     • Retorna cancel(): cancela o timer sem executar a ação
//     • pointer-events: none no container — só o botão é clicável
// ══════════════════════════════════════════════════════════════════

function _getContainer() {
    return document.getElementById('toast-container');
}

export function mostrarToast(msg) {
    const container = _getContainer();
    if (!container) { console.warn('[toast] #toast-container não encontrado.'); return; }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Exibe um toast com botão "Desfazer" e barra de progresso.
 *
 * A ação destrutiva JÁ FOI executada antes de chamar esta função.
 * O timer representa o prazo para reverter — se expirar sem undo,
 * a ação é confirmada silenciosamente.
 *
 * @param {string}   msg        Mensagem exibida (ex: "Quantidades zeradas")
 * @param {Function} onUndo     Callback executado ao clicar em "Desfazer"
 * @param {number}   [duracaoMs=8000]  Janela de desfazer em ms
 * @returns {Function} cancel — remove o toast sem executar onUndo
 */
export function mostrarToastUndo(msg, onUndo, duracaoMs = 8000) {
    const container = _getContainer();
    if (!container) { console.warn('[toast] #toast-container não encontrado.'); return () => {}; }

    const toast = document.createElement('div');
    toast.className = 'toast toast--undo';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    // pointer-events ativo apenas no toast-undo para o botão ser clicável
    toast.style.pointerEvents = 'all';

    toast.innerHTML = `
        <span class="toast-undo-msg"></span>
        <button class="toast-undo-btn" type="button" aria-label="Desfazer ação">Desfazer</button>
        <div class="toast-undo-bar" role="progressbar"
             aria-valuemin="0" aria-valuemax="100" aria-valuenow="100">
            <div class="toast-undo-bar-fill"></div>
        </div>
    `;

    // textContent via referência — sem innerHTML para o texto do usuário
    toast.querySelector('.toast-undo-msg').textContent = msg;

    container.appendChild(toast);

    // Anima a barra de progresso
    const fill = toast.querySelector('.toast-undo-bar-fill');
    fill.style.transition = `width ${duracaoMs}ms linear`;
    // Força reflow antes de iniciar a transição
    fill.getBoundingClientRect();
    fill.style.width = '0%';

    let _resolvido = false;

    function _remover() {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(8px)';
        toast.style.transition = 'opacity 0.25s, transform 0.25s';
        setTimeout(() => toast.remove(), 280);
    }

    // Timer de expiração
    const timer = setTimeout(() => {
        if (_resolvido) return;
        _resolvido = true;
        _remover();
        // Ação já foi executada — não faz nada ao expirar
    }, duracaoMs);

    // Botão Desfazer
    toast.querySelector('.toast-undo-btn').addEventListener('click', () => {
        if (_resolvido) return;
        _resolvido = true;
        clearTimeout(timer);
        _remover();
        onUndo();
    });

    // Retorna função para cancelar externamente (ex: nova ação sobrescreve)
    return function cancel() {
        if (_resolvido) return;
        _resolvido = true;
        clearTimeout(timer);
        _remover();
    };
}
