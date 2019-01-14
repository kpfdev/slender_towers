mapboxgl.accessToken = 'pk.eyJ1IjoiZGNoYXJ2ZXkiLCJhIjoiY2plZGJxZTRpMHRuMzJ3b2QxMjZ5YWJ5MyJ9.jvqvM0KoLvKvhglXy1cKiQ';

var map = new mapboxgl.Map({
  container: 'map', // container element id
  style: 'mapbox://styles/dcharvey/cjbpm8opy70gz2rskhcwuwz4r',
  center: [-74.0000, 40.7328], // initial map center in [lon, lat]
  zoom: 12.5,
  bearing: 320,
  pitch: 60
});

var settings = {
  'category':'height',
  'color_by_places':true,
  'color_column':'height',
  'height_factor':1
}

colorRamps = [['#6C0E23','#BF211E','#F95738','#FF9D42','#FFCD2B','#FFD85B'],['#151224','#343D5E','#4F777E','#709E87','#99BE95','#D6DEBF'],['#F79F79','#FFF275','#A690A4','#87B6A7']]

map.on('load', function() {
  map.addLayer({
    id: 'hex',
    type: 'fill-extrusion',
    source: {
      type: 'geojson',
      data: './data/towers.geojson' // replace this with the url of your own geojson
    }
  });

  // use initial settings to initialize the hex height and color
  updateHeight(settings.category)
  updateColorLinear('height', 0, [0, 100, 200, 300, 400, 600])

  // location of the click, with description HTML from its properties.
  map.on('click', 'hex', function (e) {
      new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(e.features[0].properties.name)
          .addTo(map);
  });

  // Change the cursor to a pointer when the mouse is over the states layer.
  map.on('mouseenter', 'hex', function () {
      map.getCanvas().style.cursor = 'pointer';
  });

  // Change it back to a pointer when it leaves.
  map.on('mouseleave', 'hex', function () {
      map.getCanvas().style.cursor = '';
  });

  var layers = map.getStyle().layers;
  var labelLayerId;
  for (var i = 0; i < layers.length; i++) {
      if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
          labelLayerId = layers[i].id;
          break;
      }
  }

  map.addLayer({
    'id': 'shadows',
    'type': 'fill',
    source: {
      type: 'geojson',
      data: './data/shadows.geojson' // replace this with the url of your own geojson
    },
    'paint': {
        'fill-color': [
              'interpolate',
              ['linear'],
              ['number', ['get', 'shadow']],
              250, colorRamps[0][0],
              500, colorRamps[0][1],
              750, colorRamps[0][2],
              1000, colorRamps[0][3],
              1250, colorRamps[0][4],
              1500, colorRamps[0][5]
        ],
        'fill-opacity': 0.8
    }
  }, labelLayerId);

  map.addLayer({
    'id': '3d-buildings',
    'source': 'composite',
    'source-layer': 'building',
    'filter': ['==', 'extrude', 'true'],
    'type': 'fill-extrusion',
    'minzoom': 12,
    'paint': {
        'fill-extrusion-color': '#fff',
        'fill-extrusion-height': ["get", "height"],
        'fill-extrusion-base': ["get", "min_height"],
        'fill-extrusion-opacity': 1
    }
  }, labelLayerId);

});



//update the menu title to display selected category
$(function(){

  $("#dropdown-menu-1 a").click(function(){

    $("#dropdownMenu1:first-child").text($(this).text());
    $("#dropdownMenu1:first-child").val($(this).text());

  });

});

function abbrNum(number, decPlaces) {
    // 2 decimal places => 100, 3 => 1000, etc
    decPlaces = Math.pow(10,decPlaces);

    // Enumerate number abbreviations
    var abbrev = [ "k", "m", "b", "t" ];

    // Go through the array backwards, so we do the largest first
    for (var i=abbrev.length-1; i>=0; i--) {

        // Convert array index to "1000", "1000000", etc
        var size = Math.pow(10,(i+1)*3);

        // If the number is bigger or equal do the abbreviation
        if(size <= number) {
             // Here, we multiply by decPlaces, round, and then divide by decPlaces.
             // This gives us nice rounding to a particular decimal place.
             number = Math.round(number*decPlaces/size)/decPlaces;

             // Handle special case where we round up to the next abbreviation
             if((number == 1000) && (i < abbrev.length - 1)) {
                 number = 1;
                 i++;
             }

             // Add the letter for the abbreviation
             number += abbrev[i];

             // We are done... stop
             break;
        }
    }

    return number;
}

// update the data from the day slider
function updateColorLinear(column, cset, crange) {


  document.getElementById("step0").innerHTML = abbrNum(crange[0], 2);
  document.getElementById("step1").innerHTML = abbrNum(crange[1], 2);
  document.getElementById("step2").innerHTML = abbrNum(crange[2], 2);
  document.getElementById("step3").innerHTML = abbrNum(crange[3], 2);
  document.getElementById("step4").innerHTML = abbrNum(crange[4], 2);
  document.getElementById("step5").innerHTML = abbrNum(crange[5], 2);

  // update the map
  map.setPaintProperty('hex', 'fill-extrusion-color', [
        'interpolate',
        ['linear'],
        ['number', ['get', column]],
        crange[0], colorRamps[cset][0],
        crange[1], colorRamps[cset][1],
        crange[2], colorRamps[cset][2],
        crange[3], colorRamps[cset][3],
        crange[4], colorRamps[cset][4],
        crange[5], colorRamps[cset][5]
      ],
  );

};

// update the data from the day slider
function updateColorCategorical(column, cset, crange) {

  // update the map
  map.setPaintProperty('hex', 'fill-extrusion-color', [
        'match',
        ['get', column],
        crange[0], colorRamps[cset][0],
        crange[1], colorRamps[cset][1],
        crange[2], colorRamps[cset][2],
        crange[3], colorRamps[cset][3],
        '#ccc'
      ],
  );

};


function chooseHeight(category) {
  updateHeight(category)
}

// update the height
function updateHeight(category) {

  settings.category = category

  column = category

  updateColorLinear(column, 1, [0,5,10,25,50,100])

  // update the map
  map.setPaintProperty('hex', 'fill-extrusion-height', [
    '*',
    ['number', ['get', column]],
    settings.height_factor
    ]
  );

};

//update the menu title to display selected category
$(function(){

  $("#dropdown-menu-1 button").click(function(){

    $("#btnGroupDrop1:first-child").text($(this).text());
    $("#btnGroupDrop1:first-child").val($(this).text());

  });

});

//update the menu title to display selected category
$(function(){

  $("#dropdown-menu-2 button").click(function(){

    $("#btnGroupDrop2:first-child").text($(this).text());
    $("#btnGroupDrop2:first-child").val($(this).text());

  });

});
