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
function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

console.log("ps-ink-subtle (#475569) on ps-canvas (#eff2f6):", getContrast(getLuminance(...hexToRgb("#eff2f6")), getLuminance(...hexToRgb("#475569"))));
console.log("muted-foreground (hsl 215.4 16.3% 42%) on muted (hsl 210 40% 96.1%):", getContrast(getLuminance(89,101,117), getLuminance(241,245,249)));
