import { test } from 'node:test';
import assert from 'node:assert/strict';

const elements = new Map();
globalThis.document = {
  addEventListener() {},
  getElementById: id => elements.get(id),
  body: { appendChild: el => elements.set(el.id, el) },
  createElement() {
    const classes = new Set();
    return {
      classList: { add: c => classes.add(c), remove: c => classes.delete(c), contains: c => classes.has(c) },
      querySelector: () => ({ addEventListener() {} }),
    };
  },
};
const { modal } = await import('../src/js/ui/modal.js');

test('Cancel closes the modal, including after reopening, without a window global', () => {
  for (let i = 0; i < 2; i++) {
    modal.showModal({ title: 'Edit', contentHtml: '', footerHtml: '<button data-modal-close>Cancel</button>' });
    const overlay = modal.activeModal;
    overlay.onclick({ target: { closest: selector => selector === '[data-modal-close]' } });
    assert.equal(modal.activeModal, null);
    assert.equal(overlay.classList.contains('active'), false);
  }
});

test('clicking modal content keeps it open; clicking backdrop closes it', () => {
  modal.showModal({ title: 'Gallery', contentHtml: '' });
  const overlay = modal.activeModal;
  overlay.onclick({ target: { closest: () => null } });
  assert.equal(modal.activeModal, overlay);
  overlay.onclick({ target: overlay });
  assert.equal(modal.activeModal, null);
});
