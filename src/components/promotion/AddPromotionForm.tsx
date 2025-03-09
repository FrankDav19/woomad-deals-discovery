import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useSession } from "@/components/providers/SessionProvider";
import { ValidPromotionType } from "@/types/promotion";

interface AddPromotionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  preselectedStoreId?: string;
}

export function AddPromotionForm({
  onSuccess,
  onCancel,
  preselectedStoreId,
}: AddPromotionFormProps) {
  const { session } = useSession();
  const [newPromotion, setNewPromotion] = useState({
    title: "",
    description: "",
    type: "" as ValidPromotionType,
    start_date: "",
    end_date: "",
    discount_value: "",
    terms_conditions: "",
    image_url: "",
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!session?.user?.id) {
        toast.error("Debes iniciar sesión para agregar una promoción");
        return;
      }

      // Validate dates
      const startDate = new Date(newPromotion.start_date);
      const endDate = new Date(newPromotion.end_date);

      if (endDate <= startDate) {
        toast.error("La fecha de fin debe ser posterior a la fecha de inicio");
        return;
      }

      const { error } = await supabase.from("promotions").insert([
        {
          store_id: preselectedStoreId,
          title: newPromotion.title,
          description: newPromotion.description,
          type: newPromotion.type,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          discount_value: newPromotion.discount_value || null,
          terms_conditions: newPromotion.terms_conditions || null,
          image_url: newPromotion.image_url || null,
          user_id: session.user.id,
          is_active: newPromotion.is_active,
        },
      ]);

      if (error) throw error;

      toast.success("Promoción agregada exitosamente");
      onSuccess();
    } catch (error) {
      console.error("Error adding promotion:", error);
      toast.error("Error al agregar la promoción");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Tipo de Promoción</Label>
        <Select
          value={newPromotion.type}
          onValueChange={(value) =>
            setNewPromotion({
              ...newPromotion,
              type: value as ValidPromotionType,
            })
          }
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="promotion">Promoción</SelectItem>
            <SelectItem value="coupon">Cupón</SelectItem>
            <SelectItem value="sale">Oferta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>
          {newPromotion.type === "coupon" ? "Código del Cupón" : "Título"}
        </Label>
        <Input
          value={newPromotion.title}
          onChange={(e) =>
            setNewPromotion({ ...newPromotion, title: e.target.value })
          }
          required
        />
      </div>

      <div>
        <Label>Descripción</Label>
        <Textarea
          value={newPromotion.description}
          onChange={(e) =>
            setNewPromotion({ ...newPromotion, description: e.target.value })
          }
          required
        />
      </div>

      <div>
        <Label>Valor del Descuento (ej. 20%, $500, 2x1)</Label>
        <Input
          value={newPromotion.discount_value}
          onChange={(e) =>
            setNewPromotion({ ...newPromotion, discount_value: e.target.value })
          }
          placeholder="Opcional"
        />
      </div>

      <div>
        <Label>Términos y Condiciones</Label>
        <Textarea
          value={newPromotion.terms_conditions}
          onChange={(e) =>
            setNewPromotion({
              ...newPromotion,
              terms_conditions: e.target.value,
            })
          }
          placeholder="Opcional"
        />
      </div>

      <div>
        <Label>URL de la Imagen</Label>
        <Input
          value={newPromotion.image_url}
          onChange={(e) =>
            setNewPromotion({ ...newPromotion, image_url: e.target.value })
          }
          placeholder="Opcional"
        />
      </div>

      <div>
        <Label>Fecha de inicio</Label>
        <Input
          type="datetime-local"
          value={newPromotion.start_date}
          onChange={(e) =>
            setNewPromotion({ ...newPromotion, start_date: e.target.value })
          }
          required
        />
      </div>

      <div>
        <Label>Fecha de fin</Label>
        <Input
          type="datetime-local"
          value={newPromotion.end_date}
          onChange={(e) =>
            setNewPromotion({ ...newPromotion, end_date: e.target.value })
          }
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">Agregar Promoción</Button>
      </div>
    </form>
  );
}
