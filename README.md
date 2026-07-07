# Açık Yol Ankara

Açık Yol Ankara is a web-based map application that helps users view temporary road closures, protocol/convoy routes, and route-related warnings in Ankara.

The goal of the project is to present road closure data in a simpler interface, allow users to select a start and destination point, generate a route, and warn the user if the route passes near or intersects with affected road sections.

## Screenshots

![Mobile home screen](./public/screenshots:05-mobile.PNG)

![Mobile route result](./public/screenshots:06-mobile.PNG)

## Features

- Display closed roads on the map
- Display protocol / convoy routes
- Use the user’s current location as the starting point
- Select start and destination points
- Search for addresses and places
- Select points directly from the map
- Generate a route between selected points
- Show a warning if the route passes near affected road sections
- Show route distance and estimated duration
- Display a “Live traffic is not included” notice
- List nearby road warnings
- Mobile-friendly interface

## Technologies Used

- Next.js
- TypeScript
- Tailwind CSS
- MapLibre GL
- Turf.js
- OpenStreetMap-based map and geocoding services
- OSRM routing service

## Data Sources

The application uses GeoJSON-based road data to display temporary road closures and protocol/convoy routes.

Address and place search is based on OpenStreetMap-related services. Route generation is handled through the OSRM routing service.

Note: Route duration does not include live traffic data. Official traffic directions and announcements should always be followed.

## Installation

```bash
npm install
npm run dev
```
