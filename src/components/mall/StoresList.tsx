
import { Store } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StoreCard } from "@/components/StoreCard";

interface StoresListProps {
  stores: any[];
  onStoreClick?: (storeId: string) => void;
}

export function StoresList({ stores, onStoreClick }: StoresListProps) {
  if (stores.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2 text-gray-500">
            <Store className="h-6 w-6" />
            No hay tiendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">
            Vuelve más tarde para ver las tiendas disponibles.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {stores.map((store) => (
        <StoreCard
          key={store.id}
          store={store}
          onClick={() => onStoreClick?.(store.id)}
        />
      ))}
    </>
  );
}
