package com.example.pennywise.auth;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class CurrentUser {
    public Long id() {
        return Long.valueOf(SecurityContextHolder.getContext().getAuthentication().getName());
    }
}
