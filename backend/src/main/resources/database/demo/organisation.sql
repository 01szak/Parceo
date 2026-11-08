-- liquibase formatted sql
-- changeset 01szak:organisation_demo context:dev
-- preconditions onFail:MARK_RAN
-- precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM organisation

-- the booking website key is not a real BCrypt hash, so website authentication is refused locally
INSERT INTO organisation (id, owner_id, organisation_name, address, phone_number, email, web_app_api_key, created_at, updated_at)
VALUES
    (1, 1, 'Leśna Polana', 'ul. Leśna 1, 76-032 Mielno', '+48 600 100 200', 'kontakt@lesnapolana.example.com', 'dev-website-key-not-bcrypt', NOW(), NOW());

UPDATE app_user SET organisation_id = 1 WHERE id IN (1, 2);

