import { NextRequest, NextResponse } from 'next/server';

// Mock Ankara closed roads fallback data in case the external API fails or is empty
const MOCK_CLOSED_ROADS = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: 1,
      properties: {
        name: "Atatürk Bulvarı (Kızılay Kavşağı - Sıhhiye)",
        desc: "Protokol geçişi ve yol çalışması nedeniyle çift yönlü olarak trafiğe kapatılmıştır.",
        type: "closed"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [32.8542, 39.9208], // Kızılay
          [32.8545, 39.9250],
          [32.8549, 39.9304]  // Sıhhiye
        ]
      }
    },
    {
      type: "Feature",
      id: 2,
      properties: {
        name: "Tunus Caddesi (Kavaklıdere)",
        desc: "Altyapı yenileme çalışmaları sebebiyle yol trafiğe kapatılmıştır. Alternatif güzergahları kullanınız.",
        type: "closed"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [32.8604, 39.9095],
          [32.8596, 39.9148]
        ]
      }
    },
    {
      type: "Feature",
      id: 3,
      properties: {
        name: "Mithatpaşa Caddesi (Sıhhiye Yönü)",
        desc: "Güvenlik tedbirleri nedeniyle tek şerit kontrollü geçiş sağlanmaktadır.",
        type: "warning"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [32.8601, 39.9231],
          [32.8615, 39.9288]
        ]
      }
    },
    {
      type: "Feature",
      id: 4,
      properties: {
        name: "İsmet İnönü Bulvarı (Kara Kuvvetleri Kavşağı)",
        desc: "Yapım çalışmaları nedeniyle yol daraltması yapılmıştır.",
        type: "warning"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [32.8465, 39.9152],
          [32.8510, 39.9160]
        ]
      }
    }
  ]
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rev = searchParams.get('v') || '1';

  try {
    const response = await fetch(`https://harita.iletisim.gov.tr/data/closed-roads.geojson?v=${rev}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      throw new Error(`Closed Roads API returned status: ${response.status}`);
    }

    const data = await response.json();
    
    // If the government API returns empty features, merge with or use mock data so the app has something to show.
    if (!data.features || data.features.length === 0) {
      return NextResponse.json({
        ...data,
        features: MOCK_CLOSED_ROADS.features,
        info: "Government API returned 0 closed roads. Showing demonstration mock data."
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching closed roads, using mock data:', error);
    return NextResponse.json(MOCK_CLOSED_ROADS);
  }
}
