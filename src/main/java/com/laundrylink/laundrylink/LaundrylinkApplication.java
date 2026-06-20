package com.laundrylink.laundrylink;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableScheduling
public class LaundrylinkApplication {

    public static void main(String[] args) {
        SpringApplication.run(LaundrylinkApplication.class, args);
    }

}
