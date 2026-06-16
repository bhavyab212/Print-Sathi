import math

def hsl_to_rgb(h, s, l):
    h /= 360.0
    s /= 100.0
    l /= 100.0
    
    if s == 0:
        r = g = b = l
    else:
        def hue_to_rgb(p, q, t):
            if t < 0: t += 1
            if t > 1: t -= 1
            if t < 1/6: return p + (q - p) * 6 * t
            if t < 1/2: return q
            if t < 2/3: return p + (q - p) * (2/3 - t) * 6
            return p

        q = l * (1 + s) if l < 0.5 else l + s - l * s
        p = 2 * l - q
        r = hue_to_rgb(p, q, h + 1/3)
        g = hue_to_rgb(p, q, h)
        b = hue_to_rgb(p, q, h - 1/3)

    return (round(r * 255), round(g * 255), round(b * 255))

def luminance(r, g, b):
    def adjust(c):
        c /= 255.0
        return c / 12.92 if c <= 0.03928 else math.pow((c + 0.055) / 1.055, 2.4)
    return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b)

def contrast(c1, c2):
    l1 = luminance(*c1)
    l2 = luminance(*c2)
    brightest = max(l1, l2)
    darkest = min(l1, l2)
    return (brightest + 0.05) / (darkest + 0.05)

colors = {
    "background": hsl_to_rgb(0, 0, 100),
    "muted": hsl_to_rgb(210, 40, 96.1),
    "muted_foreground": hsl_to_rgb(215.4, 16.3, 42),
    "border": hsl_to_rgb(214.3, 32, 75),
    "card": hsl_to_rgb(0, 0, 100),
    "ps_canvas": (239, 242, 246),
    "ps_canvas_soft": (226, 232, 240),
}

print(f"Muted text on background: {contrast(colors['muted_foreground'], colors['background']):.2f}:1")
print(f"Muted text on muted bg: {contrast(colors['muted_foreground'], colors['muted']):.2f}:1")
print(f"Card (white) on ps-canvas (#eff2f6): {contrast(colors['card'], colors['ps_canvas']):.2f}:1")
print(f"Card (white) on ps-canvas-soft (#e2e8f0): {contrast(colors['card'], colors['ps_canvas_soft']):.2f}:1")
print(f"Card (white) vs border (hsl 214.3 32% 75%): {contrast(colors['card'], colors['border']):.2f}:1")
