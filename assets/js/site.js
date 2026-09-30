/* Pooneh Mousavi — site scripts. No libraries needed. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Outside links and PDFs open in a new tab ---------- */
  const openNew = (a) => {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#') || href.startsWith('mailto:') || a.hasAttribute('data-join')) return;
    const url = new URL(href, location.href);
    if (url.host !== location.host || /\.pdf($|[?#])/i.test(url.pathname)) { a.target = '_blank'; a.rel = 'noopener'; }
  };
  $$('a[href]').forEach(openNew);

  /* ---------- Waveform under the name (home page) ---------- */
  const canvas = $('#wave');
  if (canvas) {
    const draw = (ts) => {
      const dpr = devicePixelRatio || 1, w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w) return;
      if (canvas.width !== w * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
      const x = canvas.getContext('2d');
      x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h);
      const cs = getComputedStyle(document.documentElement), g = x.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, cs.getPropertyValue('--accent')); g.addColorStop(.5, cs.getPropertyValue('--violet')); g.addColorStop(1, cs.getPropertyValue('--coral'));
      x.fillStyle = g;
      const n = Math.floor(w / 5), phase = (ts || 0) / 900;
      for (let i = 0; i < n; i++) {
        const u = i / n;
        const env = (0.18 + 0.82 * Math.max(0, Math.sin(u * Math.PI * 3.2))) * (0.55 + 0.45 * Math.sin(u * 9 + 1.3)) * (1 - u * 0.45);
        const jitter = 0.65 + 0.35 * Math.sin(i * 1.7 + phase * 2) * Math.sin(i * 0.37 + phase);
        const a = Math.max(1.5, env * jitter * (h / 2 - 2));
        x.globalAlpha = 0.35 + 0.65 * env; x.fillRect(i * 5, h / 2 - a, 2.5, a * 2);
      }
    };
    draw(0);
    addEventListener('resize', () => draw(0));
    if (!still) { let last = 0; const loop = (ts) => { if (ts - last > 60) { draw(ts * 0.6); last = ts; } requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
  }

  /* ---------- RG title types itself out; the robot's chat bubble cycles messages ---------- */
  const typed = $('.typed');
  if (typed) {
    // Wrap every letter so the title keeps its final size while it "types" (no layout jump).
    const chars = [];
    $$('span, em', typed).forEach(el => {
      el.innerHTML = [...el.textContent].map(c => `<span class="ch">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
      chars.push(...$$('.ch', el));
    });
    const caret = document.createElement('span'); caret.className = 'caret';
    if (still) { chars.forEach(c => c.classList.add('on')); typed.append(caret); }
    else {
      let i = 0;
      const step = () => {
        if (i < chars.length) { chars[i].classList.add('on'); chars[i].after(caret); i++; setTimeout(step, chars[i - 1].textContent === '\u00a0' ? 140 : 55 + Math.random() * 60); }
      };
      setTimeout(step, 350);
    }
  }
  const bubble = $('#bubble');
  if (bubble) {
    let msgs = []; try { msgs = JSON.parse(bubble.dataset.msgs); } catch (e) {}
    const dots = $('.dots', bubble), msg = $('.msg', bubble); let k = 0;
    const show = () => {
      if (!msgs.length) return;
      const text = msgs[k++ % msgs.length];
      if (still) { dots.hidden = true; msg.textContent = text; setTimeout(show, 4500); return; }
      dots.hidden = false; msg.textContent = '';
      setTimeout(() => {
        dots.hidden = true; let n = 0; const chars = [...text];
        const type = () => { msg.textContent = chars.slice(0, ++n).join(''); if (n < chars.length) setTimeout(type, 28); else setTimeout(show, 3200); };
        type();
      }, 1100);
    };
    setTimeout(show, 600);
  }

  /* ---------- "Show all papers" (home page) ---------- */
  const pubAll = $('#pubAll');
  if (pubAll) {
    const label = pubAll.textContent;
    pubAll.addEventListener('click', () => {
      const extra = $$('#pubs [data-extra]'), showing = extra.some(li => !li.hidden);
      extra.forEach(li => { li.hidden = showing; });
      pubAll.textContent = showing ? label : 'Show selected only';
    });
    if (!$$('#pubs [data-extra]').length) pubAll.hidden = true;
  }

  /* ---------- Past talks: search, term dropdown, expand / collapse (RG page) ---------- */
  const box = $('#talks');
  if (box) {
    const terms = $$('.term', box), q = $('#q'), tog = $('#toggleAll'), count = $('#count'), none = $('#noMatch');
    const pills = $$('#termnav [data-go]'), total = $$('.talk', box).length;
    const setTog = () => { tog.textContent = terms.every(d => d.open) ? 'Collapse all' : 'Expand all'; };
    tog.addEventListener('click', () => { const open = !terms.every(d => d.open); terms.forEach(d => { d.open = open; }); setTog(); });
    box.addEventListener('toggle', setTog, true);
    // Jump to a term: open it and scroll there
    const go = (name, smooth) => {
      const d = terms.find(x => x.dataset.term === name); if (!d) return;
      if (q.value) { q.value = ''; apply(); }
      d.open = true; d.scrollIntoView({ behavior: smooth && !still ? 'smooth' : 'auto', block: 'start' });
      pills.forEach(p => p.classList.toggle('on', p.dataset.go === name)); setTog();
    };
    pills.forEach(p => p.addEventListener('click', e => { e.preventDefault(); go(p.dataset.go, true); history.replaceState(null, '', '#' + d_id(p)); }));
    const d_id = p => p.getAttribute('href').slice(1);
    // Highlight the pill of the term currently on screen
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) pills.forEach(p => p.classList.toggle('on', p.dataset.go === e.target.dataset.term)); }), { rootMargin: '-80px 0px -70% 0px' });
      terms.forEach(d => io.observe(d));
    }
    const apply = () => {
      const text = q.value.trim().toLowerCase(); let shown = 0;
      terms.forEach(d => {
        let n = 0;
        $$('.talk', d).forEach(a => { const ok = !text || a.dataset.search.toLowerCase().includes(text); a.hidden = !ok; if (ok) n++; });
        d.hidden = n === 0; shown += n; if (text) d.open = n > 0;
      });
      if (!text) terms.forEach((d, i) => { d.open = i === 0; });
      count.textContent = shown === total ? `${total} talks` : `${shown} of ${total} talks`;
      none.hidden = shown > 0; tog.hidden = !!text; setTog();
    };
    q.addEventListener('input', apply);
    setTog();
    // Opening the page at /rg.html#fall-2025 jumps straight to that term
    const start = terms.find(d => '#' + d.id === location.hash); if (start) go(start.dataset.term, false);
  }

  /* ---------- Zoom link behind a short check (RG page) ---------- */
  const gate = $('#gate');
  if (gate) {
    const ok = $('#gateOk'), day = $('#gateQ'), err = $('#gateErr'), out = $('#gateLink');
    const close = () => { gate.hidden = true; };
    document.addEventListener('click', e => { if (e.target.closest('[data-join]')) { e.preventDefault(); gate.hidden = false; ok.focus(); } });
    $('#gateX').addEventListener('click', close);
    gate.addEventListener('click', e => { if (e.target === gate) close(); });
    addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    $('#gateGo').addEventListener('click', () => {
      const pass = ok.checked && /^\s*thu(rs(day)?)?\s*$/i.test(day.value);
      err.hidden = pass; if (!pass) return;
      // The meeting link is put together here, so it never appears in the page source.
      const url = ['https:/', 'concordia-ca.zoom.us', 'j', ['810', '0480', '5542'].join('')].join('/');
      out.innerHTML = `<b>Zoom link:</b> <a href="${url}" target="_blank" rel="noopener">${url}</a><br><span style="font-size:13px;color:var(--muted)">Thursdays, 11:00–12:00 ET</span>`;
      out.hidden = false;
    });
  }
})();
