// 输入金额和返回值均以分计。会员或订单满 100 元包邮，否则运费 8 元。
export function shippingFee(subtotalInCents, isMember = false) {
  return isMember || subtotalInCents >= 10_000 ? 0 : 800;
}
