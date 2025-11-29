package com.jobproj.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {

        registry.addViewController("/auth/login")
                .setViewName("auth/login");

        registry.addViewController("/auth/signup")
                .setViewName("auth/signup");

        // 융합프로젝트 김태형 12주차 : 내 이력서 초안(목록) 페이지
        // templates/resume/Make.html 로 forward
        registry.addViewController("/resume/make")
                .setViewName("resume/Make");

        // 2233076 12주차 추가 : 내정보 페이지
        registry.addViewController("/mypage")
                .setViewName("user_page/mypage");

        // 융합프로젝트 김태형 12주차 : 새 이력서 편집 페이지
        // templates/resume/resume-edit.html 로 forward
        registry.addViewController("/resume/edit")
                .setViewName("resume/resume-edit");

        // 필요 시 /home.html 직접 접근도 열고 싶다면 아래 추가
        // registry.addViewController("/home.html").setViewName("home");
    }
}
