package com.company.pms.auth;

public record UserManagementDto(
    Long id,
    String userCode,
    String fullName,
    String email,
    String roleName,
    Boolean active,
    Boolean emailVerified,
    String avatarImage
) {
}
