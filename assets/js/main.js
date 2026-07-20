import { initNavigation } from './navigation.js';
import { initObserverMode } from './observer.js?v=stellar-drift-v1';
import { initTheoryLab } from './theory-lab.js?v=theory-clarity-v2';
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
