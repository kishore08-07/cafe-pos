package com.example.cafeposbackend.discount;

import com.example.cafeposbackend.common.enums.DiscountType;
import com.example.cafeposbackend.common.enums.PromotionAppliesTo;
import com.example.cafeposbackend.common.exception.ResourceNotFoundException;
import com.example.cafeposbackend.discount.DiscountDtos.*;
import com.example.cafeposbackend.product.ProductRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PromotionServiceImpl implements PromotionService {
  private final PromotionRepository promotionRepository;
  private final ProductRepository productRepository;

  public PromotionServiceImpl(
      PromotionRepository promotionRepository, ProductRepository productRepository) {
    this.promotionRepository = promotionRepository;
    this.productRepository = productRepository;
  }

  @Override
  public PromotionResponse create(PromotionRequest request) {
    Promotion promotion = new Promotion();
    apply(promotion, request);
    return map(promotionRepository.save(promotion));
  }

  @Override
  public List<PromotionResponse> getAll() {
    return promotionRepository.findAll().stream().map(this::map).toList();
  }

  @Override
  public PromotionResponse update(Long id, PromotionRequest request) {
    Promotion promotion =
        promotionRepository
            .findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Promotion", id));
    apply(promotion, request);
    return map(promotionRepository.save(promotion));
  }

  @Override
  public void delete(Long id) {
    promotionRepository.deleteById(id);
  }

  @Override
  public List<DiscountResult> evaluate(EvaluationContext context) {
    return promotionRepository.findAll().stream()
        .filter(Promotion::isActive)
        .filter(promotion -> applies(promotion, context))
        .map(promotion -> result(promotion, context))
        .toList();
  }

  private DiscountResult result(Promotion promotion, EvaluationContext context) {
    BigDecimal basis =
        promotion.getAppliesTo() == PromotionAppliesTo.ORDER
            ? context.subtotal()
            : context.items().stream()
                .filter(item -> item.productId().equals(promotion.getProduct().getId()))
                .map(CartItem::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal amount =
        promotion.getDiscountType() == DiscountType.PERCENTAGE
            ? basis
                .multiply(promotion.getDiscountValue())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
            : promotion.getDiscountValue();
    return new DiscountResult(
        promotion.getId(),
        promotion.getName(),
        promotion.getDiscountType(),
        promotion.getDiscountValue(),
        amount.min(basis).max(BigDecimal.ZERO));
  }

  private boolean applies(Promotion promotion, EvaluationContext context) {
    if (promotion.getAppliesTo() == PromotionAppliesTo.ORDER) {
      return promotion.getMinOrderAmount() == null
          || context.subtotal().compareTo(promotion.getMinOrderAmount()) >= 0;
    }
    return promotion.getProduct() != null
        && context.items().stream()
            .filter(item -> item.productId().equals(promotion.getProduct().getId()))
            .anyMatch(
                item ->
                    promotion.getMinQuantity() == null
                        || item.quantity().compareTo(BigDecimal.valueOf(promotion.getMinQuantity()))
                            >= 0);
  }

  private void apply(Promotion promotion, PromotionRequest request) {
    promotion.setName(request.name().trim());
    promotion.setAppliesTo(request.appliesTo());
    promotion.setProduct(
        request.productId() == null
            ? null
            : productRepository
                .findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", request.productId())));
    promotion.setMinQuantity(request.minQuantity());
    promotion.setMinOrderAmount(request.minOrderAmount());
    promotion.setDiscountType(request.discountType());
    promotion.setDiscountValue(request.discountValue());
    promotion.setActive(request.active() == null || request.active());
  }

  private PromotionResponse map(Promotion promotion) {
    return new PromotionResponse(
        promotion.getId(),
        promotion.getName(),
        promotion.getAppliesTo(),
        promotion.getProduct() == null ? null : promotion.getProduct().getId(),
        promotion.getMinQuantity(),
        promotion.getMinOrderAmount(),
        promotion.getDiscountType(),
        promotion.getDiscountValue(),
        promotion.isActive());
  }
}
