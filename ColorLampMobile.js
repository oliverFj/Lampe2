// ColorLampMobile.js 
// Sender besked til stationær om farveværdi.

let topic = "ColorLamp"; //Deklarerer en variabel topic, der indeholder emnet for MQTT-meddelelser.
var latitude = 0; //Initialiserer variable til at gemme breddegrad sat til 0.
var longitude = 0; //Initialiserer variable til at gemme længdegrad sat til 0.

function onMessage(message) { //Funktionen kaldes, når der modtages en ny besked via MQTT.
  console.log("received new message!");
  if (message["from"] != config.myID) { //Hvis beskeden IKKE kommer fra den aktuelle enhed (config.myID), udføres nedenstående handlinger:

  }
}


function setup() {
  createCanvas(windowWidth, windowHeight); //Opretter en canvas og indstiller baggrundsfarven til hvid,
  noStroke(); // Fjerner kanterne omkring figurer, for en renere præsentation
  background(255);
  setupMQTT(topic);
}

let redPressed = false; // Tilstandskontrol for rød cirkel
let bluePressed = false; // Tilstandskontrol for blå cirkel
let myColor = 0;

// Add state control for green circle
let greenPressed = false; // State control for green circle

function draw() {
  background(255);
  let centerX = windowWidth / 2;
  let centerY = windowHeight / 2;
  let radius = min(windowWidth, windowHeight) / 2 - 20;

  // Existing drop shadow effect
  drawingContext.shadowOffsetX = 5;
  drawingContext.shadowOffsetY = 5;
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = 'rgba(200, 200, 200, 0.50)';

  // Existing red circle
  fill(redPressed ? 'darkred' : 'red');
  ellipse(centerX, centerY - centerY / 2, radius);

  // Existing blue circle
  fill(bluePressed ? 'darkblue' : 'blue');
  ellipse(centerX, centerY + centerY / 2, radius);

  // New green circle
  fill(greenPressed ? 'darkgreen' : 'green');
  ellipse(centerX, centerY, radius); // Positioned at the center
}

function cirkelknaptrykket() {
  let upperCircleCenterY = windowHeight / 4;
  let centerCircleCenterY = windowHeight / 2; 
  let lowerCircleCenterY = 3 * windowHeight / 4;
  let radius = min(windowWidth, windowHeight) / 2 - 40;

  let distToUpperCircle = dist(mouseX, mouseY, windowWidth / 2, upperCircleCenterY);
  let distToCenterCircle = dist(mouseX, mouseY, windowWidth / 2, centerCircleCenterY); 
  let distToLowerCircle = dist(mouseX, mouseY, windowWidth / 2, lowerCircleCenterY);

  if (distToUpperCircle < radius / 2) {
    redPressed = true;
    bluePressed = false;
    greenPressed = false; 
    myColor = 1;
    console.log("Øvre cirkel (rød) trykket");
  } else if (distToCenterCircle < radius / 2) {
    greenPressed = true; 
    redPressed = false;
    bluePressed = false;
    myColor = 2; 
    console.log("Midterste cirkel (grøn) trykket");
  } else if (distToLowerCircle < radius / 2) {
    bluePressed = true;
    redPressed = false;
    greenPressed = false;
    myColor = 3;
    console.log("Nedre cirkel (blå) trykket");
  }
}


let threshold = 1; //Deklarerer en variabel threshold med værdien 1


let updateInterval = null; // This will hold the reference to the interval

function touchStarted() {
  console.log("Touch detected");

  // Setup location tracking
  setupLocation(threshold);

  // Handle color selection via touch interaction
  cirkelknaptrykket();

  // Clear any existing interval to avoid duplicates
  if (updateInterval) {
    clearInterval(updateInterval);
  }

  // Start sending updates every 5 seconds (5000 milliseconds)
  updateInterval = setInterval(function() {
    sendCurrentStatus();
  }, 1000);
}

function sendCurrentStatus() {
  // Fetch current GPS location from sensor
  let currentLocation = locationSensor.get();

  // Create and send the message with the current location and color
  let message = {
    "from": config.myID,
    "mobilemessage": "Continual update",
    "colorValue": myColor,
    "latitude": currentLocation.lat,
    "longitude": currentLocation.long
  };

  console.log("Sending Location and Color:", message);
  sendMessage(message);
}