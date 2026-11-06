/* Menu du telephone, bandeau et phrase du premier bilan. Aucune dependance : tourne aussi si les animations sont reduites. */
(function () {
  const WA = 'https://wa.me/33664817826?text=';
  const MAIL = 'contact.coachnelly@gmail.com';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // menu plein ecran
  const btn = $('.mb'), sheet = $('.sheet');
  if (btn && sheet) {
    const label = $('span', btn);
    const rest = () => $$('body > *').filter(n => !n.matches('.top,.sheet,script,svg'));
    const set = open => {
      btn.setAttribute('aria-expanded', open);
      label.textContent = open ? 'fermer' : 'menu';
      sheet.classList.toggle('on', open);
      $('.top').classList.toggle('open', open);
      document.documentElement.style.overflow = open ? 'hidden' : '';
      rest().forEach(n => { n.inert = open; });
      if (window.cnLenis) window.cnLenis[open ? 'stop' : 'start']();
      if (open) { const a = $('a', sheet); if (a) a.focus({ preventScroll: true }); } else if (sheet.contains(document.activeElement)) btn.focus({ preventScroll: true });
    };
    btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
    $$('a', sheet).forEach(a => a.addEventListener('click', () => set(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape' && sheet.classList.contains('on')) set(false); });
    matchMedia('(min-width: 821px)').addEventListener('change', e => { if (e.matches) set(false); });
    // la section en cours est signalee dans le menu
    const links = $$('.sheet li a[href*="#"], .top nav a[href*="#"]');
    const secs = links.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
    if (secs.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(a => { if (a.hash === '#' + e.target.id) a.setAttribute('aria-current', 'true'); else if (a.hash) a.removeAttribute('aria-current'); });
      }), { rootMargin: '-45% 0px -50% 0px' });
      secs.forEach(s => io.observe(s));
    }
  }

  // bandeau : fond plein des qu'on quitte le haut de page
  const top = $('.top');
  if (top) {
    const theme = $('meta[name=theme-color]');
    const stick = () => {
      const on = scrollY > 24;
      top.classList.toggle('on', on);
      if (theme) theme.content = on ? '#2E0D12' : '#78222B';
    };
    addEventListener('scroll', stick, { passive: true });
    stick();
  }

  // questions : un mot, une reponse
  const tabs = $$('.q');
  if (tabs.length) {
    const show = t => {
      tabs.forEach(b => {
        const on = b === t;
        b.setAttribute('aria-selected', on);
        b.tabIndex = on ? 0 : -1;
        document.getElementById(b.getAttribute('aria-controls')).classList.toggle('on', on);
      });
    };
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    tabs.forEach((b, i) => {
      b.addEventListener('click', () => show(b));
      if (fine) b.addEventListener('pointerenter', () => show(b));
      b.addEventListener('keydown', e => {
        const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (!k) return;
        e.preventDefault();
        const n = tabs[(i + k + tabs.length) % tabs.length];
        show(n);
        n.focus();
      });
    });
  }

  // avis : les etoiles se posent quand l'avis arrive
  const slabs = $$('.slab');
  if (slabs.length && 'IntersectionObserver' in window) {
    const seen = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('pop'); seen.unobserve(e.target); }
    }), { threshold: .12 });
    slabs.forEach(s => seen.observe(s));
  }

  // premier bilan : la phrase du titre est le message, des exemples s'y ecrivent seuls
  const goal = $('#goal');
  if (goal) {
    const input = $('input', goal);
    goal.addEventListener('submit', e => {
      e.preventDefault();
      const v = input.value.trim().replace(/[.!]+$/, '');
      const t = 'Bonjour Nelly, ' + (v ? 'je veux ' + v + '. J' : 'j') + "'aimerais réserver mon premier bilan.";
      location.href = WA + encodeURIComponent(t);
    });
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const ideas = ['courir 10 km', 'revenir de blessure', 'préparer ma saison', 'reprendre le sport', 'marcher chaque semaine'];
      let i = 0, n = ideas[0].length, back = true, wait = 26, seen = false;
      new IntersectionObserver(es => { seen = es[0].isIntersecting; }).observe(goal);
      setInterval(() => {
        if (!seen || input.value || document.activeElement === input) return;
        if (wait > 0) { wait--; return; }
        n += back ? -1 : 1;
        input.placeholder = ideas[i].slice(0, n) || ' ';
        if (back && n === 0) { back = false; i = (i + 1) % ideas.length; }
        else if (!back && n === ideas[i].length) { back = true; wait = 26; }
      }, 70);
    }
  }
})();
