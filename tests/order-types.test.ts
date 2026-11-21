import assert from "node:assert/strict";
import test from "node:test";
import {
  canFulfillFromStock,
  isAllowedWebOrderDate,
  minimumPreOrderDate,
} from "@/lib/order-types";

test("minimum preorder date advances by three Jakarta calendar days", () => {
  assert.equal(
    minimumPreOrderDate(new Date("2026-11-21T16:59:00.000Z")),
    "2026-11-24",
  );
  assert.equal(
    minimumPreOrderDate(new Date("2026-11-21T17:01:00.000Z")),
    "2026-11-25",
  );
});

test("web dates allow today and H+3, but reject H+1, H+2 and invalid dates", () => {
  const now = new Date("2026-11-21T12:00:00.000Z");

  assert.equal(isAllowedWebOrderDate("2026-11-21", now), true);
  assert.equal(isAllowedWebOrderDate("2026-11-22", now), false);
  assert.equal(isAllowedWebOrderDate("2026-11-23", now), false);
  assert.equal(isAllowedWebOrderDate("2026-11-24", now), true);
  assert.equal(isAllowedWebOrderDate("2026-02-31", now), false);
});

test("stock eligibility aggregates duplicate variants and rejects partial carts", () => {
  assert.equal(
    canFulfillFromStock(
      [
        { variantId: "variant-a", quantity: 2 },
        { variantId: "variant-a", quantity: 3 },
        { variantId: "variant-b", quantity: 1 },
      ],
      { "variant-a": 5, "variant-b": 1 },
    ),
    true,
  );
  assert.equal(
    canFulfillFromStock(
      [
        { variantId: "variant-a", quantity: 2 },
        { variantId: "variant-a", quantity: 3 },
      ],
      { "variant-a": 4 },
    ),
    false,
  );
  assert.equal(
    canFulfillFromStock([{ variantId: null, quantity: 1 }], {}),
    false,
  );
});
