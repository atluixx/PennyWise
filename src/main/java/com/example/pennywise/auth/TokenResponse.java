package com.example.pennywise.auth;

public record TokenResponse(String accessToken, String tokenType, long expiresIn) {}
