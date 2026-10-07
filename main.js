/* Mar de Ágata — main.js (IIFE, sin módulos) */
(function () {
  'use strict';

  function safe(fn, name) {
    try { fn(); } catch (e) { if (window.console) console.warn('[init] ' + name + ' falló:', e); }
  }

  /* ---- Nav: fondo al hacer scroll + enlace activo ---- */
  function initNav() {
    var nav = document.getElementById('nav');
    if (!nav) return;
    var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 30); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
    if (!('IntersectionObserver' in window) || !links.length) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (l) { l.classList.remove('is-active'); });
          map[en.target.id].classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) io.observe(s);
    });
  }

  /* ---- Menú móvil ---- */
  function initMenu() {
    var btn = document.getElementById('navToggle');
    var menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;
    function set(open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
      document.body.classList.toggle('menu-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }
    btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  }

  /* ---- Reveal al hacer scroll (umbral bajo + red de seguridad) ---- */
  function initReveal() {
    var els = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    if (!els.length) return;
    var showAll = function () { els.forEach(function (el) { el.classList.add('is-in'); }); };
    if (!('IntersectionObserver' in window)) { showAll(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
    setTimeout(showAll, 6000);
  }

  /* ---- Formulario: envío real a contact.php (Hostinger) ---- */
  function initForm() {
    var form = document.getElementById('contactForm');
    var msg = document.getElementById('formMsg');
    var btn = document.getElementById('f-submit');
    var t = document.getElementById('f-t');
    if (!form) return;
    if (t) t.value = String(Date.now());

    function show(text, ok) {
      msg.className = 'form-msg ' + (ok ? 'ok' : 'err');
      msg.textContent = text;
    }
    function mailtoFallback() {
      var f = form.elements;
      var body =
        'Hola, me gustaría recibir información del Centro Infantil Mar de Ágata.\n\n' +
        'Nombre: ' + f.nombre.value.trim() + '\nTeléfono: ' + f.telefono.value.trim() +
        '\nEdad: ' + f.edad.value + '\nInicio: ' + f.inicio.value + '\n\n' + (f.mensaje.value.trim() || '');
      window.location.href = 'mailto:mardeagata@gmail.com?subject=' +
        encodeURIComponent('Solicitud de información / visita') + '&body=' + encodeURIComponent(body);
    }
    function done(text) {
      form.innerHTML =
        '<div class="form-done" role="status">' +
        '<svg viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="34" fill="#ffd23f"/><path d="M22 37l9 9 19-20" fill="none" stroke="#083a5b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '<h3>¡Solicitud enviada!</h3><p></p>' +
        '<a class="btn btn-ghost" href="tel:+34858108687">¿Prisa? Llama al 858 108 687</a></div>';
      form.querySelector('.form-done p').textContent = text;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements, ok = true;
      ['nombre', 'telefono'].forEach(function (n) {
        var bad = !f[n].value.trim();
        f[n].classList.toggle('is-invalid', bad);
        if (bad) ok = false;
      });
      var tel = f.telefono.value.replace(/[^0-9]/g, '');
      if (f.telefono.value.trim() && tel.length < 9) { f.telefono.classList.add('is-invalid'); ok = false; }
      if (!f.privacidad.checked) ok = false;
      if (!ok) { show('Revisa tu nombre, un teléfono válido y acepta la política de privacidad.', false); return; }

      if (window.__PREVIEW__) { done('Vista previa: en la web publicada esta solicitud llega por email al centro.'); return; }
      // Sin servidor PHP (vista previa o archivo local): usa el correo.
      if (location.protocol === 'file:' || !window.fetch || !window.FormData) { mailtoFallback(); return; }

      btn.disabled = true; btn.classList.add('is-sending'); btn.firstChild.textContent = 'Enviando ';
      fetch(form.getAttribute('action'), { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json().catch(function () { throw new Error('bad'); }); })
        .then(function (data) {
          if (data && data.ok) { done(data.message); }
          else { show((data && data.message) || 'No se pudo enviar. Llámanos al 858 108 687.', false); }
        })
        .catch(function () {
          show('No se pudo enviar desde aquí. Llámanos al 858 108 687 o escribe a mardeagata@gmail.com.', false);
        })
        .then(function () {
          if (btn.isConnected) { btn.disabled = false; btn.classList.remove('is-sending'); btn.firstChild.textContent = 'Enviar solicitud'; }
        });
    });
  }

  /* ---- Mapa: se carga solo cuando la familia lo pide ---- */
  function initMap() {
    var b = document.getElementById('loadMap');
    var map = document.getElementById('map');
    if (!b || !map) return;
    b.addEventListener('click', function () {
      if (map.querySelector('iframe')) return;
      var f = document.createElement('iframe');
      f.title = 'Mapa: Callejón del Pretorio 7, Granada';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.src = 'https://www.google.com/maps?q=Callej%C3%B3n+del+Pretorio+7,+18008+Granada&output=embed';
      map.innerHTML = '';
      map.appendChild(f);
    });
  }

  /* ---- Galería: ampliar foto ---- */
  function initLightbox() {
    var dlg = document.getElementById('lightbox');
    var img = document.getElementById('lbImg');
    var cap = document.getElementById('lbCap');
    var close = document.getElementById('lbClose');
    var btns = document.querySelectorAll('.ph[data-full]');
    if (!dlg || !btns.length) return;
    var canDialog = typeof dlg.showModal === 'function';
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () {
        var small = b.querySelector('img');
        var fig = b.closest('figure');
        img.src = b.getAttribute('data-full');
        img.alt = small ? small.alt : '';
        cap.textContent = fig && fig.querySelector('figcaption') ? fig.querySelector('figcaption').textContent : '';
        if (canDialog) dlg.showModal(); else window.open(img.src, '_blank');
      });
    });
    close.addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  }

  /* ---- Barquito de progreso + parallax de dibujos (un solo bucle rAF) ---- */
  function initVoyageAndParallax() {
    var boat = document.getElementById('voyageBoat');
    var trail = document.getElementById('voyageTrail');
    var doodles = Array.prototype.slice.call(document.querySelectorAll('.doodle[data-speed]'));
    var ticking = false;
    function update() {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (boat && trail) {
        var x = (p * 100).toFixed(2) + '%';
        boat.style.left = 'calc(' + x + ' * 0.96 + 2%)';
        trail.style.width = 'calc(' + x + ' * 0.96 + 2%)';
      }
      var vh = window.innerHeight;
      doodles.forEach(function (d) {
        var r = d.parentElement.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var offset = (r.top + r.height / 2 - vh / 2) * parseFloat(d.getAttribute('data-speed'));
        d.style.translate = '0 ' + offset.toFixed(1) + 'px';
      });
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  function initYear() {
    var y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  }

  safe(initNav, 'nav');
  safe(initMenu, 'menu');
  safe(initReveal, 'reveal');
  safe(initForm, 'form');
  safe(initMap, 'map');
  safe(initLightbox, 'lightbox');
  safe(initVoyageAndParallax, 'voyage');
  safe(initYear, 'year');
})();
