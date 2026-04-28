package com.company.pms.auth;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccountService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AccountService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public AccountProfileDto getCurrentProfile() {
        return toProfileDto(getCurrentUser());
    }

    @Transactional
    public AccountProfileDto updateCurrentProfile(UpdateProfileRequest request) {
        UserEntity user = getCurrentUser();
        user.setFullName(request.fullName().trim());
        user.setAvatarImage(normalizeAvatarImage(request.avatarImage()));
        return toProfileDto(userRepository.save(user));
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        UserEntity user = getCurrentUser();

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }

        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must be different from the current password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    private UserEntity getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }

        return userRepository.findByEmailIgnoreCase(authentication.getName())
            .filter(user -> Boolean.TRUE.equals(user.getActive()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private AccountProfileDto toProfileDto(UserEntity user) {
        return new AccountProfileDto(
            user.getId(),
            user.getUserCode(),
            user.getFullName(),
            user.getEmail(),
            user.getRoleName(),
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
