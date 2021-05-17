package com.ozu.metadatagenerator.core;

import java.util.Map;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@ToString
@Configuration
@ConfigurationProperties(prefix = "core")
@Getter
@Setter
public class CoreProperties {
    
    private Map<String,Event> events;
    private int matchCount;
    private int matchLength;
    private String outputDir;

    @Getter
    @Setter
    @ToString
    public static class Event {

        private String name;
        private int maxCount;
        private int minCount;
        private int maxLength;
        private int minLength;
    }

}
