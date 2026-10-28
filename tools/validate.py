"""Comprueba que los números de Perigeo tienen la estructura que espera app.js.

Uso: python3 -I tools/validate.py   (desde la carpeta perigeo)
Sale con código 1 y lista los problemas si algo no cuadra.
"""
import json
import os
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
LEADS = {
    'quote': ['kicker', 'title', 'body'],
    'split': ['kicker', 'title', 'body'],
    'stat': ['stat', 'statLabel', 'title', 'body'],
}
BLOCKS = {
    'analysis': ['title', 'columns'],
    'briefs': ['items'],
    'orbitmap': ['title', 'distance', 'transit', 'legend'],
    'timeline': ['title', 'items'],
    'agenda': [],
}
errors = []


def need(obj, keys, where):
    for k in keys:
        if obj.get(k) in (None, '', []):
            errors.append(f'{where}: falta «{k}»')


def check_issue(path, entry):
    d = json.load(open(path, encoding='utf-8'))
    where = os.path.basename(path)
    need(d, ['number', 'week', 'date', 'dateLabel', 'edition', 'readingTime', 'tagline', 'summary', 'sections', 'sources'], where)
    if d.get('number') != entry['number']:
        errors.append(f'{where}: number {d.get("number")} no coincide con index.json ({entry["number"]})')
    sm = d.get('summary') or {}
    need(sm, ['kicker', 'title', 'items'], where + ' summary')
    ids = set()
    for i, s in enumerate(d.get('sections') or []):
        w = f'{where} sections[{i}]'
        need(s, ['id', 'numeral', 'name'], w)
        if s.get('id') in ids:
            errors.append(f'{w}: id repetido «{s.get("id")}»')
        ids.add(s.get('id'))
        lead = s.get('lead')
        if lead:
            if lead.get('type') not in LEADS:
                errors.append(f'{w}.lead: type desconocido «{lead.get("type")}»')
            else:
                need(lead, LEADS[lead['type']], w + '.lead')
        if not lead and not s.get('blocks'):
            errors.append(f'{w}: sección vacía')
        for j, b in enumerate(s.get('blocks') or []):
            bw = f'{w}.blocks[{j}]'
            if b.get('type') not in BLOCKS:
                errors.append(f'{bw}: type desconocido «{b.get("type")}»')
            else:
                need(b, BLOCKS[b['type']], bw)


index = json.load(open(os.path.join(ROOT, 'issues', 'index.json'), encoding='utf-8'))
numbers = [e['number'] for e in index['issues']]
if len(numbers) != len(set(numbers)):
    errors.append('index.json: números repetidos')
for entry in index['issues']:
    need(entry, ['number', 'file', 'week', 'date', 'dateLabel'], 'index.json')
    p = os.path.join(ROOT, 'issues', entry['file'])
    if not os.path.exists(p):
        errors.append(f'index.json: no existe issues/{entry["file"]}')
        continue
    try:
        check_issue(p, entry)
    except json.JSONDecodeError as e:
        errors.append(f'{entry["file"]}: JSON no válido ({e})')

if errors:
    print('\n'.join(errors))
    sys.exit(1)
print(f'OK · {len(numbers)} número(s)')
