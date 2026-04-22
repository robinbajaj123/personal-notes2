package com.mailflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MailflowApplication {
    public static void main(String[] args) {
        SpringApplication.run(MailflowApplication.class, args);
    }
}
