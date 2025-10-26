package com.jobproj.api.security;

import com.jobproj.api.repo.UserRepo;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Base64;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class JwtTokenProvider {
  private final SecretKey key;
  private final long validityInMilliseconds;

  public JwtTokenProvider(
      @Value("${jwt.secret-key}") String secretKey,
      @Value("${jwt.expiration-ms}") long validityInMilliseconds) {
    byte[] keyBytes = Base64.getDecoder().decode(secretKey);
    this.key = Keys.hmacShaKeyFor(keyBytes);
    this.validityInMilliseconds = validityInMilliseconds;
  }

  public String createToken(UserRepo.UserRow user) {

    Date now = new Date();
    Date validity = new Date(now.getTime() + validityInMilliseconds);

    return Jwts.builder()
        .subject(user.email)
        .claim("name", user.name)
        .claim("role", user.role.name())
        .issuedAt(now)
        .expiration(validity)
        .signWith(key)
        .compact();
  }

  public String resolveToken(HttpServletRequest request) {
    String bearerToken = request.getHeader("Authorization");
    // "Bearer "로 시작하고, 그 뒤에 토큰 문자열이 있는지 확인
    if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
      return bearerToken.substring(7); // "Bearer " (7글자) 이후의 토큰 반환
    }
    return null;
  }

  public boolean validateToken(String token) {
    try {
      Jws<Claims> claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
      // 만료 시간이 현재 시간보다 이전인지 확인
      return !claims.getPayload().getExpiration().before(new Date());
    } catch (JwtException | IllegalArgumentException e) {
      // (로그) e.printStackTrace();
      // 유효하지 않은 토큰 (만료, 위조, 형식 오류 등)
      return false;
    }
  }

  public String getEmail(String token) {
    return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().getSubject();
  }
}
