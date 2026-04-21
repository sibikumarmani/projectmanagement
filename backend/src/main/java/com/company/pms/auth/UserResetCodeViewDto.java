package com.company.pms.auth;

import java.time.Instant;

public record UserResetCodeViewDto(
    Long userId,
    String userCode,
    String fullName,
    String email,
    String resetCode,
    Instant expiresAt,
    Boolean consumed,
    boolean available
) {
}
