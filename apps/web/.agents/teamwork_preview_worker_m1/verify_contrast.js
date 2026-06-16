const fs = require('fs');

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

function luminance(r, g, b) {
  const a = [r, g, b].map(function (v) {
    v /= 255;
    return v <= 0.03928
      ? v / 12.92
      : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function contrast(rgb1, rgb2) {
  const lum1 = luminance(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = luminance(rgb2[0], rgb2[1], rgb2[2]);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const textHsl = [215.4, 20, 35];
const borderHsl = [214.3, 32, 60];
const canvasHex = '#eff2f6';

const textRgb = hslToRgb(...textHsl);
const borderRgb = hslToRgb(...borderHsl);
const canvasRgb = hexToRgb(canvasHex);

const textContrast = contrast(textRgb, canvasRgb);
const borderContrast = contrast(borderRgb, canvasRgb);

console.log(`Text vs Canvas Contrast Ratio: ${textContrast.toFixed(2)}:1`);
console.log(`Text WCAG >= 4.5:1 passed? ${textContrast >= 4.5}`);

console.log(`Border vs Canvas Contrast Ratio: ${borderContrast.toFixed(2)}:1`);
console.log(`Border WCAG >= 1.5:1 passed? ${borderContrast >= 1.5}`);
