package com.example.cafeposbackend.common.exception;

import com.example.cafeposbackend.common.response.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(ResourceNotFoundException.class)
  ResponseEntity<ApiResponse<Void>> notFound(ResourceNotFoundException ex) {
    return error(HttpStatus.NOT_FOUND, "NOT_FOUND", ex.getMessage(), null);
  }

  @ExceptionHandler({MethodArgumentNotValidException.class, ConstraintViolationException.class})
  ResponseEntity<ApiResponse<Void>> validation(Exception ex) {
    Object details = ex.getMessage();
    if (ex instanceof MethodArgumentNotValidException validation) {
      Map<String, String> fields = new LinkedHashMap<>();
      for (FieldError fieldError : validation.getBindingResult().getFieldErrors()) {
        fields.put(fieldError.getField(), fieldError.getDefaultMessage());
      }
      details = fields;
    }
    return error(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Request validation failed", details);
  }

  @ExceptionHandler(AccessDeniedException.class)
  ResponseEntity<ApiResponse<Void>> forbidden(AccessDeniedException ex) {
    return error(HttpStatus.FORBIDDEN, "ACCESS_DENIED", ex.getMessage(), null);
  }

  @ExceptionHandler(BusinessRuleException.class)
  ResponseEntity<ApiResponse<Void>> business(BusinessRuleException ex) {
    // HttpStatus.UNPROCESSABLE_ENTITY is deprecated since Spring 7.0; use numeric value 422
    return error(HttpStatus.valueOf(422), "BUSINESS_RULE", ex.getMessage(), null);
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  ResponseEntity<ApiResponse<Void>> conflict(DataIntegrityViolationException ex) {
    return error(HttpStatus.CONFLICT, "DATA_CONFLICT", "Operation violates data constraints", null);
  }

  @ExceptionHandler(EmailDeliveryException.class)
  ResponseEntity<ApiResponse<Void>> emailDelivery(EmailDeliveryException ex) {
    return error(HttpStatus.SERVICE_UNAVAILABLE, "EMAIL_DELIVERY_FAILED", ex.getMessage(), null);
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<ApiResponse<Void>> unexpected(Exception ex) {
    return error(
        HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "An unexpected error occurred", null);
  }

  private ResponseEntity<ApiResponse<Void>> error(
      HttpStatus status, String code, String message, Object details) {
    return ResponseEntity.status(status).body(ApiResponse.error(code, message, details));
  }
}
