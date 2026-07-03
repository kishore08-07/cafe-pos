package com.example.cafeposbackend.common.config;

import com.example.cafeposbackend.common.enums.DiscountType;
import com.example.cafeposbackend.common.enums.PaymentMethodType;
import com.example.cafeposbackend.discount.Coupon;
import com.example.cafeposbackend.discount.CouponRepository;
import com.example.cafeposbackend.paymentmethod.PaymentMethod;
import com.example.cafeposbackend.paymentmethod.PaymentMethodRepository;
import java.math.BigDecimal;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements ApplicationRunner {
  private final PaymentMethodRepository paymentMethodRepository;
  private final CouponRepository couponRepository;

  public DataInitializer(
      PaymentMethodRepository paymentMethodRepository, CouponRepository couponRepository) {
    this.paymentMethodRepository = paymentMethodRepository;
    this.couponRepository = couponRepository;
  }

  @Override
  public void run(ApplicationArguments args) {
    for (PaymentMethodType type : PaymentMethodType.values()) {
      paymentMethodRepository
          .findByType(type)
          .orElseGet(
              () -> {
                PaymentMethod method = new PaymentMethod();
                method.setType(type);
                method.setEnabled(type == PaymentMethodType.CASH);
                return paymentMethodRepository.save(method);
              });
    }

    couponRepository
        .findByCode("WELCOME10")
        .orElseGet(
            () -> {
              Coupon coupon = new Coupon();
              coupon.setCode("WELCOME10");
              coupon.setDiscountType(DiscountType.PERCENTAGE);
              coupon.setDiscountValue(BigDecimal.TEN);
              coupon.setMinOrderAmount(BigDecimal.ZERO);
              coupon.setActive(true);
              return couponRepository.save(coupon);
            });
  }
}
