"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function PredictionsHistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["predictions"],
    queryFn: async () => {
      const { data } = await axios.get("http://localhost:8000/api/v1/predictions?page=1&limit=10");
      return data;
    }
  });

  if (isLoading) return <LoadingSpinner />;[cite: 2]

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Historial de Predicciones</h1>
        <Link href="/predict" className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
          Nueva Predicción
        </Link>
      </div>

      <Card>[cite: 2]
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-4 text-sm font-medium text-gray-600">Fecha</th>
              <th className="p-4 text-sm font-medium text-gray-600">Diagnóstico</th>
              <th className="p-4 text-sm font-medium text-gray-600">Confianza</th>
              <th className="p-4 text-sm font-medium text-gray-600">Feedback</th>
              <th className="p-4 text-sm font-medium text-gray-600">Acción</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((item: any) => (
              <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="p-4 text-sm">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
                <td className="p-4 font-medium text-green-700">{item.label}</td>
                <td className="p-4 text-sm">
                  {(item.confidence * 100).toFixed(1)}%
                </td>
                <td className="p-4">
                  {item.feedback ? (
                    <StatusBadge status="low" label="Enviado" />
                  ) : (
                    <StatusBadge status="pending" label="Pendiente" />
                  )}
                </td>
                <td className="p-4">
                  <Link 
                    href={`/predictions/${item.id}`} 
                    className="text-blue-600 hover:underline text-sm font-medium"
                  >
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="p-4 flex justify-between items-center bg-gray-50 border-t">
          <p className="text-xs text-gray-500">
            Mostrando {data?.data.length} de {data?.meta.total} resultados
          </p>
        </div>
      </Card>
    </div>
  );
}