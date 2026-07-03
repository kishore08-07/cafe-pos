package com.example.cafeposbackend.kds;

import com.example.cafeposbackend.kds.KdsDtos.*;
import java.util.List;

public interface KdsService {
  List<KdsTicketResponse> getAll(KdsFilter filter);

  KdsTicketResponse advanceStage(Long orderId);

  KdsTicketResponse markItemDone(Long orderId, Long itemId);

  void publish(Long orderId);
}
