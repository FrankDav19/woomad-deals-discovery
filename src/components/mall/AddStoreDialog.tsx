import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSession } from "@/components/providers/SessionProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


interface AddStoreDialogProps {
  mallId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddStoreDialog({ mallId, isOpen, onClose, onSuccess }: AddStoreDialogProps) {
  const { session } = useSession();
  const [store, setStore] = useState({
    name: "",
    category: "",
    description: "",
    location_in_mall: "",
    contact_number: "",
  });
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, name");

        if (error) {
          console.error("Error fetching categories:", error);
          toast.error("Failed to load categories");
        } else {
          setCategories(data || []);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      } finally {
        setLoadingCategories(false);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!session?.user?.id) {
        toast.error("Debes iniciar sesión para agregar una tienda");
        return;
      }

      const { error } = await supabase
        .from("stores")
        .insert([
          {
            ...store,
            mall_id: mallId,
            user_id: session.user.id,
          },
        ]);

      if (error) throw error;

      toast.success("Tienda agregada exitosamente");
      onSuccess();
      onClose();
      setStore({
        name: "",
        category: "",
        description: "",
        location_in_mall: "",
        contact_number: "",
      });
    } catch (error) {
      console.error("Error al agregar tienda:", error);
      toast.error("Error al agregar tienda");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar Nueva Tienda</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre de la Tienda</Label>
            <Input
              id="name"
              value={store.name}
              onChange={(e) => setStore({ ...store, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="category">Categoría</Label>
            <Select value={store.category} onValueChange={(value) => setStore({...store, category: value})}>
              <SelectTrigger id="category" className="w-full" disabled={loadingCategories}>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {loadingCategories ? (
                  <SelectItem value="" disabled>Cargando categorías...</SelectItem>
                ) : categories.length > 0 ? (
                  categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>No hay categorías disponibles</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={store.description}
              onChange={(e) => setStore({ ...store, description: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="location">Ubicación en el Centro Comercial</Label>
            <Input
              id="location"
              value={store.location_in_mall}
              onChange={(e) => setStore({ ...store, location_in_mall: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="contact">Número de Contacto</Label>
            <Input
              id="contact"
              value={store.contact_number}
              onChange={(e) => setStore({ ...store, contact_number: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Agregar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}