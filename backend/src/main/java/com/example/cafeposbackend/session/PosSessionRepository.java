package com.example.cafeposbackend.session;

import com.example.cafeposbackend.common.enums.SessionStatus;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PosSessionRepository extends JpaRepository<PosSession, Long> {
  Optional<PosSession> findFirstByOrderByOpenedAtDesc();

  Optional<PosSession> findFirstByStatusOrderByOpenedAtDesc(SessionStatus status);
}
