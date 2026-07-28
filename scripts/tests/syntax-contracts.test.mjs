import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateCssText } from '../check-syntax.mjs';

test('gate CSS aceita blocos, strings e comentários bem formados', () => {
  assert.equal(
    validateCssText('.card { content: "}"; background: url("data:image/svg+xml,{x}"); } /* ok */'),
    '',
  );
});

test('gate CSS acusa chaves, strings e comentários não encerrados', () => {
  assert.match(validateCssText('.card { color: red;'), /bloco/);
  assert.match(validateCssText('.card { content: "x; }'), /string/);
  assert.match(validateCssText('.card { color: red; } /*'), /comentário/);
  assert.match(validateCssText('.card }'), /sem abertura/);
});
