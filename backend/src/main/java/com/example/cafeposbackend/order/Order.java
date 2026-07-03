package com.example.cafeposbackend.order;

import com.example.cafeposbackend.common.BaseEntity;
import com.example.cafeposbackend.common.enums.OrderStatus;
import com.example.cafeposbackend.customer.Customer;
import com.example.cafeposbackend.discount.Coupon;
import com.example.cafeposbackend.floor.RestaurantTable;
import com.example.cafeposbackend.identity.AdminUser;
import com.example.cafeposbackend.session.PosSession;
import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.*;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
public class Order extends BaseEntity {
  @Column(name = "order_number", nullable = false, unique = true)
  private String orderNumber;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "session_id", nullable = false)
  private PosSession session;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "table_id")
  private RestaurantTable table;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "customer_id")
  private Customer customer;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "employee_id", nullable = false)
  private AdminUser employee;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "coupon_id")
  private Coupon coupon;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private OrderStatus status;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal subtotal = BigDecimal.ZERO;

  @Column(name = "tax_total", nullable = false, precision = 10, scale = 2)
  private BigDecimal taxTotal = BigDecimal.ZERO;

  @Column(name = "discount_total", nullable = false, precision = 10, scale = 2)
  private BigDecimal discountTotal = BigDecimal.ZERO;

  @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
  private BigDecimal totalAmount = BigDecimal.ZERO;

  @Column(name = "sent_to_kitchen", nullable = false)
  private boolean sentToKitchen = false;
}
