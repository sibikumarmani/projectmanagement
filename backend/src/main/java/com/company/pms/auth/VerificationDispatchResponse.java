package com.company.pms.auth;

public record VerificationDispatchResponse(
    String email,
    String message,
    String verificationCode
) {
}
