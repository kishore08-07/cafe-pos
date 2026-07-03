package com.example.cafeposbackend.reporting;

import com.example.cafeposbackend.common.response.ApiResponse;
import com.example.cafeposbackend.reporting.ReportDtos.*;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
  private final ReportService service;

  public ReportController(ReportService service) {
    this.service = service;
  }

  @GetMapping("/summary")
  ApiResponse<DashboardSummary> summary(FilterParams params) {
    return ApiResponse.success(service.getSummary(params.toFilter()));
  }

  @GetMapping("/sales-trend")
  ApiResponse<List<SalesTrendPoint>> trend(FilterParams params) {
    return ApiResponse.success(service.getSalesTrend(params.toFilter()));
  }

  @GetMapping("/top-categories")
  ApiResponse<List<CategorySales>> categories(FilterParams params) {
    return ApiResponse.success(service.getTopCategories(params.toFilter()));
  }

  @GetMapping("/top-orders")
  ApiResponse<Page<OrderSummary>> orders(FilterParams params, Pageable pageable) {
    return ApiResponse.success(service.getTopOrders(params.toFilter(), pageable));
  }

  @GetMapping("/top-products")
  ApiResponse<List<ProductSales>> products(FilterParams params) {
    return ApiResponse.success(service.getTopProducts(params.toFilter()));
  }

  @GetMapping(value = "/export/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
  ResponseEntity<byte[]> pdf(FilterParams params) {
    return download(service.exportPdf(params.toFilter()), "report.pdf", MediaType.APPLICATION_PDF);
  }

  @GetMapping(
      value = "/export/xls",
      produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
  ResponseEntity<byte[]> xls(FilterParams params) {
    return download(
        service.exportXls(params.toFilter()),
        "report.xlsx",
        MediaType.parseMediaType(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
  }

  private ResponseEntity<byte[]> download(byte[] body, String filename, MediaType type) {
    return ResponseEntity.ok()
        .contentType(type)
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
        .body(body);
  }

  public static class FilterParams {
    public Period period;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    public LocalDate from;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    public LocalDate to;

    public Long employeeId;
    public Long sessionId;
    public Long productId;

    ReportFilter toFilter() {
      return new ReportFilter(period, from, to, employeeId, sessionId, productId);
    }
  }
}
