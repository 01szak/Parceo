-- liquibase formatted sql
-- changeset 01szak:insert_camper_place_type
-- validCheckSum: ANY
-- preconditions onFail:MARK_RAN
-- precondition-sql-check expectedResult:1 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'camper_place' AND column_name = 'camperPlaceType'

INSERT IGNORE INTO camper_place_type (type_name, price, created_at, updated_at)
SELECT type, MIN(price), NOW(), NOW()
FROM camper_place
WHERE type IS NOT NULL
GROUP BY type;

-- rollback DELETE FROM camper_place_type;