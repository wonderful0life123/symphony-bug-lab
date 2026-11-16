import assert from 'node:assert/strict';
import test from 'node:test';
import { shippingFee } from '../src/shipping.mjs';

test('99.99 元收取 8 元运费', () => {
  assert.equal(shippingFee(9_999), 800);
});

test('恰好 100 元免运费', () => {
  assert.equal(shippingFee(10_000), 0);
});

test('100.01 元免运费', () => {
  assert.equal(shippingFee(10_001), 0);
});
