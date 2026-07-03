package com.example.cafeposbackend.category;

import com.example.cafeposbackend.category.CategoryDtos.CategoryRequest;
import com.example.cafeposbackend.category.CategoryDtos.CategoryResponse;
import com.example.cafeposbackend.common.exception.BusinessRuleException;
import com.example.cafeposbackend.common.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryServiceImpl implements CategoryService {
  private final CategoryRepository repository;

  public CategoryServiceImpl(CategoryRepository repository) {
    this.repository = repository;
  }

  @Override
  public CategoryResponse create(CategoryRequest request) {
    if (repository.existsByNameIgnoreCase(request.name())) {
      throw new BusinessRuleException("Category name already exists");
    }
    Category category = new Category();
    apply(category, request);
    return map(repository.save(category));
  }

  @Override
  public List<CategoryResponse> getAll() {
    return repository.findAll().stream().map(this::map).toList();
  }

  @Override
  @Transactional
  public CategoryResponse update(Long id, CategoryRequest request) {
    Category category = find(id);
    apply(category, request);
    return map(repository.save(category));
  }

  @Override
  public void delete(Long id) {
    repository.delete(find(id));
  }

  private void apply(Category category, CategoryRequest request) {
    category.setName(request.name().trim());
    category.setColorHex(request.colorHex().trim());
  }

  private Category find(Long id) {
    return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Category", id));
  }

  private CategoryResponse map(Category category) {
    return new CategoryResponse(category.getId(), category.getName(), category.getColorHex());
  }
}
