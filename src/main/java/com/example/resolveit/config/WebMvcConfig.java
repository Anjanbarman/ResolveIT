package com.example.resolveit.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.lang.NonNull;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // Serve uploaded complaint files under /api/files/complaints/** via local
        // folder uploads/complaints
        Path uploadDir = Paths.get("uploads/complaints").toAbsolutePath().normalize();
        String location = "file:" + uploadDir.toString() + "/"; // trailing slash is important

        registry.addResourceHandler("/api/files/complaints/**")
                .addResourceLocations(location);
    }
}
