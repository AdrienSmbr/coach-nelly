/* Page avis : un film au defilement. Un tir au basket, le ballon devient ballon de foot, haltere, chaussure,
   kettlebell, puis le symbole Coach Nelly. Une seule forme morphee, pilotee par le scroll, sans librairie. */
(function () {
  const root = document.documentElement;
  if (!root.classList.contains('fx')) return;
  const stage = document.querySelector('.stage'), film = document.querySelector('.film');
  const svg = document.querySelector('.scene');
  const hoopB = svg.querySelector('#hoopB'), hoopF = svg.querySelector('#hoopF'), net = svg.querySelector('#net');
  const ob = svg.querySelector('#ob'), sil = svg.querySelector('#sil'), slash = svg.querySelector('#slash');
  const hole = svg.querySelector('#hole'), trail = svg.querySelector('#trail'), ticks = svg.querySelector('#ticks');
  const dets = [...svg.querySelectorAll('.det')];
  const texts = [...stage.querySelectorAll('.rv')];

  const N = 220, LAST = 6;
  // formes dans une boite de +/-100 centree sur 0
  const D = {
    ball: 'M0-96A96 96 0 1 1 0 96A96 96 0 1 1 0-96Z',
    dumb: 'M-108-10H-96V-42H-74V-60H-46V-9H46V-60H74V-42H96V-10H108V10H96V42H74V60H46V9H-46V60H-74V42H-96V10H-108Z',
    shoe: 'M-104 48C-108 30-104 8-98-14C-96-24-92-34-84-36C-76-36-70-28-60-28C-50-28-44-36-40-44L-18-40C-10-24 8-8 30 2C50 10 76 12 92 24C104 32 108 42 106 52C106 58 102 60 96 60L-92 60C-100 60-104 56-104 48Z',
    kett: 'M-42-92C-14-104 14-104 42-92C58-84 60-62 52-40L44-18C66-2 78 20 78 44C78 78 44 100 0 100C-44 100-78 78-78 44C-78 20-66-2-44-18L-52-40C-60-62-58-84-42-92Z',
    chev: 'M-26.38-91.94C-28.8-95.4-26.33-100.15-22.11-100.15L34.01-100.15C35.72-100.15 37.31-99.32 38.29-97.93L104.74-2.99C106-1.2 106 1.2 104.74 2.99L38.29 97.93C37.31 99.32 35.72 100.15 34.01 100.15L-22.11 100.15C-26.33 100.15-28.8 95.4-26.38 91.94L37.98 0Z'
  };
  const sample = d => {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    const L = p.getTotalLength(), a = [];
    for (let i = 0; i < N; i++) { const q = p.getPointAtLength(L * i / N); a.push([q.x, q.y]); }
    let s = 0;
    for (let i = 0; i < N; i++) { const b = a[(i + 1) % N]; s += a[i][0] * b[1] - b[0] * a[i][1]; }
    return s < 0 ? a.reverse() : a;
  };
  // meme point de depart pour chaque forme, sinon elles se retournent pendant le morphing
  const align = (a, ref) => {
    let best = 0, min = Infinity;
    for (let k = 0; k < N; k += 2) {
      let e = 0;
      for (let i = 0; i < N; i += 5) { const b = a[(i + k) % N], c = ref[i]; e += (b[0] - c[0]) ** 2 + (b[1] - c[1]) ** 2; }
      if (e < min) { min = e; best = k; }
    }
    return a.slice(best).concat(a.slice(0, best));
  };
  const ball = sample(D.ball), dumb = align(sample(D.dumb), ball), shoe = align(sample(D.shoe), dumb), kett = align(sample(D.kett), shoe), chev = align(sample(D.chev), kett);
  const SH = [ball, ball, ball, dumb, shoe, kett, chev];
  const DET = [0, 0, 1, 2, 3, -1, -1];       // details dessines sur chaque etat
  const ROT = [0, 0, 0, -20, -6, 0, 0];
  const SIZE = [.72, 1, 1, 1.08, 1.12, 1, .95];
  const SPIN = [1.5, 2, 1, 1, 1, 1];
  const SIDE = [1, 0, 1, 0, 1, 0, 1];        // 1 : objet a droite

  let W = 0, H = 0, R = 0, wide = true;
  const measure = () => {
    W = stage.clientWidth; H = stage.clientHeight; wide = W > 820;
    R = wide ? Math.min(H * .3, W * .19) : Math.min(H * .17, W * .27);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    draw(cur, true);
  };
  const at = i => {
    if (wide) return [SIDE[i] ? W * .75 : W * .25, i === 0 ? H * .68 : H * .5];
    if (i === 0) return [W * .72, H * .74];
    return [SIDE[i] ? W * .58 : W * .42, H * .25];
  };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
  const inOut = v => { v = clamp(v); return v < .5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };
  // les vols restent dans le cadre : sur ordinateur par le haut, sur telephone par le bas, sous le texte qui s'efface
  const arc = (a, b, e) => [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e + (wide ? -H * .2 : H * .24) * 4 * e * (1 - e)];
  // le tir : le ballon monte, passe dans le panier, retombe
  const shot = (a, b, e) => [a[0] + (b[0] - a[0]) * smooth(e / .72), a[1] + (b[1] - a[1]) * e - H * (wide ? .5 : .42) * 4 * e * (1 - e)];
  const rim = () => { const b = at(1); return [b[0], b[1] - H * (wide ? .2 : .115), R * (wide ? .62 : .72)]; };

  const pathOf = (a, b, m) => {
    let d = 'M';
    for (let i = 0; i < N; i++) {
      const p = a[i], q = b[i];
      d += (p[0] + (q[0] - p[0]) * m).toFixed(1) + ' ' + (p[1] + (q[1] - p[1]) * m).toFixed(1) + (i < N - 1 ? 'L' : 'Z');
    }
    return d;
  };

  let lastShape = '';
  function draw(u, force) {
    u = clamp(u, 0, LAST);
    const i = Math.min(LAST - 1, Math.floor(u)), t = u - i, j = i + 1;
    const hold = t < .5, h = clamp(t / .5), e = inOut((t - .5) / .5), a = at(i), b = at(j);
    const path = i === 0 ? shot : arc;
    let [x, y] = path(a, b, e);
    let rot = ROT[i] + (ROT[j] - ROT[i]) * e + SPIN[i] * 360 * e;
    let sc = (SIZE[i] + (SIZE[j] - SIZE[i]) * e) * R / 100;
    let sx = 1, sy = 1;
    const fly = Math.sin(Math.PI * e);
    if (!hold) {
      sx = 1 + .1 * fly; sy = 1 - .08 * fly;
      // le ballon s'eloigne pendant le tir pour passer dans l'arceau, les autres objets aussi, un peu
      sc *= i === 0 ? 1 - .58 * smooth(e / .25) * (1 - smooth((e - .94) / .06)) : 1 - .26 * fly;
    }
    // l'objet vit pendant que l'avis se lit
    if (hold && i > 0) {
      const k = 1 - h, land = clamp(h / .24);
      const sq = Math.sin(Math.PI * land) * (1 - land * .4);
      sx = 1 + .13 * sq; sy = 1 - .15 * sq; y += R * .15 * sq;
      if (i === 1) y -= Math.abs(Math.sin(h * Math.PI * 3)) * R * .42 * k;
      if (i === 1 || i === 2) rot += h * 70;
      if (i === 3) { y -= Math.sin(h * Math.PI) * R * .34; rot += Math.sin(h * Math.PI * 2) * 7; }
      if (i === 4) { x += (h - .5) * R * .5; rot += Math.sin(h * Math.PI * 4) * 4; }
      if (i === 5) rot += Math.sin(h * Math.PI * 2) * 12 * k;
    }
    ob.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(2)}) scale(${(sc * sx).toFixed(4)} ${(sc * sy).toFixed(4)})`);

    const m = smooth((t - .6) / .28);
    const key = i + ':' + m.toFixed(3);
    if (key !== lastShape || force) { sil.setAttribute('d', pathOf(SH[i], SH[j], m)); lastShape = key; }

    // details : ils partent avant le vol, reviennent a l'arrivee
    const out = 1 - smooth((t - .5) / .08), inn = smooth((t - .86) / .14);
    dets.forEach((g, n) => {
      let o = 0;
      if (DET[i] === n && DET[j] === n) o = 1;
      else if (DET[i] === n) o = out;
      else if (DET[j] === n) o = inn;
      g.style.opacity = o;
    });
    // le trou de la kettlebell, le trait court du symbole
    const hr = i === 5 ? 1 - smooth((t - .5) / .08) : (j === 5 ? inn : 0);
    hole.setAttribute('rx', (31 * hr).toFixed(1));
    hole.setAttribute('ry', (27 * hr).toFixed(1));
    slash.style.opacity = j === LAST ? inn : 0;

    // le panier apparait pour le tir, le filet bouge au passage
    const hp = i === 0 ? smooth((t - .5) / .12) * (1 - smooth((e - .9) / .08)) : 0;
    if (hp > .002) {
      const [hx, hy, hs] = rim(), tr = `translate(${hx.toFixed(1)} ${hy.toFixed(1)}) scale(${(hs / 100).toFixed(3)})`;
      hoopB.setAttribute('transform', tr); hoopF.setAttribute('transform', tr);
      const sw = i === 0 ? Math.sin(Math.PI * clamp((e - .82) / .18)) : 0;
      net.setAttribute('transform', `scale(${(1 - .12 * sw).toFixed(3)} ${(1 + .22 * sw).toFixed(3)})`);
    }
    hoopB.style.opacity = hoopF.style.opacity = hp;

    // trainee de la trajectoire
    if (!hold && fly > .02) {
      let d = '';
      const from = Math.max(0, e - .3);
      for (let k = 0; k <= 14; k++) { const q = path(a, b, from + (e - from) * k / 14); d += (k ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }
      trail.setAttribute('d', d);
      trail.style.opacity = fly * .7;
    } else trail.style.opacity = 0;

    // eclats a l'atterrissage
    if (hold && i > 0 && h < .24) {
      const land = h / .24, r0 = R * SIZE[i] * (1.12 + land * .3), r1 = r0 + R * .16 * Math.sin(Math.PI * land);
      let d = '';
      for (let k = 0; k < 9; k++) {
        const g = Math.PI * 2 * k / 9 + .3;
        d += `M${(x + Math.cos(g) * r0).toFixed(1)} ${(y + Math.sin(g) * r0).toFixed(1)}L${(x + Math.cos(g) * r1).toFixed(1)} ${(y + Math.sin(g) * r1).toFixed(1)}`;
      }
      ticks.setAttribute('d', d);
      ticks.style.opacity = Math.sin(Math.PI * land);
    } else ticks.style.opacity = 0;

    // textes : celui de l'etat courant sort, le suivant entre
    texts.forEach((el, n) => {
      let o = 0;
      if (n === i) o = 1 - smooth((t - .46) / .1);
      if (n === j) o = smooth((t - .88) / .12);
      if (u >= LAST && n === LAST) o = 1;
      el.style.opacity = o;
      el.style.visibility = o < .01 ? 'hidden' : 'visible';
      el.style.transform = `translate3d(0,${((1 - o) * (n === j ? 14 : -10)).toFixed(1)}px,0)`;
    });
  }

  // defilement -> progression, avec un leger amorti
  let cur = 0, goal = 0, raf = 0;
  const read = () => {
    const r = film.getBoundingClientRect(), span = r.height - stage.clientHeight;
    const top = parseFloat(getComputedStyle(stage).top) || 0;
    goal = clamp((top - r.top) / span) * (LAST + .28);
  };
  const tick = () => {
    cur += (goal - cur) * .14;
    if (Math.abs(goal - cur) < .0008) { cur = goal; raf = 0; draw(cur); return; }
    draw(cur);
    raf = requestAnimationFrame(tick);
  };
  const wake = () => { read(); if (!raf) raf = requestAnimationFrame(tick); };
  addEventListener('scroll', wake, { passive: true });
  addEventListener('resize', () => { measure(); wake(); });
  measure();
  read();
  cur = goal;
  draw(cur, true);
  root.classList.add('fx-on');
  window.cnFilm = { draw, get u() { return cur; } };
})();
