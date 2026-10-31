-- liquibase formatted sql
-- changeset 01szak:user_to_guest_mig
-- validCheckSum: ANY
-- preconditions onFail:MARK_RAN
-- precondition-sql-check expectedResult:1 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'users'

ALTER TABLE users MODIFY email VARCHAR(150) NULL;
UPDATE users SET email = NULL WHERE email = '';
-- Intentional one-way cleanup: nullify invalid emails from pre-validation era
UPDATE users SET email = NULL WHERE email NOT LIKE '%@%';


INSERT INTO guest (id, firstname, lastname, email, phone_number, car_registration, created_at, updated_at)
SELECT id, first_name, last_name, email , phone_number, car_registration, created_at, updated_at
FROM users;

-- rollback DELETE FROM guest WHERE id IN (SELECT id FROM users);
