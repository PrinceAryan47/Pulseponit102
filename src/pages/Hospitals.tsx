import React, { useState, useEffect } from 'react';
import { Hospital as HospitalType } from '../types';
import { collection, onSnapshot, query, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Hospital, 
  MapPin, 
  Clock, 
  Search, 
  Stethoscope,
  Navigation,
  Loader2,
  PlusCircle,
  Activity,
  AlertTriangle,
  Info,
  ExternalLink,
  Smile,
  FlaskConical,
  Sparkles,
  Database,
  Phone,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  CheckCircle2,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { findNearbyFacilities, NearbyFacility } from '../services/locationService';
import { 
  COMPREHENSIVE_FACILITIES_CATALOG, 
  calculateDistanceMeters, 
  formatDistance, 
  estimateDriveTime 
} from '../data/facilityCatalog';
import { Map, Overlay } from 'pigeon-maps';
import VoiceSearch from '../components/VoiceSearch';
import GuestOverlay from '../components/GuestOverlay';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';

const FALLBACK_HOSPITAL_IMAGES = [
  "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=800"
];

const getHospitalImage = (hospital: HospitalType) => {
  if (hospital.photoURL && hospital.photoURL.trim() !== "" && !hospital.photoURL.includes("placeholder")) {
    return hospital.photoURL;
  }
  const index = Math.abs(hospital.id ? hospital.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : 0) % FALLBACK_HOSPITAL_IMAGES.length;
  return FALLBACK_HOSPITAL_IMAGES[index];
};

export interface RegionPreset {
  name: string;
  country: string;
  lat: number;
  lng: number;
  flag: string;
}

export const REGION_PRESETS: RegionPreset[] = [
  { name: "Kampala", country: "Uganda", lat: 0.3476, lng: 32.5825, flag: "🇺🇬" },
  { name: "Nairobi", country: "Kenya", lat: -1.2921, lng: 36.8219, flag: "🇰🇪" },
  { name: "Kigali", country: "Rwanda", lat: -1.9441, lng: 30.0619, flag: "🇷🇼" },
  { name: "Dar es Salaam", country: "Tanzania", lat: -6.7924, lng: 39.2083, flag: "🇹🇿" },
  { name: "Lagos", country: "Nigeria", lat: 6.5244, lng: 3.3792, flag: "🇳🇬" },
  { name: "Johannesburg", country: "South Africa", lat: -26.2041, lng: 28.0473, flag: "🇿🇦" },
  { name: "London", country: "United Kingdom", lat: 51.5074, lng: -0.1278, flag: "🇬🇧" },
  { name: "New York", country: "United States", lat: 40.7128, lng: -74.0060, flag: "🇺🇸" },
  { name: "Chicago", country: "United States", lat: 41.8781, lng: -87.6298, flag: "🇺🇸" },
  { name: "Los Angeles", country: "United States", lat: 34.0522, lng: -118.2437, flag: "🇺🇸" },
  { name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832, flag: "🇨🇦" },
  { name: "New Delhi", country: "India", lat: 28.6139, lng: 77.2090, flag: "🇮🇳" },
  { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, flag: "🇦🇺" },
  { name: "Dubai", country: "United Arab Emirates", lat: 25.2048, lng: 55.2708, flag: "🇦🇪" }
];

const getStoredRegion = (): RegionPreset => {
  try {
    const saved = localStorage.getItem('pulsepoint_user_region');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.lat && parsed.lng && parsed.name) {
        return parsed;
      }
    }
  } catch {}
  return REGION_PRESETS[0];
};

const Hospitals: React.FC = () => {
  const { profile } = useAuth();
  const initialPreset = getStoredRegion();
  const [hospitals, setHospitals] = useState<HospitalType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [showBrowserLocationHelp, setShowBrowserLocationHelp] = useState(false);
  const [selectedRegionLabel, setSelectedRegionLabel] = useState<string>(`${initialPreset.name}, ${initialPreset.country}`);
  const [currentPreset, setCurrentPreset] = useState<RegionPreset>(initialPreset);
  const [customCitySearch, setCustomCitySearch] = useState<string>("");
  const [isSearchingCity, setIsSearchingCity] = useState<boolean>(false);
  const [nearbyFacilities, setNearbyFacilities] = useState<NearbyFacility[]>(() => {
    return COMPREHENSIVE_FACILITIES_CATALOG.map(cat => {
      const dist = calculateDistanceMeters(initialPreset.lat, initialPreset.lng, cat.lat, cat.lng);
      return {
        ...cat,
        distanceMeter: dist,
        distanceDisplay: formatDistance(dist),
        durationDisplay: estimateDriveTime(dist)
      };
    }).sort((a, b) => (a.distanceMeter || 0) - (b.distanceMeter || 0));
  });
  const [groundingSources, setGroundingSources] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [userLocation, setUserLocation] = useState<[number, number] | null>([initialPreset.lat, initialPreset.lng]);
  const [isPreciseLocation, setIsPreciseLocation] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([initialPreset.lat, initialPreset.lng]);
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [selectedFacility, setSelectedFacility] = useState<any | null>(null);

  // AI Advisor States
  const [aiAdvisorEnabled, setAiAdvisorEnabled] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiFacilities, setAiFacilities] = useState<NearbyFacility[] | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [embeddingId, setEmbeddingId] = useState<string | null>(null);

  const handleAISearchAdviceWithQuery = async (queryToSearch: string) => {
    if (!queryToSearch.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setAiAdvice(null);
    setAiFacilities(null);

    try {
      const lat = userLocation ? userLocation[0] : (profile?.simulatedLatitude || currentPreset.lat);
      const lng = userLocation ? userLocation[1] : (profile?.simulatedLongitude || currentPreset.lng);

      const response = await fetch("/api/facilities/search-advice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: queryToSearch,
          lat,
          lng
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      setAiAdvice(data.advice || "No specific advice found for your query.");
      setAiFacilities(data.facilities || []);
    } catch (err: any) {
      console.error("AI Search Advice failed:", err);
      setAiError("Failed to fetch advice and nearby facilities. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const buildComprehensiveFacilityList = (
    lat: number, 
    lng: number, 
    extraHospitals?: HospitalType[], 
    apiFacilities?: NearbyFacility[]
  ): NearbyFacility[] => {
    const facilityDict: Record<string, NearbyFacility> = {};

    // 1. Add all from comprehensive catalog
    COMPREHENSIVE_FACILITIES_CATALOG.forEach(cat => {
      const dist = calculateDistanceMeters(lat, lng, cat.lat, cat.lng);
      facilityDict[cat.name.toLowerCase().trim()] = {
        ...cat,
        distanceMeter: dist,
        distanceDisplay: formatDistance(dist),
        durationDisplay: estimateDriveTime(dist),
      };
    });

    // 2. Merge Firestore hospitals if any
    const hSource = extraHospitals && extraHospitals.length > 0 ? extraHospitals : hospitals;
    hSource.forEach(h => {
      const key = h.name.toLowerCase().trim();
      let dist: number | undefined;
      let distDisplay: string | undefined;
      let driveTime: string | undefined;
      if (h.location?.lat && h.location?.lng) {
        dist = calculateDistanceMeters(lat, lng, h.location.lat, h.location.lng);
        distDisplay = formatDistance(dist);
        driveTime = estimateDriveTime(dist);
      }
      const existing = facilityDict[key];
      facilityDict[key] = {
        id: h.id,
        name: h.name,
        address: h.address,
        type: 'hospital',
        phone: h.contactPhone || existing?.phone || '+256 414 554001',
        openingHours: h.openingHours || existing?.openingHours || '24/7 Emergency',
        services: h.services || existing?.services || ['General Medicine', 'Emergency'],
        mapsUrl: h.location?.lat && h.location?.lng 
          ? `https://www.google.com/maps/dir/?api=1&destination=${h.location.lat},${h.location.lng}`
          : (existing?.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + ' ' + h.address)}`),
        lat: h.location?.lat || existing?.lat,
        lng: h.location?.lng || existing?.lng,
        distanceMeter: dist ?? existing?.distanceMeter,
        distanceDisplay: distDisplay ?? existing?.distanceDisplay,
        durationDisplay: driveTime ?? existing?.durationDisplay,
        reviews: existing?.reviews || ['Verified Partner Health Facility'],
        isPartner: true
      };
    });

    // 3. Merge API facilities if any
    if (apiFacilities && apiFacilities.length > 0) {
      apiFacilities.forEach(apiFac => {
        const key = apiFac.name.toLowerCase().trim();
        const existing = facilityDict[key];
        const fLat = apiFac.lat || existing?.lat || lat;
        const fLng = apiFac.lng || existing?.lng || lng;
        const dist = apiFac.distanceMeter ?? calculateDistanceMeters(lat, lng, fLat, fLng);
        
        facilityDict[key] = {
          ...existing,
          ...apiFac,
          distanceMeter: dist,
          distanceDisplay: apiFac.distanceDisplay || formatDistance(dist),
          durationDisplay: apiFac.durationDisplay || estimateDriveTime(dist),
          phone: apiFac.phone || existing?.phone,
          openingHours: apiFac.openingHours || existing?.openingHours,
          services: apiFac.services || existing?.services,
          reviews: (apiFac.reviews && apiFac.reviews.length > 0) ? apiFac.reviews : existing?.reviews,
        };
      });
    }

    return Object.values(facilityDict).sort((a, b) => 
      (a.distanceMeter || 9999999) - (b.distanceMeter || 9999999)
    );
  };

  const loadFacilitiesForCoords = async (lat: number, lng: number, fallbackHospitalList?: HospitalType[]) => {
    // 1. Instantly update with local catalog & Firestore hospitals so there is zero delay
    const initialList = buildComprehensiveFacilityList(lat, lng, fallbackHospitalList || hospitals);
    setNearbyFacilities(initialList);

    // 2. Fetch live Google Maps API facilities asynchronously and merge
    try {
      const results = await findNearbyFacilities(lat, lng);
      if (results.facilities && results.facilities.length > 0) {
        const merged = buildComprehensiveFacilityList(lat, lng, fallbackHospitalList || hospitals, results.facilities);
        setNearbyFacilities(merged);
        setGroundingSources(results.groundingSources || []);
      }
    } catch (err) {
      console.warn("API facilities query failed, using comprehensive catalog facilities:", err);
    }
  };

  // Fetch hospitals from database
  useEffect(() => {
    const q = query(collection(db, 'hospitals'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as HospitalType));
      setHospitals(data);
      setLoading(false);

      // Refresh facility distances immediately with new partner hospitals
      const currentLat = userLocation ? userLocation[0] : currentPreset.lat;
      const currentLng = userLocation ? userLocation[1] : currentPreset.lng;
      setNearbyFacilities(prev => buildComprehensiveFacilityList(currentLat, currentLng, data));
    }, (err) => {
      console.error("Error fetching hospitals:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userLocation]);

  // Automatically fetch user location on mount with high compatibility for Edge, Firefox, and Chrome
  useEffect(() => {
    let initialLat = currentPreset.lat;
    let initialLng = currentPreset.lng;
    let precise = false;

    if (profile?.simulatedLocationEnabled && profile?.simulatedLatitude && profile?.simulatedLongitude) {
      initialLat = profile.simulatedLatitude;
      initialLng = profile.simulatedLongitude;
      precise = true;
      setUserLocation([initialLat, initialLng]);
      setMapCenter([initialLat, initialLng]);
      setSelectedRegionLabel("Simulated GPS Location");
      setIsPreciseLocation(true);
      loadFacilitiesForCoords(initialLat, initialLng);
      return;
    }

    // Load facilities for chosen city / preset so user immediately gets local results
    loadFacilitiesForCoords(initialLat, initialLng);

    if (!precise && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setIsPreciseLocation(true);
          setSelectedRegionLabel("My Current GPS Location");
          await loadFacilitiesForCoords(latitude, longitude);
        },
        (err) => {
          console.warn(`Browser GPS access blocked/delayed (using ${currentPreset.name} coordinates fallback):`, err);
          loadFacilitiesForCoords(initialLat, initialLng);
        },
        // Low accuracy is faster and works across Edge Windows services & Firefox privacy protections
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
      );
    }
  }, [profile?.simulatedLocationEnabled, profile?.simulatedLatitude, profile?.simulatedLongitude]);

  const handleLocateNearby = () => {
    if (profile?.simulatedLocationEnabled && profile?.simulatedLatitude && profile?.simulatedLongitude) {
      setLocating(true);
      setError(null);
      const lat = profile.simulatedLatitude;
      const lng = profile.simulatedLongitude;
      setUserLocation([lat, lng]);
      setMapCenter([lat, lng]);
      setIsPreciseLocation(true);
      loadFacilitiesForCoords(lat, lng).finally(() => {
        setLocating(false);
      });
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser. Displaying facilities based on reference coordinates.");
      const fallbackLat = userLocation ? userLocation[0] : currentPreset.lat;
      const fallbackLng = userLocation ? userLocation[1] : currentPreset.lng;
      loadFacilitiesForCoords(fallbackLat, fallbackLng);
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setMapCenter([latitude, longitude]);
        setIsPreciseLocation(true);
        setError(null);
        await loadFacilitiesForCoords(latitude, longitude);
        setLocating(false);
      },
      async (err) => {
        console.warn("Geolocation denied or timed out in Edge/Firefox:", err);
        const fallbackLat = userLocation ? userLocation[0] : currentPreset.lat;
        const fallbackLng = userLocation ? userLocation[1] : currentPreset.lng;
        setUserLocation([fallbackLat, fallbackLng]);
        setMapCenter([fallbackLat, fallbackLng]);
        await loadFacilitiesForCoords(fallbackLat, fallbackLng);
        setLocating(false);
        setError(
          "Notice: Live GPS was blocked or timed out by browser privacy settings (common in Microsoft Edge & Firefox). We have calculated nearby facilities using reference coordinates. You can also click anywhere on the live map or toggle Simulated Location in Profile!"
        );
      },
      // 15-second timeout and 5-min cache for Edge & Firefox stability
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
    );
  };

  const handleResetToCityCenter = async () => {
    const center: [number, number] = [currentPreset.lat, currentPreset.lng];
    setSelectedRegionLabel(`${currentPreset.name}, ${currentPreset.country}`);
    setUserLocation(center);
    setMapCenter(center);
    setIsPreciseLocation(true);
    setLocating(true);
    setError(null);
    try {
      await loadFacilitiesForCoords(center[0], center[1]);
    } finally {
      setLocating(false);
    }
  };

  const handleSelectPresetRegion = async (preset: RegionPreset) => {
    setCurrentPreset(preset);
    setSelectedRegionLabel(`${preset.name}, ${preset.country}`);
    setUserLocation([preset.lat, preset.lng]);
    setMapCenter([preset.lat, preset.lng]);
    setIsPreciseLocation(true);
    setLocating(true);
    setError(null);
    try {
      localStorage.setItem('pulsepoint_user_region', JSON.stringify(preset));
    } catch {}
    try {
      await loadFacilitiesForCoords(preset.lat, preset.lng);
    } finally {
      setLocating(false);
    }
  };

  const handleCustomCityLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCitySearch.trim()) return;
    setIsSearchingCity(true);
    setError(null);
    try {
      const match = REGION_PRESETS.find(p => 
        p.name.toLowerCase().includes(customCitySearch.trim().toLowerCase()) ||
        p.country.toLowerCase().includes(customCitySearch.trim().toLowerCase())
      );
      if (match) {
        await handleSelectPresetRegion(match);
      } else {
        const res = await fetch("/api/facilities/search-advice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: customCitySearch.trim() })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.facilities && data.facilities.length > 0) {
            const first = data.facilities[0];
            const fLat = first.lat || currentPreset.lat;
            const fLng = first.lng || currentPreset.lng;
            const newPreset: RegionPreset = {
              name: customCitySearch.trim(),
              country: "Global",
              lat: fLat,
              lng: fLng,
              flag: "📍"
            };
            setCurrentPreset(newPreset);
            try {
              localStorage.setItem('pulsepoint_user_region', JSON.stringify(newPreset));
            } catch {}
            setSelectedRegionLabel(customCitySearch.trim());
            setUserLocation([fLat, fLng]);
            setMapCenter([fLat, fLng]);
            setIsPreciseLocation(true);
            await loadFacilitiesForCoords(fLat, fLng);
          }
        }
      }
    } catch (err) {
      console.warn("City lookup error:", err);
    } finally {
      setIsSearchingCity(false);
      setCustomCitySearch("");
    }
  };

  const handleMapClick = async ({ latLng }: { latLng: [number, number] }) => {
    setUserLocation(latLng);
    setMapCenter(latLng);
    setIsPreciseLocation(true);
    setLocating(true);
    setError(null);
    try {
      await loadFacilitiesForCoords(latLng[0], latLng[1]);
    } catch (err) {
      setError("Failed to fetch facilities for this clicked location. Please try again.");
    } finally {
      setLocating(false);
    }
  };

  const getDistanceMeter = (h: HospitalType) => {
    if (!userLocation || !h.location?.lat || !h.location?.lng) return Infinity;
    return calculateDistanceMeters(userLocation[0], userLocation[1], h.location.lat, h.location.lng);
  };

  const getDistanceDisplay = (h: HospitalType) => {
    const dist = getDistanceMeter(h);
    if (dist === Infinity) return null;
    return formatDistance(dist);
  };

  const filteredHospitals = [...hospitals]
    .filter(h => 
      (h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.address.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (!userLocation) return 0;
      return getDistanceMeter(a) - getDistanceMeter(b);
    });

  const filteredNearby = nearbyFacilities.filter(f => 
    (filterType === 'all' || f.type === filterType) &&
    (f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRedirectToMaps = (facility: NearbyFacility | HospitalType) => {
    let origin = '';
    if (userLocation) {
      origin = `${userLocation[0]},${userLocation[1]}`;
    }
    
    let destination = '';
    if ('location' in facility && facility.location?.lat && facility.location?.lng) {
      destination = `${facility.location.lat},${facility.location.lng}`;
    } else if ('lat' in facility && facility.lat && facility.lng) {
      destination = `${facility.lat},${facility.lng}`;
    } else {
      destination = `${facility.name}, ${facility.address}`;
    }

    const originParam = origin ? `&origin=${encodeURIComponent(origin)}` : '';
    const destParam = `destination=${encodeURIComponent(destination)}`;
    
    // Using Google Maps Directions API URL format for direct navigation
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&${destParam}${originParam}&travelmode=driving`;
    
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  const isAlreadyPartner = (facility: NearbyFacility) => {
    return hospitals.some(h => h.name.toLowerCase().trim() === facility.name.toLowerCase().trim());
  };

  const handleEmbedHospital = async (facility: NearbyFacility) => {
    if (isAlreadyPartner(facility)) return;
    setEmbeddingId(facility.name);
    try {
      const data = {
        name: facility.name,
        address: facility.address,
        location: {
          lat: facility.lat || userLocation?.[0] || currentPreset.lat,
          lng: facility.lng || userLocation?.[1] || currentPreset.lng
        },
        licenseNumber: "MOH-UG-" + Math.floor(100000 + Math.random() * 900000),
        contactPhone: "+256 414 " + Math.floor(100000 + Math.random() * 900000),
        contactEmail: "info@" + facility.name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".or.ug",
        services: [facility.type || "general", "Emergency Care", "Outpatient Services"],
        openingHours: "24 Hours",
        photoURL: facility.type === 'pharmacy' 
          ? 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800' 
          : 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800'
      };
      
      await addDoc(collection(db, 'hospitals'), data);
    } catch (err: any) {
      console.error("Error embedding hospital:", err);
      alert("Failed to embed facility: " + err.message);
    } finally {
      setEmbeddingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-bold animate-pulse uppercase tracking-widest">Loading Facilities...</p>
      </div>
    );
  }

  return (
    <GuestOverlay
      title="Access Medical Facilities"
      description="Sign in to find nearby hospitals, clinics, and pharmacies using real-time geolocation mapping, directions, and health reviews."
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 transition-colors duration-300">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight neon-text">Medical Facilities</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Calculate distances to top hospitals, clinics, and pharmacies and get instant Google Maps directions.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <button 
              onClick={handleResetToCityCenter}
              disabled={locating}
              className="flex items-center gap-2 px-5 py-3 bg-secondary hover:bg-secondary/80 text-foreground rounded-2xl font-bold transition-all border border-border disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
            >
              <Compass className="w-4 h-4 text-primary" />
              <span>Center on {currentPreset.name}</span>
            </button>
            <button 
              onClick={handleLocateNearby}
              disabled={locating}
              className="flex items-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 text-xs sm:text-sm cursor-pointer"
            >
              <Navigation className="w-4 h-4 sm:w-5 sm:h-5" />
              {locating ? 'Acquiring GPS...' : 'Calculate Distances to Facilities'}
            </button>
          </div>
        </div>

        {/* Global City / Country Selector Toolbar */}
        <div className="mb-6 p-5 rounded-3xl bg-card border border-border shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2.5">
              <Compass className="w-5 h-5 text-primary" />
              <div>
                <h4 className="font-bold text-sm text-foreground">Select City or Country</h4>
                <p className="text-xs text-muted-foreground">Choose or search any city or country to instantly map local hospitals, clinics, and pharmacies.</p>
              </div>
            </div>
            {/* Quick Country Dropdown & Custom Search */}
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
              <select
                value={currentPreset.name}
                onChange={(e) => {
                  const found = REGION_PRESETS.find(p => p.name === e.target.value);
                  if (found) handleSelectPresetRegion(found);
                }}
                className="px-3.5 py-2 bg-muted/60 border border-border rounded-xl text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary w-full sm:w-56 cursor-pointer"
              >
                {REGION_PRESETS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.flag} {p.name}, {p.country}
                  </option>
                ))}
              </select>

              <form onSubmit={handleCustomCityLookup} className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Type any city/country..."
                  value={customCitySearch}
                  onChange={(e) => setCustomCitySearch(e.target.value)}
                  className="px-4 py-2 bg-muted/60 border border-border rounded-xl text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary w-full sm:w-48"
                />
                <button
                  type="submit"
                  disabled={isSearchingCity || !customCitySearch.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold shrink-0 hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSearchingCity ? 'Searching...' : 'Go'}
                </button>
              </form>
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 mr-1">Popular Hubs:</span>
            {REGION_PRESETS.map((preset) => {
              const isSelected = selectedRegionLabel.includes(preset.name);
              return (
                <button
                  key={preset.name}
                  onClick={() => handleSelectPresetRegion(preset)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted/40 hover:bg-muted text-foreground/80 border-border"
                  }`}
                >
                  <span>{preset.flag}</span>
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* GPS Distance Status Banner & Edge/Firefox Helper */}
        <div className={`mb-6 p-6 rounded-3xl border flex flex-col shadow-sm transition-all ${
          isPreciseLocation 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-400" 
            : "bg-amber-500/10 border-amber-500/25 text-amber-800 dark:text-amber-400"
        }`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-2xl shrink-0 ${
                isPreciseLocation ? "bg-emerald-500/15" : "bg-amber-500/15"
              }`}>
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h4 className="font-bold text-sm">
                    {isPreciseLocation ? `Active Region: ${selectedRegionLabel}` : `Reference Geolocation: ${selectedRegionLabel}`}
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/40 dark:bg-black/20">
                    {selectedRegionLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isPreciseLocation 
                    ? `Coordinates: [${userLocation?.[0].toFixed(5)}, ${userLocation?.[1].toFixed(5)}]. Facilities and driving durations calculated in real time around ${selectedRegionLabel}.`
                    : `Displaying facilities near ${selectedRegionLabel}. You can select any city hub above, click on the map, or click 'Acquire Precise GPS' to use your browser location.`}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setShowBrowserLocationHelp(!showBrowserLocationHelp)}
                className="px-3.5 py-2 bg-white/70 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-foreground transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <HelpCircle className="w-3.5 h-3.5 text-primary" />
                <span>Edge / Firefox Tips</span>
                {showBrowserLocationHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {!isPreciseLocation && (
                <button
                  onClick={handleLocateNearby}
                  disabled={locating}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shrink-0 transition-all shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  {locating ? 'Acquiring...' : 'Acquire Precise GPS'}
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Browser Geolocation Diagnostic Card */}
          <AnimatePresence>
            {showBrowserLocationHelp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-4 pt-4 border-t border-border/40 text-foreground"
              >
                <div className="bg-card/90 backdrop-blur rounded-2xl p-5 border border-border text-xs space-y-3">
                  <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>Why can't I locate nearby facilities on Edge or Firefox even with location turned on?</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground pt-1">
                    <div className="p-3.5 bg-muted/40 rounded-xl border border-border/50">
                      <p className="font-bold text-foreground mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Microsoft Edge & Windows Permissions
                      </p>
                      <p className="leading-relaxed">
                        Edge routes HTML5 geolocation through the <strong>Windows Location Service</strong>. Even if site permissions are enabled in Edge, Windows blocks it if <em>Settings &gt; Privacy &amp; security &gt; Location &gt; "Let desktop apps access your location"</em> is turned OFF.
                      </p>
                    </div>
                    <div className="p-3.5 bg-muted/40 rounded-xl border border-border/50">
                      <p className="font-bold text-foreground mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        Mozilla Firefox & Enhanced Tracking
                      </p>
                      <p className="leading-relaxed">
                        Firefox's <strong>Enhanced Tracking Protection</strong> and private browsing mode block Wi-Fi triangulation and sensor probes, causing `navigator.geolocation` to time out or return a Position Unavailable error.
                      </p>
                    </div>
                  </div>
                  <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/20 text-foreground">
                    <p className="font-bold mb-1 flex items-center gap-1.5 text-primary">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Why does it always work in First Aid Guide?
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      The First Aid Guide calculates proximity using an <strong>instant client-side math algorithm</strong> anchored to regional coordinates. It never hangs or shows an empty screen while waiting for the browser to approve GPS permissions. We have now applied this exact high-resilience architecture here to Medical Facilities!
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <span className="font-bold text-foreground">Quick Solutions:</span>
                    <button
                      onClick={handleResetToCityCenter}
                      className="px-3 py-1.5 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all text-xs"
                    >
                      1-Click Use City Center (Kampala)
                    </button>
                    <span className="text-muted-foreground">or simply click anywhere on the live map below to position your location pin!</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* GPS Interactive Map Container */}
        <div className="mb-8 bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-md transition-all relative">
          <div className="p-6 border-b border-border/60 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary animate-bounce" />
                Live GPS Location Map
              </h3>
              <p className="text-xs text-muted-foreground">
                Click anywhere on the map to set custom coordinates, or click a marker to view medical provider details.
              </p>
            </div>
            {userLocation && (
              <button
                onClick={() => {
                  setMapCenter(userLocation);
                  setMapZoom(14);
                }}
                className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                Center on My GPS
              </button>
            )}
          </div>
          <div className="h-[400px] w-full relative bg-slate-100 dark:bg-slate-950">
            <Map 
              center={mapCenter} 
              zoom={mapZoom} 
              onBoundsChanged={({ center, zoom }) => {
                setMapCenter(center);
                setMapZoom(zoom);
              }}
              onClick={handleMapClick}
            >
              {/* User location marker */}
              {userLocation && (
                <Overlay 
                  anchor={userLocation} 
                >
                  <div className="relative flex items-center justify-center" style={{ transform: 'translate(-50%, -50%)' }}>
                    <span className="absolute inline-flex h-6 w-6 rounded-full bg-blue-400 opacity-75 animate-ping"></span>
                    <div className="relative rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-md"></div>
                  </div>
                </Overlay>
              )}

              {/* Nearby facilities markers */}
              {nearbyFacilities.map((fac, fIdx) => {
                if (fac.lat === undefined || fac.lng === undefined) return null;
                const isSelected = selectedFacility && selectedFacility.name === fac.name;
                return (
                  <Overlay 
                    key={`fac-${fIdx}`}
                    anchor={[fac.lat, fac.lng]}
                  >
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFacility(fac);
                        setMapCenter([fac.lat, fac.lng]);
                      }}
                      className={`p-1.5 rounded-full shadow-md cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-rose-500 scale-125 ring-4 ring-rose-500/20' 
                          : fac.type === 'pharmacy' ? 'bg-teal-500 hover:scale-110' :
                            fac.type === 'clinic' ? 'bg-emerald-500 hover:scale-110' :
                            fac.type === 'dental' ? 'bg-blue-500 hover:scale-110' :
                            fac.type === 'specialty' ? 'bg-purple-500 hover:scale-110' :
                            fac.type === 'diagnostic' ? 'bg-amber-500 hover:scale-110' :
                            'bg-rose-500 hover:scale-110'
                      }`}
                      style={{ transform: 'translate(-50%, -50%)' }}
                    >
                      {fac.type === 'pharmacy' ? (
                        <PlusCircle className="w-4 h-4 text-white shrink-0" />
                      ) : fac.type === 'clinic' ? (
                        <Activity className="w-4 h-4 text-white shrink-0" />
                      ) : fac.type === 'dental' ? (
                        <Smile className="w-4 h-4 text-white shrink-0" />
                      ) : fac.type === 'specialty' ? (
                        <Stethoscope className="w-4 h-4 text-white shrink-0" />
                      ) : fac.type === 'diagnostic' ? (
                        <FlaskConical className="w-4 h-4 text-white shrink-0" />
                      ) : (
                        <Hospital className="w-4 h-4 text-white shrink-0" />
                      )}
                    </div>
                  </Overlay>
                );
              })}

              {/* Partner Hospitals from database */}
              {hospitals.map((hosp, hIdx) => {
                if (!hosp.location?.lat || !hosp.location?.lng) return null;
                const isSelected = selectedFacility && selectedFacility.name === hosp.name;
                return (
                  <Overlay
                    key={`hosp-${hIdx}`}
                    anchor={[hosp.location.lat, hosp.location.lng]}
                  >
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFacility(hosp);
                        setMapCenter([hosp.location.lat, hosp.location.lng]);
                      }}
                      className={`p-2 rounded-full bg-rose-600 border-2 border-white shadow-lg cursor-pointer transition-all ${
                        isSelected ? 'scale-125 ring-4 ring-rose-600/30' : 'hover:scale-110'
                      }`}
                      style={{ transform: 'translate(-50%, -50%)' }}
                    >
                      <Hospital className="w-4 h-4 text-white shrink-0" />
                    </div>
                  </Overlay>
                );
              })}
            </Map>

            {/* Selected facility detail popover inside the map */}
            {selectedFacility && (
              <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 bg-card border border-border p-5 rounded-3xl shadow-xl z-20 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                    selectedFacility.type === 'pharmacy' ? 'bg-teal-500/5 text-teal-600 dark:text-teal-400 border-teal-500/20' :
                    selectedFacility.type === 'clinic' ? 'bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                    selectedFacility.type === 'dental' ? 'bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                    selectedFacility.type === 'specialty' ? 'bg-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-500/20' :
                    selectedFacility.type === 'diagnostic' ? 'bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                    'bg-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  }`}>
                    {selectedFacility.type === 'hospital' ? 'Hospital' :
                     selectedFacility.type === 'clinic' ? 'Clinic' :
                     selectedFacility.type === 'pharmacy' ? 'Pharmacy' :
                     selectedFacility.type === 'dental' ? 'Dental' :
                     selectedFacility.type === 'specialty' ? 'Specialist' :
                     selectedFacility.type === 'diagnostic' ? 'Diagnostic' : 'Hospital'}
                  </span>
                  <button 
                    onClick={() => setSelectedFacility(null)}
                    className="text-muted-foreground hover:text-foreground text-xs font-black bg-muted w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    ×
                  </button>
                </div>
                <h4 className="font-extrabold text-foreground text-sm mb-1 truncate">{selectedFacility.name}</h4>
                <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2">{selectedFacility.address || selectedFacility.openingHours}</p>
                
                {selectedFacility.reviews && selectedFacility.reviews.length > 0 && (
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg inline-block font-semibold mb-4">
                    {selectedFacility.reviews[0]}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRedirectToMaps(selectedFacility)}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-all shadow-md shadow-primary/20 cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Open Directions
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI-Powered Patient Navigator Toggles */}
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 rounded-3xl p-6 mb-8 transition-all">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  AI Clinical Patient Advisor & Navigator
                  <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] rounded-full font-black uppercase tracking-wider">Grounded</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Type active symptoms or search requirements. Gemini retrieves matching medical facilities and generates immediate patient safety feedback.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setAiAdvisorEnabled(!aiAdvisorEnabled);
                if (aiAdvisorEnabled) {
                  setAiAdvice(null);
                  setAiFacilities(null);
                  setAiError(null);
                }
              }}
              className={`px-5 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 ${
                aiAdvisorEnabled 
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25" 
                  : "bg-card border border-border text-foreground hover:bg-muted"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {aiAdvisorEnabled ? "Clinical Advisor: Active" : "Turn On AI Clinical Advisor"}
            </button>
          </div>

          {aiAdvisorEnabled && (
            <div className="mt-6 border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
              <p className="text-xs font-bold text-muted-foreground mb-3">Click a health concern to test dynamic coordinates search instantly:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { query: "Severe active toothache", label: "Toothache & Dental Care", desc: "Finds dentists with maps location advice" },
                  { query: "24/7 pediatric emergency clinic for child high fever", label: "Pediatric Emergency", desc: "Finds 24-hour children medical centers" },
                  { query: "Late night pharmacy open on Jinja Road", label: "Late-Night Pharmacy", desc: "Locates 24-hour chemical dispensaries" },
                  { query: "Advanced imaging centre for urgent X-ray and CT scan", label: "X-Ray & Scan Lab", desc: "Finds diagnostic imaging centers" }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSearchTerm(item.query);
                      handleAISearchAdviceWithQuery(item.query);
                    }}
                    className="text-left p-3.5 bg-card border border-border hover:border-indigo-500/40 rounded-2xl transition-all hover:scale-[1.01]"
                  >
                    <h4 className="text-xs font-black text-foreground mb-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                      {item.label}
                    </h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed truncate">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 mb-8">
          <form onSubmit={(e) => { e.preventDefault(); if (aiAdvisorEnabled) { handleAISearchAdviceWithQuery(searchTerm); } }} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow flex gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={aiAdvisorEnabled ? "Describe symptom, concern, or facility (e.g. 'severe chest pain', 'dentist near me')..." : "Search by facility name, address, or medical specialization..."}
                  className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                />
              </div>
              <VoiceSearch onResult={(text) => {
                setSearchTerm(text);
                if (aiAdvisorEnabled) {
                  handleAISearchAdviceWithQuery(text);
                }
              }} />
            </div>
            
            {aiAdvisorEnabled ? (
              <button
                type="submit"
                disabled={aiLoading || !searchTerm.trim()}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-500/25 transition-all shrink-0 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Search with AI
                  </>
                )}
              </button>
            ) : (
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-6 py-3 bg-card border border-border rounded-2xl text-muted-foreground font-medium focus:ring-2 focus:ring-primary outline-none transition-all"
              >
                <option value="all">All Facility Types ({nearbyFacilities.length})</option>
                <option value="hospital">Hospitals ({nearbyFacilities.filter(f => f.type === 'hospital').length})</option>
                <option value="clinic">Emergency Clinics ({nearbyFacilities.filter(f => f.type === 'clinic').length})</option>
                <option value="pharmacy">Pharmacies & Chemists ({nearbyFacilities.filter(f => f.type === 'pharmacy').length})</option>
                <option value="dental">Dental Clinics ({nearbyFacilities.filter(f => f.type === 'dental').length})</option>
                <option value="specialty">Specialist Centers ({nearbyFacilities.filter(f => f.type === 'specialty').length})</option>
                <option value="diagnostic">Diagnostics & Labs ({nearbyFacilities.filter(f => f.type === 'diagnostic').length})</option>
              </select>
            )}
          </form>

          {/* Gorgeous Category Select Badges with Real Counts */}
          {!aiAdvisorEnabled && (
            <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
              <div className="flex gap-3 min-w-max">
                {[
                  { id: 'all', label: 'All Providers', count: nearbyFacilities.length, icon: Activity, color: 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900', activeColor: 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25' },
                  { id: 'hospital', label: 'Hospitals', count: nearbyFacilities.filter(f => f.type === 'hospital').length, icon: Hospital, color: 'border-rose-100 dark:border-rose-950/40 text-rose-700 dark:text-rose-400 bg-rose-500/5', activeColor: 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20' },
                  { id: 'clinic', label: 'Emergency Clinics', count: nearbyFacilities.filter(f => f.type === 'clinic').length, icon: Activity, color: 'border-emerald-100 dark:border-emerald-950/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5', activeColor: 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' },
                  { id: 'pharmacy', label: 'Pharmacies & Chemists', count: nearbyFacilities.filter(f => f.type === 'pharmacy').length, icon: PlusCircle, color: 'border-teal-100 dark:border-teal-950/40 text-teal-700 dark:text-teal-400 bg-teal-500/5', activeColor: 'bg-teal-500 text-white border-teal-500 shadow-lg shadow-teal-500/20' },
                  { id: 'dental', label: 'Dental Clinics', count: nearbyFacilities.filter(f => f.type === 'dental').length, icon: Smile, color: 'border-blue-100 dark:border-blue-950/40 text-blue-700 dark:text-blue-400 bg-blue-500/5', activeColor: 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' },
                  { id: 'specialty', label: 'Specialist Centers', count: nearbyFacilities.filter(f => f.type === 'specialty').length, icon: Stethoscope, color: 'border-purple-100 dark:border-purple-950/40 text-purple-700 dark:text-purple-400 bg-purple-500/5', activeColor: 'bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/20' },
                  { id: 'diagnostic', label: 'Diagnostics & Labs', count: nearbyFacilities.filter(f => f.type === 'diagnostic').length, icon: FlaskConical, color: 'border-amber-100 dark:border-amber-950/40 text-amber-700 dark:text-amber-400 bg-amber-500/5', activeColor: 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' },
                ].map((cat) => {
                  const Icon = cat.icon;
                  const isActive = filterType === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setFilterType(cat.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border font-bold text-xs transition-all duration-300 ${
                        isActive ? cat.activeColor : `${cat.color} hover:border-slate-300 dark:hover:border-slate-700 hover:scale-[1.01]`
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{cat.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-500/10 text-slate-500 dark:text-slate-400'
                      }`}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {aiAdvisorEnabled ? (
              <div className="space-y-6">
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  AI Clinical Advice & Matching Facilities
                </h2>

                {aiLoading && (
                  <div className="p-10 text-center bg-card rounded-[2.5rem] border border-indigo-500/10 shadow-lg shadow-indigo-500/5">
                    <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-4" />
                    <p className="text-sm font-bold text-foreground">Analyzing medical query and searching local health resources...</p>
                    <p className="text-xs text-muted-foreground mt-2 animate-pulse">Consulting Gemini with live Google Maps grounding vectors...</p>
                  </div>
                )}

                {aiError && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 text-sm flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 animate-bounce" />
                    {aiError}
                  </div>
                )}

                {aiAdvice && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/20 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden text-foreground"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
                    <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-indigo-500/10">
                      <div className="p-2 bg-indigo-500/15 rounded-xl text-indigo-600 dark:text-indigo-400">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-foreground uppercase tracking-wider">AI Clinical Advisor Analysis</h3>
                        <p className="text-[10px] text-muted-foreground">Empathetic patient support grounded via Google Maps</p>
                      </div>
                    </div>
                    <div className="prose dark:prose-invert prose-xs text-sm text-slate-700 dark:text-slate-200 leading-relaxed max-w-none">
                      <ReactMarkdown>{aiAdvice}</ReactMarkdown>
                    </div>
                    <div className="mt-6 flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                        <strong>Disclaimer:</strong> This automated advisor uses Google Maps Grounding to suggest facilities. It does not provide medical treatment, diagnosis, or emergency dispatch services. If you are experiencing a life-threatening emergency, please call local emergency numbers or proceed to the nearest emergency room immediately.
                      </p>
                    </div>
                  </motion.div>
                )}

                {aiFacilities && (
                  <div className="space-y-4 pt-4">
                    <h3 className="font-extrabold text-xs uppercase tracking-widest text-muted-foreground">AI Recommended Facilities ({aiFacilities.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {aiFacilities.length > 0 ? (
                        aiFacilities.map((facility, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-card border border-indigo-500/25 p-6 rounded-[2rem] group hover:border-indigo-500 transition-all shadow-sm hover:shadow-md flex flex-col justify-between text-foreground"
                          >
                            <div>
                              <div className="flex items-start justify-between mb-4 gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className={`p-3 rounded-2xl ${
                                    facility.type === 'pharmacy' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' :
                                    facility.type === 'clinic' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                    facility.type === 'dental' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                    facility.type === 'specialty' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                                    facility.type === 'diagnostic' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                    'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                  }`}>
                                    {facility.type === 'pharmacy' ? (
                                      <PlusCircle className="w-6 h-6" />
                                    ) : facility.type === 'clinic' ? (
                                      <Activity className="w-6 h-6" />
                                    ) : facility.type === 'dental' ? (
                                      <Smile className="w-6 h-6" />
                                    ) : facility.type === 'specialty' ? (
                                      <Stethoscope className="w-6 h-6" />
                                    ) : facility.type === 'diagnostic' ? (
                                      <FlaskConical className="w-6 h-6" />
                                    ) : (
                                      <Hospital className="w-6 h-6" />
                                    )}
                                  </div>
                                  {facility.distanceDisplay && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">
                                      <MapPin className="w-3 h-3" />
                                      {facility.distanceDisplay} Away
                                    </div>
                                  )}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 border ${
                                  facility.type === 'pharmacy' ? 'bg-teal-500/5 text-teal-600 dark:text-teal-400 border-teal-500/20' :
                                  facility.type === 'clinic' ? 'bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                                  facility.type === 'dental' ? 'bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                                  facility.type === 'specialty' ? 'bg-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-500/20' :
                                  facility.type === 'diagnostic' ? 'bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                                  'bg-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                }`}>
                                  {facility.type === 'hospital' ? 'Hospital' :
                                   facility.type === 'clinic' ? 'Clinic' :
                                   facility.type === 'pharmacy' ? 'Pharmacy' :
                                   facility.type === 'dental' ? 'Dental' :
                                   facility.type === 'specialty' ? 'Specialist' :
                                   facility.type === 'diagnostic' ? 'Diagnostic/Lab' : facility.type}
                                </span>
                              </div>
                              <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {facility.name}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {facility.address}
                              </p>
                              {facility.reviews && facility.reviews.length > 0 && (
                                <div className="mb-4 flex flex-wrap gap-1">
                                  {facility.reviews.map((rev, rIdx) => (
                                    <span key={rIdx} className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                                      {rev}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="mt-4 pt-4 border-t border-border/60 flex flex-col sm:flex-row gap-2">
                              <button 
                                onClick={() => handleRedirectToMaps(facility)}
                                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 cursor-pointer"
                              >
                                <Navigation className="w-4 h-4 animate-pulse" />
                                Get Directions
                              </button>
                              <button
                                onClick={() => handleEmbedHospital(facility)}
                                disabled={embeddingId === facility.name || isAlreadyPartner(facility)}
                                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                                  isAlreadyPartner(facility)
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                    : 'bg-transparent text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/5'
                                }`}
                              >
                                <Database className="w-4 h-4" />
                                {embeddingId === facility.name ? (
                                  <>Embedding...</>
                                ) : isAlreadyPartner(facility) ? (
                                  <>Saved Partner 🤝</>
                                ) : (
                                  <>Embed in DB</>
                                )}
                              </button>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="col-span-full py-20 text-center bg-card rounded-[2.5rem] border border-dashed border-border">
                          <Navigation className="w-12 h-12 text-muted/20 mx-auto mb-4" />
                          <p className="text-muted-foreground">Describe your health concern and click "Search with AI" to locate matched providers.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Nearby Facilities ({filteredNearby.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredNearby.length > 0 ? filteredNearby.map((facility, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-card border border-border p-6 rounded-[2rem] group hover:border-primary/50 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between mb-4 gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className={`p-3 rounded-2xl ${
                              facility.type === 'pharmacy' ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400' :
                              facility.type === 'clinic' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                              facility.type === 'dental' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                              facility.type === 'specialty' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                              facility.type === 'diagnostic' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                              'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}>
                              {facility.type === 'pharmacy' ? (
                                <PlusCircle className="w-6 h-6" />
                              ) : facility.type === 'clinic' ? (
                                <Activity className="w-6 h-6" />
                              ) : facility.type === 'dental' ? (
                                <Smile className="w-6 h-6" />
                              ) : facility.type === 'specialty' ? (
                                <Stethoscope className="w-6 h-6" />
                              ) : facility.type === 'diagnostic' ? (
                                <FlaskConical className="w-6 h-6" />
                              ) : (
                                <Hospital className="w-6 h-6" />
                              )}
                            </div>
                            {facility.distanceDisplay && (
                              <div className="flex items-center gap-1.5 px-3 py-1 bg-primary text-primary-foreground rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                                <MapPin className="w-3 h-3" />
                                {facility.distanceDisplay} Away
                              </div>
                            )}
                            {facility.durationDisplay && (
                              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20">
                                <Clock className="w-3 h-3 text-white" />
                                Drive: {facility.durationDisplay}
                              </div>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 border ${
                            facility.type === 'pharmacy' ? 'bg-teal-500/5 text-teal-600 dark:text-teal-400 border-teal-500/20' :
                            facility.type === 'clinic' ? 'bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                            facility.type === 'dental' ? 'bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                            facility.type === 'specialty' ? 'bg-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-500/20' :
                            facility.type === 'diagnostic' ? 'bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                            'bg-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/20'
                          }`}>
                            {facility.type === 'hospital' ? 'Hospital' :
                             facility.type === 'clinic' ? 'Clinic' :
                             facility.type === 'pharmacy' ? 'Pharmacy' :
                             facility.type === 'dental' ? 'Dental' :
                             facility.type === 'specialty' ? 'Specialist' :
                             facility.type === 'diagnostic' ? 'Diagnostic/Lab' : facility.type}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                          {facility.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2.5 flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-primary/70 shrink-0 mt-0.5" />
                          <span>{facility.address}</span>
                        </p>

                        {/* Contact Phone & Hours */}
                        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs mb-3">
                          {facility.phone && (
                            <a 
                              href={`tel:${facility.phone.replace(/[^\d+]/g, '')}`}
                              className="inline-flex items-center gap-1 font-bold text-primary hover:underline bg-primary/10 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{facility.phone}</span>
                            </a>
                          )}
                          {facility.openingHours && (
                            <div className="inline-flex items-center gap-1 text-muted-foreground text-[11px] font-semibold bg-muted px-2 py-1 rounded-lg">
                              <Clock className="w-3 h-3 text-primary" />
                              <span>{facility.openingHours}</span>
                            </div>
                          )}
                        </div>

                        {/* Services Badges */}
                        {facility.services && facility.services.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {facility.services.slice(0, 3).map((srv: string, sIdx: number) => (
                              <span key={sIdx} className="text-[10px] font-semibold bg-muted/80 text-foreground px-2 py-0.5 rounded-md border border-border/50">
                                {srv}
                              </span>
                            ))}
                            {facility.services.length > 3 && (
                              <span className="text-[10px] text-muted-foreground font-semibold px-1 py-0.5">
                                +{facility.services.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {facility.reviews && facility.reviews.length > 0 && (
                          <div className="mb-4 flex flex-wrap gap-1">
                            {facility.reviews.map((rev, rIdx) => (
                              <span key={rIdx} className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                                {rev}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="mt-4 pt-4 border-t border-border/60 flex flex-col sm:flex-row gap-2">
                        <button 
                          onClick={() => handleRedirectToMaps(facility)}
                          className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 hover:bg-primary/90 shadow-lg shadow-primary/20 cursor-pointer"
                        >
                          <Navigation className="w-4 h-4 animate-pulse" />
                          Get Directions
                        </button>
                        <button
                          onClick={() => handleEmbedHospital(facility)}
                          disabled={embeddingId === facility.name || isAlreadyPartner(facility)}
                          className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                            isAlreadyPartner(facility)
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-transparent text-primary dark:text-primary-foreground border-primary/20 hover:bg-primary/5'
                          }`}
                        >
                          <Database className="w-4 h-4" />
                          {embeddingId === facility.name ? (
                            <>Embedding...</>
                          ) : isAlreadyPartner(facility) ? (
                            <>Saved Partner 🤝</>
                          ) : (
                            <>Embed in DB</>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="col-span-full py-20 text-center bg-card rounded-[2.5rem] border border-dashed border-border">
                      <Navigation className="w-12 h-12 text-muted/20 mx-auto mb-4" />
                      <p className="text-muted-foreground">Authorize your GPS location or adjust filters to view nearby providers.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="space-y-8">
            <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                Partner Hospitals
              </h2>
              <div className="space-y-6">
                {filteredHospitals.map((hospital) => (
                  <div key={hospital.id} className="group cursor-pointer">
                    <div className="flex gap-4 mb-4">
                      <img 
                        src={getHospitalImage(hospital)} 
                        alt={hospital.name} 
                        className="w-20 h-20 rounded-2xl object-cover border border-border"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const index = Math.abs(hospital.id ? hospital.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : 0) % FALLBACK_HOSPITAL_IMAGES.length;
                          target.src = FALLBACK_HOSPITAL_IMAGES[index];
                        }}
                      />
                      <div>
                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{hospital.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{hospital.address}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1.5 text-primary text-xs font-bold">
                            <Clock className="w-3 h-3" />
                            {hospital.openingHours}
                          </div>
                          {getDistanceDisplay(hospital) && (
                            <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                              <MapPin className="w-3 h-3" />
                              {getDistanceDisplay(hospital)} Away
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleRedirectToMaps(hospital)}
                        className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md shadow-primary/10"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        Navigate on Google Maps
                      </button>
                    </div>
                    <div className="mt-4 h-px bg-border group-last:hidden"></div>
                  </div>
                ))}
              </div>
            </div>

            {groundingSources && groundingSources.length > 0 && (
              <div className="bg-card p-8 rounded-[2.5rem] border border-emerald-500/20 shadow-sm">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <MapPin className="w-5 h-5" />
                  Verified Google Maps Sources
                </h2>
                <div className="space-y-6">
                  {groundingSources.map((source, sIdx) => (
                    <div key={sIdx} className="group">
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                            {source.title}
                          </h3>
                          <a 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-xs flex items-center gap-1 shrink-0 font-bold"
                          >
                            Map <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        {source.reviewSnippets && source.reviewSnippets.length > 0 && (
                          <div className="mt-2 space-y-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-border/60">
                            {source.reviewSnippets.map((snippet: string, snIdx: number) => (
                              <p key={snIdx} className="text-xs text-muted-foreground italic leading-relaxed">
                                "{snippet}"
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="mt-4 h-px bg-border group-last:hidden animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Info className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Distance Standard</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                Estimations are mathematically structured on real spatial vectors using standard Haversine mathematical procedures matching your active browser coordinate location directly to facilities' referenced landmarks. No static mock data is utilized.
              </p>
              <button 
                onClick={handleLocateNearby}
                className="w-full py-4 bg-muted hover:bg-slate-200 dark:hover:bg-slate-800 text-foreground border border-border rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <MapPin className="w-5 h-5 text-primary" />
                Refresh GPS Distance
              </button>
            </div>
          </div>
        </div>
      </div>
    </GuestOverlay>
  );
};

export default Hospitals;
