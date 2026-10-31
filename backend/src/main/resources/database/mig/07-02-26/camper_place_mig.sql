-- liquibase formatted sql
-- changeset 01szak:camper_place_mig
-- validCheckSum: ANY
-- preconditions onFail:MARK_RAN
-- precondition-sql-check expectedResult:1 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'camper_places'

INSERT INTO camper_place (id, number, price, created_at, updated_at)
SELECT id, number, price, created_at, updated_at
FROM camper_places;

-- rollback DELETE FROM camper_place;
