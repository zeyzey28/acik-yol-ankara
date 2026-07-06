import { NextRequest, NextResponse } from 'next/server';

// Mock Ankara exclude zones (VIP convoy routes / security zones) fallback
const MOCK_EXCLUDE_ZONES = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "zone-1",
      properties: {
        name: "Protokol Yolu (Esenboğa Havalimanı - Kızılay Güzergahı)",
        desc: "VIP Konvoy Geçişi Güzergahı. Belirtilen saatlerde kesintili kapatmalar uygulanabilir.",
        type: "convoy"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [33.0035, 40.1175], // Esenboğa Airport area
          [32.9644, 40.0652], // Pursaklar
          [32.8805, 39.9702], // Dışkapı
          [32.8549, 39.9304], // Sıhhiye
          [32.8542, 39.9208]  // Kızılay
        ]
      }
    },
    {
      type: "Feature",
      id: "zone-2",
      properties: {
        name: "Cumhurbaşkanlığı Külliyesi Çevresi Güvenlik Alanı",
        desc: "Beştepe bölgesi genelinde güvenlik tedbirleri kapsamında yüksek yoğunluklu VIP araç trafiği mevcuttur.",
        type: "exclude_area"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [32.7935, 39.9355],
            [32.8090, 39.9355],
            [32.8090, 39.9270],
            [32.7935, 39.9270],
            [32.7935, 39.9355]
          ]
        ]
      }
    },
    {
      type: "Feature",
      id: "zone-3",
      properties: {
        name: "TBMM Çevresi Protokol Bölgesi",
        desc: "Meclis yerleşkesi etrafında konvoy ve güvenlik önlemleri bulunmaktadır.",
        type: "exclude_area"
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [32.8480, 39.9145],
            [32.8550, 39.9145],
            [32.8550, 39.9075],
            [32.8480, 39.9075],
            [32.8480, 39.9145]
          ]
        ]
      }
    }
  ]
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zrev = searchParams.get('v') || '1';

  try {
    const response = await fetch(`https://harita.iletisim.gov.tr/data/exclude-zones.json?v=${zrev}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      throw new Error(`Exclude Zones API returned status: ${response.status}`);
    }

    const data = await response.json();
    
    // Check if the output is in GeoJSON format. If not (government site might use a custom JSON format),
    // convert it or merge it. If it returns empty, use our mock data.
    let geojsonResult = data;
    
    if (!data.features || data.features.length === 0) {
      geojsonResult = MOCK_EXCLUDE_ZONES;
    }

    return NextResponse.json(geojsonResult);
  } catch (error: any) {
    console.error('Error fetching exclude zones, using mock data:', error);
    return NextResponse.json(MOCK_EXCLUDE_ZONES);
  }
}
