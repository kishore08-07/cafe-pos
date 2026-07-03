package com.example.cafeposbackend.common.response;

import java.time.Instant;

public record ApiResponse<T>(boolean success, T data, ApiError error, Instant timestamp) {
  public static <T> ApiResponse<T> success(T data) {
    return new ApiResponse<>(true, data, null, Instant.now());
  }

  public static ApiResponse<Void> ok() {
    return success(null);
  }

  public static ApiResponse<Void> error(String code, String message, Object details) {
    return new ApiResponse<>(false, null, new ApiError(code, message, details), Instant.now());
  }

  public record ApiError(String code, String message, Object details) {}
}
