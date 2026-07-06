package com.example.cafeposbackend.product;

import com.example.cafeposbackend.category.Category;
import com.example.cafeposbackend.category.CategoryRepository;
import com.example.cafeposbackend.common.exception.ResourceNotFoundException;
import com.example.cafeposbackend.product.ProductDtos.ProductRequest;
import com.example.cafeposbackend.product.ProductDtos.ProductResponse;
import com.example.cafeposbackend.tax.Tax;
import com.example.cafeposbackend.tax.TaxRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductServiceImpl implements ProductService {
  private final ProductRepository productRepository;
  private final CategoryRepository categoryRepository;
  private final TaxRepository taxRepository;

  public ProductServiceImpl(
      ProductRepository productRepository,
      CategoryRepository categoryRepository,
      TaxRepository taxRepository) {
    this.productRepository = productRepository;
    this.categoryRepository = categoryRepository;
    this.taxRepository = taxRepository;
  }

  @Override
  @Transactional
  public ProductResponse create(ProductRequest request) {
    Product product = new Product();
    apply(product, request);
    return map(productRepository.save(product));
  }

  @Override
  @Transactional(readOnly = true)
  public ProductResponse getById(Long id) {
    return map(find(id));
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ProductResponse> getAll(Pageable pageable, Long categoryId, String search) {
    List<Product> filtered =
        productRepository.findAll().stream()
            .filter(
                product -> categoryId == null || product.getCategory().getId().equals(categoryId))
            .filter(
                product ->
                    search == null
                        || search.isBlank()
                        || product.getName().toLowerCase().contains(search.toLowerCase()))
            .toList();
    if (pageable.isUnpaged()) {
      return new PageImpl<>(filtered.stream().map(this::map).toList());
    }
    int start = (int) Math.min(pageable.getOffset(), filtered.size());
    int end = Math.min(start + pageable.getPageSize(), filtered.size());
    return new PageImpl<>(
        filtered.subList(start, end).stream().map(this::map).toList(), pageable, filtered.size());
  }

  @Override
  @Transactional
  public ProductResponse update(Long id, ProductRequest request) {
    Product product = find(id);
    apply(product, request);
    return map(productRepository.save(product));
  }

  @Override
  public void delete(Long id) {
    productRepository.delete(find(id));
  }

  @Override
  @Transactional(readOnly = true)
  public List<ProductResponse> getByCategory(Long categoryId) {
    return productRepository.findByCategoryId(categoryId).stream().map(this::map).toList();
  }

  private void apply(Product product, ProductRequest request) {
    Category category =
        categoryRepository
            .findById(request.categoryId())
            .orElseThrow(() -> new ResourceNotFoundException("Category", request.categoryId()));
    Tax tax = resolveTax(request);
    product.setName(request.name().trim());
    product.setCategory(category);
    product.setTax(tax);
    product.setPrice(request.price());
    product.setUnitOfMeasure(request.unitOfMeasure());
    product.setDescription(request.description());
    product.setShowOnKds(request.showOnKds() == null || request.showOnKds());
  }

  private Tax resolveTax(ProductRequest request) {
    if (request.taxId() != null) {
      return taxRepository
          .findById(request.taxId())
          .orElseThrow(() -> new ResourceNotFoundException("Tax", request.taxId()));
    }
    BigDecimal rate = request.taxRate();
    if (rate == null || rate.compareTo(BigDecimal.ZERO) == 0) {
      return null;
    }
    return taxRepository
        .findByRatePercent(rate)
        .orElseGet(
            () -> {
              Tax tax = new Tax();
              tax.setName("Tax " + rate.stripTrailingZeros().toPlainString() + "%");
              tax.setRatePercent(rate);
              return taxRepository.save(tax);
            });
  }

  private Product find(Long id) {
    return productRepository
        .findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Product", id));
  }

  private ProductResponse map(Product product) {
    Tax tax = product.getTax();
    return new ProductResponse(
        product.getId(),
        product.getName(),
        product.getCategory().getId(),
        product.getCategory().getName(),
        product.getCategory().getColorHex(),
        tax == null ? null : tax.getId(),
        tax == null ? null : tax.getRatePercent(),
        product.getPrice(),
        product.getUnitOfMeasure(),
        product.getDescription(),
        product.isShowOnKds());
  }
}
