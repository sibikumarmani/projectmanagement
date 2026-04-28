package com.company.pms.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @NotBlank
    @Size(min = 3, max = 120, message = "Full name must be between 3 and 120 characters")
    String fullName,
    String avatarImage
) {
}
