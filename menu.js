/* Menu du telephone, formulaire d'objectif et d'avis. Aucune dependance : tourne aussi si les animations sont reduites. */
(function () {
  const WA = 'https://wa.me/33664817826?text=';
  const MAIL = 'contact.coachnelly@gmail.com';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // menu plein ecran
  const btn = $('.mb'), sheet = $('.sheet');
  if (btn && sheet) {
    const label = $('span', btn);
    const rest = () => $$('body > *').filter(n => !n.matches('.bar,.sheet,script,svg'));
    const set = open => {
      btn.setAttribute('aria-expanded', open);
      label.textContent = open ? 'fermer' : 'menu';
      sheet.classList.toggle('on', open);
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
    const links = $$('li a[href*="#"]', sheet);
    const secs = links.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
    if (secs.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(a => { if (a.hash === '#' + e.target.id) a.setAttribute('aria-current', 'true'); else if (a.hash) a.removeAttribute('aria-current'); });
      }), { rootMargin: '-45% 0px -50% 0px' });
      secs.forEach(s => io.observe(s));
    }
  }

  // arrive au bilan, le bouton du bas devient l'appel direct
  const cta = $('.cta'), bilan = document.getElementById('bilan');
  if (cta && bilan && 'IntersectionObserver' in window) {
    const txt = cta.firstChild, base = [txt.textContent, cta.getAttribute('href')];
    new IntersectionObserver(es => {
      const at = es[0].isIntersecting;
      txt.textContent = at ? 'Appeler Nelly' : base[0];
      cta.setAttribute('href', at ? 'tel:+33664817826' : base[1]);
    }, { rootMargin: '0px 0px -40% 0px' }).observe(bilan);
  }

  // premier bilan : l'objectif choisi part dans le message
  const chips = $$('.chip');
  const wa = $('#wa'), ml = $('#ml');
  if (chips.length && wa) {
    const write = goal => {
      const t = 'Bonjour Nelly, je voudrais réserver mon premier bilan' + (goal ? '. Mon objectif : ' + goal + '.' : '.');
      wa.href = WA + encodeURIComponent(t);
      if (ml) ml.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Premier bilan') + '&body=' + encodeURIComponent(t);
    };
    chips.forEach(c => c.addEventListener('click', () => {
      const on = c.getAttribute('aria-pressed') !== 'true';
      chips.forEach(x => x.setAttribute('aria-pressed', 'false'));
      c.setAttribute('aria-pressed', on);
      write(on ? c.textContent.trim() : '');
    }));
    write('');
  }

  // avis : rien n'est stocke sur le site, le message part depuis l'appareil de la personne
  const form = $('#avis-form');
  if (form) {
    const err = $('.err', form);
    const compose = () => {
      const f = new FormData(form);
      const g = k => String(f.get(k) || '').trim();
      if (!g('objectif') || !g('resultat') || !g('prenom')) { err.textContent = 'Remplis les trois champs pour envoyer ton avis.'; return null; }
      if (!f.get('accord')) { err.textContent = 'Coche la case pour autoriser la publication.'; return null; }
      err.textContent = '';
      return 'Mon avis sur Coach Nelly\n\nMon objectif : ' + g('objectif') + '\nCe qui a changé : ' + g('resultat') + '\nPrénom : ' + g('prenom') + '\n\nJ\'autorise la publication de cet avis avec mon prénom sur le site de Coach Nelly.';
    };
    form.addEventListener('submit', e => {
      e.preventDefault();
      const t = compose();
      if (t) location.href = WA + encodeURIComponent(t);
    });
    $('#avis-mail').addEventListener('click', () => {
      const t = compose();
      if (t) location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Mon avis sur Coach Nelly') + '&body=' + encodeURIComponent(t);
    });
  }
})();
