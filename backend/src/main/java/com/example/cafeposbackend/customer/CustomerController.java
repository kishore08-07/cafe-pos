package com.example.cafeposbackend.customer;

import com.example.cafeposbackend.common.response.ApiResponse;
import com.example.cafeposbackend.customer.CustomerDtos.*;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {
  private final CustomerService service;

  public CustomerController(CustomerService service) {
    this.service = service;
  }

  @GetMapping
  ApiResponse<Page<CustomerResponse>> search(
      @RequestParam(required = false) String query, Pageable pageable) {
    return ApiResponse.success(service.search(query, pageable));
  }

  @PostMapping
  ApiResponse<CustomerResponse> create(@Valid @RequestBody CustomerRequest request) {
    return ApiResponse.success(service.create(request));
  }

  @PutMapping("/{id}")
  ApiResponse<CustomerResponse> update(
      @PathVariable Long id, @Valid @RequestBody CustomerRequest request) {
    return ApiResponse.success(service.update(id, request));
  }

  @DeleteMapping("/{id}")
  ApiResponse<Void> delete(@PathVariable Long id) {
    service.delete(id);
    return ApiResponse.ok();
  }
}
