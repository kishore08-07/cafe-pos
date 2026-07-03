package com.example.cafeposbackend.product;

import com.example.cafeposbackend.common.response.ApiResponse;
import com.example.cafeposbackend.product.ProductDtos.ProductRequest;
import com.example.cafeposbackend.product.ProductDtos.ProductResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
public class ProductController {
  private final ProductService service;

  public ProductController(ProductService service) {
    this.service = service;
  }

  @GetMapping
  ApiResponse<Page<ProductResponse>> all(
      Pageable pageable,
      @RequestParam(required = false) Long categoryId,
      @RequestParam(required = false) String search) {
    return ApiResponse.success(service.getAll(pageable, categoryId, search));
  }

  @GetMapping("/{id}")
  ApiResponse<ProductResponse> one(@PathVariable Long id) {
    return ApiResponse.success(service.getById(id));
  }

  @PostMapping
  ApiResponse<ProductResponse> create(@Valid @RequestBody ProductRequest request) {
    return ApiResponse.success(service.create(request));
  }

  @PutMapping("/{id}")
  ApiResponse<ProductResponse> update(
      @PathVariable Long id, @Valid @RequestBody ProductRequest request) {
    return ApiResponse.success(service.update(id, request));
  }

  @DeleteMapping("/{id}")
  ApiResponse<Void> delete(@PathVariable Long id) {
    service.delete(id);
    return ApiResponse.ok();
  }
}
