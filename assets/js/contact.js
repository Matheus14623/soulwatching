import { SITE_CONFIG } from './config.js';
import { $ } from './utils.js';

const ERROR_MESSAGES = Object.freeze({
  valueMissing: 'Este campo é obrigatório.',
  typeMismatch: 'Digite um e-mail válido.',
  tooShort: 'Escreva um pouco mais para a mensagem fazer sentido.',
});

function getFieldError(field) {
  const validity = field.validity;
  if (validity.valid) return '';
  const key = Object.keys(ERROR_MESSAGES).find((name) => validity[name]);
  return ERROR_MESSAGES[key] || 'Revise este campo.';
}

function setFieldError(form, field, message) {
  const wrapper = field.closest('.form-field');
  const error = $(`[data-error-for="${field.name}"]`, form);
  wrapper?.classList.toggle('has-error', Boolean(message));
  field.setAttribute('aria-invalid', String(Boolean(message)));
  if (error) error.textContent = message;
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return 'clipboard';
  }

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mensagem-para-matheus-camargo.txt';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return 'download';
}

function buildMessage(form) {
  const data = new FormData(form);
  const name = String(data.get('name') || '').trim();
  const email = String(data.get('email') || '').trim();
  const message = String(data.get('message') || '').trim();

  return {
    name,
    email,
    message,
    body: [
      `Nome: ${name}`,
      `E-mail: ${email}`,
      '',
      'Mensagem:',
      message,
      '',
      'Origem: Site O Observador Cósmico',
    ].join('\n'),
  };
}

export function initContactForm() {
  const form = $('[data-contact-form]');
  const status = $('[data-contact-status]');
  const submit = $('[data-contact-submit]');
  if (!form) return;

  const fields = Array.from(form.elements).filter((element) => element.matches?.('input, textarea'));

  fields.forEach((field) => {
    field.addEventListener('input', () => setFieldError(form, field, getFieldError(field)));
    field.addEventListener('blur', () => setFieldError(form, field, getFieldError(field)));
  });

  if (SITE_CONFIG.contactEmail && submit) submit.textContent = 'Abrir e-mail';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status?.classList.remove('is-success', 'is-error');
    if (status) status.textContent = '';

    let valid = true;
    fields.forEach((field) => {
      const message = getFieldError(field);
      setFieldError(form, field, message);
      if (message) valid = false;
    });

    if (!valid) {
      status?.classList.add('is-error');
      if (status) status.textContent = 'Há campos para revisar antes de gerar a mensagem.';
      fields.find((field) => !field.validity.valid)?.focus();
      return;
    }

    const payload = buildMessage(form);

    if (SITE_CONFIG.contactEmail) {
      const subject = encodeURIComponent(SITE_CONFIG.mailSubject);
      const body = encodeURIComponent(payload.body);
      window.location.href = `mailto:${SITE_CONFIG.contactEmail}?subject=${subject}&body=${body}`;
      status?.classList.add('is-success');
      if (status) status.textContent = 'Seu cliente de e-mail foi aberto com a mensagem preparada.';
      return;
    }

    try {
      const result = await copyToClipboard(payload.body);
      status?.classList.add('is-success');
      if (status) {
        status.textContent = result === 'clipboard'
          ? 'Mensagem copiada. Cole no canal de contato que você escolher.'
          : 'Mensagem baixada como arquivo .txt para você enviar pelo canal escolhido.';
      }
      form.reset();
    } catch (error) {
      status?.classList.add('is-error');
      if (status) status.textContent = `Não foi possível preparar a mensagem: ${error.message}`;
    }
  });
}
