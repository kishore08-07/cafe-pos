package com.example.cafeposbackend.selfordering;

import com.example.cafeposbackend.product.ProductDtos.ProductResponse;
import com.example.cafeposbackend.selfordering.SelfOrderDtos.*;
import java.util.List;

public interface SelfOrderService {
  SelfOrderConfigResponse getConfig();

  SelfOrderConfigResponse updateConfig(SelfOrderConfigRequest request);

  String generateTableQr(Long tableId);

  byte[] downloadQrPdf(Long tableId);

  TableTokenResponse getTableToken(Long tableId);

  TableTokenResponse resolveToken(String token);

  List<ProductResponse> getMenu(String token);

  SelfOrderResponse placeOrder(String token, SelfOrderRequest request);

  OrderStatusResponse trackOrder(Long orderId);
}
