-- liquibase formatted sql

-- changeset 01szak:insert_transactions_based_on_reservation_price
-- validCheckSum: ANY
-- preconditions onFail:MARK_RAN
-- precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM payment_transaction

SET @start_id = (SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE table_schema = DATABASE() AND table_name = 'payment_transaction');

INSERT INTO payment_transaction(created_at, updated_at, currency, ammount, transaction_type, organisation_id)
SELECT r.created_at, r.updated_at, 'PLN', r.price, 'RESERVATION_PAYMENT', org.id
FROM reservation as r
JOIN app_user as u on r.creator_id = u.id
JOIN organisation as org on u.organisation_id = org.id
WHERE r.paid = TRUE
ORDER BY r.id;

INSERT INTO reservation_payment_transaction(id, reservation_id)
SELECT @start_id - 1 + ROW_NUMBER() OVER (ORDER BY r.id), r.id
FROM reservation r
JOIN app_user as u on r.creator_id = u.id
JOIN organisation as org on u.organisation_id = org.id
WHERE r.paid = TRUE
ORDER BY r.id;

