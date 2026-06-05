"use client";

import { useEffect, useState } from "react";
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

type ConformiteGaugeProps = {
  value: number;
  label?: string;
};

export function ConformiteGauge({ value, label = "Conformite globale" }: ConformiteGaugeProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const color = value >= 85 ? "#0f766e" : value >= 65 ? "#d97706" : "#dc2626";
  const data = [{ value, fill: color }];

  return (
    <div className="conformiteGauge">
      <div className="conformiteGaugeChart">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="65%"
              outerRadius="90%"
              data={data}
              startAngle={220}
              endAngle={-40}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background={{ fill: "#e2e8f0" }}
                dataKey="value"
                cornerRadius={8}
                angleAxisId={0}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        ) : (
          <div className="chartSkeleton" style={{ borderRadius: "50%", height: 120, width: 120 }} />
        )}
        <div className="conformiteGaugeCenter">
          <strong style={{ color }}>{value}%</strong>
          <span>objectif 85%</span>
          {value < 85 ? (
            <span className="conformiteGaugeEcart ecartNeg">−{85 - value}%</span>
          ) : (
            <span className="conformiteGaugeEcart ecartPos">+{value - 85}%</span>
          )}
        </div>
      </div>
      <p className="conformiteGaugeLabel">{label}</p>
    </div>
  );
}
