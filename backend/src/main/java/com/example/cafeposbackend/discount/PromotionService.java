package com.example.cafeposbackend.discount;

import com.example.cafeposbackend.discount.DiscountDtos.*;
import java.util.List;

public interface PromotionService {
  PromotionResponse create(PromotionRequest request);

  List<PromotionResponse> getAll();

  PromotionResponse update(Long id, PromotionRequest request);

  void delete(Long id);

  List<DiscountResult> evaluate(EvaluationContext context);
}
