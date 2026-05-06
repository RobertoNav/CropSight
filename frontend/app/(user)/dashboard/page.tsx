// app/(user)/dashboard/page.tsx

import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";

async function getUser() {
  const res = await fetch("http://localhost:8000/api/v1/auth/me", {
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_TOKEN}`,
    },
    cache: "no-store",
  });

  return res.json();
}

async function getPredictions() {
  const res = await fetch("http://localhost:8000/api/v1/predictions?limit=5", {
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_TOKEN}`,
    },
    cache: "no-store",
  });

  return res.json();
}

export default async function DashboardPage() {
  const user = await getUser();
  const predictions = await getPredictions();

  const recentPredictions = predictions?.data || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Bienvenido, {user.name}
        </h1>
        <p className="text-gray-500">
          Aquí tienes un resumen de tu actividad en CropSight
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Predicciones Totales"
          value={predictions?.meta?.total || 0}
        />

        <MetricCard
          title="Última Predicción"
          value={
            recentPredictions[0]?.label || "Sin datos"
          }
        />

        <MetricCard
          title="Empresa"
          value={user.company_id ? "Asignada" : "Sin empresa"}
        />
      </div>

      {/* Recent Predictions */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">
          Predicciones Recientes
        </h2>

        <div className="space-y-3">
          {recentPredictions.length === 0 ? (
            <p className="text-gray-500">
              No tienes predicciones aún.
            </p>
          ) : (
            recentPredictions.map((pred: any) => (
              <div
                key={pred.id}
                className="flex justify-between items-center border-b pb-2"
              >
                <div>
                  <p className="font-medium">{pred.label}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(pred.created_at).toLocaleString()}
                  </p>
                </div>

                <Badge>
                  {(pred.confidence * 100).toFixed(1)}%
                </Badge>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
