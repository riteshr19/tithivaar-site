/* Tithivaar website: live content from the app's own data, and small scroll effects. */
(() => {
  'use strict';
  const DAY_MS = 864e5;
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const TYPE = { major: 'Festival', vrat: 'Vrat', observance: 'Observance', regional: 'Regional' };

  const $ = s => document.querySelector(s);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const todayKey = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const utc = k => { const [y, m, d] = k.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  const fmt = k => { const d = new Date(utc(k)); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; };
  const daysUntil = k => Math.round((utc(k) - utc(todayKey())) / DAY_MS);
  const getJSON = url => fetch(url).then(r => { if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); });

  // Seamless marquee: the track holds the list twice and scrolls by half.
  const track = $('#marquee');
  if (track) track.innerHTML += track.innerHTML;

  // Fade sections in once as they scroll into view.
  const reveal = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); reveal.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(n => reveal.observe(n));

  // "A day with Tithivaar": highlight the step whose scene is on screen.
  const links = [...document.querySelectorAll('#dayNav a')];
  const scenes = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -45% 0px' });
  document.querySelectorAll('.scene').forEach(s => scenes.observe(s));

  // Blog: "Load more" shows the remaining posts.
  const more = $('#loadMore');
  if (more) more.addEventListener('click', () => {
    document.querySelectorAll('.post.more').forEach(p => { p.hidden = false; });
    more.parentElement.remove();
  });

  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Verse of the day: the same rotation the app uses (days since 1970 in UTC, mod count).
  // Only the landing page shows live verses and festivals.
  if ($('#versesRow')) getJSON('verses.json').then(list => {
    const row = $('#versesRow');
    if (!row || !list.length) return;
    const n = Math.floor(utc(todayKey()) / DAY_MS);
    for (let i = 0; i < 8; i++) {
      const q = list[(((n + i) % list.length) + list.length) % list.length];
      const card = el('article', 'verse' + (i === 0 ? ' today' : ''));
      const when = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : fmt(new Date(utc(todayKey()) + i * DAY_MS).toISOString().slice(0, 10));
      card.append(el('span', 'src', when + ' · ' + q.s), el('p', 'orig', q.t), el('p', 'mean', '“' + q.e + '”'));
      row.append(card);
    }
    const step = () => Math.min(row.clientWidth * 0.9, 440);
    $('#vPrev').addEventListener('click', () => row.scrollBy({ left: -step(), behavior: 'smooth' }));
    $('#vNext').addEventListener('click', () => row.scrollBy({ left: step(), behavior: 'smooth' }));
  }).catch(() => { const s = $('#verses'); if (s) s.hidden = true; });

  // Festivals: the next three from the app's data, the icon cloud and the next Purnima.
  if ($('#fests') || $('#iconCloud')) getJSON('festivals.json').then(list => {
    const today = todayKey();
    const upcoming = list.filter(f => (f.e || f.s) >= today).sort((a, b) => a.s.localeCompare(b.s));
    const box = $('#fests');
    if (box) {
      const next = upcoming.filter(f => f.i && f.t !== 'vrat').slice(0, 3);
      if (!next.length) $('#upcoming').hidden = true;
      next.forEach(f => {
        const card = el('article', 'fest');
        const pic = el('div', 'pic');
        const img = el('img'); img.src = f.i; img.alt = ''; img.loading = 'lazy';
        const d = daysUntil(f.s);
        pic.append(img, el('span', 'when', d < 0 ? 'Ongoing' : d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : 'In ' + d + ' days'));
        const meta = el('div', 'meta');
        meta.append(el('span', null, TYPE[f.t] || 'Festival'), el('span', null, fmt(f.s) + (f.e ? ' – ' + fmt(f.e) : '') + ' · ' + WD[new Date(utc(f.s)).getUTCDay()]));
        card.append(pic, meta, el('h3', null, f.n), el('p', null, f.d));
        box.append(card);
      });
    }
    const cloud = $('#iconCloud');
    if (cloud) {
      const spots = [[4, 58], [18, 8], [34, 52], [50, 4], [64, 56], [80, 12], [26, 30], [58, 30], [90, 50], [8, 18]];
      const seen = new Set();
      list.filter(f => f.i && f.t === 'major' && !seen.has(f.i) && seen.add(f.i)).slice(0, spots.length).forEach((f, i) => {
        const img = el('img'); img.src = f.i; img.alt = f.n; img.title = f.n; img.loading = 'lazy';
        img.style.left = 'calc(' + spots[i][0] + '% - 29px)'; img.style.top = spots[i][1] + '%';
        img.style.transform = 'rotate(' + ((i % 2 ? 1 : -1) * (4 + (i * 3) % 7)) + 'deg)';
        cloud.append(img);
      });
    }
    const purnima = upcoming.find(f => /Purnima/.test(f.n) && f.s >= today);
    const big = document.querySelector('.float-big');
    if (big && purnima) {
      const d = daysUntil(purnima.s);
      big.querySelector('small').textContent = (d === 0 ? 'Tonight' : d === 1 ? 'Tomorrow' : 'Next Purnima') + ' · ' + purnima.n;
      big.querySelector('b').textContent = fmt(purnima.s);
    } else if (big) { big.hidden = true; }
  }).catch(() => { const s = $('#upcoming'); if (s) s.hidden = true; });
})();
