
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function PasswordReset() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const fragment = location.hash;
      
      // Clear any existing session first to avoid conflicts
      await supabase.auth.signOut();

      if (!fragment) {
        navigate("/");
        return;
      }

      const params = new URLSearchParams(fragment.substring(1));
      const accessToken = params.get('access_token');
      const type = params.get('type');
      
      if (!accessToken) {
        toast.error("Token no válido");
        navigate("/");
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: '',
        });

        if (error) throw error;

        if (type === 'recovery') {
          // Show password reset form
          setShowResetForm(true);
        } else {
          // Handle email confirmation or other auth callbacks
          if (session) {
            toast.success("Autenticación exitosa");
            navigate("/");
          } else {
            throw new Error("No se pudo establecer la sesión");
          }
        }
      } catch (error: any) {
        console.error('Error handling auth callback:', error);
        toast.error(error.message || "Error procesando la autenticación");
        navigate("/");
      }
    };

    handleAuthCallback();
  }, [location, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) throw error;

      // Sign out and clean up the session
      await supabase.auth.signOut();
      toast.success("Contraseña actualizada con éxito");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!showResetForm) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p>Procesando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Restablecer contraseña
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa tu nueva contraseña
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirmar contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Actualizando..." : "Actualizar contraseña"}
          </Button>
        </form>
      </div>
    </div>
  );
}
