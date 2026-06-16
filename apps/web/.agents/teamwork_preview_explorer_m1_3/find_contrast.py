import sys

def luminance(r, g, b):
    a = [c / 255.0 for c in (r, g, b)]
    for i in range(3):
        if a[i] <= 0.03928:
            a[i] = a[i] / 12.92
        else:
            a[i] = ((a[i] + 0.055) / 1.055) ** 2.4
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722

def contrast_ratio(l1, l2):
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

for i in range(255, 200, -1):
    l = luminance(i, i, i)
    cr = contrast_ratio(1.0, l)
    if cr >= 1.5:
        print(f"To get 1.5:1 contrast against white, use rgb({i},{i},{i}) -> hex #{i:02x}{i:02x}{i:02x}. Contrast: {cr:.2f}:1")
        break

# What about a prominent border?
for i in range(100, 0, -1):
    # test opacity for border
    bg = (255, 255, 255)
    r, g, b = (0, 0, 0)
    a = i / 100.0
    br = int((1 - a) * bg[0] + a * r)
    bg_g = int((1 - a) * bg[1] + a * g)
    bb = int((1 - a) * bg[2] + a * b)
    l = luminance(br, bg_g, bb)
    cr = contrast_ratio(1.0, l)
    if cr >= 3.0:
        print(f"To get 3:1 contrast against white for border, use rgba(0,0,0,{a}). Contrast: {cr:.2f}:1")
        break
