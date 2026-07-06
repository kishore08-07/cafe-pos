package com.example.cafeposbackend.identity;

import com.example.cafeposbackend.common.enums.Role;
import com.example.cafeposbackend.common.exception.BusinessRuleException;
import com.example.cafeposbackend.common.exception.ResourceNotFoundException;
import com.example.cafeposbackend.identity.UserDtos.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {
  private final AdminUserRepository repository;
  private final PasswordEncoder passwordEncoder;

  public UserServiceImpl(AdminUserRepository repository, PasswordEncoder passwordEncoder) {
    this.repository = repository;
    this.passwordEncoder = passwordEncoder;
  }

  @Override
  public Page<UserResponse> getAll(Pageable pageable) {
    return repository.findAll(pageable).map(this::map);
  }

  @Override
  public UserResponse create(CreateUserRequest request) {
    if (repository.existsByEmail(request.email().trim().toLowerCase())) {
      throw new BusinessRuleException("Email is already registered");
    }
    AdminUser user = new AdminUser();
    user.setName(request.name().trim());
    user.setEmail(request.email().trim().toLowerCase());
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user.setRole(request.role());
    return map(repository.save(user));
  }

  @Override
  public UserResponse update(Long id, UpdateUserRequest request) {
    AdminUser user = find(id);
    String email = request.email().trim().toLowerCase();
    repository
        .findByEmail(email)
        .filter(existing -> !existing.getId().equals(id))
        .ifPresent(
            existing -> {
              throw new BusinessRuleException("Email is already registered");
            });
    guardLastActiveAdmin(user, request.role(), request.active());
    user.setName(request.name().trim());
    user.setEmail(email);
    user.setRole(request.role());
    user.setActive(request.active());
    return map(repository.save(user));
  }

  @Override
  public UserResponse changePassword(Long id, ChangePasswordRequest request) {
    AdminUser user = find(id);
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    return map(repository.save(user));
  }

  @Override
  public UserResponse archive(Long id) {
    AdminUser user = find(id);
    if (user.isActive()) {
      guardLastActiveAdmin(user, user.getRole(), false);
    }
    user.setActive(!user.isActive());
    return map(repository.save(user));
  }

  @Override
  public void delete(Long id) {
    AdminUser user = find(id);
    if (user.isActive()) {
      guardLastActiveAdmin(user, user.getRole(), false);
    }
    repository.delete(user);
  }

  private AdminUser find(Long id) {
    return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User", id));
  }

  private UserResponse map(AdminUser user) {
    return new UserResponse(
        user.getId(), user.getName(), user.getEmail(), user.getRole(), user.isActive());
  }

  private void guardLastActiveAdmin(AdminUser user, Role nextRole, boolean nextActive) {
    boolean remainsActiveAdmin = nextActive && nextRole == Role.ADMIN;
    if (user.getRole() != Role.ADMIN || !user.isActive() || remainsActiveAdmin) {
      return;
    }
    long activeAdmins =
        repository.findByActiveTrue().stream()
            .filter(value -> value.getRole() == Role.ADMIN)
            .count();
    if (activeAdmins <= 1) {
      throw new BusinessRuleException("At least one active admin must remain in the system");
    }
  }
}
