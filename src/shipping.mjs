const FREE_SHIPPING_THRESHOLD_IN_CENTS = 10_000;

// 输入金额和返回值均以分计。会员或订单满 100 元包邮，否则运费 8 元。
export function shippingFee(subtotalInCents, isMember = false) {
  return isMember || subtotalInCents >= FREE_SHIPPING_THRESHOLD_IN_CENTS ? 0 : 800;
}

// 返回距离包邮还差的金额（分）；会员或已达到门槛时返回 0。
export function amountUntilFreeShipping(subtotalInCents, isMember = false) {
  if (isMember) {
    return 0;
  }

  return Math.max(0, FREE_SHIPPING_THRESHOLD_IN_CENTS - subtotalInCents);
}
