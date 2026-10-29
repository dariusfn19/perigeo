/* Perigeo — lector semanal.
 * Pinta cada número a partir de issues/NN.json replicando el marcado y los
 * estilos en línea del diseño original (Main.dc.html). Los textos admiten
 * HTML en línea (<b>, <em>…) porque los redacta la propia edición. */
(function () {
  'use strict';

  var MONO = "font-family: 'IBM Plex Mono', monospace;";
  var SERIF_D = "font-family: 'Instrument Serif', serif;";
  var LABEL = MONO + ' font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase;';

  var app = document.getElementById('app');
  var root = document.documentElement;
  var issues = [];
  var current = null;

  function attr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function map(list, fn) { return (list || []).map(fn).join('\n'); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isDark() { return root.dataset.theme === 'dark'; }

  /* ---------- Cabecera ---------- */

  function masthead(d) {
    var dark = isDark();
    return '<header style="padding-top: 28px;">' +
      '<div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px 24px; ' + MONO + ' font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); padding-bottom: 14px; border-bottom: 1px solid var(--ink);">' +
        '<span>Nº ' + pad(d.number) + ' — Semana ' + d.week + '</span>' +
        '<span>' + d.dateLabel + '</span>' +
        '<span>' + d.edition + ' · Lectura ' + d.readingTime + '</span>' +
        '<button type="button" data-action="theme" aria-pressed="' + dark + '" style="min-height: 44px; padding: 0 16px; background: transparent; color: var(--ink); border: 1px solid var(--ink); border-radius: 999px; ' + MONO + ' font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer;">' + (dark ? 'Modo claro' : 'Modo oscuro') + '</button>' +
      '</div>' +
      '<div style="display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px 48px; padding: 40px 0 28px;">' +
        '<h1 style="margin: 0; ' + SERIF_D + ' font-weight: 400; font-size: clamp(88px, 15vw, 196px); line-height: 0.82; letter-spacing: -0.02em;">Perigeo<span style="color: var(--accent);">.</span></h1>' +
        '<p style="margin: 0; max-width: 340px; font-size: 17px; line-height: 1.5; color: var(--soft); font-style: italic;">' + d.tagline + '</p>' +
      '</div>' +
      '<nav aria-label="Secciones" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); border-top: 3px double var(--ink); border-bottom: 1px solid var(--ink);">' +
        map(d.sections, function (s) {
          return '<a href="#' + s.id + '" style="text-decoration: none; padding: 14px 0; ' + MONO + ' font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase;"><span style="color: var(--accent);">' + s.numeral + '</span>  ' + s.name + '</a>';
        }) +
      '</nav>' +
    '</header>';
  }

  function summary(sm) {
    return '<section aria-labelledby="tres" style="display: flex; flex-wrap: wrap; gap: 32px 56px; padding: 64px 0 72px; border-bottom: 1px solid var(--hair);">' +
      '<div style="flex: 1 1 260px;">' +
        '<p style="margin: 0 0 12px; ' + LABEL + ' color: var(--accent);">' + sm.kicker + '</p>' +
        '<h2 id="tres" style="margin: 0; ' + SERIF_D + ' font-weight: 400; font-size: 44px; line-height: 1.05;">' + sm.title + '</h2>' +
      '</div>' +
      '<ol style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 22px; flex: 2 1 520px; min-width: 0;">' +
        map(sm.items, function (t, i) {
          return '<li style="display: flex; gap: 20px; font-size: 20px; line-height: 1.5;"><span style="' + SERIF_D + ' font-size: 36px; line-height: 1; color: var(--accent); min-width: 28px;">' + (i + 1) + '</span><span>' + t + '</span></li>';
        }) +
      '</ol>' +
    '</section>';
  }

  /* ---------- Aperturas de sección ---------- */

  function kicker(t) { return '<p style="margin: 0; ' + LABEL + ' color: var(--muted);">' + t + '</p>'; }
  function dek(t) { return t ? '<p style="margin: 0; font-size: 22px; line-height: 1.45; color: var(--soft); font-style: italic;">' + t + '</p>' : ''; }
  function h3(id, t, extra) { return '<h3 id="' + id + '" style="margin: 0; ' + SERIF_D + ' font-weight: 400; ' + extra + '">' + t + '</h3>'; }

  // link: { url, source } → «Leer en Al Jazeera ↗»
  function sourceLink(link) {
    if (!link || !link.url) return '';
    return '<p style="margin: 0;"><a href="' + attr(link.url) + '" target="_blank" rel="noopener" style="text-decoration: none; ' + LABEL + ' color: var(--accent);">Leer en ' + (link.source || 'la fuente') + ' ↗</a></p>';
  }

  // image: { src, alt, credit, caption } — fotos de bancos libres, siempre con crédito
  function photo(img, ratio, mb) {
    if (!img || !img.src) return '';
    return '<figure style="margin: 0 0 ' + (mb || 0) + 'px;">' +
      '<img src="' + attr(img.src) + '" alt="' + attr(img.alt || '') + '" loading="lazy" style="display: block; width: 100%; aspect-ratio: ' + (ratio || '16 / 9') + '; object-fit: cover; background: var(--hair);">' +
      ((img.caption || img.credit) ? '<figcaption style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 16px; margin-top: 10px;">' +
        (img.caption ? '<span style="font-size: 15px; line-height: 1.5; color: var(--soft); font-style: italic;">' + img.caption + '</span>' : '<span></span>') +
        (img.credit ? '<span style="' + MONO + ' font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted);">' + img.credit + '</span>' : '') +
      '</figcaption>' : '') +
    '</figure>';
  }

  var leads = {
    quote: function (l, hid) {
      return '<div style="display: flex; flex-wrap: wrap; gap: 48px 64px;">' +
        '<article style="flex: 2 1 560px; min-width: 0; display: flex; flex-direction: column; gap: 20px;">' +
          kicker(l.kicker) +
          h3(hid, l.title, 'font-size: clamp(40px, 5vw, 64px); line-height: 1.02; letter-spacing: -0.01em;') +
          dek(l.dek) +
          '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px 40px; font-size: 18px; line-height: 1.65;">' +
            map(l.body, function (p) { return '<p style="margin: 0;">' + p + '</p>'; }) +
          '</div>' +
          sourceLink(l.link) +
        '</article>' +
        (l.quote ? '<aside style="flex: 1 1 280px; display: flex; flex-direction: column; justify-content: center; gap: 20px; padding: 32px 0; border-top: 3px double var(--ink); border-bottom: 1px solid var(--ink);">' +
          '<p style="margin: 0; ' + SERIF_D + ' font-size: 96px; line-height: 0.6; color: var(--accent);">“</p>' +
          '<blockquote style="margin: 0; ' + SERIF_D + ' font-size: 36px; line-height: 1.12;">' + l.quote.text + '</blockquote>' +
          '<p style="margin: 0; ' + MONO + ' font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted);">' + l.quote.author + '</p>' +
        '</aside>' : '') +
      '</div>';
    },
    split: function (l, hid) {
      return '<article style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 32px 64px;">' +
        '<div style="display: flex; flex-direction: column; gap: 20px;">' +
          kicker(l.kicker) +
          h3(hid, l.title, 'font-size: clamp(40px, 5vw, 64px); line-height: 1.02;') +
          dek(l.dek) +
        '</div>' +
        '<div style="display: flex; flex-direction: column; gap: 18px; font-size: 18px; line-height: 1.65;">' +
          map(l.body, function (p) { return '<p style="margin: 0;">' + p + '</p>'; }) +
          sourceLink(l.link) +
        '</div>' +
      '</article>';
    },
    stat: function (l, hid) {
      return '<article style="display: flex; flex-wrap: wrap; gap: 32px 64px; align-items: flex-start;">' +
        '<div style="flex: 1 1 260px; display: flex; flex-direction: column; gap: 4px; border-top: 3px double var(--ink); padding-top: 20px;">' +
          '<span style="' + SERIF_D + ' font-size: clamp(120px, 14vw, 180px); line-height: 0.85; color: var(--accent);">' + l.stat + '</span>' +
          '<span style="' + LABEL + ' color: var(--muted);">' + l.statLabel + '</span>' +
        '</div>' +
        '<div style="display: flex; flex-direction: column; gap: 18px; flex: 2 1 560px; min-width: 0;">' +
          (l.kicker ? kicker(l.kicker) : '') +
          h3(hid, l.title, 'font-size: clamp(36px, 4.4vw, 56px); line-height: 1.04;') +
          map(l.body, function (p) { return '<p style="margin: 0; font-size: 18px; line-height: 1.65;">' + p + '</p>'; }) +
          sourceLink(l.link) +
        '</div>' +
      '</article>';
    }
  };

  /* ---------- Bloques ---------- */

  var blocks = {
    analysis: function (b) {
      return '<div style="margin-top: 56px; padding-top: 28px; border-top: 1px solid var(--ink); display: flex; flex-direction: column; gap: 28px;">' +
        '<div style="display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px 20px;">' +
          '<span style="' + LABEL + ' color: var(--accent);">' + (b.label || 'Análisis') + '</span>' +
          '<h4 style="margin: 0; ' + SERIF_D + ' font-weight: 400; font-size: 34px; line-height: 1.1;">' + b.title + '</h4>' +
        '</div>' +
        '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 28px 48px;">' +
          map(b.columns, function (c) {
            return '<div style="display: flex; flex-direction: column; gap: 10px;">' +
              '<p style="margin: 0; ' + LABEL + ' color: var(--muted);">' + c.label + '</p>' +
              '<p style="margin: 0; font-size: 17px; line-height: 1.65;">' + c.text + '</p>' +
            '</div>';
          }) +
        '</div>' +
        (b.key ? '<div style="border-top: 1px solid var(--accent); padding-top: 14px; display: flex; flex-wrap: wrap; gap: 8px 20px;">' +
          '<span style="' + LABEL + ' color: var(--accent);">' + (b.keyLabel || 'Clave para ti') + '</span>' +
          '<p style="margin: 0; flex: 1 1 420px; font-size: 17px; line-height: 1.55; font-style: italic;">' + b.key + '</p>' +
        '</div>' : '') +
      '</div>';
    },

    briefs: function (b) {
      return '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 40px 48px; margin-top: 56px; padding-top: 32px; border-top: 1px solid var(--ink);">' +
        map(b.items, function (it) {
          return '<article style="display: flex; flex-direction: column; gap: 10px;">' +
            photo(it.image, '3 / 2', 6) +
            kicker(it.kicker) +
            '<h4 style="margin: 0; ' + SERIF_D + ' font-weight: 400; font-size: 30px; line-height: 1.1;">' + it.title + '</h4>' +
            '<p style="margin: 0; font-size: 17px; line-height: 1.6;">' + it.text + '</p>' +
            sourceLink(it.link) +
          '</article>';
        }) +
      '</div>';
    },

    photo: function (b) {
      return '<div style="margin-top: 56px;">' + photo(b, b.ratio) + '</div>';
    },

    // Barras horizontales: bars [{ label, value, display?, highlight? }]
    chart: function (b) {
      var max = Math.max.apply(null, (b.bars || []).map(function (x) { return Math.abs(+x.value) || 0; })) || 1;
      return '<figure style="margin: 56px 0 0; padding: 36px 0 8px; border-top: 1px solid var(--ink);">' +
        figcaption(b, 28) +
        '<div style="display: flex; flex-direction: column;">' +
          map(b.bars, function (x) {
            var pct = Math.max(0.5, Math.abs(+x.value) / max * 100);
            var color = x.highlight ? 'var(--accent)' : 'var(--ink)';
            return '<div style="display: grid; grid-template-columns: minmax(110px, 28%) 1fr; gap: 6px 20px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--hair);">' +
              '<span style="font-size: 16px; line-height: 1.35;' + (x.highlight ? ' font-weight: 600;' : '') + '">' + x.label + '</span>' +
              '<div style="display: flex; align-items: center; gap: 12px; min-width: 0;">' +
                '<div style="height: 12px; width: ' + pct.toFixed(1) + '%; background: ' + color + ';"></div>' +
                '<span style="flex: 0 0 auto; ' + MONO + ' font-size: 13px; letter-spacing: 0.04em;' + (x.highlight ? ' color: var(--accent);' : '') + '">' + (x.display != null ? x.display : x.value + (b.unit || '')) + '</span>' +
              '</div>' +
            '</div>';
          }) +
        '</div>' +
        (b.footnote ? '<p style="margin: 20px 0 0; font-size: 13px; color: var(--muted);">' + b.footnote + '</p>' : '') +
      '</figure>';
    },

    // Fila de cifras destacadas: items [{ value, label }]
    stats: function (b) {
      return '<figure style="margin: 56px 0 0; padding: 36px 0 8px; border-top: 1px solid var(--ink);">' +
        (b.title ? figcaption(b, 28) : '') +
        '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 28px 40px;">' +
          map(b.items, function (x) {
            return '<div style="display: flex; flex-direction: column; gap: 8px; border-top: 3px double var(--ink); padding-top: 16px;">' +
              '<span style="' + SERIF_D + ' font-size: clamp(56px, 6vw, 80px); line-height: 0.9; color: var(--accent);">' + x.value + '</span>' +
              '<span style="font-size: 16px; line-height: 1.45; color: var(--soft);">' + x.label + '</span>' +
            '</div>';
          }) +
        '</div>' +
        (b.footnote ? '<p style="margin: 20px 0 0; font-size: 13px; color: var(--muted);">' + b.footnote + '</p>' : '') +
      '</figure>';
    },

    orbitmap: function (b) {
      var small = MONO + ' font-size: clamp(11px, 1.2vw, 13px); letter-spacing: 0.08em; color: var(--muted); text-align: center;';
      return '<figure style="margin: 56px 0 0; padding: 36px 0 8px; border-top: 1px solid var(--ink);">' +
        figcaption(b, 36) +
        '<div style="display: flex; align-items: center; gap: 0;">' +
          '<div style="flex: 0 0 auto; width: clamp(96px, 14vw, 168px); aspect-ratio: 1 / 1; border: 1px dashed var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center;">' +
            '<div style="width: 58%; aspect-ratio: 1 / 1; border-radius: 50%; background: var(--ink);"></div>' +
          '</div>' +
          '<div style="flex: 1 1 auto; min-width: 40px; display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 0 12px;">' +
            '<span style="' + small + '">' + b.distance + '</span>' +
            '<div style="width: 100%; border-top: 1px dashed var(--muted);"></div>' +
            '<span style="' + small + '">' + b.transit + '</span>' +
          '</div>' +
          '<div style="flex: 0 0 auto; position: relative; width: clamp(80px, 11vw, 132px); aspect-ratio: 1 / 1; border: 1px dashed var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center;">' +
            '<div style="width: 50%; aspect-ratio: 1 / 1; border-radius: 50%; background: var(--moon);"></div>' +
            '<div style="position: absolute; left: 50%; top: 75%; width: 10px; height: 10px; margin-left: -5px; margin-top: -5px; border-radius: 50%; background: var(--accent);"></div>' +
          '</div>' +
        '</div>' +
        '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px 40px; margin-top: 36px;">' +
          map(b.legend, function (it) {
            return '<div style="display: flex; flex-direction: column; gap: 6px; border-top: 1px solid var(--hair); padding-top: 12px;">' +
              '<span style="' + LABEL + ' color: var(--accent);">' + it.label + '</span>' +
              '<span style="font-size: 16px; line-height: 1.5;">' + it.text + '</span>' +
            '</div>';
          }) +
        '</div>' +
      '</figure>';
    },

    timeline: function (b) {
      return '<figure style="margin: 56px 0 0; padding: 36px 0 8px; border-top: 1px solid var(--ink);">' +
        figcaption(b, 32) +
        '<div style="height: 1px; background: var(--ink);"></div>' +
        '<ol style="margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 0 24px;">' +
          map(b.items, function (it) {
            var dot = it.highlight
              ? '<span style="width: 13px; height: 13px; border-radius: 50%; background: var(--accent); margin-top: -7px;"></span>'
              : '<span style="width: 11px; height: 11px; border-radius: 50%; background: var(--paper); border: 2px solid var(--ink); margin-top: -7px;"></span>';
            return '<li style="display: flex; flex-direction: column; gap: 8px;">' + dot +
              '<span style="' + MONO + ' font-size: 13px; letter-spacing: 0.08em; margin-top: 8px;' + (it.highlight ? ' color: var(--accent);' : '') + '">' + it.when + '</span>' +
              '<strong style="font-weight: 600; font-size: 17px;">' + it.title + '</strong>' +
              '<span style="font-size: 15px; line-height: 1.5; color: var(--soft);">' + it.text + '</span>' +
            '</li>';
          }) +
        '</ol>' +
        (b.footnote ? '<p style="margin: 24px 0 0; font-size: 13px; color: var(--muted);">' + b.footnote + '</p>' : '') +
      '</figure>';
    },

    agenda: function (b) {
      var out = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 48px 56px;">';
      if (b.fact) {
        out += '<div style="display: flex; flex-direction: column; gap: 16px; background: var(--invBg); color: var(--invText); padding: 36px 32px;">' +
          '<p style="margin: 0; ' + LABEL + ' color: var(--invMuted);">' + b.fact.label + '</p>' +
          '<p style="margin: 0; ' + SERIF_D + ' font-size: 84px; line-height: 0.95;">' + b.fact.value + '</p>' +
          '<p style="margin: 0; font-size: 17px; line-height: 1.55; color: var(--invBody);">' + b.fact.text + '</p>' +
        '</div>';
      }
      if (b.radar) {
        out += '<div style="display: flex; flex-direction: column;">' +
          '<p style="margin: 0 0 8px; ' + LABEL + ' color: var(--accent);">' + b.radar.label + '</p>' +
          dlist(b.radar.items) +
        '</div>';
      }
      if (b.notes && b.notes.length) {
        out += '<div style="display: flex; flex-direction: column; gap: 20px;">' +
          map(b.notes, function (n, i) {
            return '<div style="display: flex; flex-direction: column; gap: 8px;' + (i ? ' border-top: 1px solid var(--ink); padding-top: 16px;' : '') + '">' +
              '<p style="margin: 0; ' + LABEL + ' color: var(--accent);">' + n.label + '</p>' +
              map(n.paragraphs, function (p) { return '<p style="margin: 0; font-size: 17px; line-height: 1.55;">' + p + '</p>'; }) +
            '</div>';
          }) +
        '</div>';
      }
      return out + '</div>';
    }
  };

  function figcaption(b, mb) {
    return '<figcaption style="display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; margin-bottom: ' + mb + 'px;">' +
      '<span style="' + SERIF_D + ' font-size: 30px;">' + b.title + '</span>' +
      (b.note ? '<span style="' + MONO + ' font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); align-self: flex-end;">' + b.note + '</span>' : '') +
    '</figcaption>';
  }

  // items: [{ when, what, href? }]
  function dlist(items) {
    return '<dl style="margin: 0;">' +
      map(items, function (it) {
        var what = it.href ? '<a href="' + attr(it.href) + '" style="text-decoration: none;">' + it.what + '</a>' : it.what;
        return '<div style="display: flex; gap: 20px; padding: 14px 0; border-bottom: 1px solid var(--hair);"><dt style="' + MONO + ' font-size: 13px; min-width: 76px;">' + it.when + '</dt><dd style="margin: 0; font-size: 17px; line-height: 1.45;">' + what + '</dd></div>';
      }) +
    '</dl>';
  }

  function section(s, last) {
    var hid = s.id + '-h';
    var head = '<div style="display: flex; align-items: baseline; gap: 16px; margin-bottom: 40px;">' +
      '<span style="' + SERIF_D + ' font-size: 64px; line-height: 1; color: var(--accent);">' + s.numeral + '</span>' +
      '<p' + (s.lead ? '' : ' id="' + hid + '"') + ' style="margin: 0; ' + MONO + ' font-size: 13px; letter-spacing: 0.14em; text-transform: uppercase;">' + s.name + '</p>' +
      '<div style="flex: 1; height: 1px; background: var(--ink); align-self: center;"></div>' +
    '</div>';
    var lead = s.lead && leads[s.lead.type] ? photo(s.lead.image, '16 / 9', 40) + leads[s.lead.type](s.lead, hid) : '';
    var body = map(s.blocks, function (b) { return blocks[b.type] ? blocks[b.type](b) : ''; });
    var style = last ? 'padding: 72px 0 56px;' : 'padding: 72px 0; border-bottom: 1px solid var(--hair);';
    return '<section id="' + s.id + '" aria-labelledby="' + hid + '" style="' + style + '">' + head + lead + body + '</section>';
  }

  function footer(d) {
    return '<footer style="border-top: 3px double var(--ink); padding-top: 24px; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 16px 40px;">' +
      '<p style="margin: 0; ' + SERIF_D + ' font-size: 32px;">Perigeo<span style="color: var(--accent);">.</span></p>' +
      '<p style="margin: 0; flex: 1 1 520px; font-size: 13px; line-height: 1.6; color: var(--muted);">' + d.sources + '</p>' +
    '</footer>';
  }

  // Solo aparece cuando hay más de un número publicado.
  function archive(d) {
    if (issues.length < 2) return '';
    var items = issues.slice().sort(function (a, b) { return b.number - a.number; }).map(function (it) {
      var label = it.dateLabel + (it.number === d.number ? ' · <span style="color: var(--accent);">en pantalla</span>' : '');
      return { when: 'Nº ' + pad(it.number), what: label, href: '?n=' + it.number };
    });
    // Con números diarios la lista crece rápido: las dos últimas semanas a la vista, el resto plegado.
    var RECENT = 14;
    var older = items.slice(RECENT);
    return '<nav aria-label="Archivo" style="margin-top: 56px; display: flex; flex-direction: column;">' +
      '<p style="margin: 0 0 8px; ' + LABEL + ' color: var(--accent);">Números anteriores</p>' +
      dlist(items.slice(0, RECENT)) +
      (older.length ? '<details style="margin-top: 4px;"><summary style="cursor: pointer; padding: 14px 0; ' + LABEL + ' color: var(--muted);">Ver ' + older.length + ' números más</summary>' + dlist(older) + '</details>' : '') +
    '</nav>';
  }

  function render(d) {
    var html = '<main style="background: var(--paper); color: var(--ink); font-family: \'Source Serif 4\', Georgia, serif; min-height: 100%; transition: background 0.3s, color 0.3s;">' +
      '<div style="max-width: 1200px; margin: 0 auto; padding: 0 clamp(16px, 4vw, 48px) 96px;">' +
        masthead(d) +
        summary(d.summary) +
        map(d.sections, function (s, i) { return section(s, i === d.sections.length - 1); }) +
        footer(d) +
        archive(d) +
      '</div>' +
    '</main>';
    app.innerHTML = html;
    document.title = 'Perigeo · Nº ' + pad(d.number);
  }

  function message(title, text) {
    app.innerHTML = '<main style="background: var(--paper); color: var(--ink); font-family: \'Source Serif 4\', Georgia, serif; min-height: 100vh;">' +
      '<div style="max-width: 1200px; margin: 0 auto; padding: 28px clamp(16px, 4vw, 48px) 96px;">' +
        '<h1 style="margin: 40px 0 24px; ' + SERIF_D + ' font-weight: 400; font-size: clamp(88px, 15vw, 196px); line-height: 0.82; letter-spacing: -0.02em;">Perigeo<span style="color: var(--accent);">.</span></h1>' +
        '<p style="margin: 0 0 8px; ' + LABEL + ' color: var(--accent);">' + title + '</p>' +
        '<p style="margin: 0; font-size: 17px; line-height: 1.55; color: var(--soft);">' + text + '</p>' +
      '</div></main>';
  }

  /* ---------- Tema ---------- */

  function setTheme(dark) {
    root.dataset.theme = dark ? 'dark' : 'light';
    try { localStorage.setItem('perigeo:theme', dark ? 'dark' : 'light'); } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0E1014' : '#FAFAF7');
    var btn = app.querySelector('[data-action="theme"]');
    if (btn) {
      btn.setAttribute('aria-pressed', String(dark));
      btn.textContent = dark ? 'Modo claro' : 'Modo oscuro';
    }
  }

  app.addEventListener('click', function (e) {
    if (e.target.closest('[data-action="theme"]')) { setTheme(!isDark()); return; }
    // Navegación interna sin recargar (archivo de números y anclas de sección)
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (href.charAt(0) === '#') {
      var el = document.getElementById(href.slice(1));
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth' }); history.replaceState(null, '', location.search + href); }
    } else if (href.indexOf('?n=') === 0) {
      e.preventDefault();
      history.pushState(null, '', href);
      route();
      window.scrollTo(0, 0);
    }
  });

  /* ---------- Datos ---------- */

  function getJSON(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(r.status + ' ' + url);
      return r.json();
    });
  }

  function route() {
    var n = parseInt(new URLSearchParams(location.search).get('n'), 10);
    var latest = issues.reduce(function (m, it) { return !m || it.number > m.number ? it : m; }, null);
    var entry = issues.filter(function (it) { return it.number === n; })[0] || latest;
    if (!entry) return message('Sin números', 'Todavía no hay ninguna edición publicada.');
    if (current && current.number === entry.number) return render(current);
    return getJSON('issues/' + entry.file).then(function (d) {
      current = d;
      render(d);
      if (location.hash) {
        var el = document.getElementById(location.hash.slice(1));
        if (el) el.scrollIntoView();
      }
    });
  }

  function load() {
    return getJSON('issues/index.json').then(function (idx) {
      issues = idx.issues || [];
      return route();
    }).catch(function () {
      message('Sin conexión', 'No se ha podido cargar la edición. Vuelve a intentarlo cuando tengas conexión.');
    });
  }

  window.addEventListener('popstate', route);

  // Al volver a la app (p. ej. desde segundo plano en iPhone) comprueba si hay número nuevo.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') return;
    getJSON('issues/index.json').then(function (idx) {
      var fresh = idx.issues || [];
      if (fresh.length !== issues.length) {
        issues = fresh;
        if (!new URLSearchParams(location.search).get('n')) { current = null; route(); }
        else if (current) render(current);
      }
    }).catch(function () {});
  });

  setTheme(isDark());
  load();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js'); });
  }
})();
