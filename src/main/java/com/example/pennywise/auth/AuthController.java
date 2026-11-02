package com.example.pennywise.auth;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService service;
    public AuthController(AuthService service) { this.service = service; }
    @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED)
    public void register(@Valid @RequestBody AuthRequest request) { service.register(request); }
    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody AuthRequest request) { return service.login(request); }
}
