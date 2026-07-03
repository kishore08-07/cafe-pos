package com.example.cafeposbackend.discount;

import com.example.cafeposbackend.common.enums.DiscountType;
import com.example.cafeposbackend.common.exception.BusinessRuleException;
import com.example.cafeposbackend.common.exception.ResourceNotFoundException;
import com.example.cafeposbackend.discount.DiscountDtos.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class DiscountServiceImpl implements CouponService {
  private final CouponRepository couponRepository;

  public DiscountServiceImpl(CouponRepository couponRepository) {
    this.couponRepository = couponRepository;
  }

  @Override
  public CouponResponse create(CouponRequest request) {
    if (couponRepository.findByCode(request.code().trim().toUpperCase()).isPresent()) {
      throw new BusinessRuleException("Coupon code already exists");
    }
    Coupon coupon = new Coupon();
    apply(coupon, request);
    return map(couponRepository.save(coupon));
  }

  @Override
  public List<CouponResponse> getAll() {
    return couponRepository.findAll().stream().map(this::map).toList();
  }

  @Override
  public CouponResponse update(Long id, CouponRequest request) {
    Coupon coupon =
        couponRepository
            .findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Coupon", id));
    apply(coupon, request);
    return map(couponRepository.save(coupon));
  }

  @Override
  public void delete(Long id) {
    couponRepository.deleteById(id);
  }

  @Override
  public DiscountResult validate(String code, BigDecimal orderTotal) {
    Coupon coupon = getEntity(code);
    if (!coupon.isActive()) {
      throw new BusinessRuleException("Coupon is inactive");
    }
    if (coupon.getMinOrderAmount() != null
        && orderTotal.compareTo(coupon.getMinOrderAmount()) < 0) {
      throw new BusinessRuleException(
          "Minimum order amount is " + coupon.getMinOrderAmount().stripTrailingZeros());
    }
    BigDecimal amount = calculate(coupon.getDiscountType(), coupon.getDiscountValue(), orderTotal);
    return new DiscountResult(
        coupon.getId(),
        coupon.getCode(),
        coupon.getDiscountType(),
        coupon.getDiscountValue(),
        amount);
  }

  @Override
  public Coupon getEntity(String code) {
    return couponRepository
        .findByCode(code.trim().toUpperCase())
        .orElseThrow(() -> new BusinessRuleException("Invalid coupon code"));
  }

  private BigDecimal calculate(DiscountType type, BigDecimal value, BigDecimal basis) {
    BigDecimal amount =
        type == DiscountType.PERCENTAGE
            ? basis.multiply(value).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
            : value;
    return amount.min(basis).max(BigDecimal.ZERO);
  }

  private void apply(Coupon coupon, CouponRequest request) {
    coupon.setCode(request.code().trim().toUpperCase());
    coupon.setDiscountType(request.discountType());
    coupon.setDiscountValue(request.discountValue());
    coupon.setMinOrderAmount(request.minOrderAmount());
    coupon.setActive(request.active() == null || request.active());
  }

  private CouponResponse map(Coupon coupon) {
    return new CouponResponse(
        coupon.getId(),
        coupon.getCode(),
        coupon.getDiscountType(),
        coupon.getDiscountValue(),
        coupon.getMinOrderAmount(),
        coupon.isActive());
  }
}
