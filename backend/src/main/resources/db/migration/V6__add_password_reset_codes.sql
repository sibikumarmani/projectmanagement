CREATE TABLE password_reset_codes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL,
    reset_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    consumed BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_password_reset_codes_user FOREIGN KEY (user_id) REFERENCES users(id)
);
