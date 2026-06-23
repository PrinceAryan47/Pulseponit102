import React, { useState, useEffect } from 'react';
import { Hospital as HospitalType } from '../types';
import { collection, onSnapshot, query } from 'firebase/firestore';
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
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { findNearbyFacilities, NearbyFacility } from '../services/locationService';
import VoiceSearch from '../components/VoiceSearch';
import GuestOverlay from '../components/GuestOverlay';

const Hospitals: React.FC = () => {
  const [hospitals, setHospitals] = useState<HospitalType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [nearbyFacilities, setNearbyFacilities] = useState<NearbyFacility[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'hospital' | 'clinic' | 'pharmacy'>('all');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Fetch hospitals from database
  useEffect(() => {
    const q = query(collection(db, 'hospitals'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as HospitalType));
      setHospitals(data);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching hospitals:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Automatically fetch user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          try {
            const results = await findNearbyFacilities(latitude, longitude);
            setNearbyFacilities(results);
          } catch (err) {
            console.error("Failed to fetch facilities on mount:", err);
          }
        },
        (err) => {
          console.warn("Location access not granted on load:", err);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const handleLocateNearby = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        try {
          const results = await findNearbyFacilities(latitude, longitude);
          setNearbyFacilities(results);
        } catch (err) {
          setError("Failed to find nearby facilities. Please try again.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setError("Location access denied. Please enable location permissions in your browser to calculate distance.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
  };

  const getDistanceMeter = (h: HospitalType) => {
    if (!userLocation || !h.location?.lat || !h.location?.lng) return Infinity;
    return calculateDistance(userLocation[0], userLocation[1], h.location.lat, h.location.lng);
  };

  const getDistanceDisplay = (h: HospitalType) => {
    const dist = getDistanceMeter(h);
    if (dist === Infinity) return null;
    return dist > 1000 
      ? `${(dist / 1000).toFixed(1)} km` 
      : `${Math.round(dist)} m`;
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
    let mapsUrl = '';
    
    if ('mapsUrl' in facility && facility.mapsUrl) {
      mapsUrl = facility.mapsUrl;
    } else {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facility.name + ' ' + facility.address)}`;
    }

    if (mapsUrl) {
      window.open(mapsUrl, '_blank', 'noopener,noreferrer');
    } else {
      setError("Google Maps link is not available for this facility.");
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
              onClick={handleLocateNearby}
              disabled={locating}
              className="flex items-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
            >
              <Navigation className="w-5 h-5" />
              {locating ? 'Acquiring GPS...' : 'Calculate Distances to Facilities'}
            </button>
          </div>
        </div>

        {/* GPS Distance Status Banner */}
        <div className={`mb-8 p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm ${
          userLocation 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-400" 
            : "bg-amber-500/10 border-amber-500/25 text-amber-800 dark:text-amber-400"
        }`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl shrink-0 ${
              userLocation ? "bg-emerald-500/15" : "bg-amber-500/15"
            }`}>
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm mb-1">
                {userLocation ? 'GPS Geolocation Enabled' : 'GPS Distance Calculations Pending'}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {userLocation 
                  ? `Active live coordinates at [${userLocation[0].toFixed(5)}, ${userLocation[1].toFixed(5)}]. Real-time, evidence-based distance formulas have been updated automatically below.`
                  : "Allow location access to calculate standard physical distance ranges to all verified clinics, partner medical spaces, and health organizations near you."}
              </p>
            </div>
          </div>
          {!userLocation && (
            <button
              onClick={handleLocateNearby}
              disabled={locating}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white hover:text-white rounded-xl text-xs font-bold shrink-0 transition-all shadow-md shadow-amber-500/10"
            >
              Authorize GPS Location
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-12">
          <div className="flex-grow flex flex-col sm:flex-row gap-3">
            <div className="relative flex-grow flex gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or location..."
                  className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-foreground"
                />
              </div>
              <VoiceSearch onResult={(text) => setSearchTerm(text)} />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-6 py-3 bg-card border border-border rounded-2xl text-muted-foreground font-medium focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
            >
              <option value="all">All Types</option>
              <option value="hospital">Hospitals</option>
              <option value="clinic">Clinics</option>
              <option value="pharmacy">Pharmacies</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
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
                        <div className="p-3 bg-primary/10 rounded-2xl">
                          {facility.type === 'pharmacy' ? (
                            <PlusCircle className="w-6 h-6 text-primary" />
                          ) : facility.type === 'clinic' ? (
                            <Activity className="w-6 h-6 text-primary" />
                          ) : (
                            <Hospital className="w-6 h-6 text-primary" />
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
                      <span className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">
                        {facility.type}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
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
                  <div className="mt-4 pt-4 border-t border-border/60">
                    <button 
                      onClick={() => handleRedirectToMaps(facility)}
                      className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-2 hover:bg-primary/90 shadow-lg shadow-primary/20"
                    >
                      <Navigation className="w-4 h-4 animate-pulse" />
                      Get Directions (Google Maps)
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
                        src={hospital.photoURL} 
                        alt={hospital.name} 
                        className="w-20 h-20 rounded-2xl object-cover border border-border"
                        referrerPolicy="no-referrer"
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
