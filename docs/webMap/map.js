mapboxgl.accessToken = 'pk.eyJ1IjoibGlzYWtpbTQyNSIsImEiOiJja3E5b3UxbDEwOTBsMm9xcjdseXA0eHhtIn0.3AmcTM0qznAEjRuU2SNnoA';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/lisakim425/ckrvhzdep8c5517w9zkrso4cr',
    zoom: 1,
    center: [-74, 40.725],
    maxZoom: 15,
    minZoom: 5,
    maxBounds: [[-74.45, 40.45], [-73.55, 41]]
});


map.on('load', function () {
  var layers = map.getStyle().layers;
for (var i = 0; i < layers.length; i++) {
    console.log(layers[i].id);
}
  map.addLayer({
      'id': 'shootingsData',
      'type': 'circle',
      'source': {
          'type': 'geojson',
          'data': 'data/NYPDShootingIncidentData2021.geojson'
      },
      'paint': {
          'circle-color': '#800020',
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 0.4,
          'circle-radius': 3
          
        }
      });

      map.addLayer({
        'id': 'medianIncome',
        'type': 'fill',
        'source': {
            'type': 'geojson',
            'data': 'data/medianIncome.geojson'
        },
        'paint': {
          'fill-color': ['step', ['get', 'MHHI'],
          '#e8fae7',
              20000, '#cef4cb',
              50000, '#7fe47a',
              70000, '#32d22a',
              100000, '#1f8119',
              150000, '#155811'],
          'fill-opacity': ['case', ['==', ['get', 'MHHI'], null], 0, 0.65]
      }
  }, 'waterway-shadow');

  });


// Create the popup
// Corresponding 'id' goes in the second slot
map.on('click', 'shootingsData', function (e) {
  var precinct = e.features[0].properties.precinct;
  var boro = e.features[0].properties.boro;
  var occur_date = e.features[0].properties.occur_date;
  var occur_time = e.features[0].properties.occur_time; 
  new mapboxgl.Popup()
      .setLngLat(e.lngLat)
      .setHTML('<b>Precinct:</b> ' + precinct + '<br>' + '<b>Borough:</b> ' + boro + '<br>' + '<b>Occurance date:</b> ' + occur_date + '<br>' + '<b>Occurance time:</b> ' + occur_time)
      .addTo(map);
});

// Change the cursor to a pointer when the mouse is over the turnstileData layer.
map.on('mouseenter', 'shootingsData', function () {
  map.getCanvas().style.cursor = 'pointer';
});
// Change it back to a pointer when it leaves.
map.on('mouseleave', 'shootingsData', function () {
  map.getCanvas().style.cursor = '';
});


// add menu
var toggleableLayerIds = ['shootingsData', 'medianIncome'];


for (var i = 0; i < toggleableLayerIds.length; i++) {
    var id = toggleableLayerIds[i];

    var link = document.createElement('a');
    link.href = '#';
    link.className = 'active';
    link.textContent = id;

    link.onclick = function(e) {
        var clickedLayer = this.textContent;
        e.preventDefault();
        e.stopPropagation();

        var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

        if (visibility === 'visible') {
            map.setLayoutProperty(clickedLayer, 'visibility', 'none');
            this.className = '';
        } else {
            this.className = 'active';
            map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
        }
    };

    var layers = document.getElementById('menu');
    layers.appendChild(link);
}
