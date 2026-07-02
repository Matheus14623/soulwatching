import { initNavigation } from './navigation.js';
import { initObserverMode } from './observer.js';
import { initPhilosophyCompass } from './philosophy.js';
import { initResonance } from './resonance.js';
import { initContactForm } from './contact.js';

const boot = () => {
  initNavigation();
  initObserverMode();
  initPhilosophyCompass();
  initResonance();
  initContactForm();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
