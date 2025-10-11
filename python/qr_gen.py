import qrcode
from PIL import Image, ImageDraw, ImageFilter
import math, random, os

# ------------------ Configuración ------------------
URL = "https://www.ebenimeli.org"
SIZE = 700                 # tamaño por QR (cuadrado)
PADDING = 40               # margen entre QR en la imagen final
OUTFILE = "qr_ebenimeli_tears_varied_targets.png"

BORDER = 4                 # borde del QR (en módulos, lo maneja qrcode)
BLUR_EDGE = 1.2            # difuminado muy suave del borde de la rotura
EDGE_SHADE = (230, 230, 230, 255)  # filo "fibra" del papel (gris claro)

# random.seed(42)  # <- descomenta para reproducibilidad

# ------------------ QR base ------------------
def crear_qr():
    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_H,  # 30% recuperación
        box_size=12,
        border=BORDER,
    )
    qr.add_data(URL)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGBA")
    return img.resize((SIZE, SIZE), resample=Image.Resampling.NEAREST)

# ------------------ Geometría / utilidades ------------------
def poly_irregular(cx, cy, base_r, n=None, jitter=0.35):
    if n is None:
        n = random.randint(18, 28)
    pts = []
    for i in range(n):
        ang = 2 * math.pi * i / n
        rr = base_r * (1.0 + random.uniform(-jitter, jitter))
        x = cx + rr * math.cos(ang)
        y = cy + rr * math.sin(ang)
        pts.append((x, y))
    return pts

def distancia(p, q):
    return math.hypot(p[0]-q[0], p[1]-q[1])

# Finder patterns aproximados
FINDER_TL = (140, 140)                # top-left
FINDER_TR = (SIZE - 140, 140)         # top-right
FINDER_BL = (140, SIZE - 140)         # bottom-left
FINDER_LIST = [FINDER_TL, FINDER_TR, FINDER_BL]

CENTER = (SIZE // 2, SIZE // 2)

# ------------------ Roturas (recortes) ------------------
def aplicar_roturas(base_img, roturas):
    """
    Dibuja roturas tipo papel:
      - borde gris claro (fibra) + blur,
      - relleno blanco (agujero).
    """
    im = base_img.copy()
    for (cx, cy, r) in roturas:
        # capa borde
        edge_layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        ed = ImageDraw.Draw(edge_layer, "RGBA")
        borde = poly_irregular(cx, cy, r, jitter=0.30)
        ed.polygon(borde, fill=EDGE_SHADE)
        edge_layer = edge_layer.filter(ImageFilter.GaussianBlur(radius=BLUR_EDGE))

        # capa agujero
        cut_layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        cd = ImageDraw.Draw(cut_layer, "RGBA")
        agujero = poly_irregular(cx, cy, int(r*0.92), jitter=0.25)
        cd.polygon(agujero, fill=(255, 255, 255, 255))

        im = Image.alpha_composite(im, edge_layer)
        im = Image.alpha_composite(im, cut_layer)
    return im

def rotura_banda_central(base_img, horizontal=True, ancho=60):
    """
    Rotura tipo 'banda' delgada que cruza el centro (rompe timing patterns).
    Se considera UNA rotura (cuenta 1).
    """
    im = base_img.copy()
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dl = ImageDraw.Draw(layer, "RGBA")

    piezas = 6
    for i in range(piezas):
        if horizontal:
            cx = int((i + 0.5) * SIZE / piezas) + random.randint(-10, 10)
            cy = SIZE // 2 + random.randint(-10, 10)
        else:
            cx = SIZE // 2 + random.randint(-10, 10)
            cy = int((i + 0.5) * SIZE / piezas) + random.randint(-10, 10)

        r_local = (ancho//2 + random.randint(-10, 10))
        poly = poly_irregular(cx, cy, r_local, jitter=0.30)
        dl.polygon(poly, fill=EDGE_SHADE)

    layer = layer.filter(ImageFilter.GaussianBlur(radius=BLUR_EDGE))

    # recorte central en blanco (la "herida" del papel)
    cut = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dc = ImageDraw.Draw(cut, "RGBA")
    if horizontal:
        y = SIZE//2 + random.randint(-5, 5)
        dc.rectangle([0, y - ancho//2, SIZE, y + ancho//2], fill=(255, 255, 255, 255))
    else:
        x = SIZE//2 + random.randint(-5, 5)
        dc.rectangle([x - ancho//2, 0, x + ancho//2, SIZE], fill=(255, 255, 255, 255))

    im = Image.alpha_composite(im, layer)
    im = Image.alpha_composite(im, cut)
    return im

# ------------------ Diseño de roturas ------------------
def roturas_qr2_escaneable_mas():
    """
    QR 2 (escaneable): 3–4 roturas pequeñas/medianas, alejadas de esquinas y centro.
    """
    roturas = []
    n = random.randint(3, 4)
    for _ in range(n):
        while True:
            cx = random.randint(220, SIZE - 220)
            cy = random.randint(220, SIZE - 220)
            if all(distancia((cx, cy), fp) > 220 for fp in FINDER_LIST) and distancia((cx, cy), CENTER) > 150:
                break
        r = random.randint(70, 115)
        roturas.append((cx, cy, r))
    return roturas

def roturas_qr3_varias_estrategias(n_qr2):
    """
    QR 3 (NO escaneable): igual o menos roturas que QR2, pero variadas y estratégicas.
    Estrategias posibles (elegida al azar):
      A) 1 finder + banda central delgada (horizontal o vertical)
      B) 1 finder + rotura central
      C) Doble banda (H+V) cruzando centro (cuenta 2 roturas)
      D) 1 finder + banda desplazada (no exactamente por el centro) + (opcional) pequeño corte periférico

    Todas buscan impedir la lectura sin llenar de roturas.
    """
    max_tears = min(3, n_qr2)   # no superar al QR2
    # Elegir estrategia
    estrategia = random.choice(["A", "B", "C", "D"])

    roturas = []
    usar_banda = False
    doble_banda = False
    banda_horizontal = True
    ancho_banda = random.randint(55, 80)

    if estrategia == "A":
        # 1 finder + banda central
        (fx, fy) = random.choice(FINDER_LIST)
        roturas.append((fx, fy, random.randint(120, 155)))
        usar_banda = True
        banda_horizontal = (random.random() < 0.5)
    elif estrategia == "B":
        # 1 finder + centro
        (fx, fy) = random.choice(FINDER_LIST)
        roturas.append((fx, fy, random.randint(120, 155)))
        roturas.append((CENTER[0] + random.randint(-25, 25),
                        CENTER[1] + random.randint(-25, 25),
                        random.randint(140, 190)))
    elif estrategia == "C":
        # Doble banda (cuenta como 2 roturas) => H + V
        doble_banda = True
        # (Sin esquinas obligatorias)
    else:  # "D"
        # 1 finder + banda fina no exacta + opcional pequeño corte periférico
        (fx, fy) = random.choice(FINDER_LIST)
        roturas.append((fx, fy, random.randint(120, 150)))
        usar_banda = True
        banda_horizontal = (random.random() < 0.5)
        # opcional tercer corte pequeño, si no superamos a QR2
        if max_tears >= 3 and random.random() < 0.5:
            cx = random.choice([random.randint(200, 260), random.randint(SIZE-260, SIZE-200)])
            cy = random.randint(200, SIZE - 200)
            roturas.append((cx, cy, random.randint(70, 100)))

    # Limitar número total de roturas si excede al QR2
    if len(roturas) > max_tears:
        roturas = roturas[:max_tears]

    return roturas, usar_banda, doble_banda, banda_horizontal, ancho_banda

# ------------------ Generación y composición ------------------
def main():
    base = crear_qr()

    # QR 1: limpio (escaneable)
    clean = base.copy()

    # QR 2: MÁS roturas pero escaneable (3–4, lejos zonas críticas)
    rot2 = roturas_qr2_escaneable_mas()
    qr2 = aplicar_roturas(base.copy(), rot2)

    # QR 3: NO escaneable con estrategias variadas y menos previsibles
    rot3_list, usar_banda, doble_banda, banda_horizontal, ancho_banda = roturas_qr3_varias_estrategias(len(rot2))
    qr3 = aplicar_roturas(base.copy(), rot3_list)

    if doble_banda:
        # Dos bandas cruzando el centro (H y V)
        qr3 = rotura_banda_central(qr3, horizontal=True, ancho=ancho_banda)
        qr3 = rotura_banda_central(qr3, horizontal=False, ancho=ancho_banda)
    elif usar_banda:
        # Una sola banda (por el centro)
        qr3 = rotura_banda_central(qr3, horizontal=banda_horizontal, ancho=ancho_banda)

    # Componer en una sola imagen (sin texto)
    w, h = clean.size
    total_w = w * 3 + PADDING * 2
    combined = Image.new("RGBA", (total_w, h), (255, 255, 255, 255))
    combined.paste(clean, (0, 0))
    combined.paste(qr2, (w + PADDING, 0))
    combined.paste(qr3, (2*w + 2*PADDING, 0))

    combined.save(OUTFILE)
    print(f"✅ Imagen generada: {os.path.abspath(OUTFILE)}")
    print(f"   Roturas QR2 (escaneable): {len(rot2)}")
    msg3 = f"   Roturas QR3 (NO escaneable): {len(rot3_list)}"
    if doble_banda:
        msg3 += " + doble banda"
    elif usar_banda:
        msg3 += " + banda"
    print(msg3)

if __name__ == "__main__":
    main()
