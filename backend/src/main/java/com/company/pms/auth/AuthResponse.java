package com.company.pms.auth;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    String tokenType,
    UserProfile user
) {
    public record UserProfile(Long id, String userCode, String fullName, String email, String roleName, String avatarImage) {
    }
}
