package com.company.pms.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PasswordResetCodeRepository extends JpaRepository<PasswordResetCodeEntity, Long> {

    List<PasswordResetCodeEntity> findAllByEmailAndConsumedFalse(String email);

    Optional<PasswordResetCodeEntity> findTopByEmailAndResetCodeAndConsumedFalseOrderByIdDesc(String email, String resetCode);
}
