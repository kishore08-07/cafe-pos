package com.example.cafeposbackend.identity;

import com.example.cafeposbackend.common.response.ApiResponse;
import com.example.cafeposbackend.identity.UserDtos.*;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
  private final UserService service;

  public UserController(UserService service) {
    this.service = service;
  }

  @GetMapping
  ApiResponse<Page<UserResponse>> all(Pageable pageable) {
    return ApiResponse.success(service.getAll(pageable));
  }

  @PostMapping
  ApiResponse<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
    return ApiResponse.success(service.create(request));
  }

  @PutMapping("/{id}")
  ApiResponse<UserResponse> update(
      @PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
    return ApiResponse.success(service.update(id, request));
  }

  @PutMapping("/{id}/password")
  ApiResponse<UserResponse> password(
      @PathVariable Long id, @Valid @RequestBody ChangePasswordRequest request) {
    return ApiResponse.success(service.changePassword(id, request));
  }

  @PutMapping("/{id}/archive")
  ApiResponse<UserResponse> archive(@PathVariable Long id) {
    return ApiResponse.success(service.archive(id));
  }

  @DeleteMapping("/{id}")
  ApiResponse<Void> delete(@PathVariable Long id) {
    service.delete(id);
    return ApiResponse.ok();
  }
}
