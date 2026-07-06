import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startLon = searchParams.get('startLon');
  const startLat = searchParams.get('startLat');
  const endLon = searchParams.get('endLon');
  const endLat = searchParams.get('endLat');

  if (!startLon || !startLat || !endLon || !endLat) {
    return NextResponse.json(
      { ok: false, error: 'Başlangıç ve varış koordinatları eksik.' },
      { status: 200 }
    );
  }

  const lon1 = parseFloat(startLon);
  const lat1 = parseFloat(startLat);
  const lon2 = parseFloat(endLon);
  const lat2 = parseFloat(endLat);

  if (isNaN(lon1) || isNaN(lat1) || isNaN(lon2) || isNaN(lat2)) {
    return NextResponse.json(
      { ok: false, error: 'Koordinat değerleri sayısal olmalıdır.' },
      { status: 200 }
    );
  }

  try {
    // Query OSRM with alternatives=true and steps=false
    const osrmUrl = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson&alternatives=true&steps=false`;
    
    const response = await fetch(osrmUrl, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`OSRM service error (${response.status}):`, errText);
      return NextResponse.json(
        { ok: false, error: 'Rota servisi şu anda yanıt vermiyor.' },
        { status: 200 }
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonErr) {
      console.error('Failed to parse OSRM JSON response:', jsonErr);
      return NextResponse.json(
        { ok: false, error: 'Rota servisi şu anda yanıt vermiyor.' },
        { status: 200 }
      );
    }

    return NextResponse.json({ ok: true, ...data });
  } catch (error: any) {
    console.error('Route API proxy error:', error);
    return NextResponse.json(
      { ok: false, error: 'Rota servisine erişilemedi veya rota hesaplanamadı.' },
      { status: 200 }
    );
  }
}
