package com.example.cafeposbackend.session;

import com.example.cafeposbackend.common.enums.OrderStatus;
import com.example.cafeposbackend.common.enums.SessionStatus;
import com.example.cafeposbackend.common.exception.BusinessRuleException;
import com.example.cafeposbackend.common.exception.ResourceNotFoundException;
import com.example.cafeposbackend.common.util.CurrentUser;
import com.example.cafeposbackend.order.Order;
import com.example.cafeposbackend.order.OrderRepository;
import com.example.cafeposbackend.session.SessionDtos.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SessionServiceImpl implements SessionService {
  private final PosSessionRepository repository;
  private final OrderRepository orderRepository;
  private final CurrentUser currentUser;

  public SessionServiceImpl(
      PosSessionRepository repository, OrderRepository orderRepository, CurrentUser currentUser) {
    this.repository = repository;
    this.orderRepository = orderRepository;
    this.currentUser = currentUser;
  }

  @Override
  public SessionResponse openSession(BigDecimal openingAmount) {
    if (repository.findFirstByStatusOrderByOpenedAtDesc(SessionStatus.OPEN).isPresent()) {
      throw new BusinessRuleException("A POS session is already open");
    }
    PosSession session = new PosSession();
    session.setEmployee(currentUser.require());
    session.setOpenedAt(LocalDateTime.now());
    session.setOpeningAmount(openingAmount == null ? BigDecimal.ZERO : openingAmount);
    session.setStatus(SessionStatus.OPEN);
    return map(repository.save(session));
  }

  @Override
  public SessionResponse getActive() {
    return repository
        .findFirstByStatusOrderByOpenedAtDesc(SessionStatus.OPEN)
        .map(this::map)
        .orElseThrow(() -> new BusinessRuleException("No open POS session"));
  }

  @Override
  public SessionSummaryResponse closeSession(Long sessionId) {
    PosSession session = find(sessionId);
    if (session.getStatus() != SessionStatus.OPEN) {
      throw new BusinessRuleException("Session is already closed");
    }
    long openOrdersCount =
        orderRepository.findAll().stream()
            .filter(order -> order.getSession().getId().equals(sessionId))
            .filter(order -> order.getStatus() == OrderStatus.DRAFT)
            .count();
    if (openOrdersCount > 0) {
      throw new BusinessRuleException(
          "Cannot close session: There are " + openOrdersCount + " open draft order(s)");
    }
    List<Order> paid = orderRepository.findBySessionIdAndStatus(sessionId, OrderStatus.PAID);
    BigDecimal revenue =
        paid.stream().map(Order::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    session.setClosedAt(LocalDateTime.now());
    session.setClosingAmount(session.getOpeningAmount().add(revenue));
    session.setStatus(SessionStatus.CLOSED);
    SessionResponse response = map(repository.save(session));
    return new SessionSummaryResponse(
        response, paid.size(), revenue, session.getOpeningAmount().add(revenue));
  }

  @Override
  public List<SessionResponse> getAll() {
    return repository.findAll().stream().map(this::map).toList();
  }

  private PosSession find(Long id) {
    return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Session", id));
  }

  private SessionResponse map(PosSession session) {
    return new SessionResponse(
        session.getId(),
        session.getEmployee().getId(),
        session.getEmployee().getName(),
        session.getOpenedAt(),
        session.getClosedAt(),
        session.getOpeningAmount(),
        session.getClosingAmount(),
        session.getStatus());
  }
}
