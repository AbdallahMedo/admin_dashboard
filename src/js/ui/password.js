import { i18n } from '../i18n.js';

export function enhancePasswordFields(root) {
  root.querySelectorAll('input[type="password"]').forEach(input => {
    if (input.closest('.password-field')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'password-field';
    input.before(wrapper);
    wrapper.append(input);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'password-toggle';
    button.setAttribute('aria-controls', input.id);
    const update = () => {
      const visible = input.type === 'text';
      const label = i18n.isRtl() ? (visible ? 'إخفاء' : 'إظهار') : (visible ? 'Hide' : 'Show');
      button.textContent = label;
      button.setAttribute('aria-label', i18n.isRtl() ? `${label} كلمة المرور` : `${label} password`);
      button.setAttribute('aria-pressed', String(visible));
    };
    button.addEventListener('click', () => {
      input.type = input.type === 'password' ? 'text' : 'password';
      update();
      input.focus();
    });
    update();
    wrapper.append(button);
  });
}
