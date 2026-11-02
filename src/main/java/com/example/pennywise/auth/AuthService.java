package com.example.pennywise.auth;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final JwtEncoder encoder;
    public AuthService(UserRepository users, PasswordEncoder passwords, JwtEncoder encoder) {
        this.users = users; this.passwords = passwords; this.encoder = encoder;
    }
    private String email(String value) { return value.trim().toLowerCase(Locale.ROOT); }
    private void checkPassword(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at most 72 UTF-8 bytes");
    }
    @Transactional
    public void register(AuthRequest request) {
        checkPassword(request.password());
        if (users.findByEmail(email(request.email())).isPresent())
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        users.saveAndFlush(new AppUser(email(request.email()), passwords.encode(request.password())));
    }
    public TokenResponse login(AuthRequest request) {
        checkPassword(request.password());
        AppUser user = users.findByEmail(email(request.email())).orElse(null);
        if (user == null || !passwords.matches(request.password(), user.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        Instant now = Instant.now();
        long seconds = 3600;
        JwtClaimsSet claims = JwtClaimsSet.builder().issuer("pennywise").subject(user.getId().toString())
                .issuedAt(now).expiresAt(now.plusSeconds(seconds)).build();
        String token = encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        return new TokenResponse(token, "Bearer", seconds);
    }
}
