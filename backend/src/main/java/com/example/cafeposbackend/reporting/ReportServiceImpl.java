package com.example.cafeposbackend.reporting;

import com.example.cafeposbackend.common.enums.OrderStatus;
import com.example.cafeposbackend.common.util.PDFUtil;
import com.example.cafeposbackend.order.*;
import com.example.cafeposbackend.reporting.ReportDtos.*;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {
  private final OrderRepository orderRepository;
  private final OrderLineRepository lineRepository;
  private final PDFUtil pdfUtil;

  public ReportServiceImpl(
      OrderRepository orderRepository, OrderLineRepository lineRepository, PDFUtil pdfUtil) {
    this.orderRepository = orderRepository;
    this.lineRepository = lineRepository;
    this.pdfUtil = pdfUtil;
  }

  @Override
  public DashboardSummary getSummary(ReportFilter filter) {
    List<Order> orders = orders(filter);
    BigDecimal revenue =
        orders.stream().map(Order::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal average =
        orders.isEmpty()
            ? BigDecimal.ZERO
            : revenue.divide(BigDecimal.valueOf(orders.size()), 2, RoundingMode.HALF_UP);
    return new DashboardSummary(orders.size(), revenue, average);
  }

  @Override
  public List<SalesTrendPoint> getSalesTrend(ReportFilter filter) {
    return orders(filter).stream()
        .collect(
            Collectors.groupingBy(
                order -> order.getCreatedAt().toLocalDate(), TreeMap::new, Collectors.toList()))
        .entrySet()
        .stream()
        .map(
            entry ->
                new SalesTrendPoint(
                    entry.getKey(),
                    entry.getValue().size(),
                    entry.getValue().stream()
                        .map(Order::getTotalAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)))
        .toList();
  }

  @Override
  public List<CategorySales> getTopCategories(ReportFilter filter) {
    Map<Long, List<OrderLine>> grouped =
        lines(filter).stream()
            .collect(Collectors.groupingBy(line -> line.getProduct().getCategory().getId()));
    return grouped.values().stream()
        .map(
            lines ->
                new CategorySales(
                    lines.getFirst().getProduct().getCategory().getId(),
                    lines.getFirst().getProduct().getCategory().getName(),
                    lines.stream()
                        .map(OrderLine::getLineTotal)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)))
        .sorted(Comparator.comparing(CategorySales::revenue).reversed())
        .toList();
  }

  @Override
  public Page<OrderSummary> getTopOrders(ReportFilter filter, Pageable pageable) {
    List<OrderSummary> summaries =
        orders(filter).stream()
            .sorted(Comparator.comparing(Order::getTotalAmount).reversed())
            .map(
                order ->
                    new OrderSummary(
                        order.getId(),
                        order.getOrderNumber(),
                        order.getTotalAmount(),
                        order.getCreatedAt().toLocalDate(),
                        order.getEmployee().getName()))
            .toList();
    int start = (int) Math.min(pageable.getOffset(), summaries.size());
    int end = Math.min(start + pageable.getPageSize(), summaries.size());
    return new PageImpl<>(summaries.subList(start, end), pageable, summaries.size());
  }

  @Override
  public List<ProductSales> getTopProducts(ReportFilter filter) {
    return lines(filter).stream()
        .collect(Collectors.groupingBy(line -> line.getProduct().getId()))
        .values()
        .stream()
        .map(
            lines ->
                new ProductSales(
                    lines.getFirst().getProduct().getId(),
                    lines.getFirst().getProduct().getName(),
                    lines.stream()
                        .map(OrderLine::getQuantity)
                        .reduce(BigDecimal.ZERO, BigDecimal::add),
                    lines.stream()
                        .map(OrderLine::getLineTotal)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)))
        .sorted(Comparator.comparing(ProductSales::revenue).reversed())
        .toList();
  }

  @Override
  public byte[] exportPdf(ReportFilter filter) {
    DashboardSummary summary = getSummary(filter);
    return pdfUtil.document(
        "Cafe POS Sales Report",
        List.of(
            "Total orders: " + summary.totalOrders(),
            "Revenue: " + summary.revenue(),
            "Average order value: " + summary.averageOrderValue()));
  }

  @Override
  public byte[] exportXls(ReportFilter filter) {
    try (XSSFWorkbook workbook = new XSSFWorkbook();
        ByteArrayOutputStream output = new ByteArrayOutputStream()) {
      var sheet = workbook.createSheet("Orders");
      var header = sheet.createRow(0);
      header.createCell(0).setCellValue("Order");
      header.createCell(1).setCellValue("Date");
      header.createCell(2).setCellValue("Employee");
      header.createCell(3).setCellValue("Total");
      int rowIndex = 1;
      for (Order order : orders(filter)) {
        var row = sheet.createRow(rowIndex++);
        row.createCell(0).setCellValue(order.getOrderNumber());
        row.createCell(1).setCellValue(order.getCreatedAt().toString());
        row.createCell(2).setCellValue(order.getEmployee().getName());
        row.createCell(3).setCellValue(order.getTotalAmount().doubleValue());
      }
      workbook.write(output);
      return output.toByteArray();
    } catch (Exception ex) {
      throw new IllegalStateException("Unable to export Excel report", ex);
    }
  }

  @Transactional(readOnly = true)
  protected List<Order> orders(ReportFilter filter) {
    DateRange range = range(filter);
    return orderRepository.findAll().stream()
        .filter(order -> order.getStatus() == OrderStatus.PAID)
        .filter(
            order ->
                !order.getCreatedAt().toLocalDate().isBefore(range.from())
                    && !order.getCreatedAt().toLocalDate().isAfter(range.to()))
        .filter(
            order ->
                filter.employeeId() == null
                    || order.getEmployee().getId().equals(filter.employeeId()))
        .filter(
            order ->
                filter.sessionId() == null || order.getSession().getId().equals(filter.sessionId()))
        .filter(
            order ->
                filter.productId() == null
                    || lineRepository.findByOrderId(order.getId()).stream()
                        .anyMatch(line -> line.getProduct().getId().equals(filter.productId())))
        .toList();
  }

  private List<OrderLine> lines(ReportFilter filter) {
    return orders(filter).stream()
        .flatMap(order -> lineRepository.findByOrderId(order.getId()).stream())
        .filter(
            line ->
                filter.productId() == null || line.getProduct().getId().equals(filter.productId()))
        .toList();
  }

  private DateRange range(ReportFilter filter) {
    LocalDate today = LocalDate.now();
    Period period = filter.period() == null ? Period.TODAY : filter.period();
    return switch (period) {
      case TODAY -> new DateRange(today, today);
      case THIS_WEEK -> new DateRange(today.with(DayOfWeek.MONDAY), today.with(DayOfWeek.SUNDAY));
      case THIS_MONTH ->
          new DateRange(today.withDayOfMonth(1), today.withDayOfMonth(today.lengthOfMonth()));
      case CUSTOM ->
          new DateRange(
              Objects.requireNonNullElse(filter.from(), today),
              Objects.requireNonNullElse(filter.to(), today));
    };
  }

  private record DateRange(LocalDate from, LocalDate to) {}
}
