# Signal Lost — Safety & Property Logic

## The Problem
The game uses real-world GPS locations. Players can drop a pin anywhere in the world and deploy there. This creates real risks:
- Trespassing onto private property
- Disturbing residential areas at night
- Suspicious activity reports to police (people walking around with phones = "suspicious person")
- Safety hazards (near traffic, construction sites, dangerous terrain)
- Privacy concerns (players dropping pins on someone's house)
- Players might be lured (e.g. a fake "cache" placed on a dangerous or restricted location)
- Liability issues

---

## 1. No Pins on Private Residential Properties

**How it works:**
- The game uses OpenStreetMap data to check if the dropped pin is within a residential property boundary (buildings with `building=house`, `building=residential`, `landuse=residential`, or areas tagged as private)
- If the pin is on a residential lot, the game REJECTS the pin and shows a warning: "📍 This location is a residential area. Deploy within 500m of this point instead."
- The game automatically moves the mission zone center to the nearest public space (nearest street, park, public square, sidewalk, or unzoned area)
- This is NOT blocking entire residential zones — just individual properties. Your street, sidewalk, and nearby parks are fine.

**Edge cases:**
- Apartment buildings: the building itself is blocked. The street outside is fine.
- Rural properties with large land: if OSM tags it as `landuse=farmyard` or `landuse=residential`, the pin center is moved to the nearest road or public access point
- Gated communities: if OSM has gate or barrier tags, the public road outside the gate is the deploy point

**Why OSM data works:**
OpenStreetMap has detailed land-use tags for most of the world:
- `building=house`, `building=residential`, `building=apartments`
- `landuse=residential`, `landuse=farmyard`
- `access=private`, `access=customers`
- `barrier=gate`, `barrier=fence`

The game checks these for the pin location and rejects if flagged.

---

## 2. Deploy-to-Public-Space Zone Offset

If a player drops a pin on a restricted area (private property, hazardous zone, school, military base), the game doesn't just block it — it offsets the deployment zone to the nearest **publicly accessible** space:

**Priority order for offset:**
1. Nearest public road (checked via OSM `highway=*`)
2. Nearest park / green space (`leisure=park`, `landuse=grass`)
3. Nearest public square / plaza (`highway=pedestrian`, `place=square`)
4. Nearest public building (`building=public`, `amenity=community_centre`)
5. Nearest sidewalk or path (`highway=footway`, `highway=path`)

**What the player sees:**
> "📍 Your pin was set on a restricted area. The mission zone has been shifted 180m northeast to [Park Name / Street Name]."
> [Accept] [Pick a different location]

---

## 3. Blocked Locations (No Deploy)

These locations are **completely blocked**. Pins within 100m are rejected and the game refuses to generate a mission:

| Category | OSM Tags Checked | Rationale |
|----------|------------------|-----------|
| Military bases | `military=*` | Obvious safety/legal issues |
| Schools / Kindergartens | `amenity=school`, `amenity=kindergarten` | No gameplay near children |
| Prisons / Detention centers | `amenity=prison`, `amenity=police` | Security risk |
| Hospitals / Emergency services | `amenity=hospital`, `amenity=fire_station` | Don't interfere with emergency services |
| Government buildings | `building=government`, `office=government` | Security concerns |
| Airports / Airfields | `aeroway=*` | Safety + legal |
| Construction sites | `landuse=construction` | Physical safety hazard |
| Railways / Train tracks | `railway=rail` (active lines) | Physical safety |
| Highways / Motorways | `highway=motorway`, `highway=trunk` (not local roads) | Physical safety |

**What the player sees:**
> "⛔ This location is blocked for safety reasons. Please choose a different area."
> [Pick a different location]

---

## 4. Time-Based Safety — No Night Deployment in Quiet Areas

At night (local time, based on pin location's timezone), deployment is restricted:

| Time | Rule |
|------|------|
| 06:00 - 22:00 | Normal — any public space is fine |
| 22:00 - 06:00 | Residential zones (entire zones, not just properties) are blocked. Parks close at 23:00. Commercial/industrial areas are fine. |

**Why:** We don't want players walking around a residential neighborhood at 2 AM looking for caches. That's how you get the police called on you.

**What the player sees at night:**
> "🌙 Night mode: residential areas are restricted. Choose a commercial, industrial, or wilderness zone, or set the mission during daytime hours."
> [Continue anyway (I'm in a safe area)] — advanced users can override with a warning acknowledgment

---

## 5. Player Consent & Awareness

Every player gets a safety briefing before their first mission (shown once, then acknowledgment saved in localStorage):

```
SIGNAL LOST — SAFETY BRIEFING

• This game uses your real GPS location
• Only deploy in areas you are legally allowed to be
• Do not trespass on private property
• Be aware of your surroundings at all times
• Do not use the game while driving or operating machinery
• Respect local laws and regulations
• If someone asks what you're doing, explain you're playing a game
• If confronted by authorities, comply and explain
• The game generates objectives on public spaces only
• You are responsible for your own safety

I understand and accept ✓
```

---

## 6. Property Owner Opt-Out

Property owners can **opt out** of having their property used as a mission location:

**How:**
- A web form on the Signal Lost website: enter your address/property coordinates
- The game adds the property to a local exclusion list
- When generating missions, the zone boundaries exclude these properties
- This uses OSM building outlines — so the exclusion is per-building, not per-area

**Technical approach:**
- Exclusion list is stored per-instance (not global — each game server has its own)
- The host can import/export exclusion lists for their community games
- Property owners can also contact the developer to add to a global blocklist

**What players see if they drop a pin near an excluded property:**
> "🏠 This area includes a property that has opted out of Signal Lost. The mission zone has been adjusted 50m east."
> (No fuss, just auto-adjusts)

---

## 7. Huge Properties Logic

Some players have very large properties — farms, ranches, large estates. They may want to play on their own land.

**Two scenarios:**

### Scenario A: Own Property
- If the host drops a pin on property they own (or have permission to be on), they should be able to deploy there
- **Verification:** Google Maps / OSM doesn't show ownership. So the logic is:
  1. The host can **claim** a property as their own by entering the coordinates and acknowledging: "I have permission to be on this property"
  2. Other squads joining the mission see: "Private Property — only deploy if you have permission"
  3. Public Open World games do NOT place objectives inside claimed properties (objectives generate 100m+ away)
  4. Private games (invite-only via game code) allow deployment anywhere the host approves

### Scenario B: Playing On Someone's Large Property
- If you know the owner and have permission: the host can mark the mission as "Private — permission granted"
- The game still blocks it for public games but allows it for private game codes
- No verification system — this is on the honor system. The safety briefing covers it.

### Technical implementation:
- **Claimed properties** = a local database of `[lat, lng, radius]` entered by hosts
- When generating objectives: check claimed properties database
- If pin is inside claimed + not the host's own claimed: shift objectives away
- If pin is inside claimed + IS the host's own: allow, show "private property" warning to all joiners

---

## 8. Squad-to-Squad Safety — No Luring to Dangerous Locations

The indirect PvP systems (traps, false objectives) must not be abusable to lure players to dangerous real-world locations:

**Rules:**
- Traps can only be placed within 100m of an existing objective (you can't place a trap in the middle of nowhere)
- False objective markers generate within 100-300m of a real objective — not kilometers away into dangerous areas
- All trap objectives are checked against the blocked-location list automatically
- If a trap/decoy would spawn in a blocked area, it re-rolls to a safe location

**Result:** You can't trick someone into walking onto train tracks or into a construction site by putting a fake cache there.

---

## 9. Emergency Situations

**Out of scope.** The game is not a medical device or safety app.

**What the game does:**
- Emergency Stop button (always visible on screen)
- When pressed: ends your participation, removes your position from the map
- Displays your current GPS coordinates in large text
- That's it. No 911 integration, no alerts, no tracking after mission end.

**What the game does NOT do:**
- Call emergency services
- Send alerts to squad members
- Track your location after the mission ends
- Provide medical advice

**Safety briefing reminder:** "If you are injured or in danger, call your local emergency services immediately. Your GPS coordinates are displayed on screen."

---

## 10. Public Spaces Are the Default

For standard (non-custom) missions, the game defaults to **pre-approved public zones**:

- Parks (OSM `leisure=park`)
- Public squares (`place=square`)
- Urban plazas (`highway=pedestrian`)
- Beaches (`natural=beach`)
- Nature reserves (`leisure=nature_reserve`)
- Sports fields (`leisure=pitch`, `leisure=sports_centre`)
- University campuses (`amenity=university`)
- Commercial districts (`landuse=retail`, `landuse=commercial`)
- Industrial zones (`landuse=industrial`) — safe during daylight

The game picks a random public space within the area the player chooses, so they don't have to worry about finding a "good spot" to play.

---

## Summary Table

| Concern | Solution |
|---------|----------|
| Trespassing on private property | OSM-based residential property detection + auto-offset to public space |
| Playing at night in quiet areas | Time-based zone restrictions (22:00-06:00) |
| Blocked locations (military, schools, hospitals, railways) | Complete game-level block with OSM tag detection |
| Safety hazards (construction, highways) | Blocked via OSM `landuse=construction`, `highway=motorway` |
| Property owners don't want the game near them | Opt-out form + per-instance exclusion list + auto-adjust |
| Huge properties / farms / ranches | Claimed property system — private games allow, public games offset |
| Players luring others to dangerous spots via traps/fakes | Trap placement restricted to near-real-objectives, checked against blocklist |
| First-time player awareness | Mandatory safety briefing before first mission |
| No public space to deploy | Zone offset to nearest road/park/square automatically |
