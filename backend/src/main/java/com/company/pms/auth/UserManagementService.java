package com.company.pms.auth;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class UserManagementService {

    private final UserRepository userRepository;
    private final PasswordResetCodeRepository passwordResetCodeRepository;
    private final PasswordEncoder passwordEncoder;

    public UserManagementService(
        UserRepository userRepository,
        PasswordResetCodeRepository passwordResetCodeRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordResetCodeRepository = passwordResetCodeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserManagementDto> getUsers() {
        return userRepository.findAllByOrderByFullNameAscIdAsc().stream()
            .map(this::toDto)
            .toList();
    }

    @Transactional
    public UserManagementDto createUser(UserUpsertRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }

        if (request.password() == null || request.password().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required for a new user");
        }

        UserEntity user = userRepository.save(
            UserEntity.builder()
                .userCode("PENDING")
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .roleName(request.roleName().trim().toUpperCase())
                .active(request.active())
                .emailVerified(request.emailVerified())
                .avatarImage(normalizeAvatarImage(request.avatarImage()))
                .build()
        );

        user.setUserCode("USR%06d".formatted(user.getId()));
        return toDto(userRepository.save(user));
    }

    @Transactional
    public UserManagementDto updateUser(Long id, UserUpsertRequest request) {
        UserEntity user = userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String normalizedEmail = request.email().trim().toLowerCase();
        userRepository.findByEmailIgnoreCase(normalizedEmail)
            .filter(existing -> !existing.getId().equals(id))
            .ifPresent(existing -> {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
            });

        user.setFullName(request.fullName().trim());
        user.setEmail(normalizedEmail);
        user.setRoleName(request.roleName().trim().toUpperCase());
        user.setActive(request.active());
        user.setEmailVerified(request.emailVerified());
        user.setAvatarImage(normalizeAvatarImage(request.avatarImage()));

        if (request.password() != null && !request.password().trim().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        return toDto(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public UserResetCodeViewDto getLatestResetCode(Long id) {
        UserEntity user = userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return passwordResetCodeRepository.findTopByUserIdOrderByIdDesc(id)
            .map(resetCode -> new UserResetCodeViewDto(
                user.getId(),
                user.getUserCode(),
                user.getFullName(),
                user.getEmail(),
                resetCode.getResetCode(),
                resetCode.getExpiresAt(),
                resetCode.getConsumed(),
                true
            ))
            .orElseGet(() -> new UserResetCodeViewDto(
                user.getId(),
                user.getUserCode(),
                user.getFullName(),
                user.getEmail(),
                null,
                null,
                null,
                false
            ));
    }

    private UserManagementDto toDto(UserEntity user) {
        return new UserManagementDto(
            user.getId(),
            user.getUserCode(),
            user.getFullName(),
            user.getEmail(),
            user.getRoleName(),
            user.getActive(),
            user.getEmailVerified(),
            user.getAvatarImage()
        );
    }

    private String normalizeAvatarImage(String avatarImage) {
        if (avatarImage == null) {
            return null;
        }

        String trimmed = avatarImage.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        if (!trimmed.startsWith("data:image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile image must be a valid image data URL");
        }

        if (trimmed.length() > 2_000_000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile image is too large");
        }

        return trimmed;
    }
}
