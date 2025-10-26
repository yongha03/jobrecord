package com.jobproj.api.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

  @Bean
  public OpenAPI openAPI() {
    final String bearer = "BearerAuth";
    return new OpenAPI()
        .info(new Info().title("JobRecord API").description("이력서/인증/파일 API 문서").version("v1"))
        .addSecurityItem(new SecurityRequirement().addList(bearer))
        .components(
            new Components()
                .addSecuritySchemes(
                    bearer,
                    new SecurityScheme()
                        .name(bearer)
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")));
  }

  // ✅ 1. 인증
  @Bean
  public GroupedOpenApi authGroup() {
    return GroupedOpenApi.builder().group("1. 인증").pathsToMatch("/auth/**").build();
  }

  // ✅ 2. 이력서 (현재 컨트롤러들이 /api로 시작한다고 했으니 /api/**로 포괄)
  @Bean
  public GroupedOpenApi resumeGroup() {
    return GroupedOpenApi.builder().group("2. 이력서").pathsToMatch("/api/**").build();
  }

  // ✅ 3. 파일(첨부)
  @Bean
  public GroupedOpenApi fileGroup() {
    return GroupedOpenApi.builder()
        .group("3. 파일")
        .pathsToMatch("/attachments/**", "/api/attachments/**")
        .build();
  }
}
