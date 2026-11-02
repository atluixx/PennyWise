package com.example.pennywise.transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import com.example.pennywise.category.Category;
import jakarta.persistence.*;

@Entity
@Table(name = "finance_transactions")
public class FinanceTransaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private TransactionType type;
    @Column(nullable = false)
    private LocalDate transactionDate;
    private String description;
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, updatable = false)
    private Long ownerId;

    protected FinanceTransaction() {}
    public FinanceTransaction(BigDecimal amount, TransactionType type, LocalDate transactionDate, String description, Category category, Long ownerId) {
        this.ownerId = ownerId;
        update(amount, type, transactionDate, description, category);
    }
    public void update(BigDecimal amount, TransactionType type, LocalDate date, String description, Category category) {
        this.amount = amount; this.type = type; this.transactionDate = date; this.description = description; this.category = category;
    }
    public Long getId() { return id; }
    public BigDecimal getAmount() { return amount; }
    public TransactionType getType() { return type; }
    public LocalDate getTransactionDate() { return transactionDate; }
    public String getDescription() { return description; }
    public Category getCategory() { return category; }
}
