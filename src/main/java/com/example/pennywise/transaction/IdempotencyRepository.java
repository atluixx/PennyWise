package com.example.pennywise.transaction;

import org.springframework.data.jpa.repository.JpaRepository;

public interface IdempotencyRepository extends JpaRepository<IdempotencyRecord, String> {}
