package com.company.pms.auth;

public record AccountProfileDto(
    Long id,
    String userCode,
    String fullName,
    String email,
    String roleName,
    String avatarImage
) {
}
