const PIX_RANDOM_KEY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizePixKey(value) {
  const key = String(value ?? '').trim();
  if (!PIX_RANDOM_KEY_PATTERN.test(key)) {
    throw new TypeError('Chave Pix aleatória inválida.');
  }
  return key;
}

function setStatus(status, message, { error = false } = {}) {
  status.textContent = message;
  status.classList.toggle('is-error', error);
}

function selectKey(keyInput) {
  keyInput.focus({ preventScroll: true });
  keyInput.select();
  keyInput.setSelectionRange(0, keyInput.value.length);
}

function initSupportCard(card) {
  if (card.dataset.pixSupportReady === 'true') return;

  const keyInput = card.querySelector('[data-pix-key]');
  const copyButton = card.querySelector('[data-pix-copy]');
  const status = card.querySelector('[data-pix-status]');
  if (!(keyInput instanceof HTMLInputElement) || !(copyButton instanceof HTMLButtonElement) || !status) return;

  card.dataset.pixSupportReady = 'true';
  copyButton.addEventListener('click', async () => {
    let key;
    try {
      key = normalizePixKey(keyInput.value);
    } catch {
      setStatus(status, 'A chave Pix disponível nesta página é inválida.', { error: true });
      return;
    }

    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard-unavailable');
      await navigator.clipboard.writeText(key);
      setStatus(status, 'Chave Pix copiada. Confira os dados no aplicativo do banco antes de confirmar.');
    } catch {
      selectKey(keyInput);
      setStatus(status, 'A cópia automática não está disponível. A chave foi selecionada; use Ctrl+C ou Command+C.');
    }
  });
}

export function initPixSupport(root = document) {
  root.querySelectorAll('[data-pix-support]').forEach(initSupportCard);
}
