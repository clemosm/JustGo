var marker;
var marker_pos;
var my_location;
var SEARCH_INPUT = "<input id='place_search' type='search' onchange='searchPlace()' placeholder='Find a place'/>";
var SOURCES = {"train":["train labels","Subway","Subway-case","Train"],"railway stations":["Railway stations","Subway stations"],"bus":["bus labels","night labels","school labels","express labels","Night lines","Classic lines","Express lines","School lines"],"bus stops":["Bus stops","Terminals","Lines-at-stop"]};
var REQUESTS = {"bus":"( rel[route=bus][operator!=Flixbus][network!=Flixbus]; rel[route=trolleybus]; rel[route=minibus]; ); out; (._;>;); out skel qt;",
				"bus stops":"(node[highway=bus_stop];way[highway=bus_stop];);out;",
				"train":"( rel[route=train][service=regional][ref]; rel[route=train][service=commuter];  rel[route=subway]; rel[route=tram]; rel[route=lightrail];); (._;>;); out;",
				"train2":"( rel[route=train][service=commuter];  rel[route=subway]; rel[route=tram]; rel[route=lightrail];); (._;>;); out;",
                "railway stations":"(node[railway=station];way[railway=station];);out;"
			}    


//JustGo-specific token
mapboxgl.accessToken =  "pk.eyJ1IjoiY2xlbWFwYm94IiwiYSI6ImNqejZycnpwZzBvbG4zZnQ0Ynl2YTVmNmYifQ.G5gWhGO4QsOPHaoNGy-x3g"

var opencage_key = "b1c0c9adbe3d4793a1e3a301c3cd1fce";


var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/clemapbox/ck4oopq3v0iat1cqz9csgnauq',
    center:[2.35,48.85],
    zoom:10.6,
    maxZoom:19.5,
    dragRotate : false,
});

map.on("load",function(){
    mapCanvas();
    changeSources();
});


var toggleableLayerIds = ["Urban lines","Express lines","Night network","School buses"];


for (var i = 0; i < toggleableLayerIds.length; i++) {
    var id = toggleableLayerIds[i];

    var link = document.createElement('a');
    link.href = '#';
    if (i<2){
        link.className = "active";
    }
    else{
        link.className = '';
    }
    link.textContent = id;

    link.onclick = function (e) {
    	var choice = this.textContent;
        var layers = [];
        switch (choice){
            case "Express lines":
                layers.push("Express lines","express labels");
                break;
            case "Urban lines":
                layers.push("Classic lines","bus labels");
                break;
            case "Night network":
                layers.push("Night lines","night labels");
                break;
            case "School buses":
                layers.push("School lines","school labels");
        }
        e.preventDefault();
        e.stopPropagation();
        
        var classname = this.className;
        if (classname === 'active') {
            this.className = '';
            layers.forEach(function f(layer){
            	map.setLayoutProperty(layer, 'visibility', 'none');
            });

        } else {
            this.className = 'active';
            layers.forEach(function f(layer){
            	map.setLayoutProperty(layer, 'visibility', 'visible');
            });
        }
    };

    var layers = document.getElementById('menu');
    layers.appendChild(link);
}



// ***************GESTION DE L'API*****************
function searchPlace(){
    var field = document.getElementById("place_search");
    ocMajMarker(field.value);
}
//GEOCODER MAJ MARKER
function ocMajMarker(address){
	console.log(address);
    if ((address=="My location")||address.substr(1,1)=="."){
        map.flyTo(({center:toCoords(address),zoom:10}));
    }
    else{
        var url = "https://api.opencagedata.com/geocode/v1/json?q="+address+"&key="+opencage_key+"&limit=1";
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.timeout = 3000;
        try{
        	xhr.send(null);
        }
        catch (error){
        	alert(error);
        }
        xhr.ontimeout = function(){console.log("Sorry, the server took too long to respond.");};
        xhr.onload = function(){
            if (xhr.readyState === 4 && xhr.status===200){
                var out = xhr.responseText;
                var arr = JSON.parse(out).results;
                if (arr.length == 0){
                	alert("Unable to find this place.");
                }
                else{
                	var newcoords = arr[0].geometry;
                	map.flyTo(({center:newcoords,zoom:12}));
                }
            }
            else{console.log(xhr.status);}
        };
    }
}

function changeSources(){
	var blank = { "type": "FeatureCollection", "generator": "overpass-ide", "copyright": "The data included in this document is from www.openstreetmap.org. The data is made available under ODbL.", "timestamp": "2019-12-22T16:03:02Z", "features": [] };
	for (sourcename in SOURCES){
		map.addSource(sourcename, { type: 'geojson', data: blank });
	}

	//For the moment I have to re-create all the transport-specific layers here... → Need to be sorted betweet 'background' layers such as labels
    map.addLayer({ "id": "Train", "type": "line", "source": "train", "minzoom": 6, "maxzoom": 19.5, "filter": [ "all", ["==", "$type", "LineString"], ["==", "route", "train"] ], "layout": {}, "paint": { "line-color": [ "case", ["has", "colour"], ["to-color", ["get", "colour"]], ["rgba", 0, 160, 0,0.7] ], "line-width": [ "interpolate", ["exponential", 1.3], ["zoom"], 8, 2, 10, 2, 18, 25 ], "line-opacity": [ "interpolate", ["linear"], ["zoom"], 10.5, 1, 13, 0.3, 22, 0.15 ] } });
    map.addLayer({ "id": "Subway-case", "type": "line",  "source": "train", "minzoom": 10.5, "maxzoom": 19.5, "filter": [ "all", ["==", "$type", "LineString"], ["==", "route", "subway"] ], "layout": {}, "paint": { "line-width": [ "interpolate", ["linear"], ["zoom"], 10.5, 0, 12, 4, 20, 17 ] } });
    map.addLayer({ "id": "Subway", "type": "line", "source": "train", "minzoom": 10, "maxzoom": 19.5, "filter": [ "all", ["==", "$type", "LineString"], ["in", "route", "subway", "tram"] ], "layout": {}, "paint": { "line-color": [ "case", ["has", "colour"], ["to-color", ["get", "colour"]], ["rgb", 25, 25, 170] ], "line-width": [ "interpolate", ["linear"], ["zoom"], 10.5, 2, 12, 3, 20, 12 ] } });
    map.addLayer({ "id": "School lines", "type": "line", "source": "bus", "minzoom": 12.5, "maxzoom": 19.5, "filter": [ "all", [ "all", ["==", "type", "route"], ["in", "school", "only", "yes"] ], ["in", "$type", "LineString", "Point", "Polygon"] ], "layout": {"visibility": "none"}, "paint": { "line-color": [ "case", ["has", "colour"], ["to-color", ["get", "colour"]], ["rgba", 0, 0, 0, 0.4] ], "line-width": [ "interpolate", ["exponential", 1], ["zoom"], 10, 0, 22, 10 ], "line-offset": [ "interpolate", ["exponential", 1], ["zoom"], 10, 0, 22, -10 ], "line-dasharray": [2, 1] } });
    map.addLayer({ "id": "Express lines", "type": "line", "source": "bus", "minzoom": 11, "maxzoom": 19.5, "filter": [ "all", ["==", "$type", "LineString"], [ "all", ["==", "passenger", "regional"], ["==", "type", "route"] ] ], "layout": {"line-join": "round"}, "paint": { "line-width": [ "interpolate", ["exponential", 1], ["zoom"], 10, 2.5, 13, 3, 15, 5, 22, 17 ], "line-dasharray": [ "step", ["zoom"], ["literal", [1, 0]], 12, ["literal", [2, 2]] ], "line-offset": [ "interpolate", ["exponential", 1.2], ["zoom"], 12.4, 0, 12.5, 5, 15, 10, 17, 15, 22, 30 ], "line-color": [ "case", ["has", "colour"], ["to-color", ["get", "colour"]], ["rgba", 0, 0, 0, 0.5] ], "line-opacity": 0.4 } });
    map.addLayer({ "id": "Classic lines", "type": "line", "source": "bus", "minzoom": 11.8, "maxzoom": 19.5, "filter": [ "all", ["!=", "by_night", "only"], ["!in", "passenger", "night", "school"], ["!in", "school", "only", "yes"], ["==", "type", "route"] ], "layout": {"line-cap": "round", "line-join": "round"}, "paint": { "line-color": [ "case", ["has", "colour"], ["to-color", ["get", "colour"]], ["rgba", 210, 35, 55,0.5] ], "line-dasharray": ["literal", [1]], "line-offset": [ "interpolate", ["exponential", 1], ["zoom"], 10, 0, 12, ["match", ["get", "importance"], ["main"], 2, 0.7], 17, ["match", ["get", "importance"], ["main"], 10, 3] ], "line-width": [ "interpolate", ["linear"], ["zoom"], 10, ["case", ["==", ["get", "variant"], "yes"], 0.5, 0.8], 22, ["case", ["==", ["get", "variant"], "yes"], 5, 10] ] } });
    map.addLayer({ "id": "Night lines", "type": "line","source": "bus", "minzoom": 11, "maxzoom": 19.5, "filter": [ "all", ["==", "type", "route"], ["in", "by_night", "only", "yes"] ], "layout": { "line-join": "round", "line-cap": "round", "visibility": "none" }, "paint": { "line-color": [ "case", ["has", "colour"], ["to-color", ["get", "colour"]], ["rgba", 210, 35, 55,0.5] ], "line-width": [ "interpolate", ["linear"], ["zoom"], 10, ["case", ["==", ["get", "variant"], "yes"], 0.5, 1], 22, ["case", ["==", ["get", "variant"], "yes"], 5, 10] ], "line-opacity": 0.5, "line-offset": [ "interpolate", ["exponential", 1], ["zoom"], 10, 0, 12, ["match", ["get", "importance"], ["main"], 2, 0.7], 17, ["match", ["get", "importance"], ["main"], 12, 3] ] } });
    map.addLayer({ "id": "train labels", "type": "symbol",  "source": "train", "minzoom": 10, "filter": [ "all", ["has", "ref"], ["match", ["get", "type"], ["route"], true, false] ], "layout": { "text-line-height": 1.7, "text-size": [ "interpolate", ["exponential", 0.86], ["zoom"],10,8, 12, 12, 22, 30 ], "symbol-spacing": [ "interpolate", ["exponential", 1.3], ["zoom"], 0, 70, 16, 170, 22, 400 ], "text-font": ["Open Sans Bold", "Arial Unicode MS Regular"], "symbol-placement": "line", "text-padding": 1, "text-offset": [0, 0], "text-anchor": "bottom", "text-field": [ "step", ["zoom"], [ "case", ["==", ["get", "route"], "train"], ["get", "ref"], "" ], 12, ["to-string", ["get", "ref"]] ] }, "paint": { "text-color": [ "case", ["has", "colour"], ["to-color", ["get", "colour"]], ["rgb", 0, 0, 0] ], "text-halo-color": "hsla(0, 0%, 0%, 0.7)", "text-halo-width": 0.5, "text-opacity": [ "case", ["<", ["length", ["get", "ref"]], 3], 1, 0 ], "text-translate": [ "interpolate", ["exponential", 1.7], ["zoom"], 12, ["literal", [0, -3]], 14, ["literal", [0, -5]], 18, ["literal", [0, -50]], 20, ["literal", [0, -100]] ] } });
    map.addLayer({ "id": "express labels", "type": "symbol", "source": "bus", "minzoom": 11.5, "filter": [ "all", ["==", "$type", "LineString"],["==", "passenger", "regional"], ["==", "type", "route"] ], "layout": { "text-size": [ "interpolate", ["exponential", 1], ["zoom"], 9, 14, 17, 18, 22, 18 ], "symbol-spacing": [ "interpolate", ["exponential", 1], ["zoom"], 10, 70, 12, 100, 17, 400, 22, 800 ], "text-font": ["Open Sans SemiBold", "Arial Unicode MS Regular"], "symbol-placement": "line", "text-padding": 6, "text-offset": [ "interpolate", ["exponential", 1.5], ["zoom"], 11, ["literal", [0, 0]], 12, ["literal", [0, 1]], 13, ["literal", [0, 1.2]], 15, ["literal", [0, 2.4]], 18, ["literal", [0, 5]] ], "text-field": ["to-string", ["get", "ref"]], "text-letter-spacing": 0.05 }, "paint": { "text-color": [ "case", ["has", "colour"], ["to-color", ["get", "colour"]], ["rgba", 0, 0, 0, 0.5] ], "text-halo-color": "#f0f0f0", "text-halo-width": [ "interpolate", ["linear"], ["zoom"], 12, 3, 12.5, 1 ], "text-halo-blur": [ "interpolate", ["linear"], ["zoom"], 12, 3, 12.5, 1 ] } });
    map.addLayer({ "id": "school labels", "type": "symbol", "source": "bus", "minzoom": 13, "filter": [ "all", ["==", "$type", "LineString"], [ "all", ["==", "type", "route"], ["in", "school", "only", "yes"] ] ], "layout": { "text-line-height": [ "interpolate", ["linear"], ["zoom"], 12, 1.2, 15, 2, 22, 2.9 ], "text-size": [ "interpolate", ["exponential", 1], ["zoom"], 12, 10, 14, 14, 17, 19, 22, 20 ], "symbol-spacing": [ "interpolate", ["exponential", 1.5], ["zoom"], 0, 50, 16, 110, 22, 200 ], "text-font": ["Open Sans Bold", "Arial Unicode MS Regular"], "symbol-placement": "line", "text-padding": 5, "visibility": "none", "text-offset": [ "interpolate", ["linear"], ["zoom"], 13, ["literal", [0, 1]], 15, ["literal", [0, 1.3]], 18, ["literal", [0, 2]] ], "text-rotation-alignment": "map", "text-field": ["to-string", ["get", "ref"]], "text-letter-spacing": 0.1 }, "paint": { "text-color": [ "case", ["has", "colour"], ["to-color", ["get", "colour"]], ["rgba", 0, 0, 0, 0.5] ], "text-halo-color": "hsla(0, 0%, 80%, 0.7)", "text-halo-width": 1, "text-halo-blur": 3 } });
    map.addLayer({ "id": "night labels", "type": "symbol",  "source": "bus", "minzoom": 12, "filter": [ "all", ["==", "$type", "LineString"], [ "all", ["!=", "passenger", "school"], ["==", "by_night", "only"], ["==", "type", "route"] ] ], "layout": { "text-line-height": [ "interpolate", ["linear"], ["zoom"], 12, 1.2, 15, 1.5, 22, 2 ], "text-size": [ "interpolate", ["exponential", 1], ["zoom"], 12, 10, 14, 14, 17, 19, 22, 20 ], "symbol-spacing": [ "interpolate", ["exponential", 1.5], ["zoom"], 0, 70, 16, 150, 22, 300 ], "text-font": ["Open Sans Bold", "Arial Unicode MS Regular"], "symbol-placement": "line", "text-padding": 5, "visibility": "none", "text-offset": [ "interpolate", ["linear"], ["zoom"], 13, ["literal", [0, 1]], 15, ["literal", [0, 1.3]], 18, ["literal", [0, 2]] ], "text-rotation-alignment": "map", "text-field": ["to-string", ["get", "ref"]], "text-letter-spacing": 0.1 }, "paint": { "text-color": [ "case", ["has", "colour"], ["to-color", ["get", "colour"]], ["rgba",210, 35, 55,0.5] ], "text-halo-color": "hsla(0, 0%, 80%, 0.7)", "text-halo-width": 1, "text-halo-blur": 3 } });
    map.addLayer({ "id": "bus labels", "type": "symbol", "source": "bus", "minzoom": 13.2, "filter": [ "all", ["==", "$type", "LineString"], [ "all", ["!=", "by_night", "only"], ["!in", "passenger", "night", "school"], ["!in", "school", "only", "yes"], ["==", "type", "route"] ] ], "layout": { "text-line-height": [ "interpolate", ["linear"], ["zoom"], 12, 1.3, 22, 2.3 ], "text-size": [ "interpolate", ["exponential", 1], ["zoom"], 12, 10, 14, 14, 17, 19, 22, 20 ], "symbol-spacing": [ "interpolate", ["exponential", 1.5], ["zoom"], 0, 50, 16, 110, 22, 200 ], "text-font": ["Open Sans Bold", "Arial Unicode MS Regular"], "symbol-placement": "line", "text-padding": 5, "text-offset": [ "interpolate", ["linear"], ["zoom"], 13, ["literal", [0, 1]], 15, ["literal", [0, 1.3]], 18, ["literal", [0, 2]] ], "text-rotation-alignment": "map", "text-field": ["to-string", ["get", "ref"]], "text-letter-spacing": 0.13 }, "paint": { "text-color": [ "case", ["has", "colour"], ["to-color", ["get", "colour"]], ["rgba",210, 35, 55,0.5] ], "text-halo-color": "hsla(0, 0%, 80%, 0.7)", "text-halo-width": 1, "text-halo-blur": 3, "text-translate": [0, 0] } });
    map.addLayer({ "id": "Lines-at-stop", "type": "symbol", "source": "bus stops", "minzoom": 18, "maxzoom": 19.5, "filter": ["all", ["==", "$type", "Point"], ["has", "route_ref"]], "layout": { "text-size": [ "interpolate", ["linear"], ["zoom"], 19, 16, 22, 18 ], "icon-image": "esaisvg", "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"], "icon-allow-overlap": true, "text-justify": "left", "text-padding": 1, "text-offset": ["literal", [0.6, 1.9]], "icon-optional": true, "icon-size": 0.5, "text-anchor": "left", "text-field": ["to-string", ["get", "route_ref"]], "icon-ignore-placement": true }, "paint": { "text-color": "hsl(0, 0%, 0%)", "icon-opacity": 0, "text-translate": [0, 0], "text-halo-color": "hsl(0, 0%, 100%)", "text-halo-width": 2, "text-halo-blur": 5 } });
    map.addLayer({ "id": "Terminals", "type": "symbol", "source": "bus stops", "minzoom": 14.5, "maxzoom": 19.5, "filter": ["all", ["==", "$type", "Point"], ["has", "terminal"]], "layout": { "text-size": 20, "icon-image": "esaisvg", "text-font": [ "Open Sans Extrabold", "Arial Unicode MS Regular" ], "icon-allow-overlap": true, "text-justify": "right", "text-padding": 1, "text-offset": ["literal", [0, 1.6]], "icon-optional": true, "icon-size": 0.5, "text-anchor": "right", "text-field": ["to-string", ["get", "terminal"]], "icon-ignore-placement": true }, "paint": { "text-color": "hsl(0, 0%, 0%)", "icon-opacity": 0, "text-translate": [0, 0], "text-halo-color": "hsl(0, 0%, 100%)", "text-halo-width": 8, "text-halo-blur": 5 } });
    map.addLayer({ "id": "Bus stops", "type": "symbol","source": "bus stops", "minzoom": 14.2, "maxzoom": 19.5, "filter": [ "all", ["!=", "railway", "station"], ["in", "$type", "Point", "Polygon"] ], "layout": { "text-optional": true, "text-size": [ "interpolate", ["exponential", 1], ["zoom"], 13.99, 0, 14, 10, 20, 15 ], "icon-image": "carre", "text-padding": 0, "text-offset": [0, -1], "icon-size": [ "interpolate", ["exponential", 1], ["zoom"], 0, 0.01, 13, 0.1, 22, 0.5 ], "text-anchor": "bottom", "text-field": ["to-string", ["get", "name"]], "icon-padding": 5, "text-max-width": 8 }, "paint": { "text-color": "hsl(0, 0%, 0%)", "text-translate": [0, 0], "text-halo-width": 2, "text-halo-color": "hsl(0, 0%, 100%)" } });
    map.addLayer({ "id": "Subway stations", "type": "symbol",  "source": "railway stations", "minzoom": 12.8, "maxzoom": 19.5, "filter": [ "all", ["in","$type","Point","LineString"], [ "all", [ "any", ["==", "subway", "yes"], ["==", "tram", "yes"], ["in", "type:RATP", "metro", "tram"] ], ["has", "name"], ["in", "railway", "station", "tram_stop"] ] ], "layout": { "text-optional": true, "text-size": [ "interpolate", ["linear"], ["zoom"], 12, 8, 22, 24 ], "icon-image": "esaisvg", "text-font": ["Open Sans Bold", "Arial Unicode MS Regular"], "icon-allow-overlap": true, "text-padding": 5, "text-offset": [0, 0], "icon-size": [ "interpolate", ["linear"], ["zoom"], 14, ["match", ["get", "railway"], ["station"], 0.3, 0.2], 20, ["match", ["get", "railway"], ["station"], 1, 0.7] ], "text-field": ["to-string", ["get", "name"]], "icon-padding": 0 }, "paint": { "text-color": "hsl(0, 0%, 0%)", "text-halo-color": "hsl(0, 0%, 100%)", "text-halo-width": 2, "icon-opacity": [ "interpolate", ["linear"], ["zoom"], 17.5, 0.5, 19, 0 ] } });
    map.addLayer({ "id": "Subway stations2", "type": "symbol",  "source": "railway stations", "minzoom": 12.8, "maxzoom": 19.5, "filter": [ "all", ["in","$type","Point","LineString"], [ "all", [ "any", ["==", "subway", "yes"], ["==", "tram", "yes"], ["in", "type:RATP", "metro", "tram"] ], ["has", "name"], ["in", "railway", "station", "tram_stop"] ] ], "layout": { "text-optional": true, "text-size": [ "interpolate", ["linear"], ["zoom"], 12, 8, 22, 24 ], "icon-image": "esaisvg", "text-font": ["Open Sans Bold", "Arial Unicode MS Regular"], "icon-allow-overlap": true,"symbol-placement": "line", "text-padding": 5, "text-offset": [0, 0], "icon-size": [ "interpolate", ["linear"], ["zoom"], 14, ["match", ["get", "railway"], ["station"], 0.3, 0.2], 20, ["match", ["get", "railway"], ["station"], 1, 0.7] ], "text-field": ["to-string", ["get", "name"]], "icon-padding": 0 }, "paint": { "text-color": "hsl(0, 0%, 0%)", "text-halo-color": "hsl(0, 0%, 100%)", "text-halo-width": 2, "icon-opacity": [ "interpolate", ["linear"], ["zoom"], 17.5, 0.5, 19, 0 ] } });
//TEST
    map.addLayer({ "id": "Railway stations", "type": "symbol", "source": "railway stations", "minzoom": 11.7, "maxzoom": 19.5, "filter": [ "all", ["in","$type","Point","LineString"], [ "all", ["!=", "station", "subway"], ["!=", "subway", "yes"], ["!=", "tram", "yes"], ["has", "name"], ["in", "railway", "", "station"] ] ], "layout": { "text-optional": true, "text-size": [ "interpolate", ["exponential", 1], ["zoom"], 12, 10, 22, 30 ], "text-font": ["Open Sans Bold", "Arial Unicode MS Regular"], "icon-allow-overlap": true, "text-padding": 5, "text-offset": [0, 0], "icon-size": [ "interpolate", ["linear"], ["zoom"], 14, ["match", ["get", "railway"], ["station"], 0.3, 0.2], 20, ["match", ["get", "railway"], ["station"], 1, 0.7] ], "text-field": ["to-string", ["get", "name"]], "icon-padding": 0 }, "paint": { "text-color": "hsl(0, 0%, 0%)", "text-halo-color": "hsl(0, 0%, 100%)", "text-halo-width": 2, "icon-opacity": [ "interpolate", ["linear"], ["zoom"], 17.5, 0.5, 19, 0 ] } });

    liste_click_layers = ["Bus stops","Railway stations","Subway stations","Train","Subway","Classic lines","Night lines","School lines","Express lines"];
    var layername;
    for (var i=0;i<liste_click_layers.length;i++){
    	layername = liste_click_layers[i];
    	map.on('mouseenter', layername, function () {
    		map.getCanvas().style.cursor = 'pointer';
		});
		map.on('click', layername, e_infos);
		map.on('mouseleave', layername, function () {
	    	map.getCanvas().style.cursor = '';
		});
    }
}

function e_infos(e){
	var text = "--- Layer : "+e.features[0].layer.id+" ---\n";
	for (i_feature in e.features){
		text += propToString(e.features[i_feature].properties);
		text += "--------------\n";
	}
	if (document.getElementById("no_alert").checked){
		console.log(text);
	}
	else{
		alert(text);
	}
}

function propToString(properties){
	var text = "";
	if (properties.name != undefined){
		text += properties.name + "\n";
	}
	for (key in properties){
		if (key!="name"){
			text += key+" = "+properties[key]+"\n";
		}
	}
	return text
}

function updateAllData(){
	if (map.getZoom() < 9.5){
		alert("Please zoom in");
	}
	else{
		sources=["bus","bus stops","train","railway stations"];
		for (var i=0;i<sources.length;i++){
			updateData(sources[i]);
		}
	}
}

function updateData(sourcename){
	if (map.getZoom() < 9.5){
		alert("Please zoom in");
	}
	else{
		var request = REQUESTS[sourcename];
		if (sourcename=="train" && !document.getElementById("inclregional").checked){//No regional trains
			request = REQUESTS.train2
		}
		var bounds = map.getBounds();
		var bbox = bounds._sw.lat.toString()+","+bounds._sw.lng.toString()+","+bounds._ne.lat.toString()+","+bounds._ne.lng.toString();
	    var url = "https://overpass-api.de/api/interpreter?data="+"[bbox:"+bbox+"][out:json];"+request;
	    var xhr = new XMLHttpRequest();
	    xhr.open("GET", url, true);
        no_timeout = document.getElementById("no_timeout").checked;
        if (!no_timeout){
            xhr.timeout = 12000;
        }
	    try{
	    	xhr.send(null);
	    }
	    catch (error){
	    	alert(error);
	    }
	    xhr.ontimeout = function(){
	    	alert("Failed to download '"+sourcename+"'. Please try within a smaller area.");
	    	document.getElementById("download_message").innerHTML="";
	    };
	    xhr.onload = function(){
	        if (xhr.readyState === 4 && xhr.status===200){
	            var out = JSON.parse(xhr.response);
	            var out_geojson = osmtogeojson(out);
	            map.getSource(sourcename).setData(out_geojson);
	            document.getElementById("download_message").innerHTML="Data downloaded ("+sourcename+").";
	        }
	        else{console.log(xhr.status);document.getElementById("download_message").innerHTML="Failed to download ("+xhr.status.toString()+")";}
	    };
        document.getElementById("download_message").innerHTML="Downloading...";
	}
}


function toCoords(string){
    var coords;
    if (string == "My location"){
        coords = new mapboxgl.LngLat(parseFloat(my_location[0]), parseFloat(my_location[1]));
    }
    else{
        var arrpos = string.split(";");
        coords = new mapboxgl.LngLat(parseFloat(arrpos[0]), parseFloat(arrpos[1]));
    }
    return coords;
}


function mapCanvas(){
    var text_b_r = "Improve this map";
    var html_t_r = "<div class='mapboxgl-ctrl' style='margin:5px 5px 0 0;'>" + SEARCH_INPUT + "</div>";
    var b_r = document.getElementsByClassName("mapbox-improve-map")[0];
    var t_r = document.getElementsByClassName("mapboxgl-ctrl-top-right")[0];
    b_r.innerHTML = text_b_r;
    t_r.innerHTML = html_t_r;
}


/*function idUrl(id){
    var url = "";
    for(var i=0;i<id.length;i++)
    {
        if (id[i]==":")
        {
            url += "%3A";
        }
        else if (id[i]==";")
        {
            url += "%3B";
        }
        else
        {
            url += id[i];
        }
    }
    return url;
}

function coordsUrl(coords){
    var lng = coords.lng;
    var lat = coords.lat;
    return lng.toString() + "%3B" + lat.toString();
}

function toTime(dt){
    return dt[9] + dt[10] +":" + dt[11]+dt[12];
}

function secondsToHHMM(sec){
	let h = ((sec-sec%3600)/3600).toString();
	let m = (((sec-sec%60)/60)%60).toString();
	if (m.length == 1) m = "0"+m;
	return {h:h,m:m};
}*/