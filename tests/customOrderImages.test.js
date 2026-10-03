import { test } from 'node:test';
import assert from 'node:assert/strict';
import { referenceImages, escapeImageHtml } from '../src/js/views/customOrderImages.js';

const url = 'http://localhost:5000/uploads/reference.png';
test('reads live image objects and legacy URL strings', () => {
  assert.deepEqual(referenceImages([{ imageUrl: url, url }]), [url]);
  assert.deepEqual(referenceImages({ images: [{ imageUrl: url }] }), [url]);
  assert.deepEqual(referenceImages({ images: [url] }), [url]);
  assert.deepEqual(referenceImages([{ url }]), [url]);
});
test('supports order aliases without counting duplicate image collections', () => {
  assert.deepEqual(referenceImages({ images: [{ imageUrl: url }], referenceImages: [{ url }], imageUrls: [url] }), [url]);
  assert.deepEqual(referenceImages({ images: [], attachments: [{ url }] }), [url]);
  assert.deepEqual(referenceImages({ imageUrls: [url] }), [url]);
});
test('handles empty responses and rejects unsafe URLs', () => {
  assert.deepEqual(referenceImages(null), []);
  assert.deepEqual(referenceImages([]), []);
  assert.deepEqual(referenceImages([{}, null, 'javascript:alert(1)']), []);
  assert.equal(escapeImageHtml('"<>&'), '&quot;&lt;&gt;&amp;');
});
