-- liquibase formatted sql
-- changeset 01szak:update_countries_for_guests
-- validCheckSum: ANY
-- preconditions onFail:MARK_RAN
-- precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM guest WHERE country IS NOT NULL

UPDATE guest
SET country = CASE
                  WHEN phone_number LIKE '+1242%' THEN 'BS'
                  WHEN phone_number LIKE '+1246%' THEN 'BB'
                  WHEN phone_number LIKE '+1268%' THEN 'AG'
                  WHEN phone_number LIKE '+1473%' THEN 'GD'
                  WHEN phone_number LIKE '+1758%' THEN 'LC'
                  WHEN phone_number LIKE '+1767%' THEN 'DM'
                  WHEN phone_number LIKE '+1784%' THEN 'VC'
                  WHEN phone_number LIKE '+1809%' THEN 'DO'
                  WHEN phone_number LIKE '+1868%' THEN 'TT'
                  WHEN phone_number LIKE '+1869%' THEN 'KN'
                  WHEN phone_number LIKE '+1876%' THEN 'JM'
                  WHEN phone_number LIKE '+351%' THEN 'PT'
                  WHEN phone_number LIKE '+352%' THEN 'LU'
                  WHEN phone_number LIKE '+353%' THEN 'IE'
                  WHEN phone_number LIKE '+354%' THEN 'IS'
                  WHEN phone_number LIKE '+355%' THEN 'AL'
                  WHEN phone_number LIKE '+356%' THEN 'MT'
                  WHEN phone_number LIKE '+357%' THEN 'CY'
                  WHEN phone_number LIKE '+358%' THEN 'FI'
                  WHEN phone_number LIKE '+359%' THEN 'BG'
                  WHEN phone_number LIKE '+370%' THEN 'LT'
                  WHEN phone_number LIKE '+371%' THEN 'LV'
                  WHEN phone_number LIKE '+372%' THEN 'EE'
                  WHEN phone_number LIKE '+373%' THEN 'MD'
                  WHEN phone_number LIKE '+375%' THEN 'BY'
                  WHEN phone_number LIKE '+376%' THEN 'AD'
                  WHEN phone_number LIKE '+377%' THEN 'MC'
                  WHEN phone_number LIKE '+378%' THEN 'SM'
                  WHEN phone_number LIKE '+380%' THEN 'UA'
                  WHEN phone_number LIKE '+381%' THEN 'RS'
                  WHEN phone_number LIKE '+385%' THEN 'HR'
                  WHEN phone_number LIKE '+386%' THEN 'SI'
                  WHEN phone_number LIKE '+387%' THEN 'BA'
                  WHEN phone_number LIKE '+420%' THEN 'CZ'
                  WHEN phone_number LIKE '+421%' THEN 'SK'
                  WHEN phone_number LIKE '+501%' THEN 'BZ'
                  WHEN phone_number LIKE '+502%' THEN 'GT'
                  WHEN phone_number LIKE '+503%' THEN 'SV'
                  WHEN phone_number LIKE '+504%' THEN 'HN'
                  WHEN phone_number LIKE '+505%' THEN 'NI'
                  WHEN phone_number LIKE '+506%' THEN 'CR'
                  WHEN phone_number LIKE '+507%' THEN 'PA'
                  WHEN phone_number LIKE '+509%' THEN 'HT'
                  WHEN phone_number LIKE '+591%' THEN 'BO'
                  WHEN phone_number LIKE '+592%' THEN 'GY'
                  WHEN phone_number LIKE '+593%' THEN 'EC'
                  WHEN phone_number LIKE '+595%' THEN 'PY'
                  WHEN phone_number LIKE '+597%' THEN 'SR'
                  WHEN phone_number LIKE '+598%' THEN 'UY'
                  WHEN phone_number LIKE '+30%' THEN 'GR'
                  WHEN phone_number LIKE '+32%' THEN 'BE'
                  WHEN phone_number LIKE '+33%' THEN 'FR'
                  WHEN phone_number LIKE '+34%' THEN 'ES'
                  WHEN phone_number LIKE '+36%' THEN 'HU'
                  WHEN phone_number LIKE '+39%' THEN 'IT'
                  WHEN phone_number LIKE '+40%' THEN 'RO'
                  WHEN phone_number LIKE '+41%' THEN 'CH'
                  WHEN phone_number LIKE '+43%' THEN 'AT'
                  WHEN phone_number LIKE '+44%' THEN 'GB'
                  WHEN phone_number LIKE '+45%' THEN 'DK'
                  WHEN phone_number LIKE '+46%' THEN 'SE'
                  WHEN phone_number LIKE '+47%' THEN 'NO'
                  WHEN phone_number LIKE '+48%' THEN 'PL'
                  WHEN phone_number LIKE '+49%' THEN 'DE'
                  WHEN phone_number LIKE '+51%' THEN 'PE'
                  WHEN phone_number LIKE '+52%' THEN 'MX'
                  WHEN phone_number LIKE '+53%' THEN 'CU'
                  WHEN phone_number LIKE '+54%' THEN 'AR'
                  WHEN phone_number LIKE '+55%' THEN 'BR'
                  WHEN phone_number LIKE '+56%' THEN 'CL'
                  WHEN phone_number LIKE '+57%' THEN 'CO'
                  WHEN phone_number LIKE '+58%' THEN 'VE'
                  WHEN phone_number LIKE '+90%' THEN 'TR'
                  WHEN phone_number LIKE '+1%' THEN 'US'
                  ELSE country
    END
WHERE country IS NULL AND phone_number IS NOT NULL;

UPDATE guest
SET country = CASE
                  WHEN LOWER(email) LIKE '%.pl' THEN 'PL'
                  WHEN LOWER(email) LIKE '%.de' THEN 'DE'
                  WHEN LOWER(email) LIKE '%.cz' THEN 'CZ'
                  WHEN LOWER(email) LIKE '%.sk' THEN 'SK'
                  WHEN LOWER(email) LIKE '%.co.uk' OR LOWER(email) LIKE '%.uk' THEN 'GB'
                  WHEN LOWER(email) LIKE '%.fr' THEN 'FR'
                  WHEN LOWER(email) LIKE '%.it' THEN 'IT'
                  WHEN LOWER(email) LIKE '%.es' THEN 'ES'
                  WHEN LOWER(email) LIKE '%.se' THEN 'SE'
                  WHEN LOWER(email) LIKE '%.no' THEN 'NO'
                  WHEN LOWER(email) LIKE '%.dk' THEN 'DK'
                  WHEN LOWER(email) LIKE '%.nl' THEN 'NL'
                  ELSE country
    END
WHERE country IS NULL AND email IS NOT NULL;

UPDATE guest
SET country = CASE
                  WHEN UPPER(car_registration) LIKE 'PL %' OR UPPER(car_registration) LIKE 'PL-%' THEN 'PL'
                  WHEN UPPER(car_registration) LIKE 'D %'  OR UPPER(car_registration) LIKE 'D-%'  THEN 'DE'
                  WHEN UPPER(car_registration) LIKE 'CZ %' OR UPPER(car_registration) LIKE 'CZ-%' THEN 'CZ'
                  WHEN UPPER(car_registration) LIKE 'SK %' OR UPPER(car_registration) LIKE 'SK-%' THEN 'SK'
                  WHEN UPPER(car_registration) LIKE 'GB %' OR UPPER(car_registration) LIKE 'GB-%' OR UPPER(car_registration) LIKE 'UK %' THEN 'GB'
                  WHEN UPPER(car_registration) LIKE 'F %'  OR UPPER(car_registration) LIKE 'F-%'  THEN 'FR'
                  WHEN UPPER(car_registration) LIKE 'I %'  OR UPPER(car_registration) LIKE 'I-%'  THEN 'IT'
                  WHEN UPPER(car_registration) LIKE 'E %'  OR UPPER(car_registration) LIKE 'E-%'  THEN 'ES'
                  ELSE country
    END
WHERE country IS NULL AND car_registration IS NOT NULL;