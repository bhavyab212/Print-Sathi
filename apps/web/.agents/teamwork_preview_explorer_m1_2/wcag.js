function getLuminance(r, g, b) {
  var a = [r, g, b].map(function (v) {
      v /= 255;
      return v <= 0.03928
          ? v / 12.92
          : Math.pow( (v + 0.055) / 1.055, 2.4 );
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrast(l1, l2) {
  var lightest = Math.max(l1, l2);
  var darkest = Math.min(l1, l2);
  return (lightest + 0.05) / (darkest + 0.05);
}

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  var c = (1 - Math.abs(2 * l - 1)) * s,
      x = c * (1 - Math.abs((h / 60) % 2 - 1)),
      m = l - c / 2,
      r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
  return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255)
  ];
}

const bg = hslToRgb(0, 0, 100);
const mutedFg = hslToRgb(215.4, 16.3, 42); // #596575 -> L=0.126
const canvas = hslToRgb(210, 40, 96.1); // Same as muted approx #f1f5f9 -> L=0.902
const canvas2 = hslToRgb(220, 33, 94); // #eff2f6 -> L=0.887

console.log("bg vs mutedFg:", getContrast(getLuminance(...bg), getLuminance(...mutedFg)));
console.log("canvas (#f1f5f9) vs mutedFg:", getContrast(getLuminance(...canvas), getLuminance(...mutedFg)));
console.log("ps-canvas (#eff2f6) vs mutedFg:", getContrast(getLuminance(...canvas2), getLuminance(...mutedFg)));
