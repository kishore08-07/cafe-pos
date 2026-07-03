package com.example.cafeposbackend.session;

import com.example.cafeposbackend.common.response.ApiResponse;
import com.example.cafeposbackend.session.SessionDtos.*;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {
  private final SessionService service;

  public SessionController(SessionService service) {
    this.service = service;
  }

  @GetMapping("/active")
  ApiResponse<SessionResponse> active() {
    return ApiResponse.success(service.getActive());
  }

  @PostMapping("/open")
  ApiResponse<SessionResponse> open(@RequestBody(required = false) OpenSessionRequest request) {
    BigDecimal amount = request == null ? BigDecimal.ZERO : request.openingAmount();
    return ApiResponse.success(service.openSession(amount));
  }

  @PostMapping("/{id}/close")
  ApiResponse<SessionSummaryResponse> close(@PathVariable Long id) {
    return ApiResponse.success(service.closeSession(id));
  }

  @GetMapping
  ApiResponse<List<SessionResponse>> all() {
    return ApiResponse.success(service.getAll());
  }
}
