package com.example.cafeposbackend.paymentmethod;

import com.example.cafeposbackend.common.response.ApiResponse;
import com.example.cafeposbackend.paymentmethod.PaymentMethodDtos.PaymentMethodRequest;
import com.example.cafeposbackend.paymentmethod.PaymentMethodDtos.PaymentMethodResponse;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment-methods")
public class PaymentMethodController {
  private final PaymentMethodService service;

  public PaymentMethodController(PaymentMethodService service) {
    this.service = service;
  }

  @GetMapping
  ApiResponse<List<PaymentMethodResponse>> all() {
    return ApiResponse.success(service.getAll());
  }

  @PutMapping("/{id}")
  ApiResponse<PaymentMethodResponse> update(
      @PathVariable Long id, @RequestBody PaymentMethodRequest request) {
    return ApiResponse.success(service.update(id, request));
  }

  @GetMapping("/upi/qr")
  ApiResponse<String> qr(@RequestParam String upiId, @RequestParam BigDecimal amount) {
    return ApiResponse.success(service.generateUpiQr(upiId, amount));
  }
}
