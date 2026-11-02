package com.example.pennywise.category;

import jakarta.persistence.*;

@Entity
public class Category {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;

    @Column(nullable = false, updatable = false)
    private Long ownerId;

    protected Category() {}
    public Category(String name, Long ownerId) { this.name = name; this.ownerId = ownerId; }
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
