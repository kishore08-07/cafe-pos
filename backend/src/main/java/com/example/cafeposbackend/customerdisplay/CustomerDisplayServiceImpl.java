package com.example.cafeposbackend.customerdisplay;

import com.example.cafeposbackend.common.enums.PaymentMethodType;
import com.example.cafeposbackend.common.exception.ResourceNotFoundException;
import com.example.cafeposbackend.common.util.QRCodeUtil;
import com.example.cafeposbackend.customerdisplay.CustomerDisplayDtos.CustomerDisplayLine;
import com.example.cafeposbackend.customerdisplay.CustomerDisplayDtos.CustomerDisplayState;
import com.example.cafeposbackend.order.Order;
import com.example.cafeposbackend.order.OrderLineRepository;
import com.example.cafeposbackend.order.OrderRepository;
import com.example.cafeposbackend.paymentmethod.PaymentMethod;
import com.example.cafeposbackend.paymentmethod.PaymentMethodRepository;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicReference;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class CustomerDisplayServiceImpl implements CustomerDisplayService {
  private final OrderRepository orderRepository;
  private final OrderLineRepository lineRepository;
  private final PaymentMethodRepository paymentMethodRepository;
  private final QRCodeUtil qrCodeUtil;
  private final AtomicReference<CustomerDisplayState> state =
      new AtomicReference<>(CustomerDisplayState.empty());
  private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

  public CustomerDisplayServiceImpl(
      OrderRepository orderRepository,
      OrderLineRepository lineRepository,
      PaymentMethodRepository paymentMethodRepository,
      QRCodeUtil qrCodeUtil) {
    this.orderRepository = orderRepository;
    this.lineRepository = lineRepository;
    this.paymentMethodRepository = paymentMethodRepository;
    this.qrCodeUtil = qrCodeUtil;
  }

  @Override
  public void pushOrderState(Order order) {
    push(order, null, "Order updated");
  }

  @Override
  public void pushPaymentState(Order order, PaymentMethod paymentMethod) {
    push(order, paymentMethod, "Awaiting payment");
  }

  @Override
  public void pushCompletionState(Order order, PaymentMethod paymentMethod) {
    push(order, paymentMethod, "Payment complete. Thank you!");
  }

  @Override
  public void previewPaymentState(Long orderId, Long paymentMethodId) {
    Order order =
        orderRepository
            .findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
    PaymentMethod paymentMethod =
        paymentMethodRepository
            .findById(paymentMethodId)
            .orElseThrow(() -> new ResourceNotFoundException("Payment method", paymentMethodId));
    push(order, paymentMethod, "Ready for payment");
  }

  @Override
  public CustomerDisplayState getCurrentState() {
    return state.get();
  }

  @Override
  public SseEmitter subscribe() {
    SseEmitter emitter = new SseEmitter(0L);
    emitters.add(emitter);
    emitter.onCompletion(() -> emitters.remove(emitter));
    emitter.onTimeout(() -> emitters.remove(emitter));
    send(emitter, state.get());
    return emitter;
  }

  private void push(Order order, PaymentMethod paymentMethod, String message) {
    List<CustomerDisplayLine> lines =
        lineRepository.findByOrderId(order.getId()).stream()
            .map(
                line ->
                    new CustomerDisplayLine(
                        line.getId(),
                        line.getProduct().getName(),
                        line.getQuantity(),
                        line.getUnitPrice(),
                        line.getLineTotal()))
            .toList();
    String upiQrCode =
        paymentMethod != null
                && paymentMethod.getType() == PaymentMethodType.UPI
                && paymentMethod.getUpiId() != null
                && !paymentMethod.getUpiId().isBlank()
            ? qrCodeUtil.base64(
                "upi://pay?pa="
                    + URLEncoder.encode(paymentMethod.getUpiId().trim(), StandardCharsets.UTF_8)
                    + "&am="
                    + order.getTotalAmount().toPlainString()
                    + "&cu=INR")
            : null;
    CustomerDisplayState next =
        new CustomerDisplayState(
            order.getId(),
            order.getOrderNumber(),
            order.getStatus(),
            lines,
            order.getSubtotal(),
            order.getTaxTotal(),
            order.getDiscountTotal(),
            order.getTotalAmount(),
            paymentMethod == null ? null : paymentMethod.getType().name(),
            upiQrCode,
            message,
            Instant.now());
    state.set(next);
    emitters.forEach(emitter -> send(emitter, next));
  }

  private void send(SseEmitter emitter, CustomerDisplayState value) {
    try {
      emitter.send(SseEmitter.event().name("state").data(value));
    } catch (IOException ex) {
      emitter.complete();
      emitters.remove(emitter);
    }
  }
}
