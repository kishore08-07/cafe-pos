package com.example.cafeposbackend.identity;

import com.example.cafeposbackend.identity.UserDtos.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {
  Page<UserResponse> getAll(Pageable pageable);

  UserResponse create(CreateUserRequest request);

  UserResponse update(Long id, UpdateUserRequest request);

  UserResponse changePassword(Long id, ChangePasswordRequest request);

  UserResponse archive(Long id);

  void delete(Long id);
}
