'use strict';

const currentVersion = process.versions.node;
const versionParts = currentVersion.split('.').map(Number);
const major = versionParts[0];
const isSupported = (
  Number.isInteger(major)
  && major === 22
);

if (!isSupported) {
  console.error([
    `Node.js incompatível: v${currentVersion}.`,
    'Este projeto requer Node.js 22.x.',
    'Com NVM for Windows, execute: nvm install 22; nvm use 22',
  ].join('\n'));
  process.exit(1);
}
