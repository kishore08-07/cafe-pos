package com.example.cafeposbackend.order;

import com.example.cafeposbackend.common.enums.*;
import com.example.cafeposbackend.common.exception.BusinessRuleException;
import com.example.cafeposbackend.common.exception.ResourceNotFoundException;
import com.example.cafeposbackend.common.util.CurrentUser;
import com.example.cafeposbackend.common.util.EmailUtil;
import com.example.cafeposbackend.common.util.PDFUtil;
import com.example.cafeposbackend.customer.Customer;
import com.example.cafeposbackend.customer.CustomerRepository;
import com.example.cafeposbackend.customerdisplay.CustomerDisplayService;
import com.example.cafeposbackend.discount.CouponService;
import com.example.cafeposbackend.discount.DiscountDtos.*;
import com.example.cafeposbackend.discount.PromotionService;
import com.example.cafeposbackend.floor.RestaurantTable;
import com.example.cafeposbackend.floor.RestaurantTableRepository;
import com.example.cafeposbackend.kds.KdsService;
import com.example.cafeposbackend.order.OrderDtos.*;
import com.example.cafeposbackend.payment.Payment;
import com.example.cafeposbackend.payment.PaymentRepository;
import com.example.cafeposbackend.paymentmethod.PaymentMethod;
import com.example.cafeposbackend.paymentmethod.PaymentMethodRepository;
import com.example.cafeposbackend.product.Product;
import com.example.cafeposbackend.product.ProductRepository;
import com.example.cafeposbackend.session.PosSession;
import com.example.cafeposbackend.session.PosSessionRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderServiceImpl implements OrderService {
  private final OrderRepository orderRepository;
  private final OrderLineRepository lineRepository;
  private final ProductRepository productRepository;
  private final PosSessionRepository sessionRepository;
  private final RestaurantTableRepository tableRepository;
  private final CustomerRepository customerRepository;
  private final PaymentMethodRepository paymentMethodRepository;
  private final PaymentRepository paymentRepository;
  private final CouponService couponService;
  private final PromotionService promotionService;
  private final KdsService kdsService;
  private final CustomerDisplayService displayService;
  private final CurrentUser currentUser;
  private final EmailUtil emailUtil;
  private final PDFUtil pdfUtil;

  public OrderServiceImpl(
      OrderRepository orderRepository,
      OrderLineRepository lineRepository,
      ProductRepository productRepository,
      PosSessionRepository sessionRepository,
      RestaurantTableRepository tableRepository,
      CustomerRepository customerRepository,
      PaymentMethodRepository paymentMethodRepository,
      PaymentRepository paymentRepository,
      CouponService couponService,
      PromotionService promotionService,
      KdsService kdsService,
      CustomerDisplayService displayService,
      CurrentUser currentUser,
      EmailUtil emailUtil,
      PDFUtil pdfUtil) {
    this.orderRepository = orderRepository;
    this.lineRepository = lineRepository;
    this.productRepository = productRepository;
    this.sessionRepository = sessionRepository;
    this.tableRepository = tableRepository;
    this.customerRepository = customerRepository;
    this.paymentMethodRepository = paymentMethodRepository;
    this.paymentRepository = paymentRepository;
    this.couponService = couponService;
    this.promotionService = promotionService;
    this.kdsService = kdsService;
    this.displayService = displayService;
    this.currentUser = currentUser;
    this.emailUtil = emailUtil;
    this.pdfUtil = pdfUtil;
  }

  @Override
  @Transactional
  public OrderResponse createOrUpdate(OrderRequest request, Long sessionId, Long tableId) {
    var user = currentUser.require();
    PosSession session =
        sessionRepository
            .findById(sessionId)
            .filter(value -> value.getStatus() == SessionStatus.OPEN)
            .orElseThrow(() -> new BusinessRuleException("An open POS session is required"));
    Order order =
        request.orderId() == null
            ? new Order()
            : orderRepository
                .findById(request.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", request.orderId()));
    if (order.getId() != null && order.getStatus() != OrderStatus.DRAFT) {
      throw new BusinessRuleException("Only draft orders can be edited");
    }
    if (order.getId() != null && !order.getEmployee().getId().equals(user.getId())) {
      throw new BusinessRuleException("Only the serving cashier can edit this order");
    }
    RestaurantTable table = tableId == null ? null : claimTable(tableId, user.getId());
    order.setOrderNumber(
        order.getOrderNumber() == null
            ? "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase()
            : order.getOrderNumber());
    order.setSession(session);
    order.setEmployee(user);
    order.setStatus(OrderStatus.DRAFT);
    order.setTable(table);
    order.setCustomer(request.customerId() == null ? null : findCustomer(request.customerId()));
    order = orderRepository.save(order);

    if (order.getId() != null) {
      lineRepository.deleteAll(lineRepository.findByOrderId(order.getId()));
      lineRepository.flush();
    }
    List<OrderLine> lines = new ArrayList<>();
    BigDecimal subtotal = BigDecimal.ZERO;
    BigDecimal taxTotal = BigDecimal.ZERO;
    for (OrderLineRequest requestedLine : request.lines()) {
      Product product =
          productRepository
              .findById(requestedLine.productId())
              .orElseThrow(
                  () -> new ResourceNotFoundException("Product", requestedLine.productId()));
      BigDecimal lineTotal =
          product.getPrice().multiply(requestedLine.quantity()).setScale(2, RoundingMode.HALF_UP);
      OrderLine line = new OrderLine();
      line.setOrder(order);
      line.setProduct(product);
      line.setQuantity(requestedLine.quantity());
      line.setUnitPrice(product.getPrice());
      line.setLineTotal(lineTotal);
      lines.add(line);
      subtotal = subtotal.add(lineTotal);
      if (product.getTax() != null) {
        taxTotal =
            taxTotal.add(
                lineTotal
                    .multiply(product.getTax().getRatePercent())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
      }
    }
    lineRepository.saveAll(lines);
    recalculateTotals(order, lines);
    order = orderRepository.save(order);
    displayService.pushOrderState(order);
    return map(order);
  }

  @Override
  @Transactional(readOnly = true)
  public OrderResponse getById(Long id) {
    return map(find(id));
  }

  @Override
  @Transactional(readOnly = true)
  public Page<OrderResponse> getBySession(OrderFilter filter, Pageable pageable) {
    List<Order> orders =
        orderRepository.findAll().stream()
            .filter(
                order ->
                    filter.sessionId() == null
                        || order.getSession().getId().equals(filter.sessionId()))
            .filter(order -> filter.status() == null || order.getStatus() == filter.status())
            .filter(
                order ->
                    filter.from() == null
                        || !order.getCreatedAt().toLocalDate().isBefore(filter.from()))
            .filter(
                order ->
                    filter.to() == null || !order.getCreatedAt().toLocalDate().isAfter(filter.to()))
            .toList();
    int start = (int) Math.min(pageable.getOffset(), orders.size());
    int end = Math.min(start + pageable.getPageSize(), orders.size());
    return new PageImpl<>(
        orders.subList(start, end).stream().map(this::map).toList(), pageable, orders.size());
  }

  @Override
  @Transactional
  public OrderResponse applyDiscount(Long orderId, String couponCode) {
    Order order = requireDraft(orderId);
    couponService.validate(couponCode, order.getSubtotal());
    order.setCoupon(couponService.getEntity(couponCode));
    recalculateTotals(order, lineRepository.findByOrderId(orderId));
    return map(orderRepository.save(order));
  }

  @Override
  @Transactional
  public OrderResponse sendToKitchen(Long orderId) {
    Order order = requireDraft(orderId);
    if (order.isSentToKitchen()) {
      throw new BusinessRuleException("Order has already been sent to the kitchen");
    }
    order.setSentToKitchen(true);
    order = orderRepository.save(order);
    kdsService.publish(orderId);
    return map(order);
  }

  @Override
  @Transactional
  public OrderResponse processPayment(Long orderId, PaymentRequest request) {
    Order order = requireDraft(orderId);
    PaymentMethod method =
        paymentMethodRepository
            .findById(request.paymentMethodId())
            .filter(PaymentMethod::isEnabled)
            .orElseThrow(() -> new BusinessRuleException("Payment method is not enabled"));
    boolean publishToKitchen = !order.isSentToKitchen();
    if (publishToKitchen) {
      order.setSentToKitchen(true);
    }
    Payment payment = new Payment();
    payment.setOrder(order);
    payment.setPaymentMethod(method);
    payment.setAmount(request.amount());
    payment.setReferenceNumber(request.referenceNumber());
    payment.setStatus(PaymentStatus.CONFIRMED);
    payment.setPaidAt(LocalDateTime.now());
    paymentRepository.save(payment);
    BigDecimal paid =
        paymentRepository.findByOrderId(orderId).stream()
            .filter(value -> value.getStatus() == PaymentStatus.CONFIRMED)
            .map(Payment::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    if (paid.compareTo(order.getTotalAmount()) >= 0) {
      order.setStatus(OrderStatus.PAID);
      order = orderRepository.save(order);
      displayService.pushCompletionState(order);
    } else {
      displayService.pushPaymentState(order);
    }
    if (publishToKitchen) {
      kdsService.publish(orderId);
    }
    return map(order);
  }

  @Override
  @Transactional(readOnly = true)
  public void sendReceipt(Long orderId, String email) {
    OrderResponse order = getById(orderId);
    if (order.status() != OrderStatus.PAID) {
      throw new BusinessRuleException("A receipt can only be emailed for a paid order");
    }
    emailUtil.sendReceipt(
        email.trim().toLowerCase(),
        "Receipt " + order.orderNumber() + " - Cafe Etoile",
        receiptText(order),
        receiptPdf(order),
        "receipt-" + order.orderNumber() + ".pdf");
  }

  @Override
  @Transactional(readOnly = true)
  public byte[] printReceipt(Long orderId) {
    OrderResponse order = getById(orderId);
    return receiptPdf(order);
  }

  @Override
  @Transactional
  public OrderResponse cancelOrder(Long orderId) {
    Order order = requireDraft(orderId);
    order.setStatus(OrderStatus.CANCELLED);
    return map(orderRepository.save(order));
  }

  @Override
  @Transactional
  public void deleteOrder(Long orderId) {
    Order order = requireDraft(orderId);
    paymentRepository.deleteAll(paymentRepository.findByOrderId(orderId));
    lineRepository.deleteAll(lineRepository.findByOrderId(orderId));
    orderRepository.delete(order);
  }

  private String receiptText(OrderResponse order) {
    List<String> lines = new ArrayList<>();
    lines.add("Cafe Etoile");
    lines.add("Receipt for order " + order.orderNumber());
    lines.add("");
    order
        .lines()
        .forEach(
            line ->
                lines.add(
                    line.productName()
                        + " x "
                        + line.quantity().stripTrailingZeros().toPlainString()
                        + " - INR "
                        + line.lineTotal()));
    lines.add("");
    lines.add("Subtotal: INR " + order.subtotal());
    lines.add("Tax: INR " + order.taxTotal());
    lines.add("Discount: INR " + order.discountTotal());
    lines.add("Total paid: INR " + order.totalAmount());
    lines.add("");
    lines.add("Thank you for visiting Cafe Etoile.");
    lines.add("A PDF copy of this receipt is attached.");
    return String.join("\n", lines);
  }

  private byte[] receiptPdf(OrderResponse order) {
    List<String> lines = new ArrayList<>();
    lines.add("Order: " + order.orderNumber());
    lines.add("Date: " + order.createdAt());
    lines.add("");
    order
        .lines()
        .forEach(
            line ->
                lines.add(
                    line.productName()
                        + " x "
                        + line.quantity().stripTrailingZeros().toPlainString()
                        + " - INR "
                        + line.lineTotal()));
    lines.add("");
    lines.add("Subtotal: INR " + order.subtotal());
    lines.add("Tax: INR " + order.taxTotal());
    lines.add("Discount: INR " + order.discountTotal());
    lines.add("Total: INR " + order.totalAmount());
    lines.add("Status: " + order.status());
    return pdfUtil.document("Cafe Etoile Receipt", lines);
  }

  private Order requireDraft(Long id) {
    Order order = find(id);
    if (order.getStatus() != OrderStatus.DRAFT) {
      throw new BusinessRuleException("Order must be in DRAFT status");
    }
    return order;
  }

  private Order find(Long id) {
    return orderRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Order", id));
  }

  private RestaurantTable findTable(Long id) {
    return tableRepository
        .findById(id)
        .filter(RestaurantTable::isActive)
        .orElseThrow(() -> new ResourceNotFoundException("Active table", id));
  }

  private RestaurantTable claimTable(Long id, Long userId) {
    RestaurantTable table =
        tableRepository
            .findByIdForUpdate(id)
            .filter(RestaurantTable::isActive)
            .orElseThrow(() -> new ResourceNotFoundException("Active table", id));
    if (table.getOccupiedBy() != null && !table.getOccupiedBy().getId().equals(userId)) {
      throw new BusinessRuleException(
          "Table "
              + table.getTableNumber()
              + " is currently served by "
              + table.getOccupiedBy().getName());
    }
    if (table.getOccupiedBy() == null) {
      table.setOccupiedBy(currentUser.require());
      tableRepository.save(table);
    }
    return table;
  }

  private Customer findCustomer(Long id) {
    return customerRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
  }

  private OrderResponse map(Order order) {
    return new OrderResponse(
        order.getId(),
        order.getOrderNumber(),
        order.getSession().getId(),
        order.getTable() == null ? null : order.getTable().getId(),
        order.getCustomer() == null ? null : order.getCustomer().getId(),
        order.getEmployee().getId(),
        order.getStatus(),
        order.isSentToKitchen(),
        order.getSubtotal(),
        order.getTaxTotal(),
        order.getDiscountTotal(),
        order.getTotalAmount(),
        order.getCreatedAt(),
        lineRepository.findByOrderId(order.getId()).stream()
            .map(
                line ->
                    new OrderLineResponse(
                        line.getId(),
                        line.getProduct().getId(),
                        line.getProduct().getName(),
                        line.getQuantity(),
                        line.getUnitPrice(),
                        line.getDiscountAmount(),
                        line.getLineTotal(),
                        line.getKdsItemStatus()))
            .toList(),
        paymentRepository.findByOrderId(order.getId()).stream()
            .map(
                payment ->
                    new PaymentResponse(
                        payment.getId(),
                        payment.getPaymentMethod().getId(),
                        payment.getAmount(),
                        payment.getReferenceNumber(),
                        payment.getStatus(),
                        payment.getPaidAt()))
            .toList());
  }

  private void recalculateTotals(Order order, List<OrderLine> lines) {
    BigDecimal subtotal =
        lines.stream().map(OrderLine::getLineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);

    BigDecimal grossTaxTotal = BigDecimal.ZERO;
    for (OrderLine line : lines) {
      if (line.getProduct().getTax() != null) {
        grossTaxTotal =
            grossTaxTotal.add(
                line.getLineTotal()
                    .multiply(line.getProduct().getTax().getRatePercent())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
      }
    }

    EvaluationContext context =
        new EvaluationContext(
            lines.stream()
                .map(
                    line ->
                        new CartItem(
                            line.getProduct().getId(), line.getQuantity(), line.getLineTotal()))
                .toList(),
            subtotal);

    BigDecimal promotionDiscount =
        promotionService.evaluate(context).stream()
            .map(DiscountResult::amount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    BigDecimal couponDiscount = BigDecimal.ZERO;
    if (order.getCoupon() != null) {
      try {
        DiscountResult couponResult = couponService.validate(order.getCoupon().getCode(), subtotal);
        couponDiscount = couponResult.amount();
      } catch (Exception e) {
        order.setCoupon(null);
      }
    }

    BigDecimal totalDiscount = promotionDiscount.add(couponDiscount).min(subtotal);

    BigDecimal taxTotal;
    if (subtotal.compareTo(BigDecimal.ZERO) > 0) {
      BigDecimal netSubtotal = subtotal.subtract(totalDiscount).max(BigDecimal.ZERO);
      taxTotal = grossTaxTotal.multiply(netSubtotal).divide(subtotal, 2, RoundingMode.HALF_UP);
    } else {
      taxTotal = BigDecimal.ZERO;
    }

    order.setSubtotal(subtotal);
    order.setTaxTotal(taxTotal);
    order.setDiscountTotal(totalDiscount);
    order.setTotalAmount(subtotal.add(taxTotal).subtract(totalDiscount).max(BigDecimal.ZERO));
  }
}
