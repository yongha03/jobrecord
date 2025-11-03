package com.jobproj.api.config;

import com.jobproj.api.common.ApiResponse;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice(basePackages = "com.jobproj.api")
public class GlobalExceptionHandler {

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiResponse<Map<String, List<Map<String, String>>>>> handleValidationExceptions(
          MethodArgumentNotValidException e) {

    List<Map<String, String>> fieldErrors = e.getBindingResult().getFieldErrors()
            .stream()
            .map(fieldError -> Map.of(
                    "field", fieldError.getField(),
                    "message", fieldError.getDefaultMessage()
            ))
            .collect(Collectors.toList());

    log.warn("[400] BeanValidation failed: {} errors", fieldErrors.size());

    // 8주차 수정: 1단계에서 추가한 fail() 메서드 사용
    ApiResponse<Map<String, List<Map<String, String>>>> response = ApiResponse.fail(
            "VALIDATION_FAILED", // code
            "입력값 검증에 실패했습니다.", // message
            Map.of("fieldErrors", fieldErrors) // data
    );

    return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
  }

  // 8주차 추가: 인증 실패 (A001) 핸들러
  @ExceptionHandler(AuthenticationException.class)
  public ResponseEntity<ApiResponse<Void>> handleAuthenticationException(AuthenticationException e) {
    log.warn("[401] Authentication failed: {}", e.getMessage());

    ApiResponse<Void> response = ApiResponse.fail(
            "A001", // 8주차 추가
            "인증에 실패했습니다. (토큰이 없거나 유효하지 않습니다)" // 8주차 추가
    );

    return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
  }

  // 8주차 수정: 반환 타입을 ApiResponse<Void>로 통일
  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException e) {
    log.warn("[400] IllegalArgument: {}", e.getMessage());

    ApiResponse<Void> response = ApiResponse.fail("INVALID_ARGUMENT", e.getMessage());
    return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
  }

  // 8주차 수정: 반환 타입을 ApiResponse<Void>로 통일
  @ExceptionHandler(RuntimeException.class)
  public ResponseEntity<ApiResponse<Void>> handleRuntime(RuntimeException e) {
    log.warn("[400] RuntimeException", e);

    ApiResponse<Void> response = ApiResponse.fail("BAD_REQUEST", e.getMessage());
    return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
  }

  // 8주차 수정: 반환 타입을 ApiResponse<Void>로 통일
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<Void>> handleAny(Exception e) {
    log.error("[500] Unhandled Exception", e);

    ApiResponse<Void> response = ApiResponse.fail("SERVER_ERROR", "unexpected_error");
    return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}