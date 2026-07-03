package com.example.cafeposbackend.session;

import com.example.cafeposbackend.common.BaseEntity;
import com.example.cafeposbackend.common.enums.SessionStatus;
import com.example.cafeposbackend.identity.AdminUser;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.*;

@Entity
@Table(name = "pos_session")
@Getter
@Setter
@NoArgsConstructor
public class PosSession extends BaseEntity {
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "employee_id", nullable = false)
  private AdminUser employee;

  @Column(name = "opened_at", nullable = false)
  private LocalDateTime openedAt;

  @Column(name = "closed_at")
  private LocalDateTime closedAt;

  @Column(name = "opening_amount", nullable = false, precision = 10, scale = 2)
  private BigDecimal openingAmount;

  @Column(name = "closing_amount", precision = 10, scale = 2)
  private BigDecimal closingAmount;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private SessionStatus status;
}
