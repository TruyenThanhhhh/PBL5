async function searchOSMPlaces(city_or_location) {
  try {
    const nRes = await fetch('https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(city_or_location) + '&format=json&limit=1', {
      headers: { 'User-Agent': 'VietTravelAI/1.0 (manhpc@example.com)' }
    });
    const geo = await nRes.json();
    if (!geo || geo.length === 0) return 'No geo';
    const {lat, lon} = geo[0];
    console.log('Lat:', lat, 'Lon:', lon);
    const oQuery = `[out:json][timeout:15];(node["tourism"~"attraction|museum|viewpoint|hotel"](around:10000,${lat},${lon});node["amenity"~"restaurant|cafe"](around:10000,${lat},${lon}););out tags 25;`;
    const oRes = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: oQuery,
      headers: {'Content-Type':'application/x-www-form-urlencoded'}
    });
    const oData = await oRes.json();
    console.log('POIs:', oData.elements.length);
    console.log(oData.elements.map(e => e.tags.name).join(', '));
  } catch (e) {
    console.error(e);
  }
}
searchOSMPlaces('Sapa');
