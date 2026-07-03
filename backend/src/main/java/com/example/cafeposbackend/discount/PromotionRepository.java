package com.example.cafeposbackend.discount;

import com.example.cafeposbackend.common.enums.PromotionAppliesTo;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {
  List<Promotion> findByAppliesTo(PromotionAppliesTo appliesTo);

  List<Promotion> findByProductId(Long productId);
}
