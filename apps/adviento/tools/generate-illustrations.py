"""SVG originals: 24 narrativas distintas con 5 técnicas gráficas editables.
No imágenes externas, sin iconos genéricos reutilizados entre días.
"""
import json, math, pathlib, re, random, html
ROOT=pathlib.Path(__file__).resolve().parents[1]
# El motivo principal (uno por tema) utiliza etiquetas SVG distintas y evita
# iconos de plantilla repetidos. {A}/{B}/{C}/{D}/{I} son colores de cada etapa.
MOTIFS=[
# 01 camino que se abre
'''<path d="M60 510 Q220 455 283 502 T744 488 L744 620 H60Z" fill="{B}" opacity=".42"/><path d="M260 595 Q320 490 365 430 Q440 345 402 268 Q380 224 460 158" fill="none" stroke="{A}" stroke-width="66" opacity=".5" stroke-linecap="round"/><path d="M260 595 Q320 490 365 430 Q440 345 402 268 Q380 224 460 158" fill="none" stroke="{D}" stroke-width="7" stroke-linecap="round" stroke-dasharray="9 18"/><circle cx="465" cy="155" r="64" fill="{C}"/><path d="M470 84 V48 M400 110 L380 90 M540 110 L560 90 M534 192 L555 213" stroke="{D}" stroke-width="8" stroke-linecap="round"/>''',
# 02 dignidad, dos figuras distintas y halo compartido
'''<circle cx="410" cy="290" r="178" fill="none" stroke="{A}" stroke-width="12"/><circle cx="300" cy="221" r="65" fill="{C}"/><circle cx="502" cy="221" r="65" fill="{B}"/><path d="M181 478 Q181 339 301 337 Q418 339 418 478Z" fill="{A}"/><path d="M386 478 Q391 338 502 337 Q624 337 624 478Z" fill="{C}"/><path d="M360 478 Q397 390 440 478" fill="none" stroke="{D}" stroke-width="12" stroke-linecap="round"/><path d="M294 202 Q304 196 314 202 M492 202 Q502 196 512 202" stroke="{I}" stroke-width="6" fill="none"/>''',
# 03 carta abierta y rayos
'''<path d="M182 236 L405 117 L624 236 V461 H182Z" fill="{B}" stroke="{D}" stroke-width="7"/><rect x="231" y="170" width="350" height="236" rx="8" fill="{D}"/><path d="M262 242 H536 M262 288 H504 M262 334 H468" stroke="{A}" stroke-width="12" stroke-linecap="round" opacity=".7"/><path d="M185 237 L405 403 L621 237 V461 H185Z" fill="{A}"/><path d="M185 459 L346 335 M620 459 L465 337" stroke="{C}" stroke-width="12"/><path d="M404 93 L404 46 M326 108 L307 75 M480 107 L505 72" stroke="{C}" stroke-width="9" stroke-linecap="round"/>''',
# 04 bifurcación, elección
'''<path d="M391 576 V360 Q391 330 355 310 L168 218" fill="none" stroke="{B}" stroke-width="100" stroke-linecap="round"/><path d="M391 360 Q391 330 438 299 L618 177" fill="none" stroke="{A}" stroke-width="105" stroke-linecap="round"/><path d="M391 560 V350 L206 247 M393 344 L590 213" fill="none" stroke="{D}" stroke-width="8" stroke-dasharray="11 19"/><circle cx="389" cy="324" r="31" fill="{C}" stroke="{D}" stroke-width="6"/><path d="M180 143 L237 129 L214 181Z M589 109 L659 138 L588 174Z" fill="{C}"/>''',
# 05 manos sosteniendo una planta
'''<path d="M166 419 Q217 344 291 386 L393 431 Q425 440 447 402 L525 313 Q566 263 611 300 Q637 322 601 374 L519 482 Q466 533 371 521 L259 500Z" fill="{B}" stroke="{I}" stroke-width="6"/><path d="M379 406 V242" stroke="{A}" stroke-width="14" stroke-linecap="round"/><path d="M378 311 Q270 333 292 241 Q360 227 378 311Z" fill="{C}"/><path d="M382 283 Q487 287 465 198 Q388 207 382 283Z" fill="{A}"/><circle cx="375" cy="176" r="24" fill="{D}"/>''',
# 06 hogar y mesa circular
'''<path d="M156 292 L395 106 L648 292" fill="none" stroke="{A}" stroke-width="33" stroke-linejoin="round"/><path d="M215 275 H578 V504 H215Z" fill="{B}" stroke="{D}" stroke-width="9"/><path d="M329 505 V347 Q395 290 461 347 V505" fill="{D}"/><ellipse cx="395" cy="418" rx="95" ry="33" fill="{C}"/><path d="M329 420 V476 M461 420 V476" stroke="{C}" stroke-width="12"/><circle cx="276" cy="350" r="20" fill="{A}"/><circle cx="511" cy="352" r="20" fill="{A}"/><path d="M259 383 Q276 366 294 383 M492 385 Q513 366 529 385" stroke="{A}" stroke-width="14" fill="none" stroke-linecap="round"/>''',
# 07 puente sobre río
'''<path d="M93 437 Q213 403 342 438 T730 431 L730 548 H93Z" fill="{B}"/><path d="M113 382 H690" stroke="{D}" stroke-width="18" stroke-linecap="round"/><path d="M156 382 Q252 150 400 382 Q553 150 655 382" fill="none" stroke="{A}" stroke-width="28"/><path d="M169 381 V270 M626 381 V270 M400 381 V240" stroke="{C}" stroke-width="10"/><path d="M170 495 Q225 473 283 495 T400 495 T516 495 T650 495" fill="none" stroke="{D}" stroke-width="11" stroke-linecap="round"/>''',
# 08 brújula
'''<circle cx="403" cy="303" r="211" fill="none" stroke="{A}" stroke-width="18"/><circle cx="403" cy="303" r="167" fill="{B}" opacity=".5"/><path d="M404 114 V179 M404 426 V491 M214 303 H278 M529 303 H592" stroke="{D}" stroke-width="15" stroke-linecap="round"/><path d="M481 217 L374 277 L326 394 L428 327Z" fill="{C}" stroke="{I}" stroke-width="7"/><path d="M481 217 L428 327 L404 305Z" fill="{A}"/><circle cx="403" cy="303" r="18" fill="{D}"/>''',
# 09 pan dividido
'''<ellipse cx="407" cy="486" rx="266" ry="65" fill="{B}" opacity=".48"/><path d="M189 368 Q189 245 327 230 Q448 200 491 302 Q559 266 624 337 Q655 433 557 460 H294 Q188 464 189 368Z" fill="{C}" stroke="{I}" stroke-width="10"/><path d="M398 249 Q363 357 416 460" stroke="{A}" stroke-width="11" stroke-linecap="round" stroke-dasharray="18 15"/><path d="M274 324 l39 -30 M503 332 l39 -23" stroke="{D}" stroke-width="11" stroke-linecap="round"/><circle cx="140" cy="263" r="28" fill="{A}"/><circle cx="658" cy="244" r="25" fill="{B}"/>''',
# 10 reloj arena
'''<path d="M263 136 H543 M263 508 H543" stroke="{A}" stroke-width="28" stroke-linecap="round"/><path d="M292 150 Q291 264 399 311 Q502 265 512 151 M292 496 Q296 370 399 319 Q503 378 512 496" fill="none" stroke="{D}" stroke-width="12"/><path d="M329 202 Q401 248 471 202 Q459 265 400 298 Q338 268 329 202Z" fill="{C}"/><path d="M328 449 Q400 369 475 449 V493 H327Z" fill="{B}"/><path d="M400 301 V432" stroke="{A}" stroke-width="9" stroke-dasharray="7 17"/><circle cx="399" cy="322" r="12" fill="{C}"/>''',
# 11 conversaciones hojas
'''<path d="M144 147 H515 Q571 147 571 202 V355 Q571 414 515 414 H348 L246 482 V412 H144 Q101 408 101 352 V205 Q101 148 144 147Z" fill="{A}"/><path d="M398 286 H658 Q691 286 691 327 V425 Q691 456 656 456 H590 L639 517 L509 456 H398 Q367 456 367 424 V329 Q367 286 398 286Z" fill="{B}" stroke="{D}" stroke-width="7"/><path d="M169 234 H495 M169 294 H395" stroke="{D}" stroke-width="15" stroke-linecap="round"/><path d="M424 352 H625 M424 402 H553" stroke="{C}" stroke-width="13" stroke-linecap="round"/>''',
# 12 árbol de gratitud
'''<path d="M402 520 V259 M402 352 L286 255 M402 322 L524 232" stroke="{I}" stroke-width="25" stroke-linecap="round"/><path d="M397 257 Q260 190 300 120 Q405 145 397 257Z" fill="{A}"/><path d="M397 271 Q503 141 579 196 Q535 285 397 271Z" fill="{B}"/><path d="M386 319 Q225 351 211 257 Q300 207 386 319Z" fill="{C}"/><path d="M407 366 Q570 321 600 400 Q525 471 407 366Z" fill="{A}"/><path d="M290 544 H532" stroke="{D}" stroke-width="13" stroke-linecap="round"/><circle cx="210" cy="162" r="26" fill="{C}"/><circle cx="595" cy="128" r="19" fill="{D}"/>''',
# 13 farol
'''<path d="M326 191 Q327 98 405 98 Q488 98 483 191" fill="none" stroke="{A}" stroke-width="19"/><path d="M287 238 H525 V490 H287Z" fill="{B}" stroke="{I}" stroke-width="13"/><path d="M325 261 H487 V448 H325Z" fill="{D}"/><path d="M403 417 Q347 348 400 280 Q452 346 403 417Z" fill="{C}"/><path d="M399 416 Q370 369 408 325 Q431 380 399 416Z" fill="{A}"/><path d="M275 492 H537 M325 238 L350 186 H458 L484 238" stroke="{A}" stroke-width="17" stroke-linecap="round"/><path d="M218 306 H170 M588 306 H633 M238 200 L202 164 M579 207 L611 172" stroke="{C}" stroke-width="10" stroke-linecap="round"/>''',
# 14 vasija reparada
'''<path d="M256 156 H538 L512 234 Q575 322 537 433 Q494 524 392 526 Q291 524 251 439 Q215 330 281 236Z" fill="{B}" stroke="{I}" stroke-width="9"/><path d="M300 165 H502" stroke="{A}" stroke-width="14" stroke-linecap="round"/><path d="M276 237 L341 293 L313 368 L392 424 L364 509" fill="none" stroke="{D}" stroke-width="14" stroke-linecap="round"/><path d="M511 264 L465 321 L493 393 L438 445" stroke="{C}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M214 477 L173 518 M575 478 L617 521" stroke="{A}" stroke-width="10" stroke-linecap="round"/>''',
# 15 silla vacía en círculo
'''<ellipse cx="403" cy="509" rx="255" ry="42" fill="{B}" opacity=".45"/><circle cx="190" cy="280" r="44" fill="{A}"/><circle cx="607" cy="280" r="44" fill="{A}"/><circle cx="278" cy="173" r="42" fill="{C}"/><circle cx="519" cy="173" r="42" fill="{C}"/><path d="M119 401 Q112 332 186 327 Q259 326 262 401 M532 401 Q534 326 605 327 Q682 332 686 401" fill="{B}"/><rect x="339" y="270" width="127" height="146" rx="8" fill="{D}" stroke="{I}" stroke-width="8"/><path d="M338 413 H468 M358 412 L346 499 M449 413 L463 499" stroke="{I}" stroke-width="17" stroke-linecap="round"/><path d="M397 233 V203" stroke="{C}" stroke-width="8"/>''',
# 16 semilla y manos
'''<path d="M94 492 Q276 394 404 483 Q546 404 710 491 V575 H94Z" fill="{B}"/><path d="M402 467 V262" stroke="{I}" stroke-width="12" stroke-linecap="round"/><path d="M401 329 Q292 335 301 237 Q373 228 401 329Z" fill="{A}"/><path d="M403 291 Q481 177 538 236 Q518 311 403 291Z" fill="{C}"/><path d="M400 477 Q353 416 279 429 L190 453 Q153 470 199 491 L338 532 Q390 538 400 477Z" fill="{D}"/><path d="M405 477 Q467 406 528 439 L605 464 Q656 485 601 504 L467 538 Q411 535 405 477Z" fill="{D}"/><circle cx="580" cy="155" r="54" fill="{C}" opacity=".5"/>''',
# 17 maleta y pasos
'''<path d="M106 467 Q254 399 386 456 T708 456" fill="none" stroke="{B}" stroke-width="68" opacity=".4"/><rect x="288" y="199" width="232" height="291" rx="22" fill="{A}" stroke="{I}" stroke-width="10"/><path d="M349 199 V160 Q349 135 374 135 H434 Q459 135 459 160 V199" fill="none" stroke="{I}" stroke-width="18"/><path d="M369 229 V462 M452 229 V462" stroke="{D}" stroke-width="12" opacity=".6"/><circle cx="575" cy="341" r="26" fill="{C}"/><ellipse cx="604" cy="393" rx="38" ry="17" transform="rotate(-20 604 393)" fill="{D}"/><ellipse cx="187" cy="402" rx="38" ry="17" transform="rotate(-20 187 402)" fill="{D}"/><ellipse cx="240" cy="463" rx="29" ry="15" transform="rotate(22 240 463)" fill="{D}"/>''',
# 18 constelación
'''<path d="M103 469 Q392 429 702 471 V566 H103Z" fill="{B}" opacity=".5"/><path d="M171 325 L285 242 L391 313 L508 177 L631 240" stroke="{A}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="171" cy="325" r="24" fill="{C}"/><circle cx="285" cy="242" r="27" fill="{D}"/><circle cx="391" cy="313" r="22" fill="{C}"/><circle cx="508" cy="177" r="30" fill="{D}"/><circle cx="631" cy="240" r="24" fill="{C}"/><path d="M508 90 V120 M448 177 H469 M557 177 H584 M631 125 L651 105" stroke="{A}" stroke-width="9" stroke-linecap="round"/>''',
# 19 puerta abierta
'''<path d="M208 538 V155 Q208 115 255 115 H543 Q594 115 594 157 V538Z" fill="{A}"/><path d="M259 538 V189 Q259 163 289 163 H517 Q542 163 542 189 V538Z" fill="{D}"/><path d="M343 190 L568 141 V529 L343 538Z" fill="{B}" stroke="{I}" stroke-width="10"/><circle cx="509" cy="352" r="12" fill="{C}"/><path d="M246 541 H624" stroke="{C}" stroke-width="19"/><path d="M171 310 H111 M648 310 H707" stroke="{C}" stroke-width="10" stroke-linecap="round"/>''',
# 20 música y lágrimas
'''<path d="M266 414 Q258 242 407 224 Q571 213 564 371" fill="none" stroke="{B}" stroke-width="27"/><path d="M302 441 Q390 529 494 443" fill="none" stroke="{A}" stroke-width="26" stroke-linecap="round"/><path d="M384 180 V399" stroke="{I}" stroke-width="12"/><path d="M386 183 L515 149 V305 L385 337Z" fill="{C}"/><ellipse cx="355" cy="405" rx="45" ry="26" transform="rotate(-16 355 405)" fill="{A}"/><ellipse cx="483" cy="332" rx="45" ry="26" transform="rotate(-16 483 332)" fill="{A}"/><path d="M171 142 Q157 180 183 196 Q213 178 171 142Z M621 201 Q602 243 628 259 Q657 241 621 201Z" fill="{D}"/>''',
# 21 onda escuchar
'''<path d="M448 460 Q551 424 554 337 Q554 255 485 236 Q406 214 351 282 Q315 333 355 376" fill="none" stroke="{A}" stroke-width="37" stroke-linecap="round"/><path d="M462 413 Q497 398 502 347 Q509 292 462 280 Q414 267 398 312 Q390 342 423 363" fill="none" stroke="{D}" stroke-width="16" stroke-linecap="round"/><path d="M208 348 Q174 294 208 247 M159 389 Q112 289 159 205 M620 244 Q664 291 617 347" fill="none" stroke="{C}" stroke-width="17" stroke-linecap="round"/><circle cx="409" cy="481" r="23" fill="{B}"/><circle cx="606" cy="169" r="16" fill="{A}"/>''',
# 22 caja de regalo con amanecer
'''<path d="M232 299 H571 V505 H232Z" fill="{B}" stroke="{I}" stroke-width="7"/><path d="M216 262 H590 V329 H216Z" fill="{A}"/><path d="M391 263 V506" stroke="{D}" stroke-width="25"/><path d="M289 209 Q234 158 283 136 Q363 122 389 259 Q414 113 502 135 Q567 167 515 212 Q456 250 391 261 Q328 259 289 209Z" fill="{C}" stroke="{I}" stroke-width="8"/><path d="M394 136 V90 M287 140 L255 107 M499 142 L531 100" stroke="{A}" stroke-width="10" stroke-linecap="round"/>''',
# 23 diario con camino
'''<path d="M153 156 Q271 113 401 160 Q540 115 664 163 V506 Q526 455 401 505 Q266 457 153 504Z" fill="{D}" stroke="{I}" stroke-width="9"/><path d="M401 163 V501" stroke="{A}" stroke-width="11"/><path d="M198 218 L349 218 M198 263 L337 263 M198 308 L321 308" stroke="{B}" stroke-width="12" stroke-linecap="round"/><path d="M455 231 Q519 196 565 247 Q616 291 553 340 Q487 380 556 421" fill="none" stroke="{C}" stroke-width="19" stroke-linecap="round" stroke-dasharray="21 19"/><circle cx="455" cy="233" r="21" fill="{A}"/><path d="M551 421 L534 392 L573 405Z" fill="{A}"/>''',
# 24 belén ilustración de establo
'''<path d="M113 329 L396 109 L684 328" fill="none" stroke="{A}" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/><path d="M163 328 V515 H634 V328" fill="none" stroke="{I}" stroke-width="16"/><circle cx="392" cy="317" r="55" fill="{C}"/><path d="M330 415 Q388 357 449 415 L488 506 H284Z" fill="{B}"/><circle cx="268" cy="318" r="39" fill="{D}"/><path d="M207 491 Q201 365 269 359 Q331 362 330 491" fill="{A}"/><circle cx="523" cy="319" r="41" fill="{D}"/><path d="M477 494 Q471 370 525 363 Q593 361 604 494" fill="{A}"/><path d="M392 91 L392 54 M334 109 L303 77 M452 109 L484 77" stroke="{C}" stroke-width="10" stroke-linecap="round"/>''',
]
assert len(MOTIFS)==24
STAGES={
 'primaria-1-3':{'A':'#DF916C','B':'#91BAB0','C':'#F1CB6B','D':'#FAF3DC','I':'#63576A','bg':'#E4EEDC','type':'picture'},
 'primaria-4-6':{'A':'#A96854','B':'#89ADA7','C':'#D2B577','D':'#FCF7ED','I':'#3B6169','bg':'#F4EEDD','type':'journal'},
 'eso-1-2':{'A':'#EC9B7B','B':'#4C9AA4','C':'#E7C176','D':'#F6F0E6','I':'#183A55','bg':'#1C3A53','type':'poster'},
 'eso-3-4':{'A':'#D7A76C','B':'#64898E','C':'#B8C5AD','D':'#E8E1D6','I':'#253F4F','bg':'#1E3442','type':'editorial'},
 'bachillerato':{'A':'#C6A06B','B':'#8EA79D','C':'#E0C899','D':'#F0E6D5','I':'#1C2D33','bg':'#172832','type':'gallery'}
}
def backdrop(palette,day):
 t=palette['type']; B=palette['B']; A=palette['A']; C=palette['C']; D=palette['D']; I=palette['I']; bg=palette['bg']
 if t=='picture':
  return f'''<rect width="800" height="600" rx="38" fill="{bg}"/><path d="M0 440 Q180 363 330 448 T800 425 V600 H0Z" fill="{B}" opacity=".24"/><circle cx="665" cy="111" r="68" fill="{C}" opacity=".45"/><path d="M40 530 Q220 480 300 536 T760 530" stroke="{D}" fill="none" stroke-width="12"/><circle cx="109" cy="112" r="9" fill="{A}"/><circle cx="700" cy="482" r="12" fill="{A}"/><path d="M82 95 l14 -30 l14 30 M705 205 l11 -23 l11 23" fill="none" stroke="{C}" stroke-width="7" stroke-linejoin="round"/>'''
 if t=='journal':
  ruling=''.join(f'<path d="M40 {y} H760" stroke="{I}" stroke-opacity=".085" stroke-width="2"/>' for y in range(76,590,38))
  return f'''<rect width="800" height="600" fill="{bg}"/><rect x="24" y="24" width="752" height="552" fill="none" stroke="{I}" stroke-opacity=".23" stroke-width="3"/>{ruling}<path d="M76 24 V576" stroke="{A}" stroke-opacity=".35" stroke-width="3"/><rect x="619" y="44" width="123" height="56" fill="{B}" opacity=".5" transform="rotate(3 619 44)"/><text x="664" y="78" text-anchor="middle" font-size="26" font-family="Georgia" fill="{I}">{day:02}</text>'''
 if t=='poster':
  return f'''<rect width="800" height="600" fill="{bg}"/><path d="M0 0 H520 L130 600 H0Z" fill="{B}" opacity=".28"/><path d="M530 0 H800 V600 H640Z" fill="{A}" opacity=".3"/><path d="M0 522 H800 V600 H0Z" fill="{I}" opacity=".55"/><path d="M34 42 H766" stroke="{C}" stroke-width="8"/><text x="55" y="95" fill="{D}" opacity=".4" font-family="Arial" font-size="38" font-weight="900" letter-spacing="6">ADVIENTO</text><text x="700" y="572" fill="{D}" font-family="Arial" font-size="34" font-weight="900" text-anchor="end">{day:02}</text>'''
 if t=='editorial':
  return f'''<rect width="800" height="600" fill="{bg}"/><circle cx="525" cy="222" r="230" fill="{B}" opacity=".24"/><rect x="58" y="51" width="684" height="493" fill="none" stroke="{D}" stroke-opacity=".39" stroke-width="3"/><path d="M58 474 H742 M126 52 V474" stroke="{A}" stroke-opacity=".36" stroke-width="3"/><text x="75" y="521" fill="{C}" font-family="Georgia" font-size="30">{day:02} / 24</text>'''
 return f'''<rect width="800" height="600" fill="{bg}"/><rect x="58" y="44" width="684" height="510" fill="none" stroke="{A}" stroke-width="1.7" opacity=".5"/><path d="M95 75 H229 M571 75 H705 M96 515 H287 M550 515 H706" stroke="{C}" stroke-width="3" opacity=".6"/><circle cx="400" cy="305" r="248" fill="none" stroke="{B}" stroke-opacity=".25" stroke-width="2"/><text x="95" y="118" fill="{D}" opacity=".7" font-family="Georgia" font-size="22" letter-spacing="3">ADVIENTO · {day:02}</text>'''
for stage,p in STAGES.items():
 out=ROOT/'assets/illustrations'/stage
 out.mkdir(parents=True,exist_ok=True)
 for day,motif in enumerate(MOTIFS,1):
  # Each motif is unique; the framing varies and incorporates meaningful age-specific visual idioms.
  # Fill tokens manually, avoiding .format() ambiguity with SVG style strings.
  for k in ['A','B','C','D','I']:motif=motif.replace('{'+k+'}',p[k])
  # Slight motif scaling per stage gives a coherent series without identical clones.
  transform={'primaria-1-3':'translate(1 0) scale(.99)',
             'primaria-4-6':'translate(5 5) scale(.98)',
             'eso-1-2':'translate(0 5) scale(1.0)',
             'eso-3-4':'translate(11 0) scale(.96)',
             'bachillerato':'translate(17 13) scale(.94)'}[stage]
  # SVG text alternative in file and external JSON: accessible and concise
  title=json.loads((ROOT/'content'/ (stage+'.json')).read_text())['days'][day-1]['title']
  svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" role="img" aria-labelledby="title desc"><title id="title">{html.escape(title)}</title><desc id="desc">Escena vectorial original del día {day}, modo {stage}, tema: {html.escape(title)}.</desc>{backdrop(p,day)}<g transform="{transform}">{motif}</g></svg>'''
  (out/f'day-{day:02}.svg').write_text(svg)
print('Generated unique themed vector scenes:',len(MOTIFS)*len(STAGES))
