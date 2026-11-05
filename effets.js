/* Coach Nelly : le depart, la course, les couloirs. Rien ne tourne si l'utilisateur reduit les animations. */
(function () {
  if (!document.documentElement.classList.contains('js') || !window.gsap) {
    document.documentElement.classList.remove('js');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const wide = matchMedia('(min-width: 821px)').matches;

  // defilement souple, relie aux declencheurs
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.05, easing: t => 1 - Math.pow(1 - t, 3.2) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const el = $(a.getAttribute('href'));
      if (el) { e.preventDefault(); lenis.scrollTo(el, { duration: 1.3 }); }
    }));
  }

  // titres coupes en lettres, mots insecables
  const split = el => {
    const out = [];
    const txt = el.textContent;
    el.setAttribute('aria-label', txt);
    el.textContent = '';
    txt.split(' ').forEach((w, i, a) => {
      const span = document.createElement('span');
      span.className = 'w';
      span.setAttribute('aria-hidden', 'true');
      [...w].forEach(c => {
        const ch = document.createElement('span');
        ch.className = 'ch';
        ch.textContent = c;
        span.appendChild(ch);
        out.push(ch);
      });
      el.appendChild(span);
      if (i < a.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return out;
  };

  // 1. le depart
  const seen = (() => { try { return sessionStorage.getItem('cn-depart'); } catch (e) { return null; } })();
  const chars = $$('h1 i').flatMap(split);
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: () => lenis && lenis.start() });
  if (lenis) lenis.stop();
  if (seen) {
    gsap.set('.start', { display: 'none' });
  } else {
    try { sessionStorage.setItem('cn-depart', '1'); } catch (e) {}
    tl.fromTo('.start svg', { xPercent: -320 }, { xPercent: 320, duration: 1.05, ease: 'expo.inOut' })
      .to('.start', { clipPath: 'polygon(100% 0,100% 0,100% 100%,100% 100%)', duration: .8, ease: 'expo.inOut' }, .3)
      .set('.start', { display: 'none' });
  }
  const at = seen ? 0 : .72;
  tl.fromTo(chars, { yPercent: 118 }, { yPercent: 0, duration: .9, stagger: .014 }, at)
    .fromTo('.hl', { clipPath: 'circle(0% at 106% 128%)' }, { clipPath: 'circle(150% at 106% 128%)', duration: 1.7, ease: 'power3.out' }, at + .1)
    .fromTo('.foot', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: .7 }, at + .55);

  // 2. le heros court : on entre dans le virage
  gsap.to('.hl', { scale: 1.34, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('h1', { yPercent: -16, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // 3. les lignes se peignent, les chiffres glissent au sol
  $$('.lane').forEach(l => {
    gsap.fromTo(l, { '--ln': 0 }, { '--ln': 1, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: l, start: 'top 88%' } });
    const n = $('.num', l);
    if (n) gsap.fromTo(n, { yPercent: 12 }, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: l, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // 4. les sports s'allument
  const items = $$('.big li');
  const lit = p => { const k = Math.round(p * items.length); items.forEach((li, i) => li.classList.toggle('on', i < k)); };
  ScrollTrigger.create(wide
    ? { trigger: '#sports', start: 'top top', end: '+=120%', pin: true, anticipatePin: 1, onUpdate: s => lit(s.progress) }
    : { trigger: '.big', start: 'top 78%', end: 'bottom 55%', onUpdate: s => lit(s.progress) });

  // 5. la bande : plus vite quand on scrolle fort
  const band = $('.band div');
  const words = ['prépa physique', 'réathlétisation', 'running', 'basket', 'marche', 'renforcement', 'mobilité'];
  const sym = '<svg viewBox="' + $('#sym').getAttribute('viewBox') + '"><use href="#sym"/></svg>';
  const group = words.map(w => '<span>' + w + sym + '</span>').join('');
  band.innerHTML = group + group + group;
  let x = 0, boost = 0;
  gsap.ticker.add((t, dt) => {
    const v = lenis ? Math.abs(lenis.velocity) : 0;
    boost += (v * .35 - boost) * .08;
    x -= (1.1 + boost) * (dt / 16.7);
    const w = band.scrollWidth / 3;
    if (-x >= w) x += w;
    band.style.transform = 'translate3d(' + x + 'px,0,0)';
  });

  // 6. la photo s'ouvre, le nom monte
  if (wide) {
    gsap.fromTo('.nelly img', { clipPath: 'inset(16% 14% 16% 14%)', scale: 1.34 }, {
      clipPath: 'inset(0% 0% 0% 0%)', scale: 1.17, transformOrigin: '0 0', ease: 'none',
      scrollTrigger: { trigger: '.nelly', start: 'top 92%', end: 'top 8%', scrub: true }
    });
  }
  gsap.from('.nelly div > *', { y: 34, autoAlpha: 0, duration: .9, stagger: .09, ease: 'expo.out', scrollTrigger: { trigger: '.nelly', start: wide ? 'top 30%' : 'top 70%' } });

  // 7. les prix comptent, la ligne se trace
  $$('.pr').forEach(p => {
    const node = p.firstChild;
    const end = parseInt(node.textContent, 10);
    const o = { v: Math.round(end * .4) };
    gsap.to(o, {
      v: end, duration: 1.2, ease: 'expo.out', snap: { v: 1 },
      onUpdate: () => { node.textContent = o.v + ' €'; },
      scrollTrigger: { trigger: p, start: 'top 82%' }
    });
  });
  gsap.from('.vl', { scaleY: 0, transformOrigin: '50% 0', duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.offers', start: 'top 82%' } });

  // 8. le bilan
  const big = $('.big2');
  if (big) gsap.from(big, { y: 40, autoAlpha: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '#bilan', start: 'top 62%' } });

  if (fine) {
    // la lumiere rasante suit la souris
    const spot = $('.spot');
    const sx = gsap.quickTo(spot, 'x', { duration: .7, ease: 'power3' });
    const sy = gsap.quickTo(spot, 'y', { duration: .7, ease: 'power3' });
    addEventListener('pointermove', e => { spot.style.opacity = 1; sx(e.clientX); sy(e.clientY); }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { spot.style.opacity = 0; });
    // les lignes du heros reagissent legerement
    const hx = gsap.quickTo('.hl', 'x', { duration: 1.1, ease: 'power3' });
    const hy = gsap.quickTo('.hl', 'y', { duration: 1.1, ease: 'power3' });
    $('.hero').addEventListener('pointermove', e => { hx((e.clientX / innerWidth - .5) * -26); hy((e.clientY / innerHeight - .5) * -18); });
    // le bouton attire le pointeur
    $$('.btn').forEach(b => {
      const bx = gsap.quickTo(b, 'x', { duration: .45, ease: 'power3' });
      const by = gsap.quickTo(b, 'y', { duration: .45, ease: 'power3' });
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); bx((e.clientX - r.left - r.width / 2) * .16); by((e.clientY - r.top - r.height / 2) * .28); });
      b.addEventListener('pointerleave', () => { bx(0); by(0); });
    });
  }

  // 9. la course : le chevron descend le couloir
  const runner = $('.run svg');
  if (runner) gsap.to(runner, { top: '100%', ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
