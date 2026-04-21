package com.company.pms.auth;

public record RegistrationResponse(
    Long userId,
    String userCode,
    String email,
    String message,
    String verificationCode
) {
}
