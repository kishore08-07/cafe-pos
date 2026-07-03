package com.example.cafeposbackend.floor;

import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {
  List<RestaurantTable> findByFloorId(Long floorId);

  boolean existsByFloorId(Long floorId);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select table from RestaurantTable table where table.id = :id")
  Optional<RestaurantTable> findByIdForUpdate(@Param("id") Long id);
}
