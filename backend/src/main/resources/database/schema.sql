-- liquibase formatted sql

-- changeset 01szak:schema
-- validCheckSum: ANY
-- preconditions onFail:MARK_RAN
-- precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'app_user'
CREATE TABLE IF NOT EXISTS app_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(100) NOT NULL,
    username VARCHAR(100),
    email VARCHAR(150),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at DATETIME,
    updated_at DATETIME,
    CONSTRAINT unique_app_user_email UNIQUE (email),
    UNIQUE KEY ux_employees_login (login)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- changeset 01szak:guest_table
-- validCheckSum: ANY
-- preconditions onFail:MARK_RAN
-- precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'guest'
CREATE TABLE IF NOT EXISTS guest (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    firstname VARCHAR(100),
    lastname VARCHAR(100),
    email VARCHAR(150),
    phone_number VARCHAR(50),
    car_registration VARCHAR(50),
    created_at DATETIME,
    updated_at DATETIME,
    CONSTRAINT unique_guest_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- changeset 01szak:camper_place_table
-- validCheckSum: ANY
-- preconditions onFail:MARK_RAN
-- precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'camper_place'
CREATE TABLE IF NOT EXISTS camper_place (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    number VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NULL,
    created_at DATETIME,
    updated_at DATETIME,
    CHECK (price > 0),
    UNIQUE KEY ux_camper_places_number (number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- changeset 01szak:reservation_table
-- validCheckSum: ANY
-- preconditions onFail:MARK_RAN
-- precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'reservation'
CREATE TABLE IF NOT EXISTS reservation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    checkin DATE NOT NULL,
    checkout DATE NOT NULL,
    camper_place_id BIGINT NOT NULL,
    guest_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    price DECIMAL(10,2) NOT NULL,
    created_at DATETIME,
    updated_at DATETIME,
    CHECK (price > 0),
    CHECK (checkout > checkin),
    CONSTRAINT fk_reservations_camper_place
    FOREIGN KEY (camper_place_id)
    REFERENCES camper_place(id),
    CONSTRAINT fk_reservations_guest
    FOREIGN KEY (guest_id)
    REFERENCES guest(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- changeset 01szak:camper_place_type_table
-- validCheckSum: ANY
-- preconditions onFail:MARK_RAN
-- precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'camper_place_type'
CREATE TABLE IF NOT EXISTS camper_place_type (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(255) NOT NULL,
    price DECIMAL(19,2) NOT NULL,
    created_at DATETIME,
    updated_at DATETIME,
    UNIQUE KEY ux_type_name (type_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- changeset 01szak:camper_place_type_col
-- validCheckSum: ANY
-- preconditions onFail:MARK_RAN
-- precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'camper_place' AND column_name = 'camper_place_type_id'
ALTER TABLE camper_place
    ADD COLUMN camper_place_type_id BIGINT;

-- changeset 01szak:camper_place_type_fk
-- validCheckSum: ANY
-- preconditions onFail:MARK_RAN
-- precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.key_column_usage WHERE table_schema = DATABASE() AND table_name = 'camper_place' AND constraint_name = 'fk_camper_place_type'
ALTER TABLE camper_place
    ADD CONSTRAINT fk_camper_place_type
    FOREIGN KEY (camper_place_type_id)
        REFERENCES camper_place_type(id)
        ON DELETE RESTRICT;

-- changeset 01szak:guest_country_col
-- validCheckSum: ANY
-- preconditions onFail:MARK_RAN
-- precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'guest' AND column_name = 'country'
ALTER TABLE guest
    ADD COLUMN country VARCHAR(2);

-- changeset 01szak:organisation_table
-- validCheckSum: ANY
-- preconditions onFail:MARK_RAN
-- precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'organisation'
CREATE TABLE IF NOT EXISTS organisation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    organisation_name VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    web_app_api_key VARCHAR(255) NOT NULL,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (owner_id) REFERENCES app_user(id),
    UNIQUE KEY uk_owner_id (owner_id),
    UNIQUE KEY uk_api_key (web_app_api_key)
);

-- changeset 01szak:organisation_column
-- validCheckSum: ANY
-- preconditions onFail:MARK_RAN
-- precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'app_user' AND column_name = 'organisation_id'
ALTER TABLE app_user
    ADD COLUMN organisation_id BIGINT,
    ADD CONSTRAINT fk_organisation_id
        FOREIGN KEY (organisation_id)
            REFERENCES organisation(id)
            ON DELETE RESTRICT;
-- changeset 01szak:creator_column
-- validCheckSum: ANY
-- preconditions onFail:MARK_RAN
-- precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'reservation' AND column_name = 'creator_id'
ALTER TABLE reservation
ADD COLUMN creator_id BIGINT,
ADD CONSTRAINT fk_creator_id
    FOREIGN KEY (creator_id)
        REFERENCES app_user(id)
        ON DELETE no action;

-- changeset 01szak:system_task_table
-- validCheckSum: ANY
-- preconditions onFail:MARK_RAN
-- precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'system_task'
CREATE TABLE IF NOT EXISTS system_task (
    id BIGINT AUTO_INCREMENT PRIMARY KEY NOT NULL,
    created_at DATETIME,
    updated_at DATETIME,
    target_id VARCHAR(36),
    payload JSON,
    task_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    task_type VARCHAR(50) NOT NULL,
    retryable BOOLEAN DEFAULT FALSE,
    retry_count BIGINT,
    parent_task_id BIGINT,
    execution_date DATETIME,
    status_message VARCHAR(255),
    CONSTRAINT fk_system_task_parent FOREIGN KEY (parent_task_id) REFERENCES system_task(id)
);
