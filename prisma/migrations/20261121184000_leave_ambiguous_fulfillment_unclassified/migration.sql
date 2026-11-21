-- An item with both a production task and an OUT movement has conflicting
-- evidence. The timestamps do not reliably identify its latest fulfillment
-- state, so leave it unclassified for the Batch 1 audit and manual review.
UPDATE "order_items" AS oi
SET "fulfillmentType" = NULL
WHERE EXISTS (
  SELECT 1
  FROM "production_tasks" AS pt
  WHERE pt."orderItemId" = oi.id
)
AND EXISTS (
  SELECT 1
  FROM "variant_stock_movements" AS vsm
  WHERE vsm."orderItemId" = oi.id
    AND vsm."type" = 'OUT'
);
