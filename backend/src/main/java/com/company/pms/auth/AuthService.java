package com.company.pms.auth;

import com.company.pms.notification.EmailSenderService;
import com.company.pms.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final PasswordResetCodeRepository passwordResetCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailSenderService emailSenderService;
    private final long verificationCodeExpirationMinutes;
    private final boolean exposeVerificationCodeInResponse;

    public AuthService(
        UserRepository userRepository,
        RefreshTokenRepository refreshTokenRepository,
        EmailVerificationRepository emailVerificationRepository,
        PasswordResetCodeRepository passwordResetCodeRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        EmailSenderService emailSenderService,
        @org.springframework.beans.factory.annotation.Value("${app.verification.code-expiration-minutes}") long verificationCodeExpirationMinutes,
        @org.springframework.beans.factory.annotation.Value("${app.verification.expose-code-in-response:false}") boolean exposeVerificationCodeInResponse
    ) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.emailVerificationRepository = emailVerificationRepository;
        this.passwordResetCodeRepository = passwordResetCodeRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailSenderService = emailSenderService;
        this.verificationCodeExpirationMinutes = verificationCodeExpirationMinutes;
        this.exposeVerificationCodeInResponse = exposeVerificationCodeInResponse;
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        UserEntity user = userRepository.findByEmailIgnoreCase(request.email().trim().toLowerCase())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email is not verified");
        }

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User account is inactive");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        return issueTokens(user);
    }

    @Transactional
    public RegistrationResponse register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }

        UserEntity user = userRepository.save(
            UserEntity.builder()
                .userCode("PENDING")
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .roleName("USER")
                .active(false)
                .emailVerified(false)
                .build()
        );

        user.setUserCode("USR%06d".formatted(user.getId()));
        user = userRepository.save(user);

        VerificationDispatchResponse verificationDispatch = generateAndSendVerificationCode(user);

        return new RegistrationResponse(user.getId(), user.getUserCode(), user.getEmail(), verificationDispatch.message(), verificationDispatch.verificationCode());
    }

    @Transactional
    public AuthResponse verifyEmail(VerifyEmailRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        UserEntity user = userRepository.findByEmailIgnoreCase(normalizedEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        EmailVerificationEntity verification = emailVerificationRepository
            .findTopByEmailAndVerificationCodeAndConsumedFalseOrderByIdDesc(normalizedEmail, request.code())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification code"));

        if (verification.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Verification code expired");
        }

        verification.setConsumed(true);
        emailVerificationRepository.save(verification);

        user.setEmailVerified(true);
        user.setActive(true);
        userRepository.save(user);

        return issueTokens(user);
    }

    @Transactional
    public VerificationDispatchResponse resendVerificationCode(ResendVerificationCodeRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        UserEntity user = userRepository.findByEmailIgnoreCase(normalizedEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is already verified");
        }

        return generateAndSendVerificationCode(user);
    }

    @Transactional(readOnly = true)
    public VerificationStatusResponse verificationStatus(VerificationStatusRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        return userRepository.findByEmailIgnoreCase(normalizedEmail)
            .map(user -> new VerificationStatusResponse(
                user.getEmail(),
                true,
                Boolean.TRUE.equals(user.getEmailVerified()),
                Boolean.TRUE.equals(user.getActive())
            ))
            .orElseGet(() -> new VerificationStatusResponse(normalizedEmail, false, false, false));
    }

    @Transactional
    public PasswordResetDispatchResponse forgotPassword(ForgotPasswordRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        UserEntity user = userRepository.findByEmailIgnoreCase(normalizedEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return generateAndSendPasswordResetCode(user);
    }

    @Transactional
    public PasswordResetDispatchResponse resetPassword(ResetPasswordRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        UserEntity user = userRepository.findByEmailIgnoreCase(normalizedEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        PasswordResetCodeEntity resetCode = passwordResetCodeRepository
            .findTopByEmailAndResetCodeAndConsumedFalseOrderByIdDesc(normalizedEmail, request.code())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid reset code"));

        if (resetCode.getExpiresAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset code expired");
        }

        resetCode.setConsumed(true);
        passwordResetCodeRepository.save(resetCode);

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        return new PasswordResetDispatchResponse(user.getEmail(), "Password reset successful. You can now sign in with your new password.", null);
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshTokenEntity refreshToken = refreshTokenRepository.findByTokenAndRevokedFalse(request.refreshToken())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        if (refreshToken.getExpiresAt().isBefore(Instant.now())) {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expired");
        }

        UserEntity user = userRepository.findById(refreshToken.getUserId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        return issueTokens(user);
    }

    private AuthResponse issueTokens(UserEntity user) {
        String accessToken = jwtService.generateAccessToken(user.getEmail(), user.getRoleName());
        String refreshTokenValue = jwtService.generateRefreshToken(user.getEmail(), user.getRoleName());

        refreshTokenRepository.save(
            RefreshTokenEntity.builder()
                .userId(user.getId())
                .token(refreshTokenValue)
                .expiresAt(Instant.now().plusMillis(jwtService.getRefreshTokenExpirationMs()))
                .revoked(false)
                .build()
        );

        return new AuthResponse(
            accessToken,
            refreshTokenValue,
            "Bearer",
            new AuthResponse.UserProfile(user.getId(), user.getUserCode(), user.getFullName(), user.getEmail(), user.getRoleName())
        );
    }

    private VerificationDispatchResponse generateAndSendVerificationCode(UserEntity user) {
        for (EmailVerificationEntity existingVerification : emailVerificationRepository.findAllByEmailAndConsumedFalse(user.getEmail())) {
            existingVerification.setConsumed(true);
        }

        String verificationCode = "%06d".formatted(ThreadLocalRandom.current().nextInt(0, 1_000_000));
        emailVerificationRepository.save(
            EmailVerificationEntity.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .verificationCode(verificationCode)
                .expiresAt(Instant.now().plusSeconds(verificationCodeExpirationMinutes * 60))
                .consumed(false)
                .build()
        );

        EmailSenderService.DeliveryResult deliveryResult =
            emailSenderService.sendVerificationCode(user.getEmail(), user.getFullName(), verificationCode);

        return new VerificationDispatchResponse(
            user.getEmail(),
            deliveryResult.message(),
            exposeVerificationCodeInResponse && !deliveryResult.delivered() ? deliveryResult.verificationCode() : null
        );
    }

    private PasswordResetDispatchResponse generateAndSendPasswordResetCode(UserEntity user) {
        for (PasswordResetCodeEntity existingResetCode : passwordResetCodeRepository.findAllByEmailAndConsumedFalse(user.getEmail())) {
            existingResetCode.setConsumed(true);
        }

        String resetCode = "%06d".formatted(ThreadLocalRandom.current().nextInt(0, 1_000_000));
        passwordResetCodeRepository.save(
            PasswordResetCodeEntity.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .resetCode(resetCode)
                .expiresAt(Instant.now().plusSeconds(verificationCodeExpirationMinutes * 60))
                .consumed(false)
                .build()
        );

        EmailSenderService.DeliveryResult deliveryResult =
            emailSenderService.sendPasswordResetCode(user.getEmail(), user.getFullName(), resetCode);

        return new PasswordResetDispatchResponse(
            user.getEmail(),
            deliveryResult.message(),
            exposeVerificationCodeInResponse && !deliveryResult.delivered() ? deliveryResult.verificationCode() : null
        );
    }
}
