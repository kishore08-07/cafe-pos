package com.example.cafeposbackend.paymentmethod;

import com.example.cafeposbackend.common.enums.PaymentMethodType;
import com.example.cafeposbackend.common.exception.BusinessRuleException;
import com.example.cafeposbackend.common.exception.ResourceNotFoundException;
import com.example.cafeposbackend.common.util.QRCodeUtil;
import com.example.cafeposbackend.paymentmethod.PaymentMethodDtos.PaymentMethodRequest;
import com.example.cafeposbackend.paymentmethod.PaymentMethodDtos.PaymentMethodResponse;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PaymentMethodServiceImpl implements PaymentMethodService {
  private final PaymentMethodRepository repository;
  private final QRCodeUtil qrCodeUtil;

  public PaymentMethodServiceImpl(PaymentMethodRepository repository, QRCodeUtil qrCodeUtil) {
    this.repository = repository;
    this.qrCodeUtil = qrCodeUtil;
  }

  @Override
  public List<PaymentMethodResponse> getAll() {
    return repository.findAll().stream().map(this::map).toList();
  }

  @Override
  public PaymentMethodResponse update(Long id, PaymentMethodRequest request) {
    PaymentMethod method =
        repository
            .findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Payment method", id));
    if (request.enabled() != null) method.setEnabled(request.enabled());
    method.setUpiId(request.upiId());
    if (method.getType() == PaymentMethodType.UPI
        && method.isEnabled()
        && (method.getUpiId() == null || method.getUpiId().isBlank())) {
      throw new BusinessRuleException("UPI ID is required when UPI is enabled");
    }
    return map(repository.save(method));
  }

  @Override
  public String generateUpiQr(String upiId, BigDecimal amount) {
    if (upiId == null || upiId.isBlank() || amount == null || amount.signum() <= 0) {
      throw new BusinessRuleException("Valid UPI ID and positive amount are required");
    }
    String uri =
        "upi://pay?pa="
            + URLEncoder.encode(upiId, StandardCharsets.UTF_8)
            + "&am="
            + amount.toPlainString()
            + "&cu=INR";
    return qrCodeUtil.base64(uri);
  }

  private PaymentMethodResponse map(PaymentMethod method) {
    return new PaymentMethodResponse(
        method.getId(), method.getType(), method.isEnabled(), method.getUpiId());
  }
}
