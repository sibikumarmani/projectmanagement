package com.company.pms.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EmailVerificationRepository extends JpaRepository<EmailVerificationEntity, Long> {

    Optional<EmailVerificationEntity> findTopByEmailAndVerificationCodeAndConsumedFalseOrderByIdDesc(String email, String verificationCode);

    List<EmailVerificationEntity> findAllByEmailAndConsumedFalse(String email);
}
