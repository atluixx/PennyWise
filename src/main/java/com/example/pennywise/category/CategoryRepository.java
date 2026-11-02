package com.example.pennywise.category;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByIdAndOwnerId(Long id, Long ownerId);
    List<Category> findAllByOwnerId(Long ownerId);
}
