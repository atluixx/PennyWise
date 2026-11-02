package com.example.pennywise.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "app.jwt.secret=YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU=",
        "spring.datasource.url=jdbc:h2:mem:pennywise-tests;DB_CLOSE_DELAY=-1"
})
class ApiIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    private JsonNode body(MvcResult result) throws Exception {
        return json.readTree(result.getResponse().getContentAsString());
    }
    private String registerAndLogin(String email) throws Exception {
        String payload = json.writeValueAsString(new Credentials(email, "password123"));
        mvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isCreated());
        MvcResult login = mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content(payload))
                .andExpect(status().isOk()).andReturn();
        return body(login).get("accessToken").asText();
    }
    private record Credentials(String email, String password) {}
    private String bearer(String token) { return "Bearer " + token; }

    @Test
    void servesTheFrontendAndEasyUiBundleWithoutSigningIn() throws Exception {
        mvc.perform(get("/")).andExpect(status().isOk());
        mvc.perform(get("/easyui.js")).andExpect(status().isOk());
    }

    @Test
    void protectsEndpointsAndRejectsIncorrectCredentials() throws Exception {
        mvc.perform(get("/categories")).andExpect(status().isUnauthorized());
        mvc.perform(get("/categories").header("Authorization", "Bearer invalid"))
                .andExpect(status().isUnauthorized());
        registerAndLogin("auth@example.com");
        mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email":"auth@example.com","password":"wrong-password"}
                        """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void validatesInputAndReturnsJsonErrors() throws Exception {
        String token = registerAndLogin("validation@example.com");
        mvc.perform(post("/categories").header("Authorization", bearer(token))
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.name").exists());
        mvc.perform(post("/transactions").header("Authorization", bearer(token))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"amount\":-1,\"type\":\"EXPENSE\",\"transactionDate\":\"2026-11-01\",\"categoryId\":1}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.amount").exists());
        mvc.perform(get("/summary").param("month", "2026-13").header("Authorization", bearer(token)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void isolatesDataAndSummarizesOnlyTheRequestedMonth() throws Exception {
        String alice = registerAndLogin("alice@example.com");
        String bob = registerAndLogin("bob@example.com");
        MvcResult category = mvc.perform(post("/categories").header("Authorization", bearer(alice))
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Food\"}"))
                .andExpect(status().isCreated()).andReturn();
        long categoryId = body(category).get("id").asLong();
        String expense = "{\"amount\":12.50,\"type\":\"EXPENSE\",\"transactionDate\":\"2026-11-02\",\"categoryId\":" + categoryId + "}";
        MvcResult created = mvc.perform(post("/transactions").header("Authorization", bearer(alice))
                .contentType(MediaType.APPLICATION_JSON).content(expense)).andExpect(status().isCreated()).andReturn();
        long transactionId = body(created).get("id").asLong();
        mvc.perform(get("/categories/{id}", categoryId).header("Authorization", bearer(bob)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/transactions/{id}", transactionId).header("Authorization", bearer(bob)))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/transactions/{id}", transactionId).header("Authorization", bearer(bob)))
                .andExpect(status().isNotFound());
        mvc.perform(post("/transactions").header("Authorization", bearer(bob))
                .contentType(MediaType.APPLICATION_JSON).content(expense)).andExpect(status().isNotFound());
        mvc.perform(get("/summary").param("month", "2026-11").header("Authorization", bearer(alice)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalExpenses").value(12.50))
                .andExpect(jsonPath("$.balance").value(-12.50));
        mvc.perform(get("/summary").param("month", "2026-12").header("Authorization", bearer(alice)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.categories.length()").value(0));
        mvc.perform(get("/summary").param("month", "2026-11").header("Authorization", bearer(bob)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.categories.length()").value(0));
    }

    @Test
    void replaysIdempotentRequestsAndScopesKeysToTheUser() throws Exception {
        String alice = registerAndLogin("keys-a@example.com");
        String bob = registerAndLogin("keys-b@example.com");
        long aId = body(mvc.perform(post("/categories").header("Authorization", bearer(alice))
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"A\"}"))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
        long bId = body(mvc.perform(post("/categories").header("Authorization", bearer(bob))
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"B\"}"))
                .andExpect(status().isCreated()).andReturn()).get("id").asLong();
        String aBody = "{\"amount\":5,\"type\":\"EXPENSE\",\"transactionDate\":\"2026-11-02\",\"categoryId\":" + aId + "}";
        String bBody = "{\"amount\":5,\"type\":\"EXPENSE\",\"transactionDate\":\"2026-11-02\",\"categoryId\":" + bId + "}";
        MvcResult first = mvc.perform(post("/transactions").header("Authorization", bearer(alice)).header("Idempotency-Key", "same-key")
                .contentType(MediaType.APPLICATION_JSON).content(aBody)).andExpect(status().isCreated()).andReturn();
        MvcResult retry = mvc.perform(post("/transactions").header("Authorization", bearer(alice)).header("Idempotency-Key", "same-key")
                .contentType(MediaType.APPLICATION_JSON).content(aBody)).andExpect(status().isCreated()).andReturn();
        assertThat(body(retry)).isEqualTo(body(first));
        mvc.perform(post("/transactions").header("Authorization", bearer(alice)).header("Idempotency-Key", "same-key")
                .contentType(MediaType.APPLICATION_JSON).content(aBody.replace("\"amount\":5", "\"amount\":6")))
                .andExpect(status().isConflict());
        mvc.perform(post("/transactions").header("Authorization", bearer(bob)).header("Idempotency-Key", "same-key")
                .contentType(MediaType.APPLICATION_JSON).content(bBody)).andExpect(status().isCreated());
        mvc.perform(get("/transactions").header("Authorization", bearer(alice)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
    }
}
