# Açık Yol Ankara

Ankara'daki geçici yol kapanmalarını ve protokol güzergâhlarını harita üzerinde gösterip rota üzerindeki uyarıları anlatan web tabanlı bir yardım aracı.

---

## Proje Hakkında

Bu uygulama, Ankara'da yürürlükteki yol kapanmaları ve protokol güzergâhlarını daha kullanıcı dostu bir arayüzle sunar.

- Kullanıcı harita üzerinden veya adres arayarak başlangıç ve varış noktası seçebilir.
- Sistem iki nokta arasında bir rota çizer.
- Rota, kapalı yol verileriyle çakışıyorsa kullanıcıya uyarı gösterir.
- Sağ panelde başlangıç noktasına en yakın yol uyarıları listelenir.

> **Not:** Canlı trafik verisi şu an dahil değildir. Rota süreleri teoriktir. Resmi trafik yönlendirmeleri her zaman önceliklidir.

---

## Özellikler

- 🔴 Kapalı yol kesimlerini harita üzerinde gösterme
- 🟠 Protokol / konvoy güzergâhlarını işaretleme
- 📍 Kullanıcının mevcut konumunu pinleme
- 🗺️ Başlangıç ve varış noktası seçme (haritadan veya arama ile)
- 🔍 Adres arama ve otomatik öneri
- 🚗 İki nokta arası rota çizme
- ⚠️ Rota kapalı yol kesimiyle çakışıyorsa uyarı verme
- 📋 Yakındaki yol uyarılarını mesafeye göre listeleme
- ◀▶ Sağ paneli açıp kapatma
- 📱 Mobil uyumlu sade arayüz

---

## Kullanılan Teknolojiler

| Teknoloji | Kullanım Amacı |
|---|---|
| [Next.js](https://nextjs.org/) | Web framework |
| [TypeScript](https://www.typescriptlang.org/) | Tip güvenliği |
| [Tailwind CSS](https://tailwindcss.com/) | Stil |
| [MapLibre GL](https://maplibre.org/) | Harita görselleştirme |
| [Turf.js](https://turfjs.org/) | Coğrafi analiz (rota–yol çakışma hesabı) |
| [OSRM](http://project-osrm.org/) | Rota hesaplama servisi |
| [Nominatim](https://nominatim.org/) | Adres arama ve ters geocoding |
| OpenStreetMap tabanlı harita katmanı | Arka plan haritası |

---

## Veri Kaynakları

Kapalı yol ve protokol güzergâh verileri resmi NATO trafik haritasından alınan açık GeoJSON dosyalarından okunmaktadır:

- `public/closed-roads.geojson` — Kapalı yol kesimleri
- `public/exclude-zones.json` — Protokol / konvoy güzergâhları

Harita ve rota servisleri OpenStreetMap tabanlıdır.

---

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcıda aç:

```
http://localhost:3000
```

---

## Proje Durumu

Bu proje **MVP aşamasındadır.**

- Canlı trafik verisi entegre değildir
- Rota süreleri teorik hesaptır, gerçek trafiği yansıtmaz
- Kapalı yol verileri manuel olarak güncellenmektedir
- Resmi trafik yönlendirmeleri her zaman önceliklidir

---

## Geliştirilebilecek Özellikler

- [ ] Canlı trafik API entegrasyonu
- [ ] Daha gelişmiş alternatif rota üretimi
- [ ] Kapalı yol verisinin otomatik güncellenmesi
- [ ] Anlık bildirim sistemi
- [ ] Mobil PWA desteği
- [ ] Kullanıcı bildirimi ile doğrulamalı yol durumu raporlama

---

## Ekran Görüntüleri

![Açık Yol Ankara ekran görüntüsü](./public/screenshot.png)

---

## Lisans

Bu proje eğitim ve MVP geliştirme amacıyla hazırlanmıştır.
