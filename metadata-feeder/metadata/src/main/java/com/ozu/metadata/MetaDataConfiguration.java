package com.ozu.metadata;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import org.springframework.core.task.TaskExecutor;
@Configuration
public class MetaDataConfiguration {

	@Bean("streamExec")
	public TaskExecutor getStreamExecutor() {
		ThreadPoolTaskExecutor threadPoolTaskExecutor = new ThreadPoolTaskExecutor();
		
		return threadPoolTaskExecutor;
	}
}
