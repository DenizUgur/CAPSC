package com.ozu.metadata.core;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
public class CoreConfiguration {
    public static final String STREAM_EXECUTOR="streamExecutor";
    @Bean(STREAM_EXECUTOR)
	public TaskExecutor getStreamExecutor() {
		ThreadPoolTaskExecutor threadPoolTaskExecutor = new ThreadPoolTaskExecutor();
		threadPoolTaskExecutor.setCorePoolSize(20);
        threadPoolTaskExecutor.setThreadNamePrefix("StreamExec-");
		return threadPoolTaskExecutor;
	}

}
