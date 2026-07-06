package com.example.cafeposbackend.customerdisplay;

import com.example.cafeposbackend.customerdisplay.CustomerDisplayDtos.CustomerDisplayState;
import com.example.cafeposbackend.order.Order;
import com.example.cafeposbackend.paymentmethod.PaymentMethod;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface CustomerDisplayService {
  void pushOrderState(Order order);

  void pushPaymentState(Order order, PaymentMethod paymentMethod);

  void pushCompletionState(Order order, PaymentMethod paymentMethod);

  void previewPaymentState(Long orderId, Long paymentMethodId);

  CustomerDisplayState getCurrentState();

  SseEmitter subscribe();
}
