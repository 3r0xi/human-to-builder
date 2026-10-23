/* Human → Builder / signal-city renderer. No dependencies or external requests. */
(function () {
  "use strict";
  var CYAN = [120, 251, 210], ORANGE = [255, 139, 71];
  var TAU = Math.PI * 2, progress = 0, frame = 0, lastFrame = 0;
  var destroyed = false, dirty = true, userMotion = null;
  var media = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var views = [], listeners = [], resizeObserver = null, intersectionObserver = null;
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function smooth(a, b, n) { var t = clamp((n - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function color(rgb, a) { return "rgba(" + rgb.join(",") + "," + clamp(a, 0, 1).toFixed(3) + ")"; }
  function random(seed) { var x = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function motion() { return userMotion === null ? !media.matches : userMotion; }
  function listen(target, event, fn) { target.addEventListener(event, fn); listeners.push([target, event, fn]); }

  var buildings = [], particles = [], routes = [];
  for (var x = -7; x < 7; x++) {
    for (var z = -7; z < 7; z++) {
      var seed = (x + 7) * 37 + (z + 7) * 83;
      if (random(seed) < 0.12 || Math.abs(x + 0.5) < 0.6 || Math.abs(z + 0.5) < 0.6) continue;
      var radius = Math.sqrt(x * x + z * z);
      var height = 0.32 + random(seed + 1) * 1.3 + Math.max(0, 1 - radius / 6) * 1.55;
      buildings.push({ x: x + 0.5, z: z + 0.5, h: height, w: 0.46 + random(seed + 2) * 0.2, seed: seed, accent: random(seed + 3) > 0.81, radius: radius });
    }
  }
  for (var p = 0; p < 520; p++) {
    particles.push({ x: (random(p + 90) - 0.5) * 18, z: (random(p + 270) - 0.5) * 18, h: random(p + 670) * 6, seed: p, size: 0.5 + random(p + 40) * 1.1 });
  }
  for (var r = 0; r < 20; r++) {
    var lane = Math.floor(random(r + 1310) * 11) - 5;
    routes.push({ lane: lane, cross: r % 2 === 0, seed: r, accent: r % 5 === 0 });
  }

  function addView(id, hero) {
    var canvas = document.getElementById(id);
    if (!canvas || typeof canvas.getContext !== "function") return;
    var context = canvas.getContext("2d");
    if (!context) return;
    views.push({ canvas: canvas, ctx: context, hero: hero, visible: true, width: 0, height: 0, ratio: 1, narrow: false });
  }
  addView("city-canvas", false);
  addView("hero-canvas", true);

  function sizeView(view) {
    var rect = view.canvas.getBoundingClientRect();
    var width = Math.max(1, Math.round(rect.width)), height = Math.max(1, Math.round(rect.height));
    var ratio = Math.min(window.devicePixelRatio || 1, 1.7);
    view.width = width; view.height = height; view.ratio = ratio; view.narrow = width < 600;
    if (view.canvas.width !== Math.round(width * ratio)) view.canvas.width = Math.round(width * ratio);
    if (view.canvas.height !== Math.round(height * ratio)) view.canvas.height = Math.round(height * ratio);
  }

  function draw(view, time) {
    if (view.width < 2 || view.height < 2) return;
    var ctx = view.ctx, w = view.width, h = view.height;
    var phase = view.hero ? 1 : progress;
    var scale = Math.min(w / (view.narrow ? 19.4 : 20), h / 12.2);
    var camera = 0.72 + (motion() ? Math.sin(time * 0.075) * 0.035 : 0);
    var cos = Math.cos(camera), sin = Math.sin(camera);
    var centerX = w * (view.hero ? 0.53 : 0.5), centerY = h * (view.narrow ? 0.62 : 0.65);
    var network = smooth(0.13, 0.43, phase), structure = smooth(0.34, 0.82, phase);
    var finalStage = smooth(0.75, 1, phase), pointAlpha = 0.7 - structure * 0.55;
    var ambient = motion() ? time : 0;
    ctx.setTransform(view.ratio, 0, 0, view.ratio, 0, 0);
    ctx.clearRect(0, 0, w, h);
    function project(x, y, z) {
      return [centerX + (x * cos - z * sin) * scale, centerY + (x * sin + z * cos) * scale * 0.46 - y * scale * 0.92];
    }
    function line(a, b, stroke, width) {
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.strokeStyle = stroke; ctx.lineWidth = width || 1; ctx.stroke();
    }
    function poly(points, fill, stroke, width) {
      ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
      for (var i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width || 0.8; ctx.stroke(); }
    }

    /* A faint horizontal atmosphere keeps the city legible against the page. */
    var glow = ctx.createRadialGradient(centerX, centerY - 2 * scale, 0, centerX, centerY, scale * 10);
    glow.addColorStop(0, color(CYAN, 0.035 + structure * 0.035));
    glow.addColorStop(0.6, color(CYAN, 0.016)); glow.addColorStop(1, color(CYAN, 0));
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);

    /* Survey grid: a diamond of navigable space. */
    for (var g = -8; g <= 8; g++) {
      var a = 0.025 + network * 0.055;
      if (g === 0) a += 0.06;
      line(project(g, 0, -8), project(g, 0, 8), color(CYAN, a), g === 0 ? 1 : 0.6);
      line(project(-8, 0, g), project(8, 0, g), color(CYAN, a), g === 0 ? 1 : 0.6);
    }
    var floor = [project(-6.7, 0, -6.7), project(6.7, 0, -6.7), project(6.7, 0, 6.7), project(-6.7, 0, 6.7)];
    poly(floor, "rgba(5,20,26," + (0.08 + network * 0.16) + ")", color(CYAN, 0.08 + network * 0.16));
    floor.forEach(function (corner) {
      line([corner[0] - 5, corner[1]], [corner[0] + 5, corner[1]], color(CYAN, 0.45));
      line([corner[0], corner[1] - 5], [corner[0], corner[1] + 5], color(CYAN, 0.45));
    });

    /* Telegraph lanes assemble before the physical structures. */
    if (network > 0) {
      routes.forEach(function (route) {
        var end = -6.2 + 12.4 * network, c = route.accent ? ORANGE : CYAN;
        var start = route.cross ? project(-6.2, 0.025, route.lane) : project(route.lane, 0.025, -6.2);
        var finish = route.cross ? project(end, 0.025, route.lane) : project(route.lane, 0.025, end);
        line(start, finish, color(c, 0.08 + network * 0.13), 0.8);
        if (network > 0.3) {
          var t = motion() ? (ambient * 0.105 + random(route.seed + 200)) % 1 : random(route.seed + 200);
          var head = -6.2 + t * 12.4 * network;
          var tail = Math.max(-6.2, head - 0.75);
          var headPoint = route.cross ? project(head, 0.035, route.lane) : project(route.lane, 0.035, head);
          var tailPoint = route.cross ? project(tail, 0.035, route.lane) : project(route.lane, 0.035, tail);
          line(tailPoint, headPoint, color(c, 0.6 * network), 1.4);
        }
      });
    }

    /* Free data converges on the ground as the city becomes coherent. */
    var particleCount = view.narrow ? 220 : 440;
    for (var j = 0; j < particleCount; j++) {
      var particle = particles[j];
      var drift = motion() ? ambient * 0.12 + particle.seed * 0.61 : particle.seed * 0.61;
      var px = particle.x + Math.sin(drift) * (1 - structure) * 0.4;
      var py = particle.h * (1 - structure * 0.93) + Math.cos(drift * 0.6) * (1 - structure) * 0.15;
      var point = project(px, py, particle.z);
      var alpha = pointAlpha * (0.25 + random(j + 51) * 0.65);
      ctx.fillStyle = color(j % 23 === 0 ? ORANGE : CYAN, alpha);
      ctx.fillRect(point[0], point[1], particle.size, particle.size);
    }

    function block(x, z, height, width, seed, accent, amount) {
      if (amount <= 0.003) return;
      var elevation = height * amount, half = width / 2, c = accent ? ORANGE : CYAN;
      var base = [project(x-half, 0, z-half), project(x+half, 0, z-half), project(x+half, 0, z+half), project(x-half, 0, z+half)];
      var roof = [project(x-half, elevation, z-half), project(x+half, elevation, z-half), project(x+half, elevation, z+half), project(x-half, elevation, z+half)];
      poly([base[1], base[2], roof[2], roof[1]], "rgba(6,23,31,0.94)", color(c, 0.2 + amount * 0.18));
      poly([base[2], base[3], roof[3], roof[2]], "rgba(8,31,37,0.95)", color(c, 0.25 + amount * 0.22));
      poly(roof, accent ? "rgba(70,37,28,0.85)" : "rgba(15,52,51,0.91)", color(c, 0.42 + amount * 0.27));
      var levels = Math.floor(elevation / 0.23);
      for (var level = 1; level < levels; level++) {
        var y = level * 0.23, light = random(seed + level * 13);
        line(project(x+half, y, z+half), project(x-half, y, z+half), color(c, light > 0.54 ? 0.38 : 0.07), 0.65);
        if (light > 0.4) line(project(x+half, y, z-half), project(x+half, y, z+half), color(c, 0.25), 0.65);
      }
      line(roof[2], base[2], color(c, 0.65 * amount), 1);
      if (height > 2 && amount > 0.92) {
        var mastBase = project(x, elevation, z), mastTop = project(x, elevation + 0.26, z);
        line(mastBase, mastTop, color(c, 0.7), 0.8);
        ctx.fillStyle = color(c, 0.85); ctx.fillRect(mastTop[0] - 1, mastTop[1] - 1, 2, 2);
      }
    }

    var sorted = buildings.slice().sort(function (a, b) { return (a.x * sin + a.z * cos) - (b.x * sin + b.z * cos); });
    sorted.forEach(function (building, index) {
      if (view.narrow && index % 3 === 0 && building.radius > 4) return;
      var delay = building.radius * 0.026 + random(building.seed + 99) * 0.08;
      var amount = smooth(0.34 + delay, 0.69 + delay, phase);
      block(building.x, building.z, building.h, building.w, building.seed, building.accent, amount);
    });

    /* A luminous central structure marks the final assembly. */
    var core = smooth(0.63, 0.95, phase);
    if (core > 0) {
      block(0, 0, 0.22, 1.9, 12000, false, core);
      block(0, 0, 2.25, 0.95, 12001, false, core);
      block(0, 0, 3.6, 0.52, 12002, false, core);
      block(0, 0, 4.65, 0.21, 12003, true, core);
      var top = project(0, 4.65 * core + 0.42 * finalStage, 0);
      var below = project(0, 4.65 * core, 0);
      line(below, top, color(ORANGE, 0.9), 1.2);
      var flare = ctx.createRadialGradient(top[0], top[1], 0, top[0], top[1], 24);
      flare.addColorStop(0, color(ORANGE, 0.45 * core));
      flare.addColorStop(0.16, color(ORANGE, 0.15 * core)); flare.addColorStop(1, color(ORANGE, 0));
      ctx.fillStyle = flare; ctx.fillRect(top[0] - 24, top[1] - 24, 48, 48);
    }

    /* Restrained orbital contour, surveyed in perspective. */
    if (network > 0.1) {
      ctx.beginPath();
      for (var angle = 0; angle <= TAU + 0.02; angle += 0.035) {
        var ring = project(Math.cos(angle) * 8, 0.015, Math.sin(angle) * 8);
        if (angle === 0) ctx.moveTo(ring[0], ring[1]); else ctx.lineTo(ring[0], ring[1]);
      }
      ctx.strokeStyle = color(CYAN, 0.1 + finalStage * 0.08); ctx.lineWidth = 0.7; ctx.stroke();
    }
    ctx.fillStyle = "rgba(0,0,0,0.055)";
    for (var scan = 0; scan < h; scan += 4) ctx.fillRect(0, scan, w, 1);
  }

  function queue() {
    if (destroyed || frame || document.hidden || !views.some(function (v) { return v.visible; })) return;
    frame = window.requestAnimationFrame(tick);
  }
  function tick(timestamp) {
    frame = 0;
    if (destroyed || document.hidden) return;
    if (motion() && timestamp - lastFrame < 32 && !dirty) { queue(); return; }
    lastFrame = timestamp;
    views.forEach(function (view) { if (view.visible) draw(view, timestamp * 0.001); });
    dirty = false;
    if (motion()) queue();
  }
  function resize() { views.forEach(sizeView); dirty = true; queue(); }
  function visibility() {
    if (document.hidden && frame) { window.cancelAnimationFrame(frame); frame = 0; }
    else { dirty = true; queue(); }
  }
  function mediaChanged() { dirty = true; queue(); }
  if (window.ResizeObserver) {
    resizeObserver = new window.ResizeObserver(resize);
    views.forEach(function (view) { resizeObserver.observe(view.canvas); });
  } else listen(window, "resize", resize);
  if (window.IntersectionObserver) {
    intersectionObserver = new window.IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var view = views.find(function (candidate) { return candidate.canvas === entry.target; });
        if (view) view.visible = entry.isIntersecting;
      });
      dirty = true; queue();
    }, { rootMargin: "120px" });
    views.forEach(function (view) { intersectionObserver.observe(view.canvas); });
  }
  listen(document, "visibilitychange", visibility);
  if (media.addEventListener) listen(media, "change", mediaChanged);
  else if (media.addListener) media.addListener(mediaChanged);
  window.JourneyVisual = Object.freeze({
    setProgress: function (value) {
      if (destroyed) return;
      var number = Number(value); progress = clamp(Number.isFinite(number) ? number : 0, 0, 1); dirty = true; queue();
    },
    setMotionEnabled: function (enabled) { if (destroyed) return; userMotion = !!enabled; dirty = true; queue(); },
    destroy: function () {
      if (destroyed) return; destroyed = true;
      if (frame) window.cancelAnimationFrame(frame);
      if (resizeObserver) resizeObserver.disconnect();
      if (intersectionObserver) intersectionObserver.disconnect();
      listeners.forEach(function (item) { item[0].removeEventListener(item[1], item[2]); });
      if (!media.addEventListener && media.removeListener) media.removeListener(mediaChanged);
      views.forEach(function (view) { view.ctx.clearRect(0, 0, view.canvas.width, view.canvas.height); });
      views.length = 0;
    }
  });
  resize();
})();
