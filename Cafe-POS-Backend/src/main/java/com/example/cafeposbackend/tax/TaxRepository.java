package com.example.cafeposbackend.tax;

import java.math.BigDecimal;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaxRepository extends JpaRepository<Tax, Long> {
  Optional<Tax> findByRatePercent(BigDecimal ratePercent);
}
