package com.example.cafeposbackend.reporting;

import com.example.cafeposbackend.reporting.ReportDtos.*;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReportService {
  DashboardSummary getSummary(ReportFilter filter);

  List<SalesTrendPoint> getSalesTrend(ReportFilter filter);

  List<CategorySales> getTopCategories(ReportFilter filter);

  Page<OrderSummary> getTopOrders(ReportFilter filter, Pageable pageable);

  List<ProductSales> getTopProducts(ReportFilter filter);

  byte[] exportPdf(ReportFilter filter);

  byte[] exportXls(ReportFilter filter);
}
