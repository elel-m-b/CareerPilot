package com.resumeanalyzer.common;

import com.resumeanalyzer.exception.BadRequestException;

import java.util.Locale;

/**
 * Normalisation of the values that identify an account.
 *
 * <p>Emails are compared case-insensitively by every login and registration
 * path, so they are stored trimmed and lowercased. Usernames are a display
 * name and keep their casing, but surrounding whitespace is never meaningful
 * and a trimmed value outside the 3–50 character window is rejected here
 * because bean validation only sees the untrimmed string.</p>
 */
public final class AccountIdentity {

    private AccountIdentity() {
    }

    public static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    public static String normalizeUsername(String username) {
        String normalized = username == null ? "" : username.trim();
        if (normalized.length() < 3 || normalized.length() > 50) {
            throw new BadRequestException("Username must be between 3 and 50 characters");
        }
        return normalized;
    }
}
