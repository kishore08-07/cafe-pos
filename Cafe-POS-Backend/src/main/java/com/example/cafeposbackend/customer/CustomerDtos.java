package com.example.cafeposbackend.customer;

import jakarta.validation.constraints.NotBlank;

public final class CustomerDtos {
  private CustomerDtos() {}

  public record CustomerRequest(@NotBlank String name, String email, String phone) {}

  public record CustomerResponse(Long id, String name, String email, String phone) {}
}
