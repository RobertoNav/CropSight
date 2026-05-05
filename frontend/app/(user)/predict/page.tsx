"use client";

import { useState } from "react";
import { ImageUploader } from "@/components/forms/ImageUploader";
import { PredictionResponse } from "@/hooks/usePrediction";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";import { FeedbackForm } from "@/components/forms/FeedbackForm";

export default function PredictPage() {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-800">Nueva Predicción</h1>
        <p className="text-gray-600">Sube una foto de tu cultivo para obtener un diagnóstico inmediato.</p>
      </header>

      {!prediction ? (
        <Card className="p-10">
          <ImageUploader onUploadSuccess={(data) => setPrediction(data)} />
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="p-6 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8">
              <img 
                src={prediction.image_url} 
                alt="Cultivo analizado" 
                className="w-full h-auto rounded-lg object-cover shadow-sm"
              />
              <div className="space-y-4">
                <div>
                  <h2 className="text-sm font-medium text-gray-500 uppercase">Resultado del Modelo</h2>
                  <p className="text-2xl font-bold text-green-700">{prediction.label}</p>
                </div>
                
                <div>
                  <h2 className="text-sm font-medium text-gray-500 uppercase">Confianza</h2>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${prediction.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-bold">{(prediction.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <Badge variant="info">Versión del modelo: {prediction.model_version}</Badge>

                <div className="pt-4">
                  <button 
                    onClick={() => setPrediction(null)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    ← Realizar otro análisis
                  </button>
                </div>
              </div>
            </div>
          </Card>
          {prediction && (
            <FeedbackForm 
                predictionId={prediction.id} 
                onSuccess={() => setPrediction(null)} 
            />
          )}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800">
              ¿Es correcto este diagnóstico? Tu opinión ayuda a mejorar nuestra inteligencia artificial.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}