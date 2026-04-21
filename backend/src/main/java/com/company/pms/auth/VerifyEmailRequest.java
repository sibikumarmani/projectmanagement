package com.company.pms.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyEmailRequest(
    @Email @NotBlank String email,
    @NotBlank @Pattern(regexp = "\\d{6}", message = "Verification code must be 6 digits") String code
) {
}
