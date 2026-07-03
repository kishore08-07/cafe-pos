package com.example.cafeposbackend.floor;

import com.example.cafeposbackend.floor.FloorDtos.*;
import java.util.List;

public interface FloorService {
  FloorResponse create(FloorRequest request);

  List<FloorResponse> getAll();

  FloorResponse update(Long id, FloorRequest request);

  void delete(Long id);

  TableResponse createTable(Long floorId, TableRequest request);

  List<TableResponse> getTables(Long floorId);

  TableResponse updateTable(Long id, TableRequest request);

  void deleteTable(Long id);

  TableStatusResponse getTableStatus(Long id);

  TableResponse claimTable(Long id);

  TableResponse releaseTable(Long id);
}
