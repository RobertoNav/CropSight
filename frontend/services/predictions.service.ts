import { api } from "@/lib/api";

export async function getPredictions(
  page = 1,
  limit = 10
) {
  const { data } = await api.get(
    `/predictions?page=${page}&limit=${limit}`
  );

  return data;
}

export async function getPredictionById(
  id: string
) {
  const { data } = await api.get(
    `/predictions/${id}`
  );

  return data;
}

export async function createPrediction(
  file: File
) {
  const formData = new FormData();

  formData.append("image", file);

  const { data } = await api.post(
    "/predictions",
    formData,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },
    }
  );

  return data;
}

export async function sendFeedback(
  predictionId: string,
  payload: {
    is_correct: boolean;
    correct_label?: string;
  }
) {
  const { data } = await api.post(
    `/predictions/${predictionId}/feedback`,
    payload
  );

  return data;
}