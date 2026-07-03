package com.example.cafeposbackend.order;

import com.example.cafeposbackend.common.enums.OrderStatus;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
  List<Order> findBySessionId(Long sessionId);

  List<Order> findBySessionIdAndStatus(Long sessionId, OrderStatus status);

  Optional<Order> findByOrderNumber(String orderNumber);
}
