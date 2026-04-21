package com.company.pms.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey key;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    public JwtService(
        @Value("${security.jwt.secret}") String secret,
        @Value("${security.jwt.access-token-expiration-ms}") long accessTokenExpirationMs,
        @Value("${security.jwt.refresh-token-expiration-ms}") long refreshTokenExpirationMs
    ) {
        byte[] keyBytes = secret.startsWith("base64:")
            ? Decoders.BASE64.decode(secret.substring(7))
            : secret.getBytes(StandardCharsets.UTF_8);
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    public String generateAccessToken(String subject, String role) {
        return buildToken(subject, role, accessTokenExpirationMs);
    }

    public String generateRefreshToken(String subject, String role) {
        return buildToken(subject, role, refreshTokenExpirationMs);
    }

    public boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public long getRefreshTokenExpirationMs() {
        return refreshTokenExpirationMs;
    }

    private String buildToken(String subject, String role, long expirationMs) {
        Date now = new Date();
        return Jwts.builder()
            .subject(subject)
            .claim("role", role)
            .issuedAt(now)
            .expiration(new Date(now.getTime() + expirationMs))
            .signWith(key)
            .compact();
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
