package com.example.cafeposbackend.customerdisplay;

import com.example.cafeposbackend.customerdisplay.CustomerDisplayDtos.CustomerDisplayState;
import com.example.cafeposbackend.order.Order;
import java.io.IOException;
import java.time.Instant;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicReference;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class CustomerDisplayServiceImpl implements CustomerDisplayService {
  private final AtomicReference<CustomerDisplayState> state =
      new AtomicReference<>(CustomerDisplayState.empty());
  private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

  @Override
  public void pushOrderState(Order order) {
    push(order, "Order updated");
  }

  @Override
  public void pushPaymentState(Order order) {
    push(order, "Awaiting payment");
  }

  @Override
  public void pushCompletionState(Order order) {
    push(order, "Payment complete. Thank you!");
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

  private void push(Order order, String message) {
    CustomerDisplayState next =
        new CustomerDisplayState(
            order.getId(),
            order.getOrderNumber(),
            order.getStatus(),
            order.getTotalAmount(),
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
