package com.example.cafeposbackend.floor;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TableQrCodeRepository extends JpaRepository<TableQrCode, Long> {
  Optional<TableQrCode> findByToken(String token);

  Optional<TableQrCode> findByTableId(Long tableId);
}
