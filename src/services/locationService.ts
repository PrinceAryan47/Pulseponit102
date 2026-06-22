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

export const findNearbyFacilities = async (lat: number, lng: number): Promise<NearbyFacility[]> => {
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
    return data as NearbyFacility[];
  } catch (error) {
    console.error("Error fetching nearby facilities via client proxy:", error);
    return [];
  }
};
