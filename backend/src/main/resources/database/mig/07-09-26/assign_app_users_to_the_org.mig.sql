-- liquibase formatted sql
-- changeset 01szak:aasing_org_to_app_users
-- validCheckSum: ANY
-- preconditions onFail:CONTINUE
-- precondition-sql-check expectedResult:1 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'organisation'
UPDATE app_user SET organisation_id = (
    SELECT id FROM organisation LIMIT 1
)