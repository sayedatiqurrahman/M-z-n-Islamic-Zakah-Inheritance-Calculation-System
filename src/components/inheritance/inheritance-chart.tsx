"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HeirOutcome } from "@/modules/inheritance/types";
import { heirLabel } from "./heir-catalog";
import { useLocale, useText } from "@/components/layout/locale-provider";

const COLORS = ["#047857", "#10b981", "#34d399", "#0f766e", "#14b8a6", "#5eead4", "#f59e0b", "#d97706", "#84cc16", "#65a30d"];

export function InheritanceChart({ outcomes, currency }: { outcomes: HeirOutcome[]; currency: string }) {
  const { locale } = useLocale();
  const TEXT = useText("charts");
  const data = outcomes
    .filter((o) => (o.amount ?? 0) > 0)
    .map((o) => ({ name: heirLabel(o.type, locale), value: o.amount ?? 0 }));

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{TEXT.distribution}</CardTitle></CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
              {data.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(value) => `${Number(value).toLocaleString("en-US")} ${currency}`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
