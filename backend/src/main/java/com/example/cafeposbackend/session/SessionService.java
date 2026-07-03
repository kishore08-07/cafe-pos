package com.example.cafeposbackend.session;

import com.example.cafeposbackend.session.SessionDtos.*;
import java.math.BigDecimal;
import java.util.List;

public interface SessionService {
  SessionResponse openSession(BigDecimal openingAmount);

  SessionResponse getActive();

  SessionSummaryResponse closeSession(Long sessionId);

  List<SessionResponse> getAll();
}
