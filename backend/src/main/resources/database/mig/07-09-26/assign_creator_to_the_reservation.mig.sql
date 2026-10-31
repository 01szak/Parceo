-- liquibase formatted sql
-- changeset 01szak:assign_creator_to_the_reservation
-- validCheckSum: ANY
-- preconditions onFail:MARK_RAN
UPDATE reservation SET creator_id = (
    SELECT id FROM app_user WHERE role = 'ADMIN' LIMIT 1
) WHERE creator_id IS NULL