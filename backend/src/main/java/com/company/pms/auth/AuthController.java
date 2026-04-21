package com.company.pms.auth;

import com.company.pms.common.api.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ApiResponse<RegistrationResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok(authService.register(request));
    }

    @PostMapping("/verify-email")
    public ApiResponse<AuthResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return ApiResponse.ok(authService.verifyEmail(request));
    }

    @PostMapping("/resend-verification-code")
    public ApiResponse<VerificationDispatchResponse> resendVerificationCode(@Valid @RequestBody ResendVerificationCodeRequest request) {
        return ApiResponse.ok(authService.resendVerificationCode(request));
    }

    @PostMapping("/verification-status")
    public ApiResponse<VerificationStatusResponse> verificationStatus(@Valid @RequestBody VerificationStatusRequest request) {
        return ApiResponse.ok(authService.verificationStatus(request));
    }

    @PostMapping("/forgot-password")
    public ApiResponse<PasswordResetDispatchResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ApiResponse.ok(authService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    public ApiResponse<PasswordResetDispatchResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ApiResponse.ok(authService.resetPassword(request));
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.ok(authService.refresh(request));
    }
}
