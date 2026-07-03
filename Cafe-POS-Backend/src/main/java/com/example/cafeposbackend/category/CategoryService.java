package com.example.cafeposbackend.category;

import com.example.cafeposbackend.category.CategoryDtos.CategoryRequest;
import com.example.cafeposbackend.category.CategoryDtos.CategoryResponse;
import java.util.List;

public interface CategoryService {
  CategoryResponse create(CategoryRequest request);

  List<CategoryResponse> getAll();

  CategoryResponse update(Long id, CategoryRequest request);

  void delete(Long id);
}
