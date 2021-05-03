package com.ozu.metadata;

import java.time.Duration;
import java.time.LocalTime;
import java.util.Random;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter.SseEventBuilder;

import lombok.extern.slf4j.Slf4j;

@RestController
@CrossOrigin
@Slf4j
public class HomeController {

	@Autowired
	@Qualifier("streamExec")
	TaskExecutor taskExecutor;

	@GetMapping("/stream")
	public SseEmitter getStream(@RequestParam(name = "media", required = false, defaultValue = "nomedia") String media,
			@RequestParam(name = "t", required = false, defaultValue = "0") double t) {
		SseEmitter sseEmitter = new SseEmitter(Long.MAX_VALUE);
		log.info("Stream requested for " + media);
		taskExecutor.execute(() -> {
			double time = t;
			long sleep = 500;
			
			double density  = 0;
			double stepCtr= 0;
			while(true){
				stepCtr++;
				try {
					sseEmitter.send(SseEmitter.event().id(String.valueOf(time)).name("periodic-event")
							.data(new MetaDataDto(time, Long.valueOf(sleep).intValue(), density)));
					if (time > t + 2) {
						Thread.sleep(sleep);
					}

					if(stepCtr%60==0){
						if(density>0){
							density=0;
						}else{
							Random r = new Random();
							density = 0.5 + (1 - 0.5) * r.nextDouble();
						}
					}

				} catch (Exception e) {
					log.error(e.getMessage(), e);
					sseEmitter.completeWithError(e);
					break;
				}

				time += Long.valueOf(sleep).doubleValue() / 1000;
			}
			sseEmitter.complete();
		});
		return sseEmitter;
	}
}
