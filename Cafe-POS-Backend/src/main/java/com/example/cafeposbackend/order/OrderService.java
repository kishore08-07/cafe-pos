package com.example.cafeposbackend.order;

import com.example.cafeposbackend.order.OrderDtos.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrderService {
  OrderResponse createOrUpdate(OrderRequest request, Long sessionId, Long tableId);

  OrderResponse getById(Long id);

  Page<OrderResponse> getBySession(OrderFilter filter, Pageable pageable);

  OrderResponse applyDiscount(Long orderId, String couponCode);

  OrderResponse sendToKitchen(Long orderId);

  OrderResponse processPayment(Long orderId, PaymentRequest request);

  void sendReceipt(Long orderId, String email);

  byte[] printReceipt(Long orderId);

  OrderResponse cancelOrder(Long orderId);

  void deleteOrder(Long orderId);
}
