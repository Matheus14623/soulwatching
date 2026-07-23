import { SITE_CONFIG } from './config.js';
import { $ } from './utils.js';

const ERROR_MESSAGES = Object.freeze({
  valueMissing: 'Este campo é obrigatório.',
  typeMismatch: 'Digite um e-mail válido.',
});

function getFieldError(field) {
  const validity = field.validity;
  if (validity.valid) return '';
  if (validity.tooShort) {
    return field.name === 'name'
      ? 'Digite pelo menos 2 caracteres.'
      : 'Escreva pelo menos 12 caracteres para contextualizar a mensagem.';
  }
  const key = Object.keys(ERROR_MESSAGES).find((name) => validity[name]);
  return ERROR_MESSAGES[key] || 'Revise este campo.';
}

function connectFieldError(form, field) {
  const error = $(`[data-error-for="${field.name}"]`, form);
  if (!error) return null;
  if (!error.id) error.id = `${field.id || field.name}-error`;
  const describedBy = new Set((field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
  describedBy.add(error.id);
  field.setAttribute('aria-describedby', [...describedBy].join(' '));
  return error;
}

function setFieldError(form, field, message) {
  const wrapper = field.closest('.form-field');
  const error = connectFieldError(form, field);
  wrapper?.classList.toggle('has-error', Boolean(message));
  if (message) field.setAttribute('aria-invalid', 'true');
  else field.removeAttribute('aria-invalid');
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
      'Origem: Observatório de Ideias',
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
    connectFieldError(form, field);
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
      if (status) status.textContent = 'Revise os campos indicados. O foco foi levado ao primeiro deles.';
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
