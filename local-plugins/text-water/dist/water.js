// Text water: sunlight through a wind-rippled pool, drawn on the floor in braille dots or ascii.
//   1. surface  = wind waves (a Phillips spectrum, set by San Antonio's live wind) + rain and pointer ripples
//   2. light    = rays refracted at the surface by Snell's law, counted where they land on the floor
//   3. drawing  = light per braille dot (ordered dither) or per character (density ramp)
(() => {
  // ---- settings ------------------------------------------------------------------------------
  const LAT = 29.42, LON = -98.49, TZ = 'America/Chicago', PLACE = 'San Antonio';
  const BAND_PX = 220, CELL_PX = 9;        // height of the water band; size of one water cell
  const MARGIN = 8;                        // extra cells around the view, so light can enter from outside
  // wind waves
  const N_K = 16, N_DIR = 5;               // wavelength x direction samples (80 waves)
  const L_PEAK = 9, L_MIN = 4, L_MAX = 28; // wavelengths in cells; energy peaks at L_PEAK
  const L_DAMP = 1.1;                      // damps the tiniest ripples, which only add noise
  const RMS_SLOPE = 0.13, GRAV = 2.2;     // steepness at a moderate breeze; wave speed
  // weather (Open-Meteo, no key needed): wind sets wave height and direction, rain drops rings,
  // clouds wash out the caustics. Until it loads, or if it can't, the water uses a light breeze.
  const WEATHER_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=wind_speed_10m,wind_direction_10m,precipitation,cloud_cover&wind_speed_unit=mph`;
  const WEATHER_EVERY = 15 * 60 * 1000;
  // pointer ripples
  const SPEED = 0.3, DAMP = 0.992, VISC = 0.35, RIP = 2;
  // light
  const N_WATER = 1.333, DEPTH = 45, MIN_SUN = 50;   // a lower sun would stretch the net into streaks
  const RAYS = { braille: 7, ascii: 4 };   // rays per cell along each axis
  const BLEND = 0.45;                      // share of each new frame; the rest is last frame, so dots glide
  // drawing: a dot or glyph appears once light passes LO, fully dense at LO + SPAN (flat water = 1)
  const BRAILLE = { lo: 0.75, span: 1.5 }, ASCII = { lo: 0.6, span: 2.6 };
  const RAMP = " .,'`:;-~=+*xoO#%@";
  const COLORS = { day: ['#9CCFD8', '#2F7F8C'], dusk: ['#F0BC7C', '#9A5A18'], night: ['#A3B2DC', '#5A6690'] };   // [dark, light theme]

  const pre = document.getElementById('water'), sunline = document.getElementById('sunline');
  if (!pre || pre.dataset.running) return;   // only on the home page, and only once
  pre.dataset.running = '1';
  const rad = Math.PI / 180;
  let mode = 'ascii';

  // ---- sun position (NOAA approximation) -----------------------------------------------------
  function sunPos(ms) {
    const d = new Date(ms), day = Math.floor((ms - Date.UTC(d.getUTCFullYear(), 0, 1)) / 864e5) + 1;
    const hr = d.getUTCHours() + d.getUTCMinutes() / 60, g = 2 * Math.PI / 365 * (day - 1 + (hr - 12) / 24);
    const eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    const ha = ((hr * 60 + eqt + 4 * LON) / 4 - 180) * rad, lat = LAT * rad;
    const el = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha));
    const az = Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat)) + Math.PI;
    return { el: el / rad, az: ((az / rad) % 360 + 360) % 360 };
  }

  // ---- wind waves ----------------------------------------------------------------------------
  // Phillips spectrum (as in Tessendorf's ocean): waves mostly travel with the wind (cos^2 spread),
  // energy peaks at L_PEAK. Deep-water speed w = sqrt(g k): longer waves run faster, so the pattern
  // drifts downwind while it reshapes. Each wave also swells and fades slowly (gusts).
  // Directions are stored relative to the wind (kx0, ky0) and turned to the live wind in setWind.
  const WAVES = (() => {
    let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const waves = []; let ms = 0;
    for (let ik = 0; ik < N_K; ik++) {
      const k = 2 * Math.PI / (L_MIN * Math.pow(L_MAX / L_MIN, (ik + rnd()) / N_K)), kl = k * L_PEAK / (2 * Math.PI);
      for (let id = 0; id < N_DIR; id++) {
        const th = ((id + rnd()) / N_DIR - 0.5) * Math.PI;
        const P = Math.exp(-1 / (kl * kl)) / k ** 4 * Math.cos(th) ** 2 * Math.exp(-k * k * L_DAMP * L_DAMP);
        const a = Math.sqrt(P) * k;
        waves.push({ kx0: Math.cos(th) * k, ky0: Math.sin(th) * k, kx: 0, ky: 0, w: Math.sqrt(GRAV * k), ph: rnd() * 2 * Math.PI, a0: a, a, gph: rnd() * 2 * Math.PI, gw: 0.04 + 0.05 * rnd() });
        ms += 0.5 * (a * k) ** 2;
      }
    }
    const scale = RMS_SLOPE / Math.sqrt(ms);
    for (const s of waves) s.a0 *= scale;
    return waves;
  })();

  const wx = { mph: 8, from: 200, rain: 0, cloud: 0, ok: false };   // a light southerly breeze until data arrives
  let amp = 1, sunlit = 1;
  function setWind() {
    // compass bearing the waves travel toward, as an angle on screen (north is up, y points down)
    const to = (wx.from + 180) * rad, a = Math.atan2(-Math.cos(to), Math.sin(to)), c = Math.cos(a), s = Math.sin(a);
    for (const w of WAVES) { w.kx = w.kx0 * c - w.ky0 * s; w.ky = w.kx0 * s + w.ky0 * c; }
    amp = Math.min(1.7, Math.max(0.3, 0.3 + wx.mph / 11));            // calm: faint ripples; 15 mph+: choppy
    sunlit = 1 - 0.6 * wx.cloud / 100;                                 // clouds dim the direct sun that makes the caustics
  }
  setWind();
  async function loadWeather() {
    try {
      const c = (await (await fetch(WEATHER_URL)).json()).current;
      Object.assign(wx, { mph: c.wind_speed_10m, from: c.wind_direction_10m, rain: c.precipitation, cloud: c.cloud_cover, ok: true });
      setWind(); updateSun();
    } catch (e) { wx.failed = true; updateSun(); }   // offline or blocked (e.g. a sandboxed preview): keep the default breeze
  }

  // ---- grids ---------------------------------------------------------------------------------
  // C x R characters; W x H square water cells; EW x EH cells including the margin;
  // LW x LH light cells (one per braille dot, or one per ascii character).
  let C = 0, R = 0, W = 0, H = 0, EW = 0, EH = 0, LW = 0, LH = 0;
  let h, v, hs, tmp, sx, sy, light, prevLight, sinX, cosX, sinY, cosY;
  function measure(force) {
    const probe = document.createElement('span');
    probe.textContent = (mode === 'braille' ? '⣿' : 'M').repeat(10);
    pre.textContent = ''; pre.appendChild(probe);
    const cw = probe.getBoundingClientRect().width / 10;
    pre.textContent = 'x'; const h1 = pre.getBoundingClientRect().height;
    pre.textContent = 'x\nx\nx\nx\nx'; const rowH = (pre.getBoundingClientRect().height - h1) / 4 || cw * 2;
    pre.textContent = '';
    const cols = Math.max(24, Math.floor(pre.clientWidth / cw));
    if (cols === C && !force) return;
    C = cols; R = Math.max(6, Math.round(BAND_PX / rowH));
    W = Math.round(C * cw / CELL_PX); H = Math.round(R * rowH / CELL_PX);
    EW = W + 2 * MARGIN; EH = H + 2 * MARGIN;
    LW = mode === 'braille' ? 2 * C : C; LH = mode === 'braille' ? 4 * R : R;
    [h, v, hs, tmp] = [0, 0, 0, 0].map(() => new Float32Array(W * H));
    [sx, sy] = [0, 0].map(() => new Float32Array(EW * EH));
    [sinX, cosX, sinY, cosY] = [EW, EW, EH, EH].map((n) => new Float32Array(n));
    light = new Float32Array(LW * LH); prevLight = null;
    for (let i = 0; i < 10; i++) drop(Math.random() * W, Math.random() * H, 5 + Math.random() * 3, 0.3);
    for (let i = 0; i < 160; i++) step();
  }

  // ---- pointer ripples: a wave automaton -----------------------------------------------------
  // a smooth dent of radius r and depth a
  function drop(x, y, r, a) {
    for (let j = Math.max(1, Math.floor(y - r)); j <= Math.min(H - 2, Math.ceil(y + r)); j++)
      for (let i = Math.max(1, Math.floor(x - r)); i <= Math.min(W - 2, Math.ceil(x + r)); i++) {
        const d = Math.hypot(i - x, j - y) / r;
        if (d < 1) h[j * W + i] -= a * (0.5 + 0.5 * Math.cos(Math.PI * d));
      }
  }
  // each cell accelerates toward its neighbors' average; viscosity then evens out velocities so
  // grid-scale wiggles (which the light would turn into flicker) die quickly
  function step() {
    for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) {
      const k = j * W + i;
      v[k] = (v[k] + ((h[k - 1] + h[k + 1] + h[k - W] + h[k + W]) * 0.25 - h[k]) * SPEED) * DAMP;
    }
    for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) {
      const k = j * W + i;
      tmp[k] = v[k] + VISC * ((v[k - 1] + v[k + 1] + v[k - W] + v[k + W]) * 0.25 - v[k]);
    }
    for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) { const k = j * W + i; v[k] = tmp[k]; }
    for (let k = 0; k < W * H; k++) h[k] += v[k];
  }

  // ---- surface slope -------------------------------------------------------------------------
  function slopes(t) {
    // ripples: one blur pass so single cells don't sparkle; edges copy their neighbor (no slope)
    for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) {
      const k = j * W + i;
      hs[k] = 0.25 * h[k] + 0.125 * (h[k - 1] + h[k + 1] + h[k - W] + h[k + W]) + 0.0625 * (h[k - W - 1] + h[k - W + 1] + h[k + W - 1] + h[k + W + 1]);
    }
    for (let i = 0; i < W; i++) { hs[i] = hs[W + i]; hs[(H - 1) * W + i] = hs[(H - 2) * W + i]; }
    for (let j = 0; j < H; j++) { hs[j * W] = hs[j * W + 1]; hs[j * W + W - 1] = hs[j * W + W - 2]; }
    sx.fill(0); sy.fill(0);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = j * W + i, K = (j + MARGIN) * EW + i + MARGIN;
      sx[K] = (hs[i < W - 1 ? k + 1 : k] - hs[i > 0 ? k - 1 : k]) * 0.5 * RIP;
      sy[K] = (hs[j < H - 1 ? k + W : k] - hs[j > 0 ? k - W : k]) * 0.5 * RIP;
    }
    // waves, separably: sin(A + B) = sin A cos B + cos A sin B, so each wave costs one sine per
    // row and column rather than one per cell
    for (const s of WAVES) {
      s.a = s.a0 * amp * (0.8 + 0.2 * Math.sin(s.gw * t + s.gph));
      const p0 = s.ph - s.w * t, fx = -s.a * s.kx, fy = -s.a * s.ky;
      for (let I = 0; I < EW; I++) { const A = s.kx * (I - MARGIN) + p0; sinX[I] = Math.sin(A); cosX[I] = Math.cos(A); }
      for (let J = 0; J < EH; J++) { const B = s.ky * (J - MARGIN); sinY[J] = Math.sin(B); cosY[J] = Math.cos(B); }
      for (let J = 0; J < EH; J++) {
        const sb = sinY[J], cb = cosY[J], row = J * EW;
        for (let I = 0; I < EW; I++) { const q = sinX[I] * cb + cosX[I] * sb; sx[row + I] += fx * q; sy[row + I] += fy * q; }
      }
    }
  }

  // ---- light on the floor --------------------------------------------------------------------
  function shine(sun, t) {
    slopes(t);
    const el = Math.max(sun.el, MIN_SUN) * rad;
    const dx = Math.sin(sun.az * rad) * Math.cos(el), dy = -Math.cos(sun.az * rad) * Math.cos(el), dz = -Math.sin(el);
    const eta = 1 / N_WATER;
    let depth = DEPTH, tx = 0, ty = 0;
    // Snell's law for a surface normal n; sets (tx, ty), the ray's sideways travel to the floor
    const refract = (nx, ny, nz) => {
      const ci = -(nx * dx + ny * dy + nz * dz), f = eta * ci - Math.sqrt(1 - eta * eta * (1 - ci * ci));
      const d = depth / -(eta * dz + f * nz);
      tx = (eta * dx + f * nx) * d; ty = (eta * dy + f * ny) * d;
    };
    // a slanted sun bends light more per unit of slope; shrink the depth so it focuses like an overhead one
    const e = 0.01, n0 = 1 / Math.sqrt(1 + e * e);
    refract(0, 0, 1); const x0 = tx, y0 = ty;
    refract(-e * n0, 0, n0); const g1 = Math.hypot(tx - x0, ty - y0);
    refract(0, -e * n0, n0); const g2 = Math.hypot(tx - x0, ty - y0);
    depth = DEPTH * DEPTH * (1 - eta) * e / Math.sqrt(g1 * g2);
    refract(0, 0, 1); const ox = tx, oy = ty;   // flat water lands here; shift so the view stays put

    if (!prevLight) prevLight = new Float32Array(light); else prevLight.set(light);
    light.fill(0);
    const S = RAYS[mode], wgt = (LW * LH) / (W * H * S * S), kx = LW / W, ky = LH / H;   // flat water: 1 per light cell
    for (let J = 0; J < EH - 1; J++) for (let sj = 0; sj < S; sj++) {
      const fy = (sj + 0.5) / S;
      for (let I = 0; I < EW - 1; I++) for (let si = 0; si < S; si++) {
        const fx = (si + 0.5) / S, K = J * EW + I;
        const gx = (sx[K] * (1 - fx) + sx[K + 1] * fx) * (1 - fy) + (sx[K + EW] * (1 - fx) + sx[K + EW + 1] * fx) * fy;
        const gy = (sy[K] * (1 - fx) + sy[K + 1] * fx) * (1 - fy) + (sy[K + EW] * (1 - fx) + sy[K + EW + 1] * fx) * fy;
        const inv = 1 / Math.sqrt(gx * gx + gy * gy + 1);
        refract(-gx * inv, -gy * inv, inv);
        // spread the ray's light over the 4 nearest light cells
        const px = (I - MARGIN + fx + tx - ox) * kx - 0.5, py = (J - MARGIN + fy + ty - oy) * ky - 0.5;
        const cx = Math.floor(px), cy = Math.floor(py);
        if (cx < -1 || cy < -1 || cx >= LW || cy >= LH) continue;
        const ax = px - cx, ay = py - cy;
        if (cy >= 0) { if (cx >= 0) light[cy * LW + cx] += wgt * (1 - ax) * (1 - ay); if (cx + 1 < LW) light[cy * LW + cx + 1] += wgt * ax * (1 - ay); }
        if (cy + 1 < LH) { if (cx >= 0) light[(cy + 1) * LW + cx] += wgt * (1 - ax) * ay; if (cx + 1 < LW) light[(cy + 1) * LW + cx + 1] += wgt * ax * ay; }
      }
    }
    for (let k = 0; k < light.length; k++) light[k] = prevLight[k] + (light[k] * sunlit - prevLight[k]) * BLEND;
  }

  // ---- characters ----------------------------------------------------------------------------
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((b) => (b + 0.5) / 16);
  const DOT = [[0x01, 0x02, 0x04, 0x40], [0x08, 0x10, 0x20, 0x80]];   // braille bit for dot [column][row]
  function draw() {
    let out = '';
    for (let r = 0; r < R; r++) {
      for (let c = 0; c < C; c++) {
        if (mode === 'braille') {
          let bits = 0;
          for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 4; dy++) {
            const X = 2 * c + dx, Y = 4 * r + dy;
            if ((light[Y * LW + X] - BRAILLE.lo) / BRAILLE.span > BAYER[(Y & 3) * 4 + (X & 3)]) bits |= DOT[dx][dy];
          }
          out += String.fromCharCode(0x2800 + bits);
        } else {
          const t = Math.max(0, (light[r * C + c] - ASCII.lo) / ASCII.span);
          out += RAMP[Math.min(RAMP.length - 1, Math.round(t * (RAMP.length - 1)))];
        }
      }
      out += '\n';
    }
    pre.textContent = out;
  }

  // ---- sun line and water color --------------------------------------------------------------
  let sun = sunPos(Date.now());
  function updateSun() {
    sun = sunPos(Date.now());
    const time = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
    const phase = sun.el > 8 ? 'day' : sun.el > 0 ? 'golden hour' : sun.el > -6 ? 'twilight' : 'night';
    // an arrow pointing where the wind blows (the API reports where it comes from): from the E -> ←  (IBM Plex Mono has all eight)
    const arrow = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'][Math.round((wx.from + 180) / 45) % 8];
    const sky = wx.rain > 0 ? (wx.rain > 2.5 ? 'heavy rain' : 'rain') : wx.cloud > 80 ? 'overcast' : wx.cloud > 30 ? 'some clouds' : 'clear skies';
    sunline.textContent = wx.ok
      ? `${PLACE} ${time}, ${sky} and ${Math.round(wx.mph)} mph wind (${arrow})`
      : `${PLACE} ${time}, ${phase}${wx.failed ? ', no weather data here' : ''}`;
    const theme = document.documentElement.getAttribute('saved-theme') === 'light' ? 1 : 0;
    pre.style.color = sun.el > 8 ? COLORS.day[theme] : sun.el > -3 ? COLORS.dusk[theme] : COLORS.night[theme];
  }

  // ---- input ---------------------------------------------------------------------------------
  const toCell = (e) => { const r = pre.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
  let last = null;
  pre.addEventListener('pointermove', (e) => {
    const [x, y] = toCell(e);
    if (last) {   // a wake: small dents along the path since the last event
      const n = Math.min(8, Math.ceil(Math.hypot(x - last[0], y - last[1]) / 1.2));
      for (let i = 1; i <= n; i++) drop(last[0] + (x - last[0]) * i / n, last[1] + (y - last[1]) * i / n, 2.6, 0.2);
    }
    last = [x, y];
  }, { passive: true });
  pre.addEventListener('pointerleave', () => { last = null; });
  pre.addEventListener('pointerdown', (e) => { const [x, y] = toCell(e); drop(x, y, 5, 1.0); });   // a stone

  const store = (k, val) => { try { if (val === undefined) return localStorage.getItem(k); localStorage.setItem(k, val); } catch (err) { return null; } };
  const press = (btns, on) => btns.forEach((b) => b.setAttribute('aria-pressed', String(on(b))));

  document.addEventListener('themechange', () => updateSun());   // sent by the footer's theme switch

  // drawing mode: braille or ascii
  const modeBtns = [document.getElementById('m-braille'), document.getElementById('m-ascii')];
  function setMode(m) {
    mode = m; press(modeBtns, (b) => b.id === 'm-' + m);
    store('water-mode', m);
    if (h) { measure(true); shine(sun, clock); draw(); }
  }
  modeBtns.forEach((b) => b.addEventListener('click', () => setMode(b.id.slice(2))));
  if (store('water-mode') === 'braille') setMode('braille');

  // ---- loop ----------------------------------------------------------------------------------
  // About 30 updates a second; the automaton steps at 60 a second regardless. A light rain drop
  // lands every 4 to 10 seconds. Starts after the page has loaded.
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let prev = 0, acc = 0, clock = 0, nextDrop = 0, lastTick = 0;
  function frame(now) {
    if (reduced || (prev && now - prev < 30)) return;
    const dt = prev ? Math.min(0.1, (now - prev) / 1000) : 0.033; prev = now;
    clock += dt;
    // rain: drops land faster the harder it rains (precipitation in mm per hour)
    if (wx.rain > 0 && clock > nextDrop) { nextDrop = clock + Math.max(0.06, 0.8 / (wx.rain + 0.2)) * (0.5 + Math.random()); drop(Math.random() * W, Math.random() * H, 2 + Math.random() * 2, 0.5 + Math.random() * 0.3); }
    for (acc += dt * 60; acc >= 1; acc--) step();
    shine(sun, clock); draw();
  }
  function tick(now) { requestAnimationFrame(tick); lastTick = performance.now(); frame(now); }
  function start() {
    measure(true); updateSun(); shine(sun, clock); draw();
    requestAnimationFrame(tick);
    // fallback for when the browser pauses animation frames (some embedded views report hidden)
    setInterval(() => { if (performance.now() - lastTick > 250) frame(performance.now()); }, 125);
    setInterval(updateSun, 60000);
    loadWeather(); setInterval(loadWeather, WEATHER_EVERY);
    addEventListener('resize', () => { measure(); shine(sun, clock); draw(); });
  }
  if (document.readyState === 'complete') setTimeout(start, 50); else addEventListener('load', () => setTimeout(start, 50), { once: true });
})();
