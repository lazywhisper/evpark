-- Rename price_eur column to price_usd. Conversion is now via NBRB rates,
-- output stored in USD (parsers compute toUsd at fetch time). Existing rows
-- still hold EUR values until next bootstrap UPDATEs them.
ALTER TABLE `listings` RENAME COLUMN `price_eur` TO `price_usd`;
