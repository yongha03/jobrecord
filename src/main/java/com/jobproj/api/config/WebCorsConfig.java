package com.jobproj.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class WebCorsConfig {

  @Bean
  public CorsFilter createCorsFilter() {
    CorsConfiguration c = new CorsConfiguration();
    c.addAllowedOriginPattern("*"); // 데모용: 모든 출처 허용
    c.addAllowedHeader("*");
    c.addAllowedMethod("*");
    c.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource s = new UrlBasedCorsConfigurationSource();
    s.registerCorsConfiguration("/**", c); // ← named arg 쓰면 안 됨
    return new CorsFilter(s);
  }
}
