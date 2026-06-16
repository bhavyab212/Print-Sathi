import re

def parse_color(c):
    c = c.strip()
    if c.startswith('#'):
        c = c.lstrip('#')
        if len(c) == 3:
            c = ''.join([x*2 for x in c])
        return tuple(int(c[i:i+2], 16) for i in (0, 2, 4))
    if c.startswith('rgba'):
        m = re.match(r'rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)', c)
        return (int(m.group(1)), int(m.group(2)), int(m.group(3)), float(m.group(4)))
    return (0,0,0)

def luminance(r, g, b):
    a = [v / 255.0 for v in [r, g, b]]
    a = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in a]
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722

def contrast(rgb1, rgb2):
    l1 = luminance(*rgb1)
    l2 = luminance(*rgb2)
    bright = max(l1, l2)
    dark = min(l1, l2)
    return (bright + 0.05) / (dark + 0.05)

def composite(fg, bg):
    if len(fg) == 4:
        r_f, g_f, b_f, a = fg
    else:
        r_f, g_f, b_f = fg
        a = 1.0
    r_b, g_b, b_b = bg
    r = round(a * r_f + (1 - a) * r_b)
    g = round(a * g_f + (1 - a) * g_b)
    b = round(a * b_f + (1 - a) * b_b)
    return (r, g, b)

# Light Mode Values from globals.css
ps_canvas = parse_color('#eff2f6')
ps_ink = parse_color('#0f172a')
ps_surface_1 = parse_color('#ffffff')
ps_hairline = parse_color('rgba(0, 0, 0, 0.35)')

# Calculations
# 1. Text (ps-ink) vs Canvas (ps-canvas)
text_vs_canvas = contrast(ps_ink, ps_canvas)

# 2. Card (ps-surface-1) vs Canvas (ps-canvas)
card_vs_canvas = contrast(ps_surface_1, ps_canvas)

# 3. Card border (ps-hairline over canvas) vs Canvas (ps-canvas)
border_over_canvas = composite(ps_hairline, ps_canvas)
border_vs_canvas = contrast(border_over_canvas, ps_canvas)

# Let's also check border over card vs canvas, or border over card vs card
border_over_card = composite(ps_hairline, ps_surface_1)
border_vs_card = contrast(border_over_card, ps_surface_1)

print(f"Text vs Canvas: {text_vs_canvas:.2f}:1 (Target: >= 4.5:1)")
print(f"Card vs Canvas: {card_vs_canvas:.2f}:1 (Target: >= 1.5:1)")
print(f"Border over Canvas vs Canvas: {border_vs_canvas:.2f}:1 (Target: >= 1.5:1)")
print(f"Border over Card vs Card: {border_vs_card:.2f}:1")

pass_all = (text_vs_canvas >= 4.5 and card_vs_canvas >= 1.5 and border_vs_canvas >= 1.5)
print(f"\nVERDICT: {'PASS' if pass_all else 'FAIL'}")
