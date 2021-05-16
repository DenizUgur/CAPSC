package com.ozu.metadata;


import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class MetadataApplication {

	public static void main(String[] args) {
		SpringApplication.run(MetadataApplication.class, args);
	}

}
