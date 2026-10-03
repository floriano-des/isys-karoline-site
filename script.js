'use strict';

// Contatos: edite os links identificados no rodapé do index.html.
// Mensagens: ajuste aqui os convites que acompanham cada botão.
const messages = {
  geral: 'Olá, Isys! Vim pelo site e gostaria de conhecer seu acompanhamento.',
  personal: 'Olá, Isys! Vim pelo site e gostaria de saber mais sobre o acompanhamento de Personal Trainer em Palmital.',
  pilates: 'Olá, Isys! Vim pelo site e gostaria de saber mais sobre as aulas de Pilates clássico na Clínica Fisioterapia Integrativa.'
};

const contactLink = document.getElementById('whatsapp-contato');
if (contactLink) {
  const baseUrl = new URL(contactLink.href);
  document.querySelectorAll('[data-whatsapp]').forEach((link) => {
    const url = new URL(baseUrl);
    url.searchParams.set('text', messages[link.dataset.whatsapp] || messages.geral);
    link.href = url.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const label = link.classList.contains('service-visual')
      ? `Saber mais sobre ${link.dataset.whatsapp === 'pilates' ? 'Pilates clássico' : 'Personal Trainer'}`
      : link.classList.contains('contact-circle') ? 'Conversar com a Isys'
      : link.textContent.trim().replace(/\s+/g, ' ');
    link.setAttribute('aria-label', `${label} pelo WhatsApp — abre em nova aba`);
  });
  baseUrl.searchParams.set('text', messages.geral);
  contactLink.href = baseUrl.href;
}

const year = document.getElementById('current-year');
if (year) year.textContent = String(new Date().getFullYear());

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.getElementById('navigation');
const mobileViewport = window.matchMedia('(max-width: 760px)');

if (menuButton && navigation) {
  document.documentElement.classList.add('menu-ready');
  const setMenu = (open, restoreFocus = false) => {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    navigation.classList.toggle('is-open', open);
    if (restoreFocus) menuButton.focus();
  };
  menuButton.addEventListener('click', () => {
    setMenu(menuButton.getAttribute('aria-expanded') !== 'true');
  });
  navigation.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link || !mobileViewport.matches) return;
    setMenu(false);
    const hash = link.getAttribute('href');
    if (hash?.startsWith('#')) {
      const section = document.getElementById(hash.slice(1));
      if (section) {
        section.setAttribute('tabindex', '-1');
        section.focus({ preventScroll: true });
        section.addEventListener('blur', () => section.removeAttribute('tabindex'), { once: true });
      }
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenu(false, true);
    }
  });
  document.addEventListener('click', (event) => {
    if (mobileViewport.matches && !event.target.closest('.site-header')) setMenu(false);
  });
  navigation.addEventListener('focusout', (event) => {
    if (mobileViewport.matches && event.relatedTarget && !event.relatedTarget.closest('.site-header')) setMenu(false);
  });
  mobileViewport.addEventListener('change', () => setMenu(false));
}

// Com texto ampliado, os controles fixos voltam ao fluxo para liberar a leitura.
// A medida relativa acompanha o tamanho de fonte escolhido pela visitante.
const adaptTextLayout = () => {
  const root = document.documentElement;
  const fontSize = parseFloat(getComputedStyle(root).fontSize);
  const headerHeight = document.querySelector('.site-header')?.offsetHeight || 0;
  const crowdedHeader = fontSize > 20 && headerHeight > window.innerHeight * 0.25;
  root.classList.toggle('large-text-layout', root.clientWidth < fontSize * 20 || crowdedHeader);
};
adaptTextLayout();
window.addEventListener('resize', adaptTextLayout, { passive: true });
if ('ResizeObserver' in window) new ResizeObserver(adaptTextLayout).observe(document.documentElement);
document.fonts?.ready.then(adaptTextLayout);

// A animação é uma melhoria opcional, isolada em motion.js.
