/* SIVAN CHEN Beauty Academy — progressive enhancement only */
(function () {
  document.documentElement.classList.add('js');

  // mobile nav
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    // close the menu when tapping anywhere outside it
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('open') && !nav.contains(e.target) && !toggle.contains(e.target)) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // header shadow + scroll progress bar
  var header = document.querySelector('.site-header');
  var progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);
  var ticking = false;
  var onScroll = function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      if (header) header.classList.toggle('scrolled', window.scrollY > 8);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ')';
      ticking = false;
    });
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  // reveal on scroll — elements entering together cascade in one after another
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      var batch = 0;
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          if (!/reveal-d\d/.test(el.className)) {
            var delay = batch * 80;
            batch++;
            if (delay) {
              el.style.transitionDelay = delay + 'ms';
              setTimeout(function () { el.style.transitionDelay = ''; }, delay + 900);
            }
          }
          el.classList.add('in');
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  // whole card is clickable (JS fallback for the CSS stretched-link, works on touch too)
  document.querySelectorAll('.card').forEach(function (card) {
    var link = card.querySelector('a.btn');
    if (!link) return;
    card.style.cursor = 'pointer';
    card.addEventListener('click', function (e) {
      if (!e.target.closest('a')) link.click();
    });
  });

  // gallery show-more — reveals the next hidden block BELOW the existing ones,
  // so images already on screen never move or reshuffle
  document.querySelectorAll('.show-more').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = btn.getAttribute('data-target');
      var sel = '.masonry-more[data-more-for="' + target + '"][hidden]';
      var block = document.querySelector(sel);
      if (block) block.removeAttribute('hidden');
      if (!document.querySelector(sel)) btn.parentElement.remove();
    });
  });

  // ============ gallery lightbox ============
  var grids = document.querySelectorAll('.masonry');
  if (grids.length) {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.hidden = true;
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'תצוגת תמונה מוגדלת');
    lb.innerHTML =
      '<button type="button" class="lb-close" aria-label="סגירה">×</button>' +
      '<button type="button" class="lb-prev" aria-label="התמונה הקודמת">‹</button>' +
      '<img alt="">' +
      '<button type="button" class="lb-next" aria-label="התמונה הבאה">›</button>' +
      '<span class="lb-count" aria-hidden="true"></span>';
    document.body.appendChild(lb);

    var lbImg = lb.querySelector('img');
    var lbCount = lb.querySelector('.lb-count');
    var items = [];
    var idx = 0;

    function show(i) {
      idx = (i + items.length) % items.length;
      var src = items[idx];
      lbImg.src = src.getAttribute('src');
      lbImg.alt = src.getAttribute('alt') || '';
      lbCount.textContent = (idx + 1) + ' / ' + items.length;
    }
    function openLb(grid, img) {
      var scope = grid.closest('section') || grid;
      items = Array.prototype.slice.call(scope.querySelectorAll('.masonry:not([hidden]) figure img'));
      show(items.indexOf(img));
      lb.hidden = false;
      document.body.style.overflow = 'hidden';
      lb.querySelector('.lb-close').focus();
    }
    function closeLb() {
      lb.hidden = true;
      document.body.style.overflow = '';
    }

    grids.forEach(function (grid) {
      grid.addEventListener('click', function (e) {
        var img = e.target.closest('figure img');
        if (img) openLb(grid, img);
      });
    });

    lb.addEventListener('click', function (e) {
      if (e.target.closest('.lb-prev')) { show(idx + 1); return; }
      if (e.target.closest('.lb-next')) { show(idx - 1); return; }
      if (e.target.closest('.lb-close')) { closeLb(); return; }
      // any click that is not on the image itself closes the popup
      if (e.target !== lbImg) closeLb();
    });

    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowRight') show(idx - 1); // RTL: right = previous
      if (e.key === 'ArrowLeft') show(idx + 1);
    });

    // touch swipe between images
    var tx = null, ty = null;
    lb.addEventListener('touchstart', function (e) {
      tx = e.touches[0].clientX; ty = e.touches[0].clientY;
    }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx;
      var dy = e.changedTouches[0].clientY - ty;
      tx = ty = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        show(dx > 0 ? idx - 1 : idx + 1); // swipe right = previous (RTL feel)
      }
    }, { passive: true });
  }

  // current year
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
