package com.example.pennywise.summary;

import java.math.BigDecimal;
import java.util.List;

public record MonthlySummary(String month, BigDecimal totalIncome, BigDecimal totalExpenses,
                             BigDecimal balance, List<CategoryTotal> categories) {}
