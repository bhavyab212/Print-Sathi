const hexToRgb = hex => {
  const bigint = parseInt(hex.replace('#', ''), 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
};

const luminance = (r, g, b) => {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

const contrast = (hex1, hex2) => {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lum1 = luminance(...rgb1);
  const lum2 = luminance(...rgb2);
  const lightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (lightest + 0.05) / (darkest + 0.05);
};

console.log("Card/Bg (#ffffff on #e2e8f0):", contrast('#ffffff', '#e2e8f0').toFixed(2));
console.log("Card/Bg (#ffffff on #f1f5f9):", contrast('#ffffff', '#f1f5f9').toFixed(2));
console.log("Card/Bg (#ffffff on #f8fafc):", contrast('#ffffff', '#f8fafc').toFixed(2));
