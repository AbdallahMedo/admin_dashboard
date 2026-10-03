// Accept the live array response and the wrapped demo/order response.
export function referenceImages(response) {
  const items = Array.isArray(response) ? response :
    [response?.images, response?.referenceImages, response?.attachments, response?.imageUrls]
      .find(value => Array.isArray(value) && value.length > 0) || [];
  return items.map(item => typeof item === 'string' ? item : item?.imageUrl || item?.url)
    .filter(url => typeof url === 'string' && url.trim())
    .map(url => url.trim())
    .filter(url => /^(https?:\/\/|\/[^/])/i.test(url));
}

export const escapeImageHtml = value => String(value).replace(/[&<>"']/g,
  char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
