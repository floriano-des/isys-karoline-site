/* GSAP 3.15.0 + ScrollTrigger. Progressive enhancement; no scroll interception. */
(() => {
  'use strict';

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger || !window.matchMedia) return;

  const select = (selector) => Array.from(document.querySelectorAll(selector));
  const targetSelector = [
    '.hero-title .line > span', '.hero-intro', '.hero-actions', '.hero-cutout',
    '.hero-orbit', '.hero-wordmark', '.hero-seal', '.reveal', '.image-reveal img',
    '.manifesto-title [data-word]', '.method-progress', '.page-progress', '[data-magnetic]'
  ].join(',');
  const alreadyRevealed = new WeakSet();
  const originalStyles = new Map();
  let media;
  let stopped = false;
  let heroPlayed = false;
  let refreshFrame = 0;
  let initialMethodStates = [];
  let header;
  let initialHeaderState = false;
  let sealPaused = false;

  function restoreStyles() {
    const stamp = document.querySelector('.hero-stamp');
    if (stamp) stamp.disabled = true;
    originalStyles.forEach((attributes, element) => {
      Object.entries(attributes).forEach(([name, value]) => {
        if (value === null) element.removeAttribute(name);
        else element.setAttribute(name, value);
      });
    });
    initialMethodStates.forEach(([step, wasActive]) => step.classList.toggle('is-active', wasActive));
    header?.classList.toggle('is-scrolled', initialHeaderState);
  }

  // Even a partial initialization must leave the document in its readable HTML state.
  function failOpen(error) {
    if (stopped) return;
    stopped = true;
    window.cancelAnimationFrame(refreshFrame);
    try { media?.revert(); } catch { /* Restore DOM styles below regardless. */ }
    try {
      gsap.killTweensOf(Array.from(originalStyles.keys()));
      ScrollTrigger.getAll().forEach((trigger) => {
        if (String(trigger.vars.id || '').startsWith('isys-')) trigger.kill();
      });
    } catch { /* The static page remains the fallback if a vendor fails. */ }
    restoreStyles();
    console.warn('As animações foram desativadas; o conteúdo continua disponível.', error);
  }

  const safely = (callback) => (...args) => {
    if (stopped) return;
    try { return callback(...args); } catch (error) { failOpen(error); }
  };

  const refresh = safely(() => {
    if (refreshFrame || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    refreshFrame = window.requestAnimationFrame(safely(() => {
      refreshFrame = 0;
      ScrollTrigger.refresh();
    }));
  });

  function initialize() {
    if (stopped) return;
    try {
      select(targetSelector).forEach((element) => {
        const attributes = { style: element.getAttribute('style') };
        if (element instanceof SVGElement) {
          attributes.transform = element.getAttribute('transform');
          attributes['data-svg-origin'] = element.getAttribute('data-svg-origin');
        }
        originalStyles.set(element, attributes);
      });
      const steps = select('.method-step');
      initialMethodStates = steps.map((step) => [step, step.classList.contains('is-active')]);
      header = document.querySelector('.site-header');
      initialHeaderState = header?.classList.contains('is-scrolled') || false;
      gsap.registerPlugin(ScrollTrigger);
      media = gsap.matchMedia();

      media.add({
        always: '(min-width: 0px)',
        reduced: '(prefers-reduced-motion: reduce)',
        desktop: '(min-width: 1000px)',
        finePointer: '(hover: hover) and (pointer: fine)'
      }, (context) => {
        if (stopped) return;
        restoreStyles();
        // matchMedia reverts every tween/ScrollTrigger before re-running this callback.
        // The reduced branch creates neither timelines nor event-driven animations.
        if (context.conditions.reduced) return;
        const removeListeners = [];
        const revealTweens = new Map();
        let heroTimeline;
        const listen = (element, event, handler, options) => {
          element.addEventListener(event, handler, options);
          removeListeners.push(() => element.removeEventListener(event, handler, options));
        };

        try {
          const hero = document.querySelector('.hero');
          const lines = select('.hero-title .line > span');
          const cutout = document.querySelector('.hero-cutout');
          const orbit = document.querySelector('.hero-orbit');
          const wordmark = document.querySelector('.hero-wordmark');
          const seal = document.querySelector('.hero-seal');

          // Re-entry from a hash link, bfcache or a breakpoint change never replays the hero.
          if (hero && !heroPlayed && window.scrollY < 40) {
            heroPlayed = true;
            heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
            if (lines.length) heroTimeline.from(lines, {
              y: 28, duration: 1.05, stagger: 0.085
            }, 0);
            const introduction = select('.hero-intro, .hero-actions');
            if (introduction.length) heroTimeline.from(introduction, {
              y: 18, duration: 0.8, stagger: 0.11
            }, 0.3);
            if (cutout) heroTimeline.from(cutout, {
              x: 18, scale: 1.025, opacity: 0, duration: 1.25
            }, 0.1);
            if (orbit) heroTimeline.from(orbit, {
              scale: 0.94, opacity: 0, duration: 1.25, transformOrigin: '50% 50%'
            }, 0.05);
            if (wordmark) heroTimeline.from(wordmark, { opacity: 0, duration: 1.2 }, 0.15);
          }

          if (hero && context.conditions.desktop) {
            const parallax = (element, properties, name) => {
              if (!element) return;
              gsap.to(element, {
                ...properties, ease: 'none',
                scrollTrigger: {
                  id: `isys-hero-${name}`, trigger: hero, start: 'top top',
                  end: 'bottom top', scrub: 0.5, invalidateOnRefresh: true
                }
              });
            };
            parallax(cutout, { yPercent: 5 }, 'portrait');
            parallax(orbit, { yPercent: -6, rotation: 7 }, 'orbit');
            parallax(wordmark, { xPercent: -3 }, 'wordmark');
          }
          if (seal) {
            const stamp = seal.closest('.hero-stamp');
            const spin = gsap.to(seal, {
              rotation: 360, duration: 36, repeat: -1,
              transformOrigin: '50% 50%', ease: 'none', paused: sealPaused
            });
            if (stamp) {
              stamp.disabled = false;
              // Automatic motion can also be paused with touch, mouse or keyboard.
              listen(stamp, 'click', safely(() => {
                sealPaused = !sealPaused;
                spin.paused(sealPaused);
                stamp.setAttribute('aria-pressed', String(sealPaused));
                const label = sealPaused ? 'Retomar animação do selo' : 'Pausar animação do selo';
                stamp.setAttribute('aria-label', label);
                stamp.title = label;
              }));
            }
          }

          select('.reveal').forEach((element, index) => {
            if (element.closest('.hero') || alreadyRevealed.has(element)) return;
            if (element.getBoundingClientRect().top < window.innerHeight * 0.92) {
              alreadyRevealed.add(element);
              return;
            }
            const tween = gsap.from(element, {
              y: 26, duration: 0.8, ease: 'power2.out',
              onStart: () => alreadyRevealed.add(element),
              scrollTrigger: {
                id: `isys-reveal-${index}`, trigger: element, start: 'top 92%',
                once: true, fastScrollEnd: true
              }
            });
            revealTweens.set(element, tween);
          });

          select('.image-reveal').forEach((figure, index) => {
            const image = figure.querySelector('img');
            if (!image || alreadyRevealed.has(image)) return;
            if (figure.getBoundingClientRect().top < window.innerHeight * 0.92) {
              alreadyRevealed.add(image);
              return;
            }
            gsap.from(image, {
              scale: 1.065, duration: 1.15, ease: 'power2.out',
              onStart: () => alreadyRevealed.add(image),
              scrollTrigger: {
                id: `isys-image-${index}`, trigger: figure, start: 'top 92%',
                once: true, fastScrollEnd: true
              }
            });
          });

          const words = select('.manifesto-title [data-word]');
          const manifesto = document.querySelector('.manifesto-title');
          if (manifesto && words.length) gsap.from(words, {
            y: 12, stagger: 0.12, duration: 0.5, ease: 'none',
            scrollTrigger: {
              id: 'isys-manifesto', trigger: manifesto, start: 'top 86%',
              end: 'clamp(bottom 52%)', scrub: 0.35
            }
          });

          if (steps.length) {
            const activate = (index) => steps.forEach((step, current) => {
              step.classList.toggle('is-active', current === index);
            });
            const syncSteps = safely(() => {
              let current = 0;
              steps.forEach((step, index) => {
                if (step.getBoundingClientRect().top <= window.innerHeight * 0.62) current = index;
              });
              activate(current);
            });
            syncSteps();
            steps.forEach((step, index) => ScrollTrigger.create({
              id: `isys-step-${index}`, trigger: step, start: 'top 62%', end: 'bottom 62%',
              onEnter: safely(() => activate(index)),
              onEnterBack: safely(() => activate(index)),
              onRefresh: syncSteps
            }));
            const line = document.querySelector('.method-progress');
            if (line) gsap.fromTo(line, { scaleY: 0, transformOrigin: 'center top' }, {
              scaleY: 1, ease: 'none',
              scrollTrigger: {
                id: 'isys-method-progress', trigger: steps[0], start: 'top 62%',
                endTrigger: steps[steps.length - 1], end: 'bottom 62%', scrub: true
              }
            });
          }

          const pageProgress = document.querySelector('.page-progress');
          if (pageProgress) gsap.fromTo(pageProgress, { scaleX: 0, transformOrigin: 'left center' }, {
            scaleX: 1, ease: 'none',
            scrollTrigger: { id: 'isys-page-progress', start: 0, end: 'max', scrub: true }
          });
          if (header) {
            const syncHeader = safely(() => header.classList.toggle('is-scrolled', window.scrollY > 20));
            syncHeader();
            ScrollTrigger.create({
              id: 'isys-header', start: 0, end: 'max', onUpdate: syncHeader, onRefresh: syncHeader
            });
          }

          if (context.conditions.finePointer) {
            select('[data-magnetic]').forEach((button) => {
              const xTo = gsap.quickTo(button, 'x', { duration: 0.3, ease: 'power3.out' });
              const yTo = gsap.quickTo(button, 'y', { duration: 0.3, ease: 'power3.out' });
              let bounds;
              const reset = safely(() => { xTo(0); yTo(0); bounds = null; });
              listen(button, 'pointerenter', safely((event) => {
                if (event.pointerType !== 'mouse') return;
                bounds = button.getBoundingClientRect();
              }));
              listen(button, 'pointermove', safely((event) => {
                if (event.pointerType !== 'mouse' || !bounds) return;
                const dx = (event.clientX - bounds.left - bounds.width / 2) * 0.16;
                const dy = (event.clientY - bounds.top - bounds.height / 2) * 0.16;
                // Small rounding margin keeps the rendered translation strictly below 8 px.
                const limit = Math.min(1, 7.9 / (Math.hypot(dx, dy) || 1));
                xTo(dx * limit);
                yTo(dy * limit);
              }));
              listen(button, 'pointerleave', reset);
              listen(button, 'pointercancel', reset);
              listen(button, 'focus', reset);
            });
          }

          // Keyboard focus is never allowed to remain inside an unrevealed block.
          listen(document, 'focusin', safely((event) => {
            if (hero?.contains(event.target)) heroTimeline?.progress(1);
            revealTweens.forEach((tween, element) => {
              if (element.contains(event.target)) {
                tween.progress(1);
                alreadyRevealed.add(element);
              }
            });
          }));
          refresh();
        } catch (error) {
          removeListeners.forEach((remove) => remove());
          // Let matchMedia finish registering its context before reverting it.
          window.queueMicrotask(() => failOpen(error));
        }
        return () => {
          removeListeners.forEach((remove) => remove());
          restoreStyles();
        };
      });

      // ScrollTrigger already handles resize; font/image completion can also move sections.
      select('img').forEach((image) => {
        if (!image.complete) {
          image.addEventListener('load', refresh, { once: true });
          image.addEventListener('error', refresh, { once: true });
        }
      });
      window.addEventListener('load', refresh, { once: true });
      window.addEventListener('pageshow', refresh);
      document.fonts?.addEventListener('loadingdone', refresh);
      window.addEventListener('error', (event) => {
        if (/\/(?:motion|gsap-[\d.]+\.min|ScrollTrigger-[\d.]+\.min)\.js(?:[?#]|$)/.test(event.filename || '')) {
          failOpen(event.error || event.message);
        }
      });
    } catch (error) {
      failOpen(error);
    }
  }

  const ready = () => {
    // Nothing is hidden while fonts load, or if fonts/library loading fails.
    Promise.resolve(document.fonts?.ready).then(initialize).catch(failOpen);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
})();
