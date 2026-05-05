import { useMutation } from "@tanstack/react-query";
import axios from "axios";

// Interfaz basada en el contrato de Jaime Galindo
export interface PredictionResponse {
  id: string;
  image_url: string;
  label: string;
  confidence: number;
  class_probabilities: Record<string, number>;
  model_version: string;
  created_at: string;
}

export const useCreatePrediction = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file); // Campo requerido por el backend

      const { data } = await axios.post<PredictionResponse>(
        "http://localhost:8000/api/v1/predictions",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return data;
    },
  });
};