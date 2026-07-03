package com.example.cafeposbackend.floor;

import com.example.cafeposbackend.common.response.ApiResponse;
import com.example.cafeposbackend.floor.FloorDtos.*;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
public class FloorController {
  private final FloorService service;

  public FloorController(FloorService service) {
    this.service = service;
  }

  @GetMapping("/api/floors")
  ApiResponse<List<FloorResponse>> floors() {
    return ApiResponse.success(service.getAll());
  }

  @PostMapping("/api/floors")
  ApiResponse<FloorResponse> createFloor(@Valid @RequestBody FloorRequest request) {
    return ApiResponse.success(service.create(request));
  }

  @PutMapping("/api/floors/{id}")
  ApiResponse<FloorResponse> updateFloor(
      @PathVariable Long id, @Valid @RequestBody FloorRequest request) {
    return ApiResponse.success(service.update(id, request));
  }

  @DeleteMapping("/api/floors/{id}")
  ApiResponse<Void> deleteFloor(@PathVariable Long id) {
    service.delete(id);
    return ApiResponse.ok();
  }

  @GetMapping("/api/floors/{floorId}/tables")
  ApiResponse<List<TableResponse>> tables(@PathVariable Long floorId) {
    return ApiResponse.success(service.getTables(floorId));
  }

  @PostMapping("/api/floors/{floorId}/tables")
  ApiResponse<TableResponse> createTable(
      @PathVariable Long floorId, @Valid @RequestBody TableRequest request) {
    return ApiResponse.success(service.createTable(floorId, request));
  }

  @PutMapping("/api/tables/{id}")
  ApiResponse<TableResponse> updateTable(
      @PathVariable Long id, @Valid @RequestBody TableRequest request) {
    return ApiResponse.success(service.updateTable(id, request));
  }

  @DeleteMapping("/api/tables/{id}")
  ApiResponse<Void> deleteTable(@PathVariable Long id) {
    service.deleteTable(id);
    return ApiResponse.ok();
  }

  @GetMapping("/api/tables/{id}/status")
  ApiResponse<TableStatusResponse> status(@PathVariable Long id) {
    return ApiResponse.success(service.getTableStatus(id));
  }

  @PostMapping("/api/tables/{id}/claim")
  ApiResponse<TableResponse> claim(@PathVariable Long id) {
    return ApiResponse.success(service.claimTable(id));
  }

  @PostMapping("/api/tables/{id}/release")
  ApiResponse<TableResponse> release(@PathVariable Long id) {
    return ApiResponse.success(service.releaseTable(id));
  }
}
