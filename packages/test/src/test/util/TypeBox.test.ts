import { Type } from "typebox";
import { describe, expect, test } from "bun:test";
import { simplifySchema } from "@podley/util";

describe("simplifySchema", () => {
  test("should throw error for undefined schema", () => {
    expect(() => simplifySchema(undefined as any)).toThrow("Schema is undefined");
  });

  test("should return Any schema as is", () => {
    const schema = Type.Any();
    expect(simplifySchema(schema)).toEqual(schema);
  });

  test("should simplify union of base type and array of same type", () => {
    const schema = Type.Union([Type.String(), Type.Array(Type.String())]);
    const result = simplifySchema(schema);
    expect(result).toEqual(Type.String({ isArray: true }));
  });

  test("should preserve annotations when simplifying union", () => {
    const schema1 = Type.Union([Type.String(), Type.Array(Type.String())], {
      title: "MyString",
      description: "A string or array of strings",
    });
    const result1 = simplifySchema(schema1);
    expect(result1).toEqual(
      Type.String({
        title: "MyString",
        description: "A string or array of strings",
        isArray: true,
      })
    );
    const schema2 = Type.Union([
      Type.String({
        title: "MyString",
        description: "A string or array of strings",
      }),
      Type.Array(Type.String()),
    ]);
    const result2 = simplifySchema(schema2);
    expect(result2).toEqual(
      Type.String({
        title: "MyString",
        description: "A string or array of strings",
        isArray: true,
      })
    );
  });

  test("should handle nullable types", () => {
    const schema = Type.Union([Type.String(), Type.Null()]);
    const result = simplifySchema(schema);
    expect(result).toEqual(
      Type.String({
        isNullable: true,
        default: null,
      })
    );
  });

  test("should recursively simplify object properties", () => {
    const schema = Type.Object({
      name: Type.Union([Type.String(), Type.Array(Type.String())]),
      age: Type.Union([Type.Number(), Type.Null()]),
    });
    const result = simplifySchema(schema);
    expect(result).toEqual(
      Type.Object({
        name: Type.String({ isArray: true }),
        age: Type.Number({ isNullable: true, default: null }),
      })
    );
  });

  test("should recursively simplify array items", () => {
    const schema = Type.Array(Type.Union([Type.String(), Type.Array(Type.String())]));
    const result = simplifySchema(schema);
    expect(result).toEqual(Type.Array(Type.String({ isArray: true })));
  });

  test("should preserve optional flag and default values", () => {
    const schema = Type.Object({
      name: Type.Optional(Type.String({ default: "John" })),
    });
    const result = simplifySchema(schema) as any;
    expect(result.type).toBe("object");
    expect(result.properties.name.type).toBe("string");
    expect(result.properties.name.default).toBe("John");
    expect(result.properties.name.optional).toBe(true);
    expect(result.properties.name.isNullable).toBe(true);
  });

  test("should handle complex nested structures", () => {
    const schema = Type.Object({
      user: Type.Object({
        name: Type.Union([Type.String(), Type.Array(Type.String())]),
        addresses: Type.Array(Type.Union([Type.String(), Type.Array(Type.String())])),
      }),
    });
    const result = simplifySchema(schema);
    expect(result).toEqual(
      Type.Object({
        user: Type.Object({
          name: Type.String({ isArray: true }),
          addresses: Type.Array(Type.String({ isArray: true })),
        }),
      })
    );
  });
});
