package com.example.cafeposbackend.selfordering;

import com.example.cafeposbackend.common.response.ApiResponse;
import com.example.cafeposbackend.product.ProductDtos.ProductResponse;
import com.example.cafeposbackend.selfordering.SelfOrderDtos.*;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
public class SelfOrderController {
  private final SelfOrderService service;

  public SelfOrderController(SelfOrderService service) {
    this.service = service;
  }

  @GetMapping("/api/self-order/config")
  ApiResponse<SelfOrderConfigResponse> config() {
    return ApiResponse.success(service.getConfig());
  }

  @PutMapping("/api/self-order/config")
  ApiResponse<SelfOrderConfigResponse> update(@RequestBody SelfOrderConfigRequest request) {
    return ApiResponse.success(service.updateConfig(request));
  }

  @GetMapping("/api/self-order/tables/{id}/qr")
  ApiResponse<String> qr(@PathVariable Long id) {
    return ApiResponse.success(service.generateTableQr(id));
  }

  @GetMapping("/api/self-order/tables/{id}/token")
  ApiResponse<TableTokenResponse> token(@PathVariable Long id) {
    return ApiResponse.success(service.getTableToken(id));
  }

  @GetMapping(
      value = "/api/self-order/tables/{id}/qr/pdf",
      produces = MediaType.APPLICATION_PDF_VALUE)
  ResponseEntity<byte[]> qrPdf(@PathVariable Long id) {
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=table-" + id + "-qr.pdf")
        .body(service.downloadQrPdf(id));
  }

  @GetMapping(value = "/s/{token}", produces = MediaType.TEXT_HTML_VALUE)
  String page(@PathVariable String token) {
    service.resolveToken(token);
    return "<!doctype html><html><body><h1>Cafe Menu</h1><p>Table token: "
        + token
        + "</p></body></html>";
  }

  @GetMapping("/api/self-order/menu/{token}")
  ApiResponse<List<ProductResponse>> menu(@PathVariable String token) {
    return ApiResponse.success(service.getMenu(token));
  }

  @PostMapping("/api/self-order/order/{token}")
  ApiResponse<SelfOrderResponse> order(
      @PathVariable String token, @Valid @RequestBody SelfOrderRequest request) {
    return ApiResponse.success(service.placeOrder(token, request));
  }

  @GetMapping("/api/self-order/order/{orderId}/status")
  ApiResponse<OrderStatusResponse> status(@PathVariable Long orderId) {
    return ApiResponse.success(service.trackOrder(orderId));
  }
}
