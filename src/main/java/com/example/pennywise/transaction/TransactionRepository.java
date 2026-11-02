package com.example.pennywise.transaction;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransactionRepository extends JpaRepository<FinanceTransaction, Long> {
    Optional<FinanceTransaction> findByIdAndOwnerId(Long id, Long ownerId);
    List<FinanceTransaction> findAllByOwnerId(Long ownerId);
    @EntityGraph(attributePaths = "category")
    List<FinanceTransaction> findByOwnerIdAndTransactionDateGreaterThanEqualAndTransactionDateLessThan(
            Long ownerId, LocalDate start, LocalDate end);
}
