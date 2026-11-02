package com.example.pennywise.auth;

import jakarta.persistence.*;

@Entity
@Table(name = "app_users", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
public class AppUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 254)
    private String email;
    @Column(nullable = false)
    private String passwordHash;
    protected AppUser() {}
    public AppUser(String email, String passwordHash) { this.email = email; this.passwordHash = passwordHash; }
    public Long getId() { return id; }
    public String getPasswordHash() { return passwordHash; }
}
