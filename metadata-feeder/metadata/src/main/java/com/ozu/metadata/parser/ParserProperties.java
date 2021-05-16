package com.ozu.metadata.parser;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;
import lombok.Setter;

@Configuration
@ConfigurationProperties(prefix = "parser")
@Getter
@Setter
public class ParserProperties {
    private String inputDirectory;
    private List<EventDensity> eventDensities;

    @Getter
    @Setter
    public static class EventDensity {

        private String name;
        private double density;

    }
}
