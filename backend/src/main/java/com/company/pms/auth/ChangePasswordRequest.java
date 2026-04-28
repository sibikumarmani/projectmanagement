package com.company.pms.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
    @NotBlank String currentPassword,
    @NotBlank
    @Size(min = 8, max = 120, message = "New password must be at least 8 characters")
    String newPassword
) {
}
