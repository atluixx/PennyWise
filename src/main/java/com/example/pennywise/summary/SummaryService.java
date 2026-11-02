package com.example.pennywise.summary;

import java.math.BigDecimal;
import com.example.pennywise.auth.CurrentUser;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.example.pennywise.transaction.FinanceTransaction;
import com.example.pennywise.transaction.TransactionRepository;
import com.example.pennywise.transaction.TransactionType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SummaryService {
    private final TransactionRepository transactions;

    private final CurrentUser currentUser;
    public SummaryService(TransactionRepository transactions, CurrentUser currentUser) {
        this.transactions = transactions;
        this.currentUser = currentUser;
    }

    @Transactional(readOnly = true)
    public MonthlySummary getMonthlySummary(YearMonth month) {
        List<FinanceTransaction> items = transactions
                .findByOwnerIdAndTransactionDateGreaterThanEqualAndTransactionDateLessThan(
                        currentUser.id(), month.atDay(1), month.plusMonths(1).atDay(1));
        Map<Long, CategoryTotal> totals = new LinkedHashMap<>();
        BigDecimal income = BigDecimal.ZERO;
        BigDecimal expenses = BigDecimal.ZERO;
        for (FinanceTransaction item : items) {
            boolean isIncome = item.getType() == TransactionType.INCOME;
            BigDecimal itemIncome = isIncome ? item.getAmount() : BigDecimal.ZERO;
            BigDecimal itemExpense = isIncome ? BigDecimal.ZERO : item.getAmount();
            income = income.add(itemIncome);
            expenses = expenses.add(itemExpense);
            Long categoryId = item.getCategory().getId();
            CategoryTotal previous = totals.getOrDefault(categoryId,
                    new CategoryTotal(categoryId, item.getCategory().getName(),
                            BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));
            BigDecimal categoryIncome = previous.income().add(itemIncome);
            BigDecimal categoryExpenses = previous.expenses().add(itemExpense);
            totals.put(categoryId, new CategoryTotal(categoryId, previous.categoryName(),
                    categoryIncome, categoryExpenses, categoryIncome.subtract(categoryExpenses)));
        }
        List<CategoryTotal> categories = totals.values().stream()
                .sorted(Comparator.comparing(CategoryTotal::categoryName).thenComparing(CategoryTotal::categoryId))
                .toList();
        return new MonthlySummary(month.toString(), income, expenses, income.subtract(expenses), categories);
    }
}
