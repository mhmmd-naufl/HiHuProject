/**
 * Helper DOM kecil tanpa innerHTML agar seluruh nilai pengguna
 * selalu dirender sebagai text node (aman dari injeksi HTML).
 */
export function h(tag, attrs = null, ...children) {
  const node = document.createElement(tag);
  let deferredValue;

  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'dataset') Object.assign(node.dataset, value);
      else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
      else if (key.startsWith('on') && typeof value === 'function') {
        node.addEventListener(key.slice(2).toLowerCase(), value);
      } else if (key === 'value' && node instanceof HTMLSelectElement) {
        deferredValue = value;
      } else if (key in node) {
        try {
          node[key] = value;
        } catch {
          node.setAttribute(key, String(value));
        }
      } else {
        node.setAttribute(key, value === true ? '' : String(value));
      }
    }
  }

  append(node, children);
  if (deferredValue !== undefined) node.value = deferredValue;
  return node;
}

export function append(node, children) {
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

export function clear(node) {
  node.replaceChildren();
  return node;
}

export function option(value, label) {
  return h('option', { value }, label);
}

export function initials(name) {
  return String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
