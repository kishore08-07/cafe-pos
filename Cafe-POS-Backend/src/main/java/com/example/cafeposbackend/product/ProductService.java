package com.example.cafeposbackend.product;

import com.example.cafeposbackend.product.ProductDtos.ProductRequest;
import com.example.cafeposbackend.product.ProductDtos.ProductResponse;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductService {
  ProductResponse create(ProductRequest request);

  ProductResponse getById(Long id);

  Page<ProductResponse> getAll(Pageable pageable, Long categoryId, String search);

  ProductResponse update(Long id, ProductRequest request);

  void delete(Long id);

  List<ProductResponse> getByCategory(Long categoryId);
}
