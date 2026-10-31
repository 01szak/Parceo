-- liquibase formatted sql
-- changeset 01szak:app_user_demo context:dev
-- preconditions onFail:MARK_RAN
-- precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM app_user

INSERT INTO app_user (id, login, username, email, password, role, created_at, updated_at)
VALUES                                                                                  -- cpsf
    (1, 'capitan', 'capitan', 'capitan@example.com', '$2a$12$i3cyOOX2Y/bow1DfAH74ru1c6nAgRV8lMwOrtdDHW4DMnvGyj3aq6', 'ADMIN', NOW(), NOW()),
    (2, 'deckhand', 'deckhand', 'deckhand@example.com', '$2a$12$kZv6wTHFbhH8rc8r6rdBtuCocdYeDW49c8WUwP5.i.HxkpNbuY5Qu', 'EMPLOYEE', NOW(), NOW());
