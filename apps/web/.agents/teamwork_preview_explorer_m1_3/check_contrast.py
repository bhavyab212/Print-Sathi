import re
import sys

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    if len(hex_str) == 3:
        hex_str = ''.join(c + c for c in hex_str)
    return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

def rgba_to_rgb(rgba, bg=(255, 255, 255)):
    r, g, b, a = rgba
    return (
        int((1 - a) * bg[0] + a * r),
        int((1 - a) * bg[1] + a * g),
        int((1 - a) * bg[2] + a * b)
    )

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

# Current variables from globals.css
canvas_bg = hex_to_rgb("#eff2f6")
surface_1 = hex_to_rgb("#ffffff")
text_ink = hex_to_rgb("#0f172a")

l_canvas = luminance(*canvas_bg)
l_surface1 = luminance(*surface_1)
l_text = luminance(*text_ink)

contrast_text_canvas = contrast_ratio(l_text, l_canvas)
contrast_text_surface = contrast_ratio(l_text, l_surface1)
contrast_card_canvas = contrast_ratio(l_surface1, l_canvas)

print(f"Text (#0f172a) vs Canvas (#eff2f6) Contrast: {contrast_text_canvas:.2f}:1")
print(f"Text (#0f172a) vs Card (#ffffff) Contrast: {contrast_text_surface:.2f}:1")
print(f"Card (#ffffff) vs Canvas (#eff2f6) Contrast: {contrast_card_canvas:.2f}:1")

# Also let's check borders
hairline = rgba_to_rgb((0, 0, 0, 0.22), surface_1)
l_hairline = luminance(*hairline)
contrast_border_card = contrast_ratio(l_surface1, l_hairline)
print(f"Border (rgba(0,0,0,0.22)) vs Card (#ffffff) Contrast: {contrast_border_card:.2f}:1")
