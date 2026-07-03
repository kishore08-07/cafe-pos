package com.example.cafeposbackend.customerdisplay;

import com.example.cafeposbackend.customerdisplay.CustomerDisplayDtos.CustomerDisplayState;
import com.example.cafeposbackend.order.Order;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface CustomerDisplayService {
  void pushOrderState(Order order);

  void pushPaymentState(Order order);

  void pushCompletionState(Order order);

  CustomerDisplayState getCurrentState();

  SseEmitter subscribe();
}
