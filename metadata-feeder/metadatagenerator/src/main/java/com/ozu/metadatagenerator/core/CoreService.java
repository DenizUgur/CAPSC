package com.ozu.metadatagenerator.core;

import java.io.File;
import java.io.FileWriter;
import java.security.KeyStore.Entry;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.Future;

import com.opencsv.CSVWriter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.AutoConfigureOrder;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.AsyncResult;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class CoreService {

    @Autowired
    CoreProperties coreProperties;
    
    @Async(CoreConfiguration.TASK_EXECUTOR)
    public Future<Void> generateMetadata(String name){
        log.info("Starting generation metadata for " + name);
        Random random = new Random();

        List<EventDto> events = new ArrayList<>();

        for (Map.Entry<String,CoreProperties.Event> event : coreProperties.getEvents().entrySet()) {
            int count = random.ints(event.getValue().getMinCount(),event.getValue().getMaxCount()).findFirst().getAsInt();
            log.info("Generating " + count + event.getKey());
            for (int i = 0; i < count; i++) {
                int length = random.ints(event.getValue().getMinLength(),event.getValue().getMaxLength()).findFirst().getAsInt();
                EventDto eventDto = new EventDto();
                eventDto.setName(event.getValue().getName());
                eventDto.setLength(length);
                events.add(eventDto);
            }
        }

        int totalLength = events.stream().map(e->e.getLength()).reduce(0, (subtotal, element) -> subtotal + element);
        log.info("Total length of events : "+ totalLength + " total count of events: "+events.size());

        Collections.shuffle(events);
        int freeTime = coreProperties.getMatchLength() - totalLength ; 
        if(freeTime<=0){
            log.error("Total length of events cannot be greater than match length");
            return null;
        }

        log.info("Free time: " + freeTime);
        int time = 0;
        try {
            CSVWriter csvWriter = new CSVWriter(new FileWriter(new File(coreProperties.getOutputDir()+"/"+name+".csv")), CSVWriter.DEFAULT_SEPARATOR, CSVWriter.NO_QUOTE_CHARACTER,CSVWriter.DEFAULT_ESCAPE_CHARACTER,CSVWriter.DEFAULT_LINE_END);
            for (EventDto eventDto : events) {

                int divisionFactor =(20*freeTime)/coreProperties.getMatchLength();
                divisionFactor = (divisionFactor<=0)?1:divisionFactor;
                int freeInterval = random.ints(0, freeTime/divisionFactor).findFirst().getAsInt();
                time +=freeInterval;
                eventDto.setTime(time);

                csvWriter.writeNext(new String[]{String.valueOf(eventDto.getTime()),String.valueOf(eventDto.getLength()*1000),eventDto.getName()});
                freeTime-=freeInterval;
                time+=eventDto.getLength();
            }
            csvWriter.close();
        } catch (Exception e) {
            log.error("Unable to write csv file for " + name , e);
        }



        return new AsyncResult<Void>(null);
    }
}
