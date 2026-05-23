# Signal Lost Action Control Prototype

This is the cinematic dark mission-control comparison build for the real-time multiplayer GPS adventure game described in the PDF.

## Open It

The local server is running at:

```text
http://127.0.0.1:5181/
```

If you need to restart it later:

```powershell
cd "C:\Users\morga\Documents\Codex\2026-04-28\files-mentioned-by-the-user-real\mission-control-ui-04-action-control"
python -m http.server 5181 --bind 127.0.0.1
```

## What Is Included

- Mission Control dashboard with live simulated player movement.
- Dark OpenStreetMap/Leaflet map treatment with tactical overlays.
- Cinematic radar with sweep, rings, blips, target labels, and alert zones.
- Live HUD sparklines for signal, crew, threat, sat link, GPS stability, and time.
- Role-aware squad list for Drone, Mechanic, Medic, Decoder, and AI roles.
- Objective chain with proximity distance calculations using the Haversine formula.
- Session code generator for Jackbox-style game joining.
- Team chat mockup.
- PWA manifest and service worker starter.
- Cipher key, override protocol, signal warning graph, mini-topography, and system log panels.

## Next Build Steps

- Add a real backend for sessions, players, chat, and live coordinates.
- Add organizer setup screens for public/private game creation.
- Add mobile field-agent dashboards for each role.
- Add real GPS permission flow and manual coordinate fallback.
- Add module loading for treasure hunt, enemy AI, waypoints, ciphers, and voice.