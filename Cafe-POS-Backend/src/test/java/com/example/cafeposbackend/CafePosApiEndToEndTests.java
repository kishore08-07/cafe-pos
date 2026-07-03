package com.example.cafeposbackend;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.example.cafeposbackend.common.enums.PaymentMethodType;
import com.example.cafeposbackend.floor.TableQrCodeRepository;
import com.example.cafeposbackend.paymentmethod.PaymentMethodRepository;
import com.jayway.jsonpath.JsonPath;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class CafePosApiEndToEndTests {
  @Autowired MockMvc mockMvc;
  @Autowired PaymentMethodRepository paymentMethodRepository;
  @Autowired TableQrCodeRepository tableQrCodeRepository;

  @Test
  void completePosAndSelfOrderingWorkflowSatisfiesPlannedApis() throws Exception {
    mockMvc
        .perform(get("/api/products"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));

    Auth admin = signup("Admin", "admin@cafe.test", "ADMIN");
    Auth employee = signup("Employee", "employee@cafe.test", "EMPLOYEE");

    mockMvc
        .perform(
            post("/api/categories")
                .header("Authorization", bearer(employee.accessToken()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Forbidden\",\"colorHex\":\"#000000\"}"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error.code").value("ACCESS_DENIED"));

    long categoryId =
        id(
            json(
                post("/api/categories"),
                admin.accessToken(),
                "{\"name\":\"Beverages\",\"colorHex\":\"#3B8BD4\"}"));
    long productId =
        id(
            json(
                post("/api/products"),
                admin.accessToken(),
                """
                {"name":"Espresso","categoryId":%d,"price":120.00,
                 "unitOfMeasure":"PIECE","description":"Double shot","showOnKds":true}
                """
                    .formatted(categoryId)));

    mockMvc
        .perform(get("/api/products").header("Authorization", bearer(employee.accessToken())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.content[0].name").value("Espresso"));

    long floorId =
        id(json(post("/api/floors"), admin.accessToken(), "{\"name\":\"Ground Floor\"}"));
    long tableId =
        id(
            json(
                post("/api/floors/" + floorId + "/tables"),
                admin.accessToken(),
                "{\"tableNumber\":\"T1\",\"seats\":4,\"active\":true}"));
    long customerId =
        id(
            json(
                post("/api/customers"),
                employee.accessToken(),
                "{\"name\":\"Guest\",\"email\":\"guest@example.com\",\"phone\":\"9999999999\"}"));
    mockMvc
        .perform(
            post("/api/tables/" + tableId + "/claim")
                .header("Authorization", bearer(employee.accessToken())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.occupiedById").value(employee.userId()));
    mockMvc
        .perform(
            post("/api/tables/" + tableId + "/claim")
                .header("Authorization", bearer(admin.accessToken())))
        .andExpect(status().isUnprocessableEntity())
        .andExpect(jsonPath("$.error.code").value("BUSINESS_RULE"));

    json(
        post("/api/promotions"),
        admin.accessToken(),
        """
        {"name":"Order Offer","appliesTo":"ORDER","minOrderAmount":100,
         "discountType":"FIXED","discountValue":5}
        """);
    json(
        post("/api/coupons"),
        admin.accessToken(),
        "{\"code\":\"SAVE10\",\"discountType\":\"PERCENTAGE\",\"discountValue\":10}");
    mockMvc
        .perform(
            post("/api/coupons/validate")
                .header("Authorization", bearer(employee.accessToken()))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"code\":\"SAVE10\",\"orderTotal\":120}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.amount").value(12.0));

    long sessionId =
        id(json(post("/api/sessions/open"), employee.accessToken(), "{\"openingAmount\":500}"));
    MvcResult orderResult =
        json(
            post("/api/orders?sessionId=" + sessionId + "&tableId=" + tableId),
            employee.accessToken(),
            """
            {"customerId":%d,"lines":[{"productId":%d,"quantity":1}]}
            """
                .formatted(customerId, productId));
    long orderId = id(orderResult);
    assertThat(number(orderResult, "$.data.totalAmount")).isEqualByComparingTo("115.0");

    mockMvc
        .perform(get("/api/kds/tickets"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.length()").value(0));

    MvcResult discounted =
        json(
            put("/api/orders/" + orderId + "/discount"),
            employee.accessToken(),
            "{\"couponCode\":\"SAVE10\"}");
    assertThat(number(discounted, "$.data.discountTotal")).isEqualByComparingTo("17.0");
    assertThat(number(discounted, "$.data.totalAmount")).isEqualByComparingTo("103.0");

    long cashMethodId =
        paymentMethodRepository.findByType(PaymentMethodType.CASH).orElseThrow().getId();
    mockMvc
        .perform(
            post("/api/orders/" + orderId + "/payment")
                .header("Authorization", bearer(employee.accessToken()))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"paymentMethodId":%d,"amount":103.00,"referenceNumber":"CASH-1"}
                    """
                        .formatted(cashMethodId)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.status").value("PAID"))
        .andExpect(jsonPath("$.data.sentToKitchen").value(true));

    mockMvc
        .perform(get("/api/kds/tickets"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].stage").value("TO_COOK"))
        .andExpect(jsonPath("$.data[0].employeeId").value(employee.userId()));
    mockMvc
        .perform(put("/api/kds/tickets/" + orderId + "/advance"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.stage").value("PREPARING"));
    mockMvc
        .perform(
            post("/api/tables/" + tableId + "/release")
                .header("Authorization", bearer(employee.accessToken())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.occupiedById").doesNotExist());

    mockMvc
        .perform(
            post("/api/orders/" + orderId + "/receipt/print")
                .header("Authorization", bearer(employee.accessToken())))
        .andExpect(status().isOk())
        .andExpect(content().contentType(MediaType.APPLICATION_PDF))
        .andExpect(result -> assertThat(result.getResponse().getContentAsByteArray()).isNotEmpty());

    mockMvc
        .perform(get("/api/customer-display/state"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.orderId").value(orderId))
        .andExpect(jsonPath("$.data.status").value("PAID"));
    mockMvc.perform(get("/customer-display")).andExpect(status().isOk());

    mockMvc
        .perform(
            put("/api/self-order/config")
                .header("Authorization", bearer(admin.accessToken()))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"mode\":\"ONLINE_ORDERING\",\"enabled\":true,\"backgroundColor\":\"#ffffff\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.enabled").value(true));
    mockMvc
        .perform(
            get("/api/self-order/tables/" + tableId + "/qr")
                .header("Authorization", bearer(admin.accessToken())))
        .andExpect(status().isOk())
        .andExpect(
            jsonPath("$.data").value(org.hamcrest.Matchers.startsWith("data:image/png;base64,")));
    String tableToken = tableQrCodeRepository.findByTableId(tableId).orElseThrow().getToken();
    mockMvc
        .perform(
            get("/api/self-order/tables/" + tableId + "/token")
                .header("Authorization", bearer(admin.accessToken())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.token").value(tableToken));
    mockMvc
        .perform(get("/api/self-order/menu/" + tableToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].name").value("Espresso"));
    MvcResult selfOrder =
        mockMvc
            .perform(
                post("/api/self-order/order/" + tableToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                    {"lines":[{"productId":%d,"quantity":1}]}
                    """
                            .formatted(productId)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.tableId").value(tableId))
            .andExpect(jsonPath("$.data.status").value("DRAFT"))
            .andReturn();
    Number selfOrderId = JsonPath.read(body(selfOrder), "$.data.orderId");
    mockMvc
        .perform(get("/api/self-order/order/" + selfOrderId + "/status"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.kitchenStage").value("TO_COOK"));
    mockMvc
        .perform(
            put("/api/orders/" + selfOrderId + "/cancel")
                .header("Authorization", bearer(employee.accessToken())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.status").value("CANCELLED"));

    mockMvc
        .perform(
            get("/api/reports/summary?period=TODAY")
                .header("Authorization", bearer(admin.accessToken())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.totalOrders").value(1))
        .andExpect(jsonPath("$.data.revenue").value(103.0));
    mockMvc
        .perform(
            get("/api/reports/top-products?period=TODAY")
                .header("Authorization", bearer(admin.accessToken())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].productName").value("Espresso"));
    mockMvc
        .perform(
            get("/api/reports/export/pdf?period=TODAY")
                .header("Authorization", bearer(admin.accessToken())))
        .andExpect(status().isOk())
        .andExpect(content().contentType(MediaType.APPLICATION_PDF));
    mockMvc
        .perform(
            get("/api/reports/export/xls?period=TODAY")
                .header("Authorization", bearer(admin.accessToken())))
        .andExpect(status().isOk())
        .andExpect(
            content()
                .contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));

    mockMvc
        .perform(
            post("/api/sessions/" + sessionId + "/close")
                .header("Authorization", bearer(employee.accessToken())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data.totalOrders").value(1))
        .andExpect(jsonPath("$.data.revenue").value(103.0));

    MvcResult refreshed =
        mockMvc
            .perform(
                post("/api/auth/refresh")
                    .header("Authorization", bearer(admin.accessToken()))
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"refreshToken":"%s"}
                        """
                            .formatted(admin.refreshToken())))
            .andExpect(status().isOk())
            .andReturn();
    String refreshedToken = JsonPath.read(body(refreshed), "$.data.refreshToken");
    mockMvc
        .perform(
            post("/api/auth/logout")
                .header(
                    "Authorization", bearer(JsonPath.read(body(refreshed), "$.data.accessToken")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"refreshToken\":\"%s\"}".formatted(refreshedToken)))
        .andExpect(status().isOk());
  }

  private Auth signup(String name, String email, String role) throws Exception {
    MvcResult result =
        mockMvc
            .perform(
                post("/api/auth/signup")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        """
                        {"name":"%s","email":"%s","password":"password123","role":"%s"}
                        """
                            .formatted(name, email, role)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andReturn();
    return new Auth(
        ((Number) JsonPath.read(body(result), "$.data.userId")).longValue(),
        JsonPath.read(body(result), "$.data.accessToken"),
        JsonPath.read(body(result), "$.data.refreshToken"));
  }

  private MvcResult json(
      org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request,
      String token,
      String content)
      throws Exception {
    return mockMvc
        .perform(
            request
                .header("Authorization", bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content(content))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andReturn();
  }

  private long id(MvcResult result) throws Exception {
    return ((Number) JsonPath.read(body(result), "$.data.id")).longValue();
  }

  private java.math.BigDecimal number(MvcResult result, String path) throws Exception {
    Number value = JsonPath.read(body(result), path);
    return new java.math.BigDecimal(value.toString());
  }

  private String body(MvcResult result) throws Exception {
    return result.getResponse().getContentAsString(StandardCharsets.UTF_8);
  }

  private String bearer(String token) {
    return "Bearer " + token;
  }

  private record Auth(long userId, String accessToken, String refreshToken) {}
}
