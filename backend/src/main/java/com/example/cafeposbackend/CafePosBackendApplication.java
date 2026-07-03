package com.example.cafeposbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
public class CafePosBackendApplication {

  public static void main(String[] args) {
    SpringApplication.run(CafePosBackendApplication.class, args);
  }

  @RestController
  public class HomeController {

    @GetMapping("/")
    public String home() {
      return "Cafe POS Backend Running";
    }
  }
}
