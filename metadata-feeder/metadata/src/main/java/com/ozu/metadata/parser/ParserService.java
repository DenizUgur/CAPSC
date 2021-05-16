package com.ozu.metadata.parser;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

import javax.annotation.PostConstruct;

import com.opencsv.CSVParser;
import com.opencsv.CSVParserBuilder;
import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import com.opencsv.exceptions.CsvValidationException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ParserService {

    Map<String,List> metadata;
    Map<String,Double> eventDensityMap;
    @Autowired
    ParserProperties parserProperties;

    @PostConstruct
    public void init() throws CsvValidationException, IOException{
        log.info("Initializing parser service.");
        metadata = new HashMap<>();
        eventDensityMap = new HashMap();
        parserProperties.getEventDensities().forEach(e->{
            eventDensityMap.put(e.getName(),e.getDensity());
        });

        File inputDirectory = new File(parserProperties.getInputDirectory());
        for (String fileStr : inputDirectory.list()) {
            log.info(fileStr + " found.");
         
            FileReader fileReader = new FileReader(new File(parserProperties.getInputDirectory()+"/"+fileStr));
            CSVParser parser=  new CSVParserBuilder().withSeparator(',').build();
            CSVReader reader = new CSVReaderBuilder(fileReader).withCSVParser(parser).build();
            String[] line;
            List<MetaDataDto> metaDataDtos = new ArrayList<>();
            int counter = 0;
            while ((line = reader.readNext()) != null) {
                counter++;
                double at = Double.valueOf(line[0]);
                System.out.println(String.valueOf(at));
                int length = Integer.valueOf(line[1]);
                double density = eventDensityMap.get(line[2]);
                metaDataDtos.add(new MetaDataDto(at, length, density));
            }
            reader.close();
            log.info(counter + " lines are loaded for "+ fileStr);
            metadata.put(fileStr.split("\\.")[0], metaDataDtos);
        }
    }

    public Integer getClosestEventIndex(String media,double time){
        List<MetaDataDto> eventList= metadata.get(media);
        if(eventList ==null)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unable to find resource");
        int result = -1;
        result = IntStream.range(0, eventList.size()).filter(i->{
            return eventList.get(i).getTime()>time;
        }).findFirst().orElse(-1);
        return result;
    }

    public MetaDataDto getMetadata(String media, int index){
        List<MetaDataDto> eventList= metadata.get(media);
        if(eventList ==null)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unable to find resource");
        if(index>=eventList.size()){
            return null;
        }
        return eventList.get(index);
    }
}
