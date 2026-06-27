import { describe, test, expect } from "bun:test";
import { ScoreDimension } from "../../../src/domain/value-objects/score-dimension";

describe("ScoreDimension", () => {
  test("creates with valid integer 0-100", () => {
    expect(new ScoreDimension(0).value).toBe(0);
    expect(new ScoreDimension(50).value).toBe(50);
    expect(new ScoreDimension(100).value).toBe(100);
  });

  test("rejects negative values", () => {
    expect(() => new ScoreDimension(-1)).toThrow();
  });

  test("rejects values above 100", () => {
    expect(() => new ScoreDimension(101)).toThrow();
  });

  test("rejects non-integer values", () => {
    expect(() => new ScoreDimension(50.5)).toThrow();
    expect(() => new ScoreDimension(NaN)).toThrow();
  });

  test("value is readonly", () => {
    const dim = new ScoreDimension(42);
    expect(dim.value).toBe(42);
  });
});
