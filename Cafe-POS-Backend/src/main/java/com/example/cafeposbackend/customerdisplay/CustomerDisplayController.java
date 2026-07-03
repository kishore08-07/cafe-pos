package com.example.cafeposbackend.customerdisplay;

import com.example.cafeposbackend.common.response.ApiResponse;
import com.example.cafeposbackend.customerdisplay.CustomerDisplayDtos.CustomerDisplayState;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
public class CustomerDisplayController {
  private final CustomerDisplayService service;

  public CustomerDisplayController(CustomerDisplayService service) {
    this.service = service;
  }

  @GetMapping("/api/customer-display/state")
  ApiResponse<CustomerDisplayState> state() {
    return ApiResponse.success(service.getCurrentState());
  }

  @GetMapping(value = "/api/customer-display/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
  SseEmitter stream() {
    return service.subscribe();
  }

  @GetMapping(value = "/customer-display", produces = MediaType.TEXT_HTML_VALUE)
  String page() {
    return """
        <!doctype html><html><body><h1 id="message">Waiting for order</h1>
        <div id="total"></div><script>
        const stream=new EventSource('/api/customer-display/stream');
        stream.addEventListener('state',e=>{const s=JSON.parse(e.data);
        document.getElementById('message').textContent=s.message;
        document.getElementById('total').textContent='Total: '+s.total;});
        </script></body></html>
        """;
  }
}
