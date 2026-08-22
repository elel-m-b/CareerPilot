package com.resumeanalyzer.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.io.Decoders;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long jwtExpirationInMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String jwtSecret,
            @Value("${app.jwt.expiration-ms:86400000}") long jwtExpirationInMs) {
        
        SecretKey secretKey;
        try {
            byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
            secretKey = Keys.hmacShaKeyFor(keyBytes);
        } catch (Exception e) {
            byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
            if (keyBytes.length < 32) {
                // Ensure key is long enough for HMAC-SHA256 (32 bytes)
                byte[] paddedKey = new byte[32];
                System.arraycopy(keyBytes, 0, paddedKey, 0, keyBytes.length);
                secretKey = Keys.hmacShaKeyFor(paddedKey);
            } else {
                secretKey = Keys.hmacShaKeyFor(keyBytes);
            }
        }
        this.key = secretKey;
        this.jwtExpirationInMs = jwtExpirationInMs;
    }

    public String generateToken(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .subject(Long.toString(userPrincipal.getId()))
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public Long getUserIdFromJWT(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return Long.parseLong(claims.getSubject());
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }
}
