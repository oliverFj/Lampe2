let topic = "ColorLamp"; // Emne for MQTT-beskeder

var devices = {};  // Ordbog til at gemme enhedsdata
var colorCount = {red: 0, green: 0, blue: 0}; // Ordbog til at gemme antallet af hver farve

function getColorFromValue(value) {
    // Konverter en numerisk værdi til en farve
    switch(value) {
        case 1: return 'red';
        case 2: return 'green';
        case 3: return 'blue';
        default: return 'unknown'; // Håndter uventede værdier
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    // Beregner afstanden mellem to punkter på jorden givet deres bredde- og længdegrader
    var R = 6371; // Jordens radius i km
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = 
        0.5 - Math.cos(dLat)/2 + 
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        (1 - Math.cos(dLon)) / 2;

    return R * 2 * Math.asin(Math.sqrt(a));
}

// Antaget central referencepunkt (kan dynamisk sættes eller være fast)
let centralLat = 34.052235; // Central breddegrad
let centralLon = -118.243683; // Central længdegrad

function calculateWeight(distance) {
    // Beregner en vægt baseret på afstanden, hvor tættere afstande giver mere indflydelse
    return Math.exp(-distance / 100); // Juster nedbrydningsraten for at passe din skala
}

function updateColorCount(color, vote, add, distance) {
    // Opdaterer farveantal baseret på vægtet stemme
    let weight = calculateWeight(distance);
    let effectiveVotes = vote * weight;

    if (add) {
        colorCount[color] += effectiveVotes;
    } else {
        colorCount[color] -= effectiveVotes;
    }
    console.log(`Opdaterede farvetællinger: Rød - ${colorCount.red.toFixed(2)}, Grøn - ${colorCount.green.toFixed(2)}, Blå - ${colorCount.blue.toFixed(2)}`);
}

let disconnectTimeout = 6000; // Timeout på 6 sekunder

function onMessage(message) {
    // Håndterer indkommende beskeder og opdaterer enhedsstatus
    console.log("Modtaget besked:", message);
    let deviceId = message.from;
    let newColorValue = getColorFromValue(message.colorValue);
    let latValue = message.latitude;
    let longValue = message.longitude;
    let distance = calculateDistance(centralLat, centralLon, latValue, longValue);

    let voteChange = newColorValue === 'unknown' ? 0 : 1; // Antager en stemmeværdi på 1, medmindre farven er ukendt

    if (!devices[deviceId]) {
        // Hvis enheden er ny, tilføj den og registrér dens stemme
        devices[deviceId] = {
            color: newColorValue, latitude: latValue, longitude: longValue, distance: distance,
            timer: setTimeout(() => removeDevice(deviceId), disconnectTimeout)
        };
        updateColorCount(newColorValue, voteChange, true, distance);
    } else {
        // Nulstil timeout og opdater farve hvis ændret
        clearTimeout(devices[deviceId].timer);
        devices[deviceId].timer = setTimeout(() => removeDevice(deviceId), disconnectTimeout);

        let currentColorValue = devices[deviceId].color;
        if (currentColorValue !== newColorValue) {
            updateColorCount(currentColorValue, voteChange, false, devices[deviceId].distance);
            devices[deviceId].color = newColorValue;
            devices[deviceId].distance = distance;
            updateColorCount(newColorValue, voteChange, true, distance);
        }
    }
    console.log(`Enhed ${deviceId} ved (${latValue}, ${longValue}) støtter ${newColorValue} med en afstand på ${distance.toFixed(2)} km.`);
}

function removeDevice(deviceId) {
    // Fjerner inaktive enheder og deres stemmer
    if (devices[deviceId]) {
        let { color, distance } = devices[deviceId];
        console.log(`Fjerner inaktiv enhed: ${deviceId}`);
        updateColorCount(color, 1, false, distance);
        delete devices[deviceId];
    }
}

function setup() {
    // Opsætter visualiseringen
    createCanvas(500, 500);
    background(0);
    setupMQTT(topic);
}

function draw() {
    // Tegner den aktuelle tilstand af stemmer og enhedsplaceringer
    let totalDevices = Object.keys(devices).length;
    if (totalDevices > 0) {
        let redRatio = (colorCount.red / totalDevices) * 255;
        let greenRatio = (colorCount.green / totalDevices) * 255;
        let blueRatio = (colorCount.blue / totalDevices) * 255;
        background(redRatio, greenRatio, blueRatio); // Sæt baggrundsfarven baseret på farveforhold
    } else {
        background(0); // Standard til en mørk baggrund, hvis ingen enheder er tilsluttet
    }

    fill(255); // Sæt tekstfarve til hvid
    textSize(16);
    text(`Totalt antal tilsluttede enheder: ${totalDevices}`, 20, 30);
    let yOffset = 50;
    text(`Rød stemme: ${colorCount.red}`, 20, yOffset);
    text(`Grøn stemme: ${colorCount.green}`, 20, yOffset + 20);
    text(`Blå stemme: ${colorCount.blue}`, 20, yOffset + 40);

    let yAdditionalOffset = 80;
    Object.keys(devices).forEach((id, index) => {
        let device = devices[id];
        let coordinatesDisplay = `Enhed ${id}: (${device.latitude}, ${device.longitude}), ${device.distance.toFixed(2)} km væk`;
        text(coordinatesDisplay, 20, yOffset + yAdditionalOffset + (index * 20));
    });
}

let threshold = 1;
function touchStarted() {
    // Kaldes, når en berøringsbegivenhed registreres
    setupLocation(threshold); // Opsætter lokation
    var currentLocation = locationSensor.get();

    // Tilgå bredde- og længdegrad
    centralLat = currentLocation.lat;
    centralLon = currentLocation.long;
}
