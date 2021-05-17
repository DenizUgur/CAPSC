package com.ozu.metadatagenerator;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Future;

import com.ozu.metadatagenerator.core.CoreProperties;
import com.ozu.metadatagenerator.core.CoreService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.scheduling.annotation.EnableAsync;

import lombok.extern.slf4j.Slf4j;

@SpringBootApplication
@Slf4j
@EnableAsync
public class MetadatageneratorApplication implements CommandLineRunner{

	@Autowired
	CoreProperties coreProperties;
	@Autowired
	CoreService coreService;
	@Autowired
	ApplicationContext applicationContext;
	public static void main(String[] args) {
		SpringApplication.run(MetadatageneratorApplication.class, args);
	}

	@Override
	public void run(String... args) throws Exception {
		log.info("System parameters: \n"+coreProperties.toString());
		int worstCaseTotalTime = 0 ;
        for (Map.Entry<String,CoreProperties.Event> event : coreProperties.getEvents().entrySet()) {
			worstCaseTotalTime += event.getValue().getMaxLength()*event.getValue().getMaxCount();
		}
		log.info("Worst case total event length: " + worstCaseTotalTime);
		if(worstCaseTotalTime>coreProperties.getMatchLength()){
			log.error("Worst case (sum of max length* max count) cannot be greater than match length");
		}else{
			List<Future> futures = new ArrayList<>();
			for (int i = 1; i <= coreProperties.getMatchCount() ; i++) {
				futures.add(coreService.generateMetadata(String.valueOf(i)));
			}
			for (Future future : futures) {
				future.get();
			}
		}


		((ConfigurableApplicationContext) applicationContext).close();


	}

}
