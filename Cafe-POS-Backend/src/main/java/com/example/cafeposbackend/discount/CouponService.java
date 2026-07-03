package com.example.cafeposbackend.discount;

import com.example.cafeposbackend.discount.DiscountDtos.*;
import java.math.BigDecimal;
import java.util.List;

public interface CouponService {
  CouponResponse create(CouponRequest request);

  List<CouponResponse> getAll();

  CouponResponse update(Long id, CouponRequest request);

  void delete(Long id);

  DiscountResult validate(String code, BigDecimal orderTotal);

  Coupon getEntity(String code);
}
