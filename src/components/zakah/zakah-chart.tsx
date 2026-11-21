"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClassifiedAsset } from "@/modules/zakah/types";
import { useText } from "@/components/layout/locale-provider";

const COLORS = ["#047857", "#10b981", "#34d399", "#a7f3d0", "#0f766e", "#14b8a6", "#5eead4", "#f59e0b", "#d97706"];

export function ZakahChart({ assets, currency }: { assets: ClassifiedAsset[]; currency: string }) {
  const TEXT = useText("charts");
  const data = assets.map((asset) => ({ name: asset.label, value: asset.valueInBase }));
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{TEXT.assetComposition}</CardTitle></CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={false}>
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
