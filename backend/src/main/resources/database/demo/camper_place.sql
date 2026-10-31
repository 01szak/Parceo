-- liquibase formatted sql
-- changeset 01szak:camper_place_demo context:dev
-- validCheckSum: ANY
-- preconditions onFail:MARK_RAN
-- precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM camper_place

INSERT INTO camper_place (id, number, price, camper_place_type_id, created_at, updated_at)
VALUES
    (1, '01', NULL, 1, NOW(), NOW()),
    (2, '02', 85.00, 2, NOW(), NOW()),
    (3, '03', NULL, 3, NOW(), NOW()),
    (4, '04', 35.00, 4, NOW(), NOW()),
    (5, '05', NULL, 5, NOW(), NOW()),
    (6, '06', NULL, 1, NOW(), NOW()),
    (7, '07', NULL, 2, NOW(), NOW()),
    (8, '08', 130.00, 3, NOW(), NOW()),
    (9, '09', NULL, 4, NOW(), NOW()),
    (10, '10', NULL, 5, NOW(), NOW()),
    (11, '11', 55.00, 1, NOW(), NOW()),
    (12, '12', NULL, 2, NOW(), NOW()),
    (13, '13', NULL, 3, NOW(), NOW()),
    (14, '14', NULL, 4, NOW(), NOW()),
    (15, '15', NULL, 5, NOW(), NOW()),
    (16, '16', 60.00, 1, NOW(), NOW()),
    (17, '17', NULL, 2, NOW(), NOW()),
    (18, '18', NULL, 3, NOW(), NOW()),
    (19, '19', NULL, 4, NOW(), NOW()),
    (20, '20', NULL, 5, NOW(), NOW());
