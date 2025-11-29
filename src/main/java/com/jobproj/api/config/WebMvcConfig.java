package com.jobproj.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/auth/login").setViewName("auth/login");
        registry.addViewController("/Make").setViewName("resume/Make");
        registry.addViewController("/auth/signup").setViewName("auth/signup");
        // 2233076 12주차 추가 : 내정보 페이지
        registry.addViewController("/mypage").setViewName("user_page/mypage");
        // 융합프로젝틑 김태형 12주차 : 새 이력서 편집 페이지
        registry.addViewController("/resume/edit").setViewName("resume/resume-edit");

        // 필요 시 /home.html 직접 접근도 열고 싶다면 아래 추가
        // registry.addViewController("/home.html").setViewName("home");
    }
}
