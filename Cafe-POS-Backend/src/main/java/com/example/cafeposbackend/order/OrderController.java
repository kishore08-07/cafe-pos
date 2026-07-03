package com.example.cafeposbackend.order;

import com.example.cafeposbackend.common.enums.OrderStatus;
import com.example.cafeposbackend.common.response.ApiResponse;
import com.example.cafeposbackend.order.OrderDtos.*;
import jakarta.validation.Valid;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
  private final OrderService service;

  public OrderController(OrderService service) {
    this.service = service;
  }

  @GetMapping
  ApiResponse<Page<OrderResponse>> all(
      @RequestParam(required = false) Long sessionId,
      @RequestParam(required = false) OrderStatus status,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
      Pageable pageable) {
    return ApiResponse.success(
        service.getBySession(new OrderFilter(sessionId, status, from, to), pageable));
  }

  @GetMapping("/{id}")
  ApiResponse<OrderResponse> one(@PathVariable Long id) {
    return ApiResponse.success(service.getById(id));
  }

  @PostMapping
  ApiResponse<OrderResponse> save(
      @Valid @RequestBody OrderRequest request,
      @RequestParam Long sessionId,
      @RequestParam(required = false) Long tableId) {
    return ApiResponse.success(service.createOrUpdate(request, sessionId, tableId));
  }

  @PutMapping("/{id}/discount")
  ApiResponse<OrderResponse> discount(
      @PathVariable Long id, @Valid @RequestBody DiscountRequest request) {
    return ApiResponse.success(service.applyDiscount(id, request.couponCode()));
  }

  @PostMapping("/{id}/send-kitchen")
  ApiResponse<OrderResponse> kitchen(@PathVariable Long id) {
    return ApiResponse.success(service.sendToKitchen(id));
  }

  @PostMapping("/{id}/payment")
  ApiResponse<OrderResponse> payment(
      @PathVariable Long id, @Valid @RequestBody PaymentRequest request) {
    return ApiResponse.success(service.processPayment(id, request));
  }

  @PostMapping("/{id}/receipt/email")
  ApiResponse<Void> email(@PathVariable Long id, @Valid @RequestBody ReceiptEmailRequest request) {
    service.sendReceipt(id, request.email());
    return ApiResponse.ok();
  }

  @PostMapping(value = "/{id}/receipt/print", produces = MediaType.APPLICATION_PDF_VALUE)
  ResponseEntity<byte[]> receipt(@PathVariable Long id) {
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=receipt-" + id + ".pdf")
        .body(service.printReceipt(id));
  }

  @PutMapping("/{id}/cancel")
  ApiResponse<OrderResponse> cancel(@PathVariable Long id) {
    return ApiResponse.success(service.cancelOrder(id));
  }

  @DeleteMapping("/{id}")
  ApiResponse<Void> delete(@PathVariable Long id) {
    service.deleteOrder(id);
    return ApiResponse.ok();
  }
}
