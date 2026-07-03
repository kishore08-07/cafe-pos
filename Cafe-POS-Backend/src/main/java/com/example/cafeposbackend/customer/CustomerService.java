package com.example.cafeposbackend.customer;

import com.example.cafeposbackend.customer.CustomerDtos.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CustomerService {
  Page<CustomerResponse> search(String query, Pageable pageable);

  CustomerResponse create(CustomerRequest request);

  CustomerResponse update(Long id, CustomerRequest request);

  void delete(Long id);
}
