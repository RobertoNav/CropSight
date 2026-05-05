"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import axios from "axios";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function PredictionDetailPage() {
  const { id } = useParams();

  const { data: prediction, isLoading } = useQuery({
    queryKey: ["prediction", id],
    queryFn: async () => {
      const { data } = await axios.get(`http://localhost:8000/api/v1/predictions/${id}`);
      return data;
    }
  });

  if (isLoading) return <p className="p-10 text-center">Cargando detalle...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="p-6">
        <h1 className="text-xl font-bold mb-4">Detalle del Diagnóstico</h1>
        <img 
          src={prediction.image_url} 
          className="w-full rounded-lg mb-6 shadow-sm" 
          alt="Original" 
        />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500 text-xs uppercase font-bold">Resultado</p>
            <p className="text-lg font-semibold">{prediction.label}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-bold">Confianza</p>
            <p className="text-lg">{(prediction.confidence * 100).toFixed(2)}%</p>
          </div>
        </div>

        {/* Muestra el feedback histórico si existe  */}
        {prediction.feedback && (
          <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-lg">
            <h3 className="text-sm font-bold text-green-800 mb-2">Feedback Registrado:</h3>
            <p className="text-sm text-green-700">
              ¿Fue correcto? {prediction.feedback.is_correct ? "Sí" : "No"}
            </p>
            {!prediction.feedback.is_correct && (
              <p className="text-sm text-green-700">
                Etiqueta correcta: <Badge>{prediction.feedback.correct_label}</Badge>
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}