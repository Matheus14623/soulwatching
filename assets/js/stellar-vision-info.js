import { $, $$ } from './utils.js';

export function initStellarVisionInfo() {
  const dialog = $('[data-stellar-vision-info]');
  const triggers = $$('[data-stellar-vision-info-open]');
  if (!dialog || !triggers.length || dialog.dataset.initialized === 'true') return;

  dialog.dataset.initialized = 'true';
  const closeButton = $('[data-stellar-vision-info-close]', dialog);
  const supportsModal = typeof dialog.showModal === 'function';
  let returnFocus = null;

  const restorePage = () => {
    document.body.classList.remove('is-stellar-vision-info-open');
    dialog.removeAttribute('aria-modal');
    returnFocus?.focus({ preventScroll: true });
    returnFocus = null;
  };

  const closeDialog = () => {
    if (!dialog.hasAttribute('open')) return;

    if (supportsModal) {
      dialog.close();
      return;
    }

    dialog.removeAttribute('open');
    restorePage();
  };

  const openDialog = (trigger) => {
    if (dialog.hasAttribute('open')) return;

    returnFocus = trigger;
    document.body.classList.add('is-stellar-vision-info-open');

    if (supportsModal) {
      dialog.showModal();
      return;
    }

    dialog.setAttribute('open', '');
    dialog.setAttribute('aria-modal', 'true');
    closeButton?.focus({ preventScroll: true });
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => openDialog(trigger));
  });

  closeButton?.addEventListener('click', closeDialog);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !dialog.hasAttribute('open')) return;
    event.preventDefault();
    closeDialog();
  });
  dialog.addEventListener('close', restorePage);
}
