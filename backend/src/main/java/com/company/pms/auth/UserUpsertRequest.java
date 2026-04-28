package com.company.pms.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserUpsertRequest(
    @NotBlank String fullName,
    @NotBlank @Email String email,
    @Size(min = 8, message = "Password must be at least 8 characters") String password,
    @NotBlank String roleName,
    @NotNull Boolean active,
    @NotNull Boolean emailVerified,
    String avatarImage
) {
}
