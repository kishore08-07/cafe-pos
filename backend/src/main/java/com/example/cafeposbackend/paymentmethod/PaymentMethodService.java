package com.example.cafeposbackend.paymentmethod;

import com.example.cafeposbackend.paymentmethod.PaymentMethodDtos.PaymentMethodRequest;
import com.example.cafeposbackend.paymentmethod.PaymentMethodDtos.PaymentMethodResponse;
import java.math.BigDecimal;
import java.util.List;

public interface PaymentMethodService {
  List<PaymentMethodResponse> getAll();

  PaymentMethodResponse update(Long id, PaymentMethodRequest request);

  String generateUpiQr(String upiId, BigDecimal amount);
}
