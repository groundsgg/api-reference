import { z } from "zod";

const keyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const relativeSpecPathPattern =
  /^[a-z0-9][a-z0-9._/-]*\.(?:json|ya?ml)$/;

const apiSourceSchema = z.object({
  id: z.string().regex(keyPattern),
  title: z.string().trim().min(1).max(80),
  slug: z.string().regex(keyPattern),
  path: z
    .string()
    .refine(
      (value) =>
        relativeSpecPathPattern.test(value) &&
        !value.startsWith("/") &&
        !value.split("/").includes("..") &&
        !value.includes("://"),
      "Source path must be a safe relative OpenAPI path",
    ),
  default: z.boolean(),
}).strict();

const apiSourceRegistrySchema = z
  .object({
    schemaVersion: z.literal(1),
    sources: z.array(apiSourceSchema),
  })
  .strict()
  .superRefine((registry, context) => {
    const uniqueFields = ["id", "slug", "path"] as const;

    for (const field of uniqueFields) {
      const values = registry.sources.map((source) => source[field]);
      if (new Set(values).size !== values.length) {
        context.addIssue({
          code: "custom",
          message: `Source ${field} values must be unique`,
          path: ["sources"],
        });
      }
    }

    const defaultCount = registry.sources.filter(
      (source) => source.default,
    ).length;
    if (registry.sources.length > 0 && defaultCount !== 1) {
      context.addIssue({
        code: "custom",
        message: "A non-empty registry must have exactly one default source",
        path: ["sources"],
      });
    }
  });

export type ApiSourceRegistry = z.infer<typeof apiSourceRegistrySchema>;

export function parseApiSourceRegistry(input: unknown): ApiSourceRegistry {
  return apiSourceRegistrySchema.parse(input);
}
