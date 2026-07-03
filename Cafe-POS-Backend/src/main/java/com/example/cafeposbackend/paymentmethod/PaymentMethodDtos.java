package com.example.cafeposbackend.paymentmethod;

import com.example.cafeposbackend.common.enums.PaymentMethodType;

public final class PaymentMethodDtos {
  private PaymentMethodDtos() {}

  public record PaymentMethodRequest(Boolean enabled, String upiId) {}

  public record PaymentMethodResponse(
      Long id, PaymentMethodType type, boolean enabled, String upiId) {}
}
