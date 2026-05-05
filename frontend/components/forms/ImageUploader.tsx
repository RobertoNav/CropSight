"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreatePrediction, PredictionResponse } from "@/hooks/usePrediction";
import { Button } from "@/components/ui/Button";

// Validaciones según el contrato[cite: 1]
const MAX_FILE_SIZE = 5 * 1024 * 1024; 
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const predictionSchema = z.object({
  image: z
    .any()
    .refine((files) => files?.length === 1, "La imagen es obligatoria.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `El tamaño máximo es 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Solo se aceptan formatos .jpg, .jpeg y .png."
    ),
});

interface Props {
  onUploadSuccess: (data: PredictionResponse) => void;
}

export const ImageUploader = ({ onUploadSuccess }: Props) => {
  const { mutate, isPending } = useCreatePrediction();
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(predictionSchema),
  });

  const onSubmit = (data: any) => {
    mutate(data.image[0], {
      onSuccess: (result) => onUploadSuccess(result),
      onError: (err: any) => alert("Error al procesar la imagen: " + err.message),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 border-2 border-dashed p-8 rounded-lg text-center">
      <input 
        type="file" 
        accept=".jpg,.jpeg,.png"
        {...register("image")}
        className="mx-auto"
      />
      {errors.image && (
        <span className="text-red-500 text-sm">{errors.image.message as string}</span>
      )}
      
      <Button type="submit" disabled={isPending}>
        {isPending ? "Analizando Cultivo..." : "Subir y Diagnosticar"}
      </Button>
    </form>
  );
};