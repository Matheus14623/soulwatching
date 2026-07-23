'use strict';

const currentVersion = process.versions.node;
const versionParts = currentVersion.split('.').map(Number);
const major = versionParts[0];
const minor = versionParts[1];
const isSupported = (
  Number.isInteger(major)
  && Number.isInteger(minor)
  && (major > 18 || (major === 18 && minor >= 17))
  && major < 25
);

if (!isSupported) {
  console.error([
    `Node.js incompatível: v${currentVersion}.`,
    'Este projeto requer Node.js >=18.17 <25 e recomenda Node.js 22.',
    'Com NVM for Windows, execute: nvm install 22; nvm use 22',
  ].join('\n'));
  process.exit(1);
}
