import { api } from '../api/client.js';
import { modal } from '../ui/modal.js';
import { toast } from '../ui/toast.js';
import { i18n } from '../i18n.js';

export function openCreateAdminModal(onSuccessCallback = null) {
  const isAr = i18n.isRtl();

  const contentHtml = `
    <div style="margin-bottom: 1.25rem;">
      <div style="background: rgba(158, 125, 83, 0.08); border: 1px solid rgba(158, 125, 83, 0.25); border-radius: var(--radius-md); padding: 0.85rem 1rem; font-size: 0.8rem; line-height: 1.5; color: var(--text-secondary);">
        <strong style="color: var(--primary);">${isAr ? 'سياسة الأمان:' : 'Security Policy:'}</strong> 
        ${isAr 
          ? 'يمكن لأي مسؤول معتمد إنشاء حساب مسؤول جديد عبر <code>POST /api/admin/users/admins</code> دون التأثير على جلستك الحالية. يجب أن تتكون كلمة المرور من <strong>12 حرفاً على الأقل</strong>.'
          : 'Any authenticated Admin can provision another administrator account via <code>POST /api/admin/users/admins</code>. Creating an account does not alter your active session. Passwords must be at least <strong>12 characters</strong> long.'
        }
      </div>
    </div>

    <form id="create-admin-form">
      <div class="form-group">
        <label class="form-label" for="new-admin-name">
          ${isAr ? 'اسم المسؤول الكامل' : 'Administrator Full Name'} <span class="required">*</span>
        </label>
        <input 
          type="text" 
          id="new-admin-name" 
          class="form-control" 
          placeholder="${isAr ? 'مثال: مسؤول مبيعات' : 'e.g. Sales Administrator'}" 
          value="${isAr ? 'مسؤول مبيعات' : 'Sales Administrator'}"
          required
        >
      </div>

      <div class="form-group">
        <label class="form-label" for="new-admin-email">
          ${isAr ? 'البريد الإلكتروني' : 'Email Address'} <span class="required">*</span>
        </label>
        <input 
          type="email" 
          id="new-admin-email" 
          class="form-control" 
          placeholder="sales.admin@example.com" 
          value="sales.admin@example.com"
          required
        >
      </div>

      <div class="form-group">
        <label class="form-label" for="new-admin-password">
          ${isAr ? 'كلمة المرور' : 'Password'} <span class="required">* (${isAr ? '12 حرفاً على الأقل' : 'min 12 chars'})</span>
          <span id="password-len-badge" style="font-size: 0.725rem; font-weight: 700; color: var(--warning);">
            32 chars
          </span>
        </label>
        <div style="position: relative;">
          <input 
            type="text" 
            id="new-admin-password" 
            class="form-control" 
            value="Use-a-unique-12-character-password"
            placeholder="Min 12 characters"
            required
            style="font-family: 'JetBrains Mono', monospace;"
          >
        </div>
        <div class="strength-meter">
          <div class="strength-bar" id="pwd-strength-bar" style="width: 100%; background-color: var(--success);"></div>
        </div>
        <span class="form-hint" id="pwd-hint" style="color: var(--success);">
          ${isAr ? 'تطابق الحد الأدنى لمتطلبات الأمان (12 حرفاً فأكثر).' : 'Meets security minimum requirement (12+ characters).'}
        </span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div class="form-group">
          <label class="form-label" for="new-admin-phone">${i18n.t('phone_number')}</label>
          <input 
            type="tel" 
            id="new-admin-phone" 
            class="form-control" 
            placeholder="01000000000" 
            value="01000000000"
          >
        </div>
        <div class="form-group">
          <label class="form-label" for="new-admin-whatsapp">${i18n.t('whatsapp_number')}</label>
          <input 
            type="tel" 
            id="new-admin-whatsapp" 
            class="form-control" 
            placeholder="01000000000" 
            value="01000000000"
          >
        </div>
      </div>
    </form>
  `;

  modal.showModal({
    title: isAr ? '+ تعيين حساب مسؤول جديد' : '+ Provision New Administrator Account',
    contentHtml,
    size: 'md',
    footerHtml: `
      <button class="btn btn-secondary" type="button" data-modal-close>${i18n.t('cancel')}</button>
      <button class="btn btn-primary" id="btn-submit-new-admin">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <line x1="19" y1="8" x2="19" y2="14"></line>
          <line x1="22" y1="11" x2="16" y2="11"></line>
        </svg>
        ${i18n.t('add_admin')}
      </button>
    `,
    onOpen: (modalEl) => {
      const pwdInput = modalEl.querySelector('#new-admin-password');
      const lenBadge = modalEl.querySelector('#password-len-badge');
      const strengthBar = modalEl.querySelector('#pwd-strength-bar');
      const hint = modalEl.querySelector('#pwd-hint');

      // Live validation for password >= 12 chars
      const updatePwdValidation = () => {
        const len = pwdInput.value.length;
        lenBadge.textContent = `${len} ${isAr ? 'حرف' : 'chars'}`;

        if (len < 12) {
          lenBadge.style.color = 'var(--danger)';
          strengthBar.style.width = `${(len / 12) * 60}%`;
          strengthBar.style.backgroundColor = 'var(--danger)';
          hint.textContent = isAr ? `كلمة المرور قصيرة (${len}/12 حرفاً).` : `Password is too short (${len}/12 characters needed).`;
          hint.style.color = 'var(--danger)';
        } else {
          lenBadge.style.color = 'var(--success)';
          strengthBar.style.width = '100%';
          strengthBar.style.backgroundColor = 'var(--success)';
          hint.textContent = isAr ? `تطابق متطلبات الأمان (${len} حرفاً).` : `Meets security requirement (${len} characters).`;
          hint.style.color = 'var(--success)';
        }
      };

      pwdInput.addEventListener('input', updatePwdValidation);
      updatePwdValidation();

      const submitBtn = modalEl.querySelector('#btn-submit-new-admin');
      submitBtn.addEventListener('click', async () => {
        const name = modalEl.querySelector('#new-admin-name').value.trim();
        const email = modalEl.querySelector('#new-admin-email').value.trim();
        const password = pwdInput.value;
        const phoneNumber = modalEl.querySelector('#new-admin-phone').value.trim();
        const whatsAppNumber = modalEl.querySelector('#new-admin-whatsapp').value.trim();

        if (!name || !email || !password) {
          toast.warning(isAr ? 'يرجى إدخال الاسم والبريد الإلكتروني وكلمة المرور.' : 'Name, email, and password are required.');
          return;
        }

        if (password.length < 12) {
          toast.error(isAr ? 'يجب أن لا تقل كلمة المرور عن 12 حرفاً.' : 'Password must be at least 12 characters long per security policy.');
          return;
        }

        try {
          submitBtn.disabled = true;
          submitBtn.textContent = isAr ? 'جاري الإنشاء...' : 'Provisioning...';

          const res = await api.request('/api/admin/users/admins', {
            method: 'POST',
            body: {
              name,
              email,
              password,
              phoneNumber,
              whatsAppNumber
            }
          });

          toast.success(isAr ? `تم إنشاء حساب المسؤول '${email}' بنجاح!` : `Admin account '${email}' created successfully!`);

          // Show confirmation with credentials to copy
          modal.showModal({
            title: isAr ? 'تم إنشاء حساب المسؤول بنجاح' : 'Administrator Provisioned Successfully',
            contentHtml: `
              <div style="text-align: center; padding: 1rem 0;">
                <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--success-bg); color: var(--success); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem;">${isAr ? 'حساب المسؤول الجديد جاهز' : 'New Admin Ready'}</h3>
                <p style="color: var(--text-secondary); font-size: 0.85rem; max-width: 420px; margin: 0 auto 1.5rem auto;">
                  ${isAr ? 'تم تسجيل الحساب الجديد بصلاحيات مسؤول (Admin). جلستك الحالية تظل نشطة كما هي.' : 'The new account has been registered with Admin privileges. Your current session remains active and unchanged.'}
                </p>

                <div class="code-viewer" style="text-align: left; margin-bottom: 1.5rem;" dir="ltr">
Email: ${email}
Password: ${password}
Role: Admin
API Endpoint: POST /api/admin/users/admins
                </div>

                <button class="btn btn-primary" id="btn-copy-admin-creds" style="width: 100%;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  ${isAr ? 'نسخ بيانات الدخول إلى الحافظة' : 'Copy Credentials to Clipboard'}
                </button>
              </div>
            `,
            footerHtml: `<button class="btn btn-secondary" type="button" data-modal-close>${i18n.t('close')}</button>`,
            onOpen: (doneModal) => {
              doneModal.querySelector('#btn-copy-admin-creds').addEventListener('click', () => {
                navigator.clipboard.writeText(`Email: ${email}\nPassword: ${password}\nRole: Admin`);
                toast.success(isAr ? 'تم نسخ بيانات الدخول بنجاح' : 'Credentials copied to clipboard');
              });
            }
          });

          if (onSuccessCallback) onSuccessCallback(res);

        } catch (err) {
          toast.error(err.message || 'Failed to provision admin account');
          submitBtn.disabled = false;
          submitBtn.textContent = i18n.t('add_admin');
        }
      });
    }
  });
}
