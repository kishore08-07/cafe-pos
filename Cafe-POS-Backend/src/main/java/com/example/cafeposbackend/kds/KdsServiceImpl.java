package com.example.cafeposbackend.kds;

import com.example.cafeposbackend.common.enums.KdsItemStatus;
import com.example.cafeposbackend.common.enums.OrderStatus;
import com.example.cafeposbackend.common.exception.ResourceNotFoundException;
import com.example.cafeposbackend.kds.KdsDtos.*;
import com.example.cafeposbackend.order.*;
import java.util.Comparator;
import java.util.List;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class KdsServiceImpl implements KdsService {
  private final OrderRepository orderRepository;
  private final OrderLineRepository lineRepository;
  private final SimpMessagingTemplate messagingTemplate;

  public KdsServiceImpl(
      OrderRepository orderRepository,
      OrderLineRepository lineRepository,
      SimpMessagingTemplate messagingTemplate) {
    this.orderRepository = orderRepository;
    this.lineRepository = lineRepository;
    this.messagingTemplate = messagingTemplate;
  }

  @Override
  public List<KdsTicketResponse> getAll(KdsFilter filter) {
    return orderRepository.findAll().stream()
        .filter(order -> order.getStatus() != OrderStatus.CANCELLED)
        .filter(Order::isSentToKitchen)
        .map(this::map)
        .filter(ticket -> !ticket.items().isEmpty())
        .filter(
            ticket -> filter == null || filter.stage() == null || ticket.stage() == filter.stage())
        .filter(
            ticket ->
                filter == null
                    || filter.product() == null
                    || ticket.items().stream()
                        .anyMatch(
                            item ->
                                item.productName()
                                    .toLowerCase()
                                    .contains(filter.product().toLowerCase())))
        .filter(
            ticket ->
                filter == null
                    || filter.categoryId() == null
                    || lineRepository.findByOrderId(ticket.orderId()).stream()
                        .anyMatch(
                            line ->
                                line.getProduct()
                                    .getCategory()
                                    .getId()
                                    .equals(filter.categoryId())))
        .sorted(Comparator.comparing(KdsTicketResponse::createdAt))
        .toList();
  }

  @Override
  public KdsTicketResponse advanceStage(Long orderId) {
    Order order = findOrder(orderId);
    List<OrderLine> lines = lineRepository.findByOrderId(orderId);
    KdsItemStatus current = stage(lines);
    if (current == KdsItemStatus.COMPLETED) {
      return map(order);
    }
    KdsItemStatus next =
        current == KdsItemStatus.TO_COOK ? KdsItemStatus.PREPARING : KdsItemStatus.COMPLETED;
    lines.forEach(line -> line.setKdsItemStatus(next));
    lineRepository.saveAll(lines);
    KdsTicketResponse response = map(order);
    messagingTemplate.convertAndSend("/topic/kds", response);
    messagingTemplate.convertAndSend("/topic/self-order/" + orderId, response);
    return response;
  }

  @Override
  public KdsTicketResponse markItemDone(Long orderId, Long itemId) {
    OrderLine line =
        lineRepository
            .findById(itemId)
            .filter(item -> item.getOrder().getId().equals(orderId))
            .orElseThrow(() -> new ResourceNotFoundException("KDS item", itemId));
    line.setKdsItemStatus(KdsItemStatus.COMPLETED);
    lineRepository.save(line);
    KdsTicketResponse response = map(findOrder(orderId));
    messagingTemplate.convertAndSend("/topic/kds", response);
    return response;
  }

  @Override
  public void publish(Long orderId) {
    messagingTemplate.convertAndSend("/topic/kds", map(findOrder(orderId)));
  }

  private Order findOrder(Long id) {
    return orderRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Order", id));
  }

  private KdsTicketResponse map(Order order) {
    List<OrderLine> lines =
        lineRepository.findByOrderId(order.getId()).stream()
            .filter(line -> line.getProduct().isShowOnKds())
            .toList();
    return new KdsTicketResponse(
        order.getId(),
        order.getOrderNumber(),
        order.getTable() == null ? null : order.getTable().getTableNumber(),
        order.getEmployee().getId(),
        stage(lines),
        order.getCreatedAt(),
        lines.stream()
            .map(
                line ->
                    new KdsItemResponse(
                        line.getId(),
                        line.getProduct().getId(),
                        line.getProduct().getName(),
                        line.getQuantity(),
                        line.getKdsItemStatus()))
            .toList());
  }

  private KdsItemStatus stage(List<OrderLine> lines) {
    if (lines.isEmpty()
        || lines.stream().allMatch(line -> line.getKdsItemStatus() == KdsItemStatus.COMPLETED)) {
      return KdsItemStatus.COMPLETED;
    }
    if (lines.stream().anyMatch(line -> line.getKdsItemStatus() == KdsItemStatus.PREPARING)) {
      return KdsItemStatus.PREPARING;
    }
    return KdsItemStatus.TO_COOK;
  }
}
