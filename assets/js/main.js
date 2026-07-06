import { initNavigation } from './navigation.js';
import { initObserverMode } from './observer.js?v=contact-structural-v3';
import { initTheoryLab } from './theory-lab.js';
import { initPhilosophyCompass } from './philosophy.js';
import { initResonance } from './resonance.js';
import { initContactForm } from './contact.js';

const boot = () => {
  initNavigation();
  initObserverMode();
  initTheoryLab();
  initPhilosophyCompass();
  initResonance();
  initContactForm();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
