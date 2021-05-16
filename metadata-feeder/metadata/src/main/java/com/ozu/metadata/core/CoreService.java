package com.ozu.metadata.core;

import java.io.IOException;
import java.util.Random;

import com.ozu.metadata.parser.MetaDataDto;
import com.ozu.metadata.parser.ParserService;

import org.apache.catalina.connector.ClientAbortException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class CoreService {

    @Autowired
    ParserService parserService;
    @Autowired
    CoreProperties coreProperties;

    @Async(CoreConfiguration.STREAM_EXECUTOR)
    public void handleReq(String media,double t,SseEmitter sseEmitter){

        double time = t;
        long sleep = 0l;
        int closestEventIndex = parserService.getClosestEventIndex(media, time);
        MetaDataDto metaDataDto = null;
        MetaDataDto response = null;
        while(true){
            response= new MetaDataDto();
            try {
                if(closestEventIndex>=0){
                    metaDataDto = parserService.getMetadata(media, closestEventIndex);
                }
                                
                if(metaDataDto != null){
                    if(metaDataDto.getTime()>time){
       
                        sleep = (long)((this.roundTwoDecimal(metaDataDto.getTime()-time))*1000);
                        response.setDuration((int)sleep);
                        response.setTime(time);
                        sseEmitter.send(SseEmitter.event().id(String.valueOf(time)).name(coreProperties.getEventName())
                        .data(response));
                        closestEventIndex--;
                    }else{
                        sleep = metaDataDto.getDuration();
                        response.setDuration(metaDataDto.getDuration());
                        response.setDensity(metaDataDto.getDensity());
                        response.setTime(time);
                        sseEmitter.send(SseEmitter.event().id(String.valueOf(time)).name(coreProperties.getEventName())
                        .data(response));
                    }

                }else{
                    break;
                }


                Thread.sleep(sleep);
                closestEventIndex++;
                metaDataDto=null;
                time+= (double)sleep/1000;
            }catch(IOException  ex){
                log.info("Client closed the connection.");
                break;
            } catch (Exception e) {
                log.error(e.getMessage(), e);
                sseEmitter.completeWithError(e);
                break;
            }
        }
        log.info("Connection is closed.");
        sseEmitter.complete();
    }

    public double roundTwoDecimal(double d){
        return Math.round(d * 100.0) / 100.0;
    }
    
}
