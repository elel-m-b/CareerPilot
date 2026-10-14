package com.resumeanalyzer.common;

import java.time.LocalDateTime;

/**
 * The shared, standardised error payload returned by every API failure.
 *
 * <p>{@code code} is a stable, machine-readable identifier (for example
 * {@code RESOURCE_NOT_FOUND}) while {@code message} stays human-readable. The remaining
 * fields mirror the previous {@code ErrorResponse} shape so existing clients that read
 * {@code message} (and the optional {@code status}/{@code error}/{@code path} fields)
 * keep working unchanged.</p>
 */
public record ApiError(
        LocalDateTime timestamp,
        int status,
        String error,
        String code,
        String message,
        String path) {
}
