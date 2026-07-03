package com.example.cafeposbackend.discount;

import com.example.cafeposbackend.common.response.ApiResponse;
import com.example.cafeposbackend.discount.DiscountDtos.*;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
public class DiscountController {
  private final CouponService couponService;
  private final PromotionService promotionService;

  public DiscountController(CouponService couponService, PromotionService promotionService) {
    this.couponService = couponService;
    this.promotionService = promotionService;
  }

  @GetMapping("/api/coupons")
  ApiResponse<List<CouponResponse>> coupons() {
    return ApiResponse.success(couponService.getAll());
  }

  @PostMapping("/api/coupons")
  ApiResponse<CouponResponse> createCoupon(@Valid @RequestBody CouponRequest request) {
    return ApiResponse.success(couponService.create(request));
  }

  @PutMapping("/api/coupons/{id}")
  ApiResponse<CouponResponse> updateCoupon(
      @PathVariable Long id, @Valid @RequestBody CouponRequest request) {
    return ApiResponse.success(couponService.update(id, request));
  }

  @DeleteMapping("/api/coupons/{id}")
  ApiResponse<Void> deleteCoupon(@PathVariable Long id) {
    couponService.delete(id);
    return ApiResponse.ok();
  }

  @PostMapping("/api/coupons/validate")
  ApiResponse<DiscountResult> validate(@Valid @RequestBody CouponValidationRequest request) {
    return ApiResponse.success(couponService.validate(request.code(), request.orderTotal()));
  }

  @GetMapping("/api/promotions")
  ApiResponse<List<PromotionResponse>> promotions() {
    return ApiResponse.success(promotionService.getAll());
  }

  @PostMapping("/api/promotions")
  ApiResponse<PromotionResponse> createPromotion(@Valid @RequestBody PromotionRequest request) {
    return ApiResponse.success(promotionService.create(request));
  }

  @PutMapping("/api/promotions/{id}")
  ApiResponse<PromotionResponse> updatePromotion(
      @PathVariable Long id, @Valid @RequestBody PromotionRequest request) {
    return ApiResponse.success(promotionService.update(id, request));
  }

  @DeleteMapping("/api/promotions/{id}")
  ApiResponse<Void> deletePromotion(@PathVariable Long id) {
    promotionService.delete(id);
    return ApiResponse.ok();
  }
}
