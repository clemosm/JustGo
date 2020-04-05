# JustGo
Map of regional public transports based on OpenStreetMap

## Purpose
The goal was to make an urban transportation map which would be more readable than the existant ones, especially by taking into account the colour attribute for bus and train lines, and this for any city in the world.

## How it works
The map is displayed by Mapbox, composed of a custom background with little saturated colours, and a dozen of transportation layers on top, whose data has to be downloaded.
"JustGo" was originally a bus transportation map for Paris with itineraries (justgo.alwaysdata.net), then transformed and translated to become this project. 
The website is here : https://justgo.alwaysdata.net/global/
It makes use of osmtogeojson.

## TO-DO list
- Display stations mapped with only an area (building) and not with a simple node.
- Set offsets for bus lines so that all lines can be seen when they take the same road.


Note : The mapbox token is specific to the justgo address, so if you want to use these files you should have your own token.
