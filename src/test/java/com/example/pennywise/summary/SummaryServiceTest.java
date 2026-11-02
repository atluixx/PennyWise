package com.example.pennywise.summary;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import com.example.pennywise.auth.CurrentUser;
import com.example.pennywise.category.Category;
import com.example.pennywise.transaction.FinanceTransaction;
import com.example.pennywise.transaction.TransactionRepository;
import com.example.pennywise.transaction.TransactionType;
import org.junit.jupiter.api.Test;

class SummaryServiceTest {
    @Test
    void calculatesIncomeExpensesAndBalanceForTheRequestedMonth() {
        TransactionRepository repository = mock(TransactionRepository.class);
        CurrentUser user = mock(CurrentUser.class);
        Category food = mock(Category.class);
        when(user.id()).thenReturn(7L);
        when(food.getId()).thenReturn(4L);
        when(food.getName()).thenReturn("Food");
        var income = new FinanceTransaction(new BigDecimal("100.00"), TransactionType.INCOME,
                LocalDate.of(2026, 2, 1), "Income", food, 7L);
        var expense = new FinanceTransaction(new BigDecimal("12.50"), TransactionType.EXPENSE,
                LocalDate.of(2026, 2, 28), "Food", food, 7L);
        when(repository.findByOwnerIdAndTransactionDateGreaterThanEqualAndTransactionDateLessThan(
                7L, LocalDate.of(2026, 2, 1), LocalDate.of(2026, 3, 1)))
                .thenReturn(List.of(income, expense));

        MonthlySummary result = new SummaryService(repository, user).getMonthlySummary(YearMonth.of(2026, 2));

        assertThat(result.totalIncome()).isEqualByComparingTo("100.00");
        assertThat(result.totalExpenses()).isEqualByComparingTo("12.50");
        assertThat(result.balance()).isEqualByComparingTo("87.50");
        assertThat(result.categories()).hasSize(1);
        assertThat(result.categories().getFirst().balance()).isEqualByComparingTo("87.50");
    }
}
