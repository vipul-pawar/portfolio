/* =========================================================================
   js/layout.js — shared chrome for every page
   Renders the header and footer into <div id="site-header"> / <div id="site-footer">
   from template strings (no fetch, so it works from file:// too), highlights
   the current page, wires the mobile menu, scroll-reveal animations and the
   gallery lightbox.

   Every page declares:
     <body data-root="./" data-page="index.html">
   data-root is the path prefix back to the site root ("../" on sub-pages) and
   data-page is the page id used for nav highlighting.
   ========================================================================= */
(function () {
  'use strict';

  var body = document.body;
  if (!body) {
    return;
  }

  var ROOT = body.getAttribute('data-root') || './';
  var PAGE = body.getAttribute('data-page') || '';
  var YEAR = new Date().getFullYear();

  var NAV = [
    { label: 'Home', href: 'index.html', match: ['index.html'] },
    { label: 'Projects', href: 'projects.html', match: ['projects.html', 'projects/'] },
    { label: 'Experience', href: 'experience/reliance-internship.html', match: ['experience/'] },
    { label: 'Skills', href: 'skills.html', match: ['skills.html'] },
    { label: 'Certifications', href: 'certifications.html', match: ['certifications.html'] },
    { label: 'PID Lab', href: 'pid-lab.html', match: ['pid-lab.html'] },
    { label: 'Contact', href: 'contact.html', match: ['contact.html'] }
  ];

  var SOCIAL = {
    github: 'https://github.com/vipul-pawar',
    linkedin: 'https://www.linkedin.com/in/vipul-pawar-gcoea/',
    email: 'vipulpawar311@gmail.com'
  };

  var ICONS = {
    sun:
      '<svg class="h-4 w-4 dark:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" /></svg>',
    moon:
      '<svg class="hidden h-4 w-4 dark:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z" /></svg>',
    menu:
      '<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>',
    close:
      '<svg class="hidden h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>',
    arrowRight:
      '<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>'
  };

  function isActive(item) {
    for (var i = 0; i < item.match.length; i++) {
      var pattern = item.match[i];
      if (pattern.charAt(pattern.length - 1) === '/') {
        if (PAGE.indexOf(pattern) === 0) {
          return true;
        }
      } else if (PAGE === pattern) {
        return true;
      }
    }
    return false;
  }

  function headerMarkup() {
    var desktopLinks = NAV.map(function (item) {
      var active = isActive(item);
      return (
        '<li><a class="nav-link' +
        (active ? ' is-active' : '') +
        '" href="' +
        ROOT +
        item.href +
        '"' +
        (active ? ' aria-current="page"' : '') +
        '>' +
        item.label +
        '</a></li>'
      );
    }).join('');

    var mobileLinks = NAV.map(function (item) {
      var active = isActive(item);
      return (
        '<li><a class="mobile-link' +
        (active ? ' is-active' : '') +
        '" href="' +
        ROOT +
        item.href +
        '"' +
        (active ? ' aria-current="page"' : '') +
        '><span>' +
        item.label +
        '</span>' +
        (active ? '<span class="led led--amber"></span>' : '<span class="tag-mini">' + '→' + '</span>') +
        '</a></li>'
      );
    }).join('');

    return (
      '<header class="site-header">' +
      '<div class="mx-auto flex w-full max-w-content items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">' +
      '<a class="brand" href="' +
      ROOT +
      'index.html" aria-label="Vipul Pawar — home">' +
      '<span class="brand-mark" aria-hidden="true">VP</span>' +
      '<span><span class="brand-name">Vipul Pawar</span><span class="brand-sub">Instrumentation Engineering</span></span>' +
      '</a>' +
      '<nav class="ml-auto hidden lg:block" aria-label="Primary">' +
      '<ul class="flex items-center gap-0.5">' +
      desktopLinks +
      '</ul>' +
      '</nav>' +
      '<div class="ml-auto flex items-center gap-2 lg:ml-3">' +
      '<button type="button" class="icon-btn" data-theme-toggle aria-pressed="false" aria-label="Switch to dark theme">' +
      ICONS.sun +
      ICONS.moon +
      '</button>' +
      '<button type="button" class="icon-btn lg:hidden" data-menu-toggle aria-expanded="false" aria-controls="site-mobile-nav" aria-label="Open navigation menu">' +
      ICONS.menu +
      ICONS.close +
      '</button>' +
      '</div>' +
      '</div>' +
      '<nav id="site-mobile-nav" class="mobile-nav lg:hidden" aria-label="Mobile">' +
      '<ul class="space-y-1 pt-2">' +
      mobileLinks +
      '</ul>' +
      '<a class="btn btn--primary btn--block mt-3" href="' +
      ROOT +
      'assets/vipul-pawar-resume.pdf" download>Download Resume</a>' +
      '</nav>' +
      '</header>'
    );
  }

  function footerMarkup() {
    var links = NAV.map(function (item) {
      return (
        '<li><a class="foot-link" href="' + ROOT + item.href + '">' + item.label + '</a></li>'
      );
    }).join('');

    return (
      '<footer class="site-footer">' +
      '<div class="mx-auto w-full max-w-content px-4 py-10 sm:px-6 lg:px-8">' +
      '<div class="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">' +
      '<div>' +
      '<a class="brand" href="' +
      ROOT +
      'index.html" aria-label="Vipul Pawar — home">' +
      '<span class="brand-mark" aria-hidden="true">VP</span>' +
      '<span><span class="brand-name">Vipul Pawar</span><span class="brand-sub">Instrumentation Engineering</span></span>' +
      '</a>' +
      '<p class="mt-4 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">' +
      'Instrumentation, Control &amp; Automation Engineering student focused on PLC/DCS automation, OT/ICS security, embedded systems and IoT.' +
      '</p>' +
      '<p class="mt-4 inline-flex items-center gap-2 rounded-lg border border-paper-300 bg-white/70 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500 dark:border-ink-700 dark:bg-ink-900/60 dark:text-slate-400">' +
      '<span class="led led--green led--pulse" aria-hidden="true"></span>' +
      '<span>system status: online</span>' +
      '</p>' +
      '</div>' +
      '<div>' +
      '<h2 class="foot-heading">Navigate</h2>' +
      '<ul class="space-y-0.5">' +
      links +
      '</ul>' +
      '</div>' +
      '<div>' +
      '<h2 class="foot-heading">Elsewhere</h2>' +
      '<ul class="space-y-0.5">' +
      '<li><a class="foot-link" href="' +
      SOCIAL.github +
      '" rel="noopener noreferrer" target="_blank">GitHub <span aria-hidden="true">↗</span></a></li>' +
      '<li><a class="foot-link" href="' +
      SOCIAL.linkedin +
      '" rel="noopener noreferrer" target="_blank">LinkedIn <span aria-hidden="true">↗</span></a></li>' +
      '<li><a class="foot-link" href="' +
      ROOT +
      'contact.html">Contact page</a></li>' +
      '<li><a class="foot-link" href="mailto:' +
      SOCIAL.email +
      '">' + SOCIAL.email + '</a></li>' +
      '</ul>' +
      '</div>' +
      '</div>' +
      '<div class="mt-9 flex flex-col gap-3 border-t border-paper-300 pt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-ink-700 dark:text-slate-500">' +
      '<p>© <span data-year>' +
      YEAR +
      '</span> Vipul Pawar · Amravati, Maharashtra, India</p>' +
      '<p>Built with HTML, Tailwind CSS &amp; vanilla JS · <a class="underline decoration-dotted hover:text-signal-800 dark:hover:text-signal-300" href="' +
      ROOT +
      'index.html">back to top ↑</a></p>' +
      '</div>' +
      '</div>' +
      '</footer>'
    );
  }

  function lightboxMarkup() {
    return (
      '<dialog class="lightbox" id="site-lightbox" aria-labelledby="site-lightbox-caption">' +
      '<div class="flex items-center justify-between gap-3 border-b border-paper-300 px-4 py-3 dark:border-ink-600">' +
      '<p class="tag-mini" id="site-lightbox-caption" data-lightbox-caption>Image</p>' +
      '<button type="button" class="icon-btn" data-lightbox-close aria-label="Close enlarged image">' +
      ICONS.close.replace('hidden ', '') +
      '</button>' +
      '</div>' +
      '<div class="bg-ink-950 p-3">' +
      '<img class="mx-auto h-auto max-h-[72vh] w-auto max-w-full rounded-lg" data-lightbox-img src="" alt="" />' +
      '</div>' +
      '</dialog>'
    );
  }

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */
  var headerHost = document.getElementById('site-header');
  var footerHost = document.getElementById('site-footer');

  if (headerHost) {
    headerHost.innerHTML = headerMarkup();
  }
  if (footerHost) {
    footerHost.innerHTML = footerMarkup();
  }

  if (!document.getElementById('site-lightbox')) {
    var dialogHost = document.createElement('div');
    dialogHost.innerHTML = lightboxMarkup();
    document.body.appendChild(dialogHost.firstChild);
  }

  // Skip link must be the first focusable element on the page.
  if (!document.querySelector('.skip-link')) {
    var skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = '#main';
    skip.textContent = 'Skip to content';
    document.body.insertBefore(skip, document.body.firstChild);
  }

  var yearNode = document.querySelector('[data-year]');
  if (yearNode) {
    yearNode.textContent = String(YEAR);
  }

  /* ---------------------------------------------------------------- */
  /* Mobile navigation                                                 */
  /* ---------------------------------------------------------------- */
  var menuToggle = document.querySelector('[data-menu-toggle]');
  var mobileNav = document.getElementById('site-mobile-nav');

  function closeMobileNav() {
    if (!menuToggle || !mobileNav) {
      return;
    }
    mobileNav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation menu');
    var icons = menuToggle.querySelectorAll('svg');
    if (icons.length === 2) {
      icons[0].classList.remove('hidden');
      icons[1].classList.add('hidden');
    }
  }

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
      var icons = menuToggle.querySelectorAll('svg');
      if (icons.length === 2) {
        icons[0].classList.toggle('hidden', isOpen);
        icons[1].classList.toggle('hidden', !isOpen);
      }
    });

    mobileNav.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        closeMobileNav();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeMobileNav();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024) {
        closeMobileNav();
      }
    });
  }

  /* ---------------------------------------------------------------- */
  /* Scroll reveal (respects prefers-reduced-motion)                   */
  /* ---------------------------------------------------------------- */
  var reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reveals = document.querySelectorAll('.reveal');

  function showAll() {
    for (var i = 0; i < reveals.length; i++) {
      reveals[i].classList.add('is-visible');
    }
  }

  if (!reveals.length) {
    /* nothing to do */
  } else if (reduceMotion || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    for (var j = 0; j < reveals.length; j++) {
      observer.observe(reveals[j]);
    }
  }

  /* ---------------------------------------------------------------- */
  /* Gallery lightbox                                                  */
  /* ---------------------------------------------------------------- */
  var lightbox = document.getElementById('site-lightbox');
  var lightboxImg = lightbox ? lightbox.querySelector('[data-lightbox-img]') : null;
  var lightboxCaption = lightbox ? lightbox.querySelector('[data-lightbox-caption]') : null;

  if (lightbox && lightboxImg && typeof lightbox.showModal === 'function') {
    document.addEventListener('click', function (event) {
      var trigger = event.target.closest ? event.target.closest('[data-lightbox]') : null;

      if (trigger) {
        event.preventDefault();
        var source = trigger.querySelector('img');
        var full = trigger.getAttribute('data-full') || (source ? source.currentSrc || source.src : '');
        var caption = trigger.getAttribute('data-caption') || (source ? source.alt : 'Image');
        lightboxImg.src = full;
        lightboxImg.alt = caption;
        if (lightboxCaption) {
          lightboxCaption.textContent = caption;
        }
        lightbox.showModal();
        return;
      }

      if (event.target === lightbox || (event.target.closest && event.target.closest('[data-lightbox-close]'))) {
        lightbox.close();
      }
    });
  }
})();
