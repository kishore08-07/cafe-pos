package com.example.cafeposbackend.order;

import com.example.cafeposbackend.common.enums.KdsItemStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderLineRepository extends JpaRepository<OrderLine, Long> {
  List<OrderLine> findByOrderId(Long orderId);

  List<OrderLine> findByOrderIdAndKdsItemStatusNot(Long orderId, KdsItemStatus status);
}
