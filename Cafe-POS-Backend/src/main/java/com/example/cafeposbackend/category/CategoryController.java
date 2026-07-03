package com.example.cafeposbackend.category;

import com.example.cafeposbackend.category.CategoryDtos.CategoryRequest;
import com.example.cafeposbackend.category.CategoryDtos.CategoryResponse;
import com.example.cafeposbackend.common.response.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {
  private final CategoryService service;

  public CategoryController(CategoryService service) {
    this.service = service;
  }

  @GetMapping
  ApiResponse<List<CategoryResponse>> all() {
    return ApiResponse.success(service.getAll());
  }

  @PostMapping
  ApiResponse<CategoryResponse> create(@Valid @RequestBody CategoryRequest request) {
    return ApiResponse.success(service.create(request));
  }

  @PutMapping("/{id}")
  ApiResponse<CategoryResponse> update(
      @PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
    return ApiResponse.success(service.update(id, request));
  }

  @DeleteMapping("/{id}")
  ApiResponse<Void> delete(@PathVariable Long id) {
    service.delete(id);
    return ApiResponse.ok();
  }
}
