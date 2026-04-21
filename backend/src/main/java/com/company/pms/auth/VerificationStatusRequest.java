package com.company.pms.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record VerificationStatusRequest(
    @Email @NotBlank String email
) {
}
