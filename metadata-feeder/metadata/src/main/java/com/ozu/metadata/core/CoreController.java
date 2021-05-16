package com.ozu.metadata.core;

import java.time.Duration;
import java.time.LocalTime;
import java.util.Random;

import com.ozu.metadata.parser.MetaDataDto;
import com.ozu.metadata.parser.ParserService;

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
public class CoreController {

	@Autowired
	@Qualifier("streamExec")
	TaskExecutor taskExecutor;
	
	@Autowired
	CoreProperties coreProperties;
	@Autowired
	ParserService parserService;
	@Autowired
	CoreService coreService;

	@GetMapping("/stream")
	public SseEmitter getStream(@RequestParam(name = "media", required = false, defaultValue = "nomedia") String media,
			@RequestParam(name = "t", required = false, defaultValue = "0") double t) {
		SseEmitter sseEmitter = new SseEmitter(Long.MAX_VALUE);
		log.info("Stream requested for " + media);
		coreService.handleReq(media, t, sseEmitter);
		return sseEmitter;
	}
}
