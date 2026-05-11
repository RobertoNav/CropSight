"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { Button } from "@/components/ui/Button";

// Esquema con validación condicional[cite: 1]
const feedbackSchema = z.object({
  is_correct: z.boolean(),
  correct_label: z.string().optional(),
}).refine((data) => {
  if (data.is_correct === false && !data.correct_label) {
    return false;
  }
  return true;
}, {
  message: "Debes seleccionar la etiqueta correcta si el diagnóstico falló",
  path: ["correct_label"],
});

interface Props {
  predictionId: string;
  onSuccess: () => void;
}

export const FeedbackForm = ({ predictionId, onSuccess }: Props) => {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { is_correct: true }
  });

  const isCorrect = watch("is_correct");

  const onSubmit = async (data: any) => {
    try {
      await axios.post(`http://localhost:8000/api/v1/predictions/${predictionId}/feedback`, data);
      onSuccess();
      alert("¡Gracias por tu feedback!");
    } catch (err) {
      alert("Error al enviar feedback. Tal vez ya enviaste uno para esta imagen.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 p-4 bg-gray-50 rounded-lg border">
      <h3 className="font-semibold mb-4 text-gray-700">¿Fue correcto el diagnóstico?</h3>
      
      <div className="flex gap-6 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" value="true" {...register("is_correct", { setValueAs: v => v === "true" })} />
          <span>Sí, es correcto</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" value="false" {...register("is_correct", { setValueAs: v => v === "true" })} />
          <span>No, es incorrecto</span>
        </label>
      </div>

      {/* Solo se muestra si is_correct es false */}
      {!isCorrect && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Etiqueta Correcta:</label>
          <select {...register("correct_label")} className="w-full p-2 border rounded">
            <option value="">Selecciona la enfermedad real...</option>
            <option value="Tomato_Healthy">Tomate Sano</option>
            <option value="Tomato_Early_Blight">Tizón Temprano</option>
            <option value="Tomato_Late_Blight">Tizón Tardío</option>
            {/* Aquí podrías mapear una lista completa de etiquetas */}
          </select>
          {errors.correct_label && <p className="text-red-500 text-xs mt-1">{errors.correct_label.message as string}</p>}
        </div>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : "Enviar Feedback"}
      </Button>
    </form>
  );
};