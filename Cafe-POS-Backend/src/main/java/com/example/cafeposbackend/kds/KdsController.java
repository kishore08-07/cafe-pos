package com.example.cafeposbackend.kds;

import com.example.cafeposbackend.common.enums.KdsItemStatus;
import com.example.cafeposbackend.common.response.ApiResponse;
import com.example.cafeposbackend.kds.KdsDtos.*;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/kds/tickets")
public class KdsController {
  private final KdsService service;

  public KdsController(KdsService service) {
    this.service = service;
  }

  @GetMapping
  ApiResponse<List<KdsTicketResponse>> all(
      @RequestParam(required = false) KdsItemStatus stage,
      @RequestParam(required = false) String product,
      @RequestParam(required = false) Long categoryId) {
    return ApiResponse.success(service.getAll(new KdsFilter(stage, product, categoryId)));
  }

  @PutMapping("/{orderId}/advance")
  ApiResponse<KdsTicketResponse> advance(@PathVariable Long orderId) {
    return ApiResponse.success(service.advanceStage(orderId));
  }

  @PutMapping("/{orderId}/items/{itemId}/done")
  ApiResponse<KdsTicketResponse> done(@PathVariable Long orderId, @PathVariable Long itemId) {
    return ApiResponse.success(service.markItemDone(orderId, itemId));
  }
}
