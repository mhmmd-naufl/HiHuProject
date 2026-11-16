const PATHS = {
  dashboard: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
  users: [
    'M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20',
    'M9 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z',
    'M19 4.5a3 3 0 0 1 0 5.8',
    'M22 20v-1.4a3.6 3.6 0 0 0-2.6-3.4',
  ],
  chart: ['M4 20V11', 'M10 20V4', 'M16 20v-6', 'M22 20H2'],
  store: ['M3.5 9 5 3.5h14L20.5 9', 'M4.5 9v10.5h15V9', 'M9.5 19.5v-5.5h5v5.5'],
  settings: ['M4 7h9', 'M17 7h3', 'M4 17h3', 'M11 17h9', 'M15 4.5v5', 'M9 14.5v5'],
  box: ['M20.5 8 12 3.5 3.5 8v8L12 20.5l8.5-4.5V8Z', 'm3.5 8 8.5 4.5L20.5 8', 'M12 12.5v8'],
  tags: [
    'M20.4 13.6 11 4.2H4.2v6.8l9.4 9.4a1.8 1.8 0 0 0 2.6 0l4.2-4.2a1.8 1.8 0 0 0 0-2.6Z',
    'M7.8 7.8h.01',
  ],
  logout: ['M9.5 20.5H5.5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h4', 'm16.5 16.5 4.5-4.5-4.5-4.5', 'M21 12H9.5'],
  sun: [
    'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z',
    'M12 1.5V4',
    'M12 20v2.5',
    'M4.6 4.6 6.4 6.4',
    'M17.6 17.6l1.8 1.8',
    'M1.5 12H4',
    'M20 12h2.5',
    'M4.6 19.4l1.8-1.8',
    'M17.6 6.4l1.8-1.8',
  ],
  moon: ['M20.5 13.3A8.5 8.5 0 1 1 10.7 3.5a6.6 6.6 0 0 0 9.8 9.8Z'],
  check: ['M20 6 9 17l-5-5'],
  alert: ['M12 8v5', 'M12 16.5h.01', 'M12 3 2.8 20h18.4L12 3Z'],
  info: ['M12 11v5', 'M12 7.5h.01', 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z'],
  eye: ['M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  eyeOff: ['m3 3 18 18', 'M10.6 5.7A9.7 9.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.9', 'M6.4 6.9A17.6 17.6 0 0 0 2.5 12S6 18.5 12 18.5a9.5 9.5 0 0 0 4.2-1', 'M9.9 9.9a3 3 0 0 0 4.2 4.2'],
  arrow: ['M5 12h14', 'm13 6 6 6-6 6'],
  sparkle: ['M12 3v4', 'M12 17v4', 'M3 12h4', 'M17 12h4', 'm5.6 5.6 2.8 2.8', 'm15.6 15.6 2.8 2.8', 'm18.4 5.6-2.8 2.8', 'm8.4 15.6-2.8 2.8'],
  whatsapp: ['M20.5 11.6a8.5 8.5 0 0 1-12.6 7.5L3.5 20.5l1.4-4.3A8.5 8.5 0 1 1 20.5 11.6Z', 'M9 8.6c.3-.1.6 0 .8.3l.8 1.4a.7.7 0 0 1-.2.9l-.6.5a6 6 0 0 0 2.5 2.5l.5-.6a.7.7 0 0 1 .9-.2l1.4.8c.3.2.4.5.3.8a2 2 0 0 1-2 1.3 8 8 0 0 1-6.2-6.2c-.1-.6.2-1.2.8-1.5Z'],
};

const SVG_NS = 'http://www.w3.org/2000/svg';

export function icon(name, { size = 18, className = '' } = {}) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  if (className) svg.setAttribute('class', className);

  for (const d of PATHS[name] || []) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}
