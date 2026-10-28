package com.resumeanalyzer.repository;

import com.resumeanalyzer.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Email is the sign-in identity. The lookups are case-insensitive so that
    // "User@Example.com" and "user@example.com" cannot become two accounts
    // (MySQL's utf8mb4_unicode_ci unique index would reject the second one with
    // a 500) and so that rows stored before normalisation still sign in.
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByUsername(String username);
    boolean existsByUsernameIgnoreCase(String username);
}
