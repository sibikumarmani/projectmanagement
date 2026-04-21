package com.company.pms.auth;

public record VerificationStatusResponse(
    String email,
    boolean registered,
    boolean emailVerified,
    boolean active
) {
}
