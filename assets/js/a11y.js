/* ============================================================
   ווידג'ט נגישות – Sivan Chen Beauty Academy
   בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות
   לשירות), התשע"ג-2013, ות"י 5568 (WCAG 2.0/2.1 AA)
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'sc-a11y';
  var state = {};
  try { state = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { state = {}; }

  var FEATURES = [
    { id: 'fontsize1',  label: 'הגדלת טקסט',        group: 'font' },
    { id: 'fontsize2',  label: 'הגדלת טקסט נוספת',   group: 'font' },
    { id: 'contrast',   label: 'ניגודיות גבוהה (כהה)' },
    { id: 'invert',     label: 'ניגודיות הפוכה' },
    { id: 'grayscale',  label: 'גווני אפור' },
    { id: 'links',      label: 'הדגשת קישורים' },
    { id: 'readable',   label: 'גופן קריא' },
    { id: 'no-motion',  label: 'עצירת אנימציות' },
    { id: 'big-cursor', label: 'סמן עכבר גדול' },
    { id: 'reading-guide', label: 'סרגל קריאה' }
  ];

  function apply() {
    FEATURES.forEach(function (f) {
      document.documentElement.classList.toggle('a11y-' + f.id, !!state[f.id]);
    });
    guide(state['reading-guide']);
  }

  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  // reading guide bar
  var guideEl = null;
  function guide(on) {
    if (on && !guideEl) {
      guideEl = document.createElement('div');
      guideEl.className = 'a11y-guide-bar';
      guideEl.setAttribute('aria-hidden', 'true');
      document.body.appendChild(guideEl);
      document.addEventListener('mousemove', moveGuide);
    } else if (!on && guideEl) {
      document.removeEventListener('mousemove', moveGuide);
      guideEl.remove(); guideEl = null;
    }
  }
  function moveGuide(e) { if (guideEl) guideEl.style.top = (e.clientY - 2) + 'px'; }

  // ---- build UI ----
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'a11y-nav-btn';
  btn.setAttribute('aria-label', 'פתיחת תפריט נגישות');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'a11y-panel');
  btn.textContent = 'נגישות';

  var panel = document.createElement('div');
  panel.id = 'a11y-panel';
  panel.className = 'a11y-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'תפריט נגישות');
  panel.hidden = true;

  var html = '<div class="a11y-head"><strong>תפריט נגישות</strong>' +
    '<button type="button" class="a11y-close" aria-label="סגירת תפריט נגישות">×</button></div><div class="a11y-body">';
  FEATURES.forEach(function (f) {
    html += '<button type="button" class="a11y-opt" data-id="' + f.id + '" aria-pressed="' + (!!state[f.id]) + '">' + f.label + '</button>';
  });
  html += '</div><div class="a11y-foot">' +
    '<button type="button" class="a11y-reset">איפוס הגדרות</button>' +
    '<a href="accessibility.html">הצהרת נגישות</a></div>';
  panel.innerHTML = html;

  function openPanel(open) {
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) panel.querySelector('.a11y-opt').focus();
  }

  btn.addEventListener('click', function () {
    openPanel(panel.hidden);
    // close the mobile hamburger menu when opening the panel from it
    var nav = document.querySelector('.main-nav');
    var toggle = document.querySelector('.nav-toggle');
    if (nav && nav.classList.contains('open')) {
      nav.classList.remove('open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
  });
  panel.addEventListener('click', function (e) {
    var opt = e.target.closest('.a11y-opt');
    if (opt) {
      var id = opt.getAttribute('data-id');
      state[id] = !state[id];
      // font sizes are exclusive-ish: size2 implies bigger than size1
      opt.setAttribute('aria-pressed', state[id] ? 'true' : 'false');
      save(); apply();
      return;
    }
    if (e.target.closest('.a11y-reset')) {
      state = {}; save(); apply();
      panel.querySelectorAll('.a11y-opt').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
      return;
    }
    if (e.target.closest('.a11y-close')) openPanel(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) { openPanel(false); btn.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) openPanel(false);
  });

  function mount() {
    var navUl = document.querySelector('.main-nav ul');
    var headerInner = document.querySelector('.header-inner');

    if (!navUl || !headerInner) {
      // pages without a nav (e.g. 404) – floating fallback
      btn.classList.add('a11y-btn-float');
      document.body.appendChild(btn);
      document.body.appendChild(panel);
      apply();
      return;
    }

    // mobile: a row inside the hamburger menu · desktop: a standalone item
    // pinned to the far (inline-end) edge of the header, outside the menu list
    var li = document.createElement('li');
    li.className = 'a11y-nav-item';
    var mq = window.matchMedia('(min-width: 861px)');

    function place() {
      if (mq.matches) {
        if (li.parentNode) li.remove();
        headerInner.appendChild(btn); // last flex child = far left in RTL
      } else {
        li.appendChild(btn);
        var ctaLi = navUl.querySelector('.nav-cta');
        ctaLi = ctaLi ? ctaLi.closest('li') : null;
        if (ctaLi) navUl.insertBefore(li, ctaLi);
        else navUl.appendChild(li);
      }
    }
    place();
    if (mq.addEventListener) mq.addEventListener('change', place);
    // extra safety: some environments don't fire matchMedia change events
    var rT;
    window.addEventListener('resize', function () {
      clearTimeout(rT); rT = setTimeout(place, 120);
    }, { passive: true });

    document.body.appendChild(panel);
    apply();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
