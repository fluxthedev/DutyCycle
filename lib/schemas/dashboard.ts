import { z } from "zod";

const kpiFormatSchema = z.enum(["decimal", "percent", "unit"]);

export const kpiSchema = z.object({
  label: z.string().min(1),
  value: z.number().nonnegative(),
  unit: z.string().optional(),
  format: kpiFormatSchema.default("decimal")
});

export type KPI = z.infer<typeof kpiSchema>;

export const dashboardSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  kpis: z.array(kpiSchema)
});

export type DashboardConfig = z.infer<typeof dashboardSchema>;
