package com.company.pms.auth;

public record PasswordResetDispatchResponse(
    String email,
    String message,
    String resetCode
) {
}
