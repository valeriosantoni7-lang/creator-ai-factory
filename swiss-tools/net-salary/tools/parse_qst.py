#!/usr/bin/env python3
"""Extract withholding tax (Quellensteuer) rates from the official ESTV files into one
compact JSON per canton, read by qst.js and index.html.

Source: ESTV, "Quellensteuertarife für den Import in Lohnbuchhaltungssysteme",
files tarYYxx.txt (all cantons: https://www.estv2.admin.ch/qst/YYYY/loehne/tarYYYYtxt.zip).
Record type 06 (ESTV document "Aufbau und Recordformate ... Löhne"):
  01-02 record type · 05-06 canton · 07-16 code (e.g. A0N) · 17-24 valid from
  25-33 monthly income from (cents) · 34-42 band width (cents)
  44-45 children · 46-54 minimum tax (cents) · 55-59 rate (hundredths of a percent)
Rule: tax = max(minimum tax, gross monthly income x rate).

Usage:
  python3 tools/parse_qst.py <folder with tarYYxx.txt> [year]
Run it every January with the new year's files, then update the constants in qst.js.
"""
import collections
import glob
import json
import os
import sys

# Situations offered by the calculator: single, married one income,
# married two incomes (0-2 children), single parent (1-2 children).
CODICI = {"A0", "B0", "B1", "B2", "C0", "C1", "C2", "H1", "H2"}
# Cantons that set the rate on annual income (annual model).
MODELLO_ANNUALE = {"FR", "GE", "TI", "VD", "VS"}
# Above this monthly income only the last rate is kept (enough for ~600k a year).
MAX_MESE = 50_000

OUT = os.path.join(os.path.dirname(__file__), "..", "data")


def rle(valori):
    """[1, 801, 851, 901, ...] -> [[1, 800, 1], [801, 50, 3], ...] (start, step, count)."""
    seg = []
    i = 0
    while i < len(valori):
        if i + 1 < len(valori):
            passo = round(valori[i + 1] - valori[i], 2)
            n = 1
            while i + n < len(valori) and round(valori[i + n] - valori[i + n - 1], 2) == passo:
                n += 1
            seg.append([valori[i], passo, n])
            i += n
        else:
            seg.append([valori[i], 0, 1])
            i += 1
    return seg


def leggi(file):
    righe = collections.defaultdict(list)
    for riga in open(file, encoding="latin-1"):
        if not riga.startswith("06"):
            continue
        codice = riga[6:16].strip()
        if codice[:2] not in CODICI:
            continue
        da = int(riga[24:33]) / 100
        minima = int(riga[45:54]) / 100
        aliquota = int(riga[54:59])  # hundredths of a percent (652 = 6.52%)
        righe[codice].append((da, aliquota, minima, riga[16:24]))
    return righe


def main():
    cartella = sys.argv[1]
    anno = sys.argv[2] if len(sys.argv) > 2 else "2026"
    uscita = os.path.join(OUT, f"qst-{anno}")
    os.makedirs(uscita, exist_ok=True)
    riepilogo = {}
    for file in sorted(glob.glob(os.path.join(cartella, f"tar{anno[2:]}*.txt"))):
        kt = os.path.basename(file)[5:7].upper()
        righe = leggi(file)
        tariffe = {}
        validita = set()
        for codice, rs in sorted(righe.items()):
            rs.sort()
            tagliate = [r for r in rs if r[0] <= MAX_MESE] or rs[:1]
            validita.update(r[3] for r in rs)
            minime = {r[2] for r in tagliate}
            voce = {"f": rle([round(r[0], 2) for r in tagliate]), "r": [r[1] for r in tagliate]}
            if minime != {0}:
                # the minimum tax is the same on every row of a code
                voce["m"] = max(minime)
            tariffe[codice] = voce
        dati = {
            "k": kt,
            "anno": int(anno),
            "valido": sorted(validita)[0],
            "annuale": kt in MODELLO_ANNUALE,
            "chiesa": any(c.endswith("Y") for c in tariffe),
            "t": tariffe,
        }
        with open(os.path.join(uscita, f"{kt.lower()}.json"), "w") as f:
            json.dump(dati, f, separators=(",", ":"))
        riepilogo[kt] = {"codici": len(tariffe), "annuale": dati["annuale"], "chiesa": dati["chiesa"]}
    print(json.dumps(riepilogo, indent=1))


if __name__ == "__main__":
    main()
