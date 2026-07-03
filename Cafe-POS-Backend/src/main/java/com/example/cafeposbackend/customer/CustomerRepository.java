package com.example.cafeposbackend.customer;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
  List<Customer> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrPhoneContaining(
      String name, String email, String phone);
}
