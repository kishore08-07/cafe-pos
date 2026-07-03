package com.example.cafeposbackend.product;

import com.example.cafeposbackend.category.Category;
import com.example.cafeposbackend.common.BaseEntity;
import com.example.cafeposbackend.common.enums.UnitOfMeasure;
import com.example.cafeposbackend.tax.Tax;
import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.*;

@Entity
@Table(name = "product")
@Getter
@Setter
@NoArgsConstructor
public class Product extends BaseEntity {
  @Column(nullable = false)
  private String name;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "category_id", nullable = false)
  private Category category;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "tax_id")
  private Tax tax;

  @Column(nullable = false, precision = 10, scale = 2)
  private BigDecimal price;

  @Enumerated(EnumType.STRING)
  @Column(name = "unit_of_measure", nullable = false)
  private UnitOfMeasure unitOfMeasure;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(name = "show_on_kds", nullable = false)
  private boolean showOnKds = true;
}
