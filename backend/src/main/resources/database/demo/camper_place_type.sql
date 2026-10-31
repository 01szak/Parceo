-- liquibase formatted sql
-- changeset 01szak:camper_place_type context:dev
-- preconditions onFail:MARK_RAN
-- precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM camper_place_type

INSERT INTO camper_place_type (id, type_name, price, created_at, updated_at)
VALUES
    (1, 'Standard', 50.00, NOW(), NOW()),
    (2, 'Premium', 80.00, NOW(), NOW()),
    (3, 'Luxury', 120.00, NOW(), NOW()),
    (4, 'Tent', 30.00, NOW(), NOW()),
    (5, 'RV', 100.00, NOW(), NOW());