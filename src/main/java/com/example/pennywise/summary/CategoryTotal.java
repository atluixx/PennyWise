package com.example.pennywise.summary;

import java.math.BigDecimal;

public record CategoryTotal(Long categoryId, String categoryName,
                            BigDecimal income, BigDecimal expenses, BigDecimal balance) {}
