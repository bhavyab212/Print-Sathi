function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [ parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16) ] : null;
}

function luminance(r, g, b) {
  const a = [r, g, b].map(function (v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
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

const canvasRgb = hexToRgb('#f4f5f6');
const cardRgb = [255, 255, 255]; // --card: 0 0% 100%;

console.log("Old values:");
let oldMutedRgb = hslToRgb(215.4, 16.3, 46.9);
let oldBorderRgb = hslToRgb(214.3, 31.8, 91.4);
console.log(`Muted fg vs Canvas: ${contrast(oldMutedRgb, canvasRgb).toFixed(2)}`);
console.log(`Muted fg vs Card (White): ${contrast(oldMutedRgb, cardRgb).toFixed(2)}`);
console.log(`Border vs Canvas: ${contrast(oldBorderRgb, canvasRgb).toFixed(2)}`);

console.log("\nTrying new values:");
// We need muted-foreground to be >= 4.5 vs canvas.
// canvas lum is ~0.9.
// So darkest needs to be (0.9 + 0.05)/4.5 - 0.05 = 0.95/4.5 - 0.05 = 0.211 - 0.05 = 0.161.
// Let's drop L to ~35%.
let newMutedRgb = hslToRgb(215.4, 16.3, 35);
console.log(`New Muted fg (L=35%) vs Canvas: ${contrast(newMutedRgb, canvasRgb).toFixed(2)}`);

// We need border vs canvas to be >= 1.5:1.
// Or we need a prominent shadow. "1.5:1 card-to-canvas OR use a prominent border/shadow. Make sure the implementation actually provides a prominent border."
// Let's modify --border to have contrast >= 1.5 against canvas.
// canvas lum ~ 0.9.
// (0.9+0.05)/1.5 - 0.05 = 0.95/1.5 - 0.05 = 0.633 - 0.05 = 0.583.
// Let's drop L to 70%.
let newBorderRgb = hslToRgb(214.3, 31.8, 70);
console.log(`New Border (L=70%) vs Canvas: ${contrast(newBorderRgb, canvasRgb).toFixed(2)}`);
