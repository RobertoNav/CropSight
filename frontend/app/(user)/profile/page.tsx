// app/(user)/profile/page.tsx

"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);

  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/api/v1/users/me", {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_TOKEN}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setName(data.name);
      });
  }, []);

  const handleUpdate = async () => {
    setLoading(true);

    const body: any = { name };

    if (newPassword) {
      body.current_password = currentPassword;
      body.new_password = newPassword;
    }

    const res = await fetch(
      "http://localhost:8000/api/v1/users/me",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_TOKEN}`,
        },
        body: JSON.stringify(body),
      }
    );

    setLoading(false);

    if (res.ok) {
      Toast.success("Perfil actualizado correctamente");
    } else {
      Toast.error("Error al actualizar perfil");
    }
  };

  if (!user) return <p className="p-6">Cargando...</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">
        Mi Perfil
      </h1>

      <Card>
        <h2 className="text-lg font-semibold mb-4">
          Información Personal
        </h2>

        <div className="space-y-4">
          <Input
            label="Nombre"
            value={name}
            onChange={(e: any) => setName(e.target.value)}
          />

          <Input
            label="Email"
            value={user.email}
            disabled
          />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-4">
          Cambiar Contraseña
        </h2>

        <div className="space-y-4">
          <Input
            label="Contraseña Actual"
            type="password"
            value={currentPassword}
            onChange={(e: any) =>
              setCurrentPassword(e.target.value)
            }
          />

          <Input
            label="Nueva Contraseña"
            type="password"
            value={newPassword}
            onChange={(e: any) =>
              setNewPassword(e.target.value)
            }
          />
        </div>
      </Card>

      <Button onClick={handleUpdate} disabled={loading}>
        {loading ? "Guardando..." : "Guardar Cambios"}
      </Button>
    </div>
  );
}
