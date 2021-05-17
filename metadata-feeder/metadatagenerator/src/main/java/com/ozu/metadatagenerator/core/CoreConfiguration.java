package com.ozu.metadatagenerator.core;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
public class CoreConfiguration {
    public static final String TASK_EXECUTOR="taskExec";

    @Bean(name = TASK_EXECUTOR)
    public ThreadPoolTaskExecutor getExec(){
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setThreadNamePrefix("Exec-");
        executor.setCorePoolSize(20);
        return executor;
    }
    
}
