import { initNavigation } from './navigation.js';
import { initObserverMode } from './observer.js?v=stellar-drift-v1';
import { initStellarVisionInfo } from './stellar-vision-info.js?v=stellar-info-v1';
import { initTheoryLab } from './theory-lab.js?v=theory-clarity-v2';
import { initPhilosophyCompass } from './philosophy.js';
import { initResonance } from './resonance.js';
import { initContactForm } from './contact.js';
import { initNotableFiguresPreview } from './notable-figures-preview.js?v=great-minds-v3';
import { initConstellationsPreview } from './constellations-preview.js?v=constellation-atlas-v2';
import { initLearningPathsPreview } from './learning-paths-preview.js?v=guided-routes-v1';

const boot = () => {
  initNavigation();
  initObserverMode();
  initStellarVisionInfo();
  initTheoryLab();
  initPhilosophyCompass();
  initResonance();
  initContactForm();
  initNotableFiguresPreview();
  initConstellationsPreview();
  initLearningPathsPreview();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
