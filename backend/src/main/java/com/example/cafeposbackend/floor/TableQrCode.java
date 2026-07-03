package com.example.cafeposbackend.floor;

import com.example.cafeposbackend.common.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "table_qr_code")
@Getter
@Setter
@NoArgsConstructor
public class TableQrCode extends BaseEntity {
  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "table_id", nullable = false, unique = true)
  private RestaurantTable table;

  @Column(nullable = false, unique = true)
  private String token;

  @Column(name = "qr_image_url")
  private String qrImageUrl;
}
