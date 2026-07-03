package com.example.cafeposbackend.customer;

import com.example.cafeposbackend.common.exception.ResourceNotFoundException;
import com.example.cafeposbackend.customer.CustomerDtos.*;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class CustomerServiceImpl implements CustomerService {
  private final CustomerRepository repository;

  public CustomerServiceImpl(CustomerRepository repository) {
    this.repository = repository;
  }

  @Override
  public Page<CustomerResponse> search(String query, Pageable pageable) {
    List<Customer> customers =
        query == null || query.isBlank()
            ? repository.findAll()
            : repository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrPhoneContaining(
                query, query, query);
    int start = (int) Math.min(pageable.getOffset(), customers.size());
    int end = Math.min(start + pageable.getPageSize(), customers.size());
    return new PageImpl<>(
        customers.subList(start, end).stream().map(this::map).toList(), pageable, customers.size());
  }

  @Override
  public CustomerResponse create(CustomerRequest request) {
    Customer customer = new Customer();
    apply(customer, request);
    return map(repository.save(customer));
  }

  @Override
  public CustomerResponse update(Long id, CustomerRequest request) {
    Customer customer = find(id);
    apply(customer, request);
    return map(repository.save(customer));
  }

  @Override
  public void delete(Long id) {
    repository.delete(find(id));
  }

  private void apply(Customer customer, CustomerRequest request) {
    customer.setName(request.name().trim());
    customer.setEmail(request.email());
    customer.setPhone(request.phone());
  }

  private Customer find(Long id) {
    return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Customer", id));
  }

  private CustomerResponse map(Customer customer) {
    return new CustomerResponse(
        customer.getId(), customer.getName(), customer.getEmail(), customer.getPhone());
  }
}
