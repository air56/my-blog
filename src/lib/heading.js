/**
 * @param {string} text
 * @returns {string}
 */
export function slugifyHeading(text) {
  return String(text)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '');
}