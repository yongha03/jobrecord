package com.jobproj.api.config;

import com.jobproj.api.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

  private final JwtAuthenticationFilter jwtAuthenticationFilter;

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .cors(cors -> {})
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            // 공통 정적 리소스 핸들러 (META-INF/resources, /resources, /static, /public, /webjars)
            .requestMatchers(PathRequest.toStaticResources().atCommonLocations()).permitAll()

            // 명시적 정적 경로 허용 (이미지 401 방지)
            .requestMatchers("/css/**", "/js/**", "/img/**", "/images/**",
                             "/webjars/**", "/favicon.ico").permitAll()

            // 템플릿 라우트
            .requestMatchers("/", "/home", "/home.html", "/error").permitAll()
            .requestMatchers("/auth/**").permitAll()

            // Swagger 경로 (application.yml의 커스텀 경로 기준)
            .requestMatchers("/api-docs/**", "/docs/**").permitAll()

            // Actuator
            .requestMatchers("/api/actuator/**", "/actuator/**").permitAll()

            // Preflight
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

            // 나머지 보호
            .anyRequest().authenticated()
        )
        .exceptionHandling(ex -> ex
            .authenticationEntryPoint((req, res, e) -> {
              res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
              res.setContentType("application/json;charset=UTF-8");
              res.getWriter().write("{\"errorCode\":\"A001\",\"message\":\"인증이 필요합니다.\",\"status\":401}");
            })
            .accessDeniedHandler((req, res, e) -> {
              res.setStatus(HttpServletResponse.SC_FORBIDDEN);
              res.setContentType("application/json;charset=UTF-8");
              res.getWriter().write("{\"errorCode\":\"A002\",\"message\":\"권한이 없습니다.\",\"status\":403}");
            })
        )
        // JWT 필터 (UsernamePasswordAuthenticationFilter 앞)
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }

  /** 쿠키/도메인 분리 환경용 CORS (동일 도메인만 쓰면 사실 불필요) */
  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(List.of(
        "http://localhost:3000", "http://127.0.0.1:3000",
        "http://localhost:5173", "http://127.0.0.1:5173"
        // 동일 도메인(8080)에서만 쓰면 위 리스트는 안 써도 됨
    ));
    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    cfg.setAllowedHeaders(List.of("Authorization","Content-Type","X-Requested-With","Accept","Origin","Cache-Control","Pragma"));
    cfg.setExposedHeaders(List.of("Content-Disposition"));
    cfg.setAllowCredentials(true);
    cfg.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", cfg);
    return source;
  }
}
