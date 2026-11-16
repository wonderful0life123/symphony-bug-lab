import assert from 'node:assert/strict';
import test from 'node:test';
import { amountUntilFreeShipping, shippingFee } from '../src/shipping.mjs';

test('会员购买 50 元商品免运费', () => {
  assert.equal(shippingFee(5_000, true), 0);
});

test('普通用户购买 50 元商品收取 8 元运费', () => {
  assert.equal(shippingFee(5_000, false), 800);
});

test('未指定会员身份时，50 元订单收取 8 元运费', () => {
  assert.equal(shippingFee(5_000), 800);
});

test('99.99 元收取 8 元运费', () => {
  assert.equal(shippingFee(9_999), 800);
});

test('恰好 100 元免运费', () => {
  assert.equal(shippingFee(10_000), 0);
});

test('100.01 元免运费', () => {
  assert.equal(shippingFee(10_001), 0);
});

test('普通用户购买 80 元商品还差 20 元包邮', () => {
  assert.equal(amountUntilFreeShipping(8_000, false), 2_000);
});

test('未指定会员身份时，80 元订单还差 20 元包邮', () => {
  assert.equal(amountUntilFreeShipping(8_000), 2_000);
});

test('普通用户购物金额为 0 元时还差 100 元包邮', () => {
  assert.equal(amountUntilFreeShipping(0), 10_000);
});

test('普通用户购买 99.99 元商品还差 1 分包邮', () => {
  assert.equal(amountUntilFreeShipping(9_999), 1);
});

test('普通用户购买恰好 100 元商品时包邮差额为 0', () => {
  assert.equal(amountUntilFreeShipping(10_000), 0);
});

test('普通用户购买超过 100 元商品时包邮差额为 0', () => {
  assert.equal(amountUntilFreeShipping(10_001), 0);
});

for (const subtotalInCents of [0, 8_000, 10_000, 10_001]) {
  test(`会员购物金额为 ${subtotalInCents} 分时包邮差额为 0`, () => {
    assert.equal(amountUntilFreeShipping(subtotalInCents, true), 0);
  });
}
