/* ==========================================================================
   PID Tuning Lab — the simulator behind pid-lab.html
   --------------------------------------------------------------------------
   Process : first-order plus dead time (FOPDT), K = 1, tau = 6 s, theta = 1.2 s
   Control : parallel form  u = Kp*e + Ki*integral(e) + Kd*de/dt
             derivative acts on the measurement, output clamped to 0-100 %,
             integration is frozen while the output is saturated (anti-windup)
   Drawing : plain canvas 2D, colours pulled from the --chart-* CSS variables
             so both themes work, no chart library
   ========================================================================== */
(function () {
  'use strict';

  var canvas = document.getElementById('pid-chart');
  if (!canvas || !canvas.getContext) {
    return;
  }
  var ctx = canvas.getContext('2d');

  /* ---- Process and sampling constants ------------------------------- */
  var DT = 0.05; // simulator step, seconds
  var TAU = 6; // process time constant, seconds
  var K_PROC = 1; // process steady-state gain
  var DEAD = 1.2; // transport delay, seconds
  var DEAD_STEPS = Math.round(DEAD / DT); // 24 samples of dead time
  var U_MIN = 0;
  var U_MAX = 100;
  var PV_MAX = 100;
  var BAND = 0.02; // settling band, +/- 2 % of setpoint
  var HIST_LIMIT = Math.round(240 / DT); // keep 4 minutes of samples

  /* ---- Elements ----------------------------------------------------- */
  var kpEl = document.getElementById('pid-kp');
  var kiEl = document.getElementById('pid-ki');
  var kdEl = document.getElementById('pid-kd');
  var spEl = document.getElementById('pid-sp');
  var kpOut = document.getElementById('pid-kp-out');
  var kiOut = document.getElementById('pid-ki-out');
  var kdOut = document.getElementById('pid-kd-out');
  var spOut = document.getElementById('pid-sp-out');
  var announceEl = document.getElementById('pid-announce');
  var ledEl = document.querySelector('[data-pid-led]');
  var runBtn = document.querySelector('[data-pid-action="run"]');

  var METRIC_KEYS = ['overshoot', 'settling', 'rise', 'error', 'pv', 'output'];
  var metricEls = {};
  var i;
  for (i = 0; i < METRIC_KEYS.length; i++) {
    metricEls[METRIC_KEYS[i]] = document.querySelector('[data-pid-metric="' + METRIC_KEYS[i] + '"]');
  }

  if (!kpEl || !kiEl || !kdEl || !spEl) {
    return;
  }

  var reducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Controller / loop state -------------------------------------- */
  var kp = Number(kpEl.value);
  var ki = Number(kiEl.value);
  var kd = Number(kdEl.value);
  var spPending = Number(spEl.value);

  var sp = spPending; // active setpoint
  var pv = 0; // process variable, %
  var u = 0; // controller output, %
  var integral = 0; // integral accumulator
  var prevPv = 0; // last measurement, for derivative-on-measurement

  var dead = new Array(DEAD_STEPS);
  for (i = 0; i < DEAD_STEPS; i++) {
    dead[i] = 0;
  }
  var deadIdx = 0;

  var t = 0; // simulated seconds
  var history = []; // { t, sp, pv, u } sampled every DT
  var markTime = 0; // metrics are measured from here (step or gain change)
  var announced = false;
  var running = !reducedMotion;
  var windowSec = 40;
  var acc = 0;
  var lastFrame = 0;
  var lastMetricsAt = 0;
  var dirty = true;

  /* ---- Helpers ------------------------------------------------------ */
  function clamp(value, lo, hi) {
    return value < lo ? lo : value > hi ? hi : value;
  }

  function setText(el, text) {
    if (el && el.textContent !== text) {
      el.textContent = text;
    }
  }

  function findAction(node) {
    var el = node;
    while (el && el !== document) {
      if (el.getAttribute) {
        if (el.getAttribute('data-pid-action')) {
          return { kind: 'action', value: el.getAttribute('data-pid-action'), el: el };
        }
        if (el.getAttribute('data-pid-preset')) {
          return { kind: 'preset', value: el.getAttribute('data-pid-preset'), el: el };
        }
        if (el.getAttribute('data-pid-window')) {
          return { kind: 'window', value: el.getAttribute('data-pid-window'), el: el };
        }
      }
      el = el.parentNode;
    }
    return null;
  }

  /* ---- Metrics ------------------------------------------------------ */
  /* Scans the recorded history from markTime and returns the four
     figures shown under the chart. Cheap enough to run a few times a
     second even with 4800 samples in the buffer. */
  function stats() {
    var band = BAND * sp;
    var peak = -Infinity;
    var lastOutsideIdx = -1;
    var first10 = -1;
    var first90 = -1;
    var samples = 0;
    var s;
    var idx;

    for (idx = 0; idx < history.length; idx++) {
      s = history[idx];
      if (s.t < markTime) {
        continue;
      }
      samples++;
      if (s.pv > peak) {
        peak = s.pv;
      }
      if (Math.abs(s.pv - sp) > band) {
        lastOutsideIdx = idx;
      }
      if (first10 < 0 && s.pv >= 0.1 * sp) {
        first10 = s.t;
      }
      if (first90 < 0 && s.pv >= 0.9 * sp) {
        first90 = s.t;
      }
    }

    var out = {
      samples: samples,
      overshoot: peak === -Infinity ? 0 : peak > sp ? ((peak - sp) / sp) * 100 : 0,
      settled: true,
      settling: 0,
      rise: first10 >= 0 && first90 >= 0 ? first90 - first10 : -1,
      error: Math.abs(sp - pv)
    };

    if (samples === 0) {
      out.settled = false;
      out.settling = -1;
      return out;
    }
    if (lastOutsideIdx < 0) {
      out.settling = 0;
    } else if (lastOutsideIdx >= history.length - 1) {
      out.settled = false;
      out.settling = t - markTime; // still moving, report elapsed so far
    } else {
      out.settling = history[lastOutsideIdx + 1].t - markTime;
    }
    return out;
  }

  function format(value, decimals) {
    return value.toFixed(decimals);
  }

  function updateMetrics(now) {
    if (now - lastMetricsAt < 160) {
      return;
    }
    lastMetricsAt = now;

    var st = stats();
    if (st.samples < 2) {
      setText(metricEls.overshoot, '—');
      setText(metricEls.settling, '—');
      setText(metricEls.rise, '—');
    } else {
      setText(metricEls.overshoot, format(st.overshoot, 1) + ' %');
      setText(
        metricEls.settling,
        st.settled ? format(st.settling, 1) + ' s' : '> ' + format(st.settling, 1) + ' s'
      );
      setText(metricEls.rise, st.rise >= 0 ? format(st.rise, 1) + ' s' : '—');
    }
    setText(metricEls.error, format(st.error, 2) + ' %');
    setText(metricEls.pv, format(pv, 1) + ' %');
    setText(metricEls.output, format(u, 1) + ' %');

    if (
      announceEl &&
      !announced &&
      st.settled &&
      st.samples > 40 &&
      t - markTime > 2 &&
      running
    ) {
      announced = true;
      setText(
        announceEl,
        'Loop settled at ' +
          format(pv, 2) +
          ' percent: ' +
          format(st.overshoot, 1) +
          ' percent overshoot, settling time ' +
          format(st.settling, 1) +
          ' seconds.'
      );
    }
  }

  /* ---- Simulation --------------------------------------------------- */
  function tick() {
    var error = sp - pv;
    var dMeasurement = (pv - prevPv) / DT; // derivative on measurement
    var dTerm = -kd * dMeasurement;
    var raw = kp * error + integral + dTerm;

    // Conditional integration: never integrate further into saturation.
    var pushingHigh = raw > U_MAX && error > 0;
    var pushingLow = raw < U_MIN && error < 0;
    if (!pushingHigh && !pushingLow) {
      integral += ki * error * DT;
      integral = clamp(integral, -100, 200);
    }

    u = clamp(kp * error + integral + dTerm, U_MIN, U_MAX);
    prevPv = pv;

    // Dead time: shift the output through a ring buffer.
    var delayed = dead[deadIdx];
    dead[deadIdx] = u;
    deadIdx = (deadIdx + 1) % DEAD_STEPS;

    // First-order plant driven by the delayed output.
    pv += ((K_PROC * delayed - pv) / TAU) * DT;

    t += DT;
    history.push({ t: t, sp: sp, pv: pv, u: u });
    if (history.length > HIST_LIMIT) {
      history.splice(0, history.length - HIST_LIMIT);
    }
  }

  /* ---- Chart -------------------------------------------------------- */
  var colors = null;

  function readColors() {
    var style = window.getComputedStyle(document.documentElement);
    function pick(name, fallback) {
      var value = style.getPropertyValue(name);
      value = value ? value.trim() : '';
      return value || fallback;
    }
    return {
      bg: pick('--chart-bg', '#ffffff'),
      grid: pick('--chart-grid', 'rgba(71,85,105,0.16)'),
      axis: pick('--chart-axis', 'rgba(71,85,105,0.45)'),
      text: pick('--chart-text', '#475569'),
      sp: pick('--chart-sp', '#b45309'),
      pv: pick('--chart-pv', '#15803d'),
      u: pick('--chart-u', '#64748b')
    };
  }

  function draw() {
    if (!colors) {
      colors = readColors();
    }

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = Math.max(1, Math.round(canvas.clientWidth || 640));
    var ch = Math.max(1, Math.round(canvas.clientHeight || 300));
    var pxW = Math.round(cw * dpr);
    var pxH = Math.round(ch * dpr);
    if (canvas.width !== pxW || canvas.height !== pxH) {
      canvas.width = pxW;
      canvas.height = pxH;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var padL = 38;
    var padR = 12;
    var padT = 14;
    var padB = 24;
    var plotW = cw - padL - padR;
    var plotH = ch - padT - padB;
    if (plotW <= 10 || plotH <= 10) {
      return;
    }

    var tHi = Math.max(t, windowSec);
    var tLo = tHi - windowSec;

    function xOf(time) {
      return padL + ((time - tLo) / windowSec) * plotW;
    }
    function yOf(value) {
      return padT + (1 - clamp(value, 0, PV_MAX) / PV_MAX) * plotH;
    }

    /* Background + grid */
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, cw, ch);
    ctx.font = '10px "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.lineWidth = 1;

    var v;
    for (v = 0; v <= PV_MAX; v += 20) {
      var gy = Math.round(yOf(v)) + 0.5;
      ctx.strokeStyle = colors.grid;
      ctx.beginPath();
      ctx.moveTo(padL, gy);
      ctx.lineTo(padL + plotW, gy);
      ctx.stroke();

      ctx.fillStyle = colors.text;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(v), padL - 7, gy);
    }

    var step = windowSec / 4;
    for (i = 0; i <= 4; i++) {
      var time = tLo + i * step;
      var gx = Math.round(xOf(time)) + 0.5;
      ctx.strokeStyle = colors.grid;
      ctx.beginPath();
      ctx.moveTo(gx, padT);
      ctx.lineTo(gx, padT + plotH);
      ctx.stroke();

      ctx.fillStyle = colors.text;
      ctx.textAlign = i === 0 ? 'left' : i === 4 ? 'right' : 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(String(Math.round(time)), gx, padT + plotH + 6);
    }

    ctx.fillStyle = colors.text;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('%', 6, 2);
    ctx.textAlign = 'right';
    ctx.fillText('t / s', padL + plotW, padT + plotH + 6);

    /* Marker for the moment the metrics are measured from */
    if (markTime > tLo) {
      var mx = Math.round(xOf(markTime)) + 0.5;
      ctx.save();
      ctx.strokeStyle = colors.axis;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(mx, padT);
      ctx.lineTo(mx, padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = colors.axis;
      ctx.textAlign = mx > padL + plotW - 24 ? 'right' : 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('t0', mx + (mx > padL + plotW - 24 ? -4 : 4), padT);
      ctx.restore();
    }

    /* Series */
    function plot(key, colour, width) {
      ctx.strokeStyle = colour;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      var started = false;
      var idx;
      for (idx = 0; idx < history.length; idx++) {
        var s = history[idx];
        if (s.t < tLo) {
          continue;
        }
        var x = xOf(s.t);
        var y = yOf(s[key]);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      if (started) {
        ctx.stroke();
      }
      return started;
    }

    plot('u', colors.u, 1.25);
    plot('sp', colors.sp, 2);
    var hasPv = plot('pv', colors.pv, 2);

    if (hasPv && history.length) {
      var last = history[history.length - 1];
      if (last.t >= tLo) {
        ctx.fillStyle = colors.pv;
        ctx.beginPath();
        ctx.arc(xOf(last.t), yOf(last.pv), 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    /* Frame */
    ctx.strokeStyle = colors.axis;
    ctx.lineWidth = 1;
    ctx.strokeRect(padL + 0.5, padT + 0.5, plotW - 1, plotH - 1);
  }

  /* ---- Controls ----------------------------------------------------- */
  var PRESETS = {
    p: { kp: 2, ki: 0, kd: 0 },
    pi: { kp: 1.6, ki: 0.18, kd: 0 },
    pid: { kp: 2.2, ki: 0.35, kd: 0.25 },
    hard: { kp: 5, ki: 1.2, kd: 0.5 }
  };

  function syncPresets() {
    var keys = ['p', 'pi', 'pid', 'hard'];
    var k;
    for (k = 0; k < keys.length; k++) {
      var preset = PRESETS[keys[k]];
      var btn = document.querySelector('[data-pid-preset="' + keys[k] + '"]');
      if (!btn) {
        continue;
      }
      var match =
        Math.abs(preset.kp - kp) < 0.001 &&
        Math.abs(preset.ki - ki) < 0.001 &&
        Math.abs(preset.kd - kd) < 0.001;
      var pressed = match ? 'true' : 'false';
      if (btn.getAttribute('aria-pressed') !== pressed) {
        btn.setAttribute('aria-pressed', pressed);
      }
    }
  }

  function syncWindowButtons() {
    var btns = document.querySelectorAll('[data-pid-window]');
    for (var b = 0; b < btns.length; b++) {
      var match = Number(btns[b].getAttribute('data-pid-window')) === windowSec;
      btns[b].setAttribute('aria-pressed', match ? 'true' : 'false');
    }
  }

  function setRunning(next) {
    running = next;
    setText(runBtn, running ? 'Pause loop' : 'Run loop');
    if (ledEl) {
      ledEl.className = running ? 'led led--green led--pulse' : 'led led--amber';
    }
    dirty = true;
  }

  function markFrom() {
    markTime = t;
    announced = false;
    dirty = true;
  }

  function readGains() {
    kp = Number(kpEl.value);
    ki = Number(kiEl.value);
    kd = Number(kdEl.value);
  }

  if (kpOut) {
    setText(kpOut, format(kp, 2));
  }
  if (kiOut) {
    setText(kiOut, format(ki, 2));
  }
  if (kdOut) {
    setText(kdOut, format(kd, 2));
  }
  if (spOut) {
    setText(spOut, String(Math.round(sp)));
  }

  kpEl.addEventListener('input', function () {
    readGains();
    if (kpOut) {
      setText(kpOut, format(kp, 2));
    }
    syncPresets();
    markFrom();
  });
  kiEl.addEventListener('input', function () {
    readGains();
    if (kiOut) {
      setText(kiOut, format(ki, 2));
    }
    syncPresets();
    markFrom();
  });
  kdEl.addEventListener('input', function () {
    readGains();
    if (kdOut) {
      setText(kdOut, format(kd, 2));
    }
    syncPresets();
    markFrom();
  });
  spEl.addEventListener('input', function () {
    spPending = Number(spEl.value);
    if (spOut) {
      setText(spOut, String(Math.round(spPending)));
    }
  });

  document.addEventListener('click', function (event) {
    var hit = findAction(event.target);
    if (!hit || hit.el.disabled) {
      return;
    }

    if (hit.kind === 'window') {
      windowSec = Number(hit.value);
      syncWindowButtons();
      dirty = true;
      return;
    }

    if (hit.kind === 'preset') {
      var preset = PRESETS[hit.value];
      if (!preset) {
        return;
      }
      kpEl.value = String(preset.kp);
      kiEl.value = String(preset.ki);
      kdEl.value = String(preset.kd);
      readGains();
      if (kpOut) {
        setText(kpOut, format(kp, 2));
      }
      if (kiOut) {
        setText(kiOut, format(ki, 2));
      }
      if (kdOut) {
        setText(kdOut, format(kd, 2));
      }
      syncPresets();
      if (!running) {
        setRunning(true);
      }
      markFrom();
      return;
    }

    if (hit.value === 'run') {
      if (!running) {
        lastFrame = 0;
      }
      setRunning(!running);
      return;
    }

    if (hit.value === 'step') {
      sp = spPending;
      if (!running) {
        setRunning(true);
      }
      markFrom();
      return;
    }

    if (hit.value === 'reset') {
      t = 0;
      pv = 0;
      u = 0;
      prevPv = 0;
      integral = 0;
      acc = 0;
      history = [];
      for (i = 0; i < DEAD_STEPS; i++) {
        dead[i] = 0;
      }
      deadIdx = 0;
      sp = spPending;
      if (!running) {
        setRunning(true);
      }
      markFrom();
    }
  });

  /* ---- Frame loop --------------------------------------------------- */
  function frame(now) {
    requestAnimationFrame(frame);

    if (!lastFrame) {
      lastFrame = now;
      draw();
      updateMetrics(now);
      return;
    }
    var elapsed = Math.min(now - lastFrame, 250); // ignore long tab sleeps
    lastFrame = now;

    if (running) {
      acc += elapsed / 1000;
      var steps = 0;
      while (acc >= DT && steps < 40) {
        tick();
        acc -= DT;
        steps++;
      }
      if (steps === 40) {
        acc = 0; // drop a backlog instead of running away
      }
      dirty = true;
    }

    if (dirty) {
      dirty = false;
      draw();
    }
    updateMetrics(now);
  }

  window.addEventListener('resize', function () {
    dirty = true;
  });
  if (window.ResizeObserver) {
    new window.ResizeObserver(function () {
      dirty = true;
    }).observe(canvas);
  }
  document.addEventListener('vp:themechange', function () {
    colors = readColors();
    dirty = true;
  });
  if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
    document.fonts.ready.then(function () {
      dirty = true;
    });
  }

  colors = readColors();
  syncPresets();
  syncWindowButtons();
  setRunning(running);
  requestAnimationFrame(frame);
})();
