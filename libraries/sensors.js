// helper functions, MOJA2023 + ASMO2024
// sensors.js - sensor library

function distance3D(x0, y0, z0, x1, y1, z1) {
  let a = x1 - x0;
  let b = y1 - y0;
  let c = z1 - z0;
  let dist = Math.round(Math.sqrt(a*a + b*b + c*c));
  return dist;
}

// USAGE: let dist = haversine(latt_sted_A, long_sted_A, latt_sted_B, long_sted_B));
function haversine() {
  var radians = Array.prototype.map.call(arguments, function(deg) { return deg/180.0 * Math.PI; });
  var lat1 = radians[0], lon1 = radians[1], lat2 = radians[2], lon2 = radians[3];
  var R = 6372.8; // km
  var dLat = lat2 - lat1;
  var dLon = lon2 - lon1;
  var a = Math.sin(dLat / 2) * Math.sin(dLat /2) + Math.sin(dLon / 2) * Math.sin(dLon /2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.asin(Math.sqrt(a));

  return Math.floor((R*c)*1000); 
}

// geo, ASMO2024

var locationSensor = {
  lat: 0,
  long: 0,
  
  get: function() {
    return {
      lat: this.lat,
      long: this.long
    }
  },
  distance: function(lat1, long1) {
    return haversine(
      this.lat, this.long,
      lat1, long1
    );    
  }
};

function doLocation(p) {
  console.log("Location updated: ", p.coords.latitude, p.coords.longitude);
  locationSensor.lat = p.coords.latitude;
  locationSensor.long = p.coords.longitude;
} 

function setupLocation(threshold) {
  function handleGeoSuccess(position) {
    doLocation(position);
  }
  function handleGeoError(error) {
    console.error("Geolocation error: ", error);
  }

  navigator.geolocation.watchPosition(handleGeoSuccess, handleGeoError, { enableHighAccuracy: true });
}

// motion, MOJA2023 + ASMO2024
const motionFactor = 100;

var motionSensor = {
  x: 0,
  y: 0,
  z: 0,
  threshold: 0,
  hasNewValue: false,
  get: function() {
    this.hasNewValue = false;
    return {
      x: this.x,
      y: this.y,
      z: this.z,
    }
  }
};

var motionValues = {
  accX: 0,
  accY: 0,
  accZ: 0,
  accXOld: 0,
  accYOld: 0,
  accZOld: 0,
};

function doMotion(e) {
  motionValues.accX = motionFactor * e.acceleration.x;
  motionValues.accY = motionFactor * e.acceleration.y; 
  motionValues.accZ = motionFactor * e.acceleration.z;
    
  let difference = distance3D(
    motionValues.accX, motionValues.accY, motionValues.accZ,
    motionValues.accXOld, motionValues.accYOld, motionValues.accZOld
  );

  if (difference >= motionSensor.threshold) {
    motionSensor.hasNewValue = true;

    motionSensor.x = motionValues.accX;
    motionSensor.y = motionValues.accY;
    motionSensor.z = motionValues.accZ;

    accXOld = motionValues.accX;
    accYOld = motionValues.accY;
    accZOld = motionValues.accZ;
  }
}


// REQUEST PERMISSION ON IOS DEVICeS
function setupMotion(threshold)
{
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === 'granted') {
            window.addEventListener("devicemotion", doMotion, false);
          }
        })
        .catch(console.error);
  }
  else { 
    window.addEventListener("devicemotion", doMotion, false); 
  }
  
  if(typeof threshold === 'number') {
    motionSensor.threshold = threshold;
  }
}

// orientation, MOJA2023 + ASMO2024

var orientationSensor = {
  x: 0,
  y: 0,
  z: 0,
  threshold: 0,
  hasNewValue: false,
  get: function() {
    this.hasNewValue = false;
    return {
      alpha: this.x,
      beta: this.y,
      gamma: this.z,
    }
  }
};

var orientationValues = {
  alpha: 0,
  beta: 0,
  gamma: 0,
  alphaOld: 0,
  betaOld: 0,
  gammaOld: 0
};

function doOrientation(e) {
  orientationValues.alpha = e.alpha;
  orientationValues.beta = e.beta; 
  orientationValues.gamma = e.gamma;

  let difference = distance3D(
    orientationValues.alpha, orientationValues.beta, orientationValues.gamma,
    orientationValues.alphaOld, orientationValues.betaOld, orientationValues.gammaOld
  );
  
  if (difference >= orientationSensor.threshold) {
    orientationSensor.hasNewValue = true;

    orientationSensor.x = orientationValues.alpha;
    orientationSensor.y = orientationValues.beta;
    orientationSensor.z = orientationValues.gamma;

    orientationValues.alphaOld = orientationValues.alpha;
    orientationValues.betaOld = orientationValues.beta;
    orientationValues.gammaOld = orientationValues.gamma;
  }
}
 
// REQUEST PERMISSION ON IOS DEVICES
function setupOrientation(threshold) {
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
          .then(permissionState => {
            if (permissionState === 'granted') {
              window.addEventListener("deviceorientation", doOrientation, false);
            }
          })
          .catch(console.error);
  }      
  else { 
    window.addEventListener("deviceorientation", doOrientation, false); 
  }
  
  if(typeof threshold === 'number') {
    orientationSensor.threshold = threshold;
  }
}
