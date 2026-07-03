package com.example.cafeposbackend.reporting;

import com.example.cafeposbackend.order.Order;
import com.example.cafeposbackend.reporting.dto.SummaryProjection;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

public interface OrderReportRepository extends Repository<Order, Long> {
  @Query(
      "SELECT new com.example.cafeposbackend.reporting.dto.SummaryProjection(COUNT(o), COALESCE(SUM(o.totalAmount), 0), COALESCE(AVG(o.totalAmount), 0)) FROM Order o WHERE o.status = com.example.cafeposbackend.common.enums.OrderStatus.PAID AND o.createdAt BETWEEN :from AND :to")
  SummaryProjection getSummary(LocalDateTime from, LocalDateTime to);

  @Query(
      "SELECT p.category.id, p.category.name, SUM(ol.lineTotal) FROM OrderLine ol JOIN ol.product p WHERE ol.order.status = com.example.cafeposbackend.common.enums.OrderStatus.PAID GROUP BY p.category.id,p.category.name ORDER BY SUM(ol.lineTotal) DESC")
  List<Object[]> getTopCategories();

  @Query(
      "SELECT ol.product.id, ol.product.name, SUM(ol.quantity), SUM(ol.lineTotal) FROM OrderLine ol WHERE ol.order.status = com.example.cafeposbackend.common.enums.OrderStatus.PAID GROUP BY ol.product.id,ol.product.name ORDER BY SUM(ol.lineTotal) DESC")
  List<Object[]> getTopProducts();
}
