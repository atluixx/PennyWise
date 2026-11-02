package com.example.pennywise.transaction;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "idempotency_records")
public class IdempotencyRecord {
    @Id
    @Column(length = 150)
    private String idempotencyKey;
    @Column(nullable = false, length = 64)
    private String requestHash;
    @Column(nullable = false, length = 2000)
    private String responseJson;

    protected IdempotencyRecord() {}
    public IdempotencyRecord(String key, String requestHash, String responseJson) {
        this.idempotencyKey = key;
        this.requestHash = requestHash;
        this.responseJson = responseJson;
    }
    public String getRequestHash() { return requestHash; }
    public String getResponseJson() { return responseJson; }
}
