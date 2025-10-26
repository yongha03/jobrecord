package com.jobproj.api.service;

import com.jobproj.api.domain.Role;
import com.jobproj.api.dto.LoginResponse;
import com.jobproj.api.repo.UserRepo;
import com.jobproj.api.repo.UserRepo.UserRow;
import com.jobproj.api.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

  private final UserRepo userRepo;
  private final PasswordEncoder passwordEncoder;
  private final JwtTokenProvider jwtTokenProvider;

  /** 로그인 */
  public LoginResponse login(String email, String password) {
    // 1) 사용자 조회
    UserRow user =
        userRepo.findByEmail(email).orElseThrow(() -> new RuntimeException("가입되지 않은 이메일입니다."));

    // 2) 비밀번호 검증
    if (!passwordEncoder.matches(password, user.pwdHash)) {
      throw new RuntimeException("비밀번호가 일치하지 않습니다.");
    }

    // 3) 토큰 생성
    String token = jwtTokenProvider.createToken(user);

    // 4) 응답 DTO 반환 (accessToken, tokenType=Bearer, expiresIn)
    long expiresIn = 3_600_000L; // 1시간(ms) — JwtTokenProvider에 TTL 메서드가 있으면 그걸로 교체
    return LoginResponse.of(token, expiresIn);
  }

  /** 회원가입 */
  public void signup(String email, String rawPassword, String name) {
    // 1) 이메일 중복 체크
    if (userRepo.existsByEmail(email)) {
      throw new RuntimeException("이미 사용 중인 이메일입니다.");
    }

    // 2) 비밀번호 암호화
    String encodedPassword = passwordEncoder.encode(rawPassword);

    // 3) 기본 역할
    Role role = Role.USER;

    // 4) 저장
    userRepo.save(email, encodedPassword, name, role);
  }
}
