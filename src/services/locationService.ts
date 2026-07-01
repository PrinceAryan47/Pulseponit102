export interface NearbyFacility {
  name: string;
  address: string;
  type: 'hospital' | 'clinic' | 'pharmacy';
  mapsUrl: string;
  lat?: number;
  lng?: number;
  distanceMeter?: number;
  distanceDisplay?: string;
  durationDisplay?: string;
  reviews?: string[];
}

export interface NearbyFacilitiesResponse {
  facilities: NearbyFacility[];
  groundingSources: any[];
}

export const findNearbyFacilities = async (lat: number, lng: number): Promise<NearbyFacilitiesResponse> => {
  try {
    const response = await fetch("/api/facilities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ lat, lng })
    });
    
    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data && typeof data === 'object' && 'facilities' in data) {
      return data as NearbyFacilitiesResponse;
    }
    
    return {
      facilities: Array.isArray(data) ? data : [],
      groundingSources: []
    };
  } catch (error) {
    console.error("Error fetching nearby facilities via client proxy:", error);
    return { facilities: [], groundingSources: [] };
  }
};
