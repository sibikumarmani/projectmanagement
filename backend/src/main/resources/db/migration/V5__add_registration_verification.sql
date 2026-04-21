ALTER TABLE users
    ADD COLUMN user_code VARCHAR(40) NOT NULL DEFAULT 'PENDING';
ALTER TABLE users
    ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE email_verifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    email VARCHAR(255) NOT NULL,
    verification_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    consumed BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_email_verifications_user FOREIGN KEY (user_id) REFERENCES users(id)
);

UPDATE users
SET user_code = 'USR000001',
    email_verified = TRUE
WHERE id = 1;
