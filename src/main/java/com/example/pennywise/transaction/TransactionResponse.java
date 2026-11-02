package com.example.pennywise.transaction;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionResponse(Long id, BigDecimal amount, TransactionType type, LocalDate transactionDate, String description, Long categoryId) {
    public static TransactionResponse from(FinanceTransaction transaction) {
        return new TransactionResponse(transaction.getId(), transaction.getAmount(), transaction.getType(), transaction.getTransactionDate(), transaction.getDescription(), transaction.getCategory().getId());
    }
}
