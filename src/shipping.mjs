// 输入和返回值均以分计。订单满 100 元包邮，否则运费 8 元。
export function shippingFee(subtotalInCents) {
  return subtotalInCents >= 10_000 ? 0 : 800;
}
