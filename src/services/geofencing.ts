
import { toast } from "sonner";
import { Mall } from "@/types/mall";
import { Location } from "@/hooks/use-location";

// Define the geofence interface
export interface Geofence {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusInMeters: number;
  isInside: boolean;
  onEnter?: () => void;
  onExit?: () => void;
}

class GeofencingService {
  private geofences: Map<string, Geofence> = new Map();
  private watchId: number | null = null;
  private lastPosition: Location | null = null;
  private notificationPermissionGranted = false;
  private retryAttempts = 0;
  private maxRetries = 3;
  private retryTimeout: number | null = null;

  constructor() {
    this.checkNotificationPermission();
  }

  private async checkNotificationPermission() {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return;
    }

    if (Notification.permission === "granted") {
      this.notificationPermissionGranted = true;
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      this.notificationPermissionGranted = permission === "granted";
    }
  }

  // Create geofences from mall data
  public createGeofencesFromMalls(malls: Mall[], radiusInMeters: number = 500) {
    malls.forEach(mall => {
      if (mall.latitude && mall.longitude) {
        this.addGeofence({
          id: mall.id,
          name: mall.name,
          centerLat: mall.latitude,
          centerLng: mall.longitude,
          radiusInMeters,
          isInside: false,
          onEnter: () => this.showNotification(`¡Estás cerca de ${mall.name}!`, 
                                              `Hay promociones activas en este centro comercial.`),
          onExit: () => console.log(`Left ${mall.name} geofence`)
        });
      }
    });
  }

  // Add a single geofence
  public addGeofence(geofence: Geofence) {
    this.geofences.set(geofence.id, geofence);
  }

  // Remove a geofence
  public removeGeofence(id: string) {
    this.geofences.delete(id);
  }

  // Clear all geofences
  public clearGeofences() {
    this.geofences.clear();
  }

  // Start monitoring geofences
  public startMonitoring() {
    if (!navigator.geolocation) {
      toast.error("Geolocalización no disponible en este navegador");
      return;
    }

    const options = {
      enableHighAccuracy: this.retryAttempts === 0, // Only use high accuracy on first attempt
      timeout: 5000 * (this.retryAttempts + 1), // Increase timeout with each retry
      maximumAge: this.retryAttempts === 0 ? 0 : 60000 // Allow older positions on retries
    };

    const handleSuccess = (position: GeolocationPosition) => {
      // Reset retry counter on success
      this.retryAttempts = 0;
      
      const currentPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      this.checkGeofences(currentPosition);
      this.lastPosition = currentPosition;
      
      // Only show success message on first successful position
      if (!this.watchId) {
        toast.success("Monitoreo de ubicación iniciado");
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error("Geolocation error:", error);
      
      const shouldRetry = this.retryAttempts < this.maxRetries;
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          toast.error("Permiso de ubicación denegado");
          this.stopMonitoring();
          break;
          
        case error.POSITION_UNAVAILABLE:
          if (shouldRetry) {
            this.retryGeolocation(options);
          } else {
            toast.error("Ubicación no disponible después de varios intentos");
            this.stopMonitoring();
          }
          break;
          
        case error.TIMEOUT:
          if (shouldRetry) {
            this.retryGeolocation(options);
          } else {
            toast.error("No se pudo obtener la ubicación después de varios intentos");
            this.stopMonitoring();
          }
          break;
          
        default:
          if (shouldRetry) {
            this.retryGeolocation(options);
          } else {
            toast.error("Error al obtener la ubicación");
            this.stopMonitoring();
          }
      }
    };

    this.watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );
  }

  private retryGeolocation(options: PositionOptions) {
    this.retryAttempts++;
    
    // Clear any existing retry timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    
    // Show retry message
    toast.info(`Reintentando obtener ubicación (intento ${this.retryAttempts} de ${this.maxRetries})...`);
    
    // Wait a moment before retrying
    this.retryTimeout = window.setTimeout(() => {
      if (this.watchId) {
        navigator.geolocation.clearWatch(this.watchId);
      }
      
      // Try to get a single position first
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // If successful, restart watching with new options
          this.startMonitoring();
        },
        (error) => {
          // If failed and we have retries left, try again
          if (this.retryAttempts < this.maxRetries) {
            this.retryGeolocation(options);
          } else {
            toast.error("No se pudo obtener la ubicación después de varios intentos");
            this.stopMonitoring();
          }
        },
        {
          ...options,
          enableHighAccuracy: false, // Use less accurate position for retries
          timeout: 10000 // Longer timeout for single position attempt
        }
      );
    }, 2000); // Wait 2 seconds between retries
  }

  // Stop monitoring geofences
  public stopMonitoring() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      
      // Clear any pending retry
      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout);
        this.retryTimeout = null;
      }
      
      // Reset retry counter
      this.retryAttempts = 0;
      
      toast.info("Monitoreo de ubicación detenido");
    }
  }

  // Check if user is inside any geofences
  private checkGeofences(position: Location) {
    this.geofences.forEach(geofence => {
      const distance = this.calculateDistance(
        position.lat, 
        position.lng,
        geofence.centerLat,
        geofence.centerLng
      );
      
      const isInside = distance * 1000 <= geofence.radiusInMeters;
      
      // If state has changed
      if (isInside !== geofence.isInside) {
        if (isInside) {
          // User entered geofence
          geofence.onEnter?.();
        } else {
          // User exited geofence
          geofence.onExit?.();
        }
        
        // Update state
        geofence.isInside = isInside;
      }
    });
  }

  // Show notification
  private showNotification(title: string, body: string) {
    if (!this.notificationPermissionGranted) {
      this.checkNotificationPermission();
      return;
    }

    // Show system notification if available
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
    
    // Also show in-app toast notification
    toast(title, {
      description: body,
      duration: 5000,
    });
  }

  // Calculate distance between two points in km (haversine formula)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
      Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const geofencingService = new GeofencingService();
import { Mall } from '@/types/mall';
import { toast } from 'sonner';

export interface Geofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

class GeofencingService {
  private geofences: Map<string, Geofence> = new Map();
  private isMonitoring: boolean = false;
  private watchId: number | null = null;
  
  // Create geofences from mall data
  createGeofencesFromMalls(malls: Mall[], radiusInMeters: number = 500): void {
    malls.forEach(mall => {
      if (mall.latitude && mall.longitude) {
        this.addGeofence({
          id: mall.id,
          name: mall.name,
          latitude: mall.latitude,
          longitude: mall.longitude,
          radius: radiusInMeters
        });
      }
    });
    
    console.log(`Created ${this.geofences.size} geofences from ${malls.length} malls`);
  }
  
  // Add a single geofence
  addGeofence(geofence: Geofence): void {
    this.geofences.set(geofence.id, geofence);
  }
  
  // Remove a geofence by ID
  removeGeofence(id: string): void {
    this.geofences.delete(id);
  }
  
  // Clear all geofences
  clearGeofences(): void {
    this.geofences.clear();
  }
  
  // Start monitoring user location against geofences
  startMonitoring(): void {
    if (this.isMonitoring || !navigator.geolocation) {
      return;
    }
    
    this.isMonitoring = true;
    
    // Set up regular location checks
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.checkGeofences(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        this.stopMonitoring();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 27000
      }
    );
    
    console.log('Geofence monitoring started');
  }
  
  // Stop monitoring user location
  stopMonitoring(): void {
    if (!this.isMonitoring || !this.watchId) {
      return;
    }
    
    navigator.geolocation.clearWatch(this.watchId);
    this.watchId = null;
    this.isMonitoring = false;
    
    console.log('Geofence monitoring stopped');
  }
  
  // Check if user is within any geofences
  private checkGeofences(latitude: number, longitude: number): void {
    this.geofences.forEach((geofence) => {
      const distance = this.calculateDistance(
        latitude, 
        longitude, 
        geofence.latitude, 
        geofence.longitude
      );
      
      const isInside = distance <= (geofence.radius / 1000); // Convert meters to km
      
      // If user just entered a geofence
      if (isInside) {
        this.triggerGeofenceEntry(geofence);
      }
    });
  }
  
  // Handle geofence entry event
  private triggerGeofenceEntry(geofence: Geofence): void {
    // Implement user notifications here
    console.log(`Entered geofence: ${geofence.name}`);
    
    // Show a browser notification if the API is available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Centro comercial cercano', {
        body: `Estás cerca de ${geofence.name}. ¡Revisa las ofertas disponibles!`,
        icon: '/pwa-icons/icon-192x192.png'
      });
    } else {
      // Fall back to toast notification
      toast.info(`Estás cerca de ${geofence.name}. ¡Revisa las ofertas disponibles!`);
    }
  }
  
  // Calculate distance between two coordinates in kilometers
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
  
  // Request notification permissions
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    
    return false;
  }
}

export const geofencingService = new GeofencingService();
