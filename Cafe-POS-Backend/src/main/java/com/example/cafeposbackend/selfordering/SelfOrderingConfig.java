package com.example.cafeposbackend.selfordering;

import com.example.cafeposbackend.common.BaseEntity;
import com.example.cafeposbackend.common.enums.SelfOrderingMode;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "self_ordering_config")
@Getter
@Setter
@NoArgsConstructor
public class SelfOrderingConfig extends BaseEntity {
  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private SelfOrderingMode mode;

  @Column(nullable = false)
  private boolean enabled;

  @Column(name = "background_color")
  private String backgroundColor;

  @Column(name = "background_image_url")
  private String backgroundImageUrl;
}
