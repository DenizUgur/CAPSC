package com.ozu.metadata.core;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;
import lombok.Setter;

@Configuration
@ConfigurationProperties(prefix = "core")
@Getter
@Setter
public class CoreProperties {
    private Long streamInterval;
    private Double streamDefaultDensity;
    private String eventName;
    
}
