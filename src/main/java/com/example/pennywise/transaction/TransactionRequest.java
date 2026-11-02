package com.example.pennywise.transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record TransactionRequest(
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.00", inclusive = false, message = "Amount must be positive")
        @Digits(integer = 17, fraction = 2, message = "Amount must have at most 17 integer digits and 2 decimal places")
        BigDecimal amount,
        @NotNull(message = "Type is required") TransactionType type,
        @NotNull(message = "Transaction date is required") LocalDate transactionDate,
        @Size(max = 255, message = "Description must be at most 255 characters") String description,
        @NotNull(message = "Category ID is required") @Positive(message = "Category ID must be positive") Long categoryId) {}
