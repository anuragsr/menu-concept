/*
 * Copyright 2021 Google LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as THREE from "three";
import { MathUtils, Vector3 } from "three";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { ThreeJSOverlayView, xyToLatLng} from "@googlemaps/three";
import {latLngToVector3Relative} from "@googlemaps/three/src/util";

const { degToRad, radToDeg } = MathUtils;
const { atan, cos, exp, log, tan, PI } = Math;

const l = console.log.bind(window.console)
// l(xyToLatLng)
let map: google.maps.Map;

const start =  { lat: 35.6594945, lng: 139.6999859 };
const end =  { lat: 35.66, lng: 139.705 };

const mapOptions = {
  tilt: 70,
  heading: 0,
  zoom: 19,
  // draggable: true,
  // scrollwheel: true,
  center: start,
  mapId: "15431d2b469f209e",
  // zoomControl: true,
  // mapTypeControl: true,
  // scaleControl: true,
  // streetViewControl: true,
  // rotateControl: true,
  // fullscreenControl: true
  // disable interactions due to animation loop and moveCamera
  // disableDefaultUI: true,
  // gestureHandling: "none",
  // keyboardShortcuts: false,
};

function initMap(): void {
  const heading2 = google.maps.geometry.spherical.computeHeading(
    start,
    end
  );
  mapOptions.heading = heading2;
  
  const mapDiv = document.getElementById("map") as HTMLElement;

  map = new google.maps.Map(mapDiv, mapOptions);

  const scene = new THREE.Scene();

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);

  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25);

  directionalLight.position.set(0, 10, 50);
  scene.add(directionalLight);
  
  const material = new THREE.LineBasicMaterial({
    color: 0x0000ff
  });
  
  const overlay = new ThreeJSOverlayView({
    animationMode:"always",
    upAxis:"Y",
    map,
    scene,
    anchor: { ...mapOptions.center, altitude: 100 },
    THREE,
  });
  
  const points = [];
  const positionS = overlay.latLngAltitudeToVector3(start);
  const positionE = overlay.latLngAltitudeToVector3(end);
  
  points.push( positionS );
  points.push( positionE );
  // points.push( new THREE.Vector3( -100, 10, -500 ) );
  
  const geometry = new THREE.BufferGeometry().setFromPoints( points );
  
  const line = new THREE.Line( geometry, material );
  scene.add( line );
  
  const lineCurve = new THREE.LineCurve3(
    positionS,
    positionE,
  );
  
  // const secondLine = new THREE.LineCurve3(
  //   new THREE.Vector3( 100, 10, -500 ),
  //   new THREE.Vector3( -100, 10, -500 )
  // );
  const pointsPath = new THREE.CurvePath();
  pointsPath.add(lineCurve)
  // pointsPath.add(secondLine)
  
  // Load the model.
  const loader = new GLTFLoader();
  const url =
    "https://raw.githubusercontent.com/googlemaps/js-samples/main/assets/pin.gltf";

  loader.load(url, (gltf) => {
    const obj = gltf.scene
    obj.scale.set(10, 10, 10);
    // obj.rotation.x = Math.PI;
    // obj.rotation.z = Math.PI;
    // obj.rotation.y = Math.PI;
    // gltf.scene.position.x = 100;
    scene.add(obj);

    let { tilt, heading, zoom } = mapOptions;

    const animate = () => {
      if (tilt < 67.5) {
        tilt += 0.5;
      } else if (heading <= 360) {
        heading += 0.2;
        zoom -= 0.0005;
      } else {
        // exit animation loop
        return;
      }

      map.moveCamera({ tilt, heading, zoom });

      requestAnimationFrame(animate);
    };
    // requestAnimationFrame(animate);
    
    let fraction = 0;
    const up = new THREE.Vector3( 0, 1, 0 );
    const axis = new THREE.Vector3( );
    // console.log(map.getProjection())
    
    function vec3ToLatLngAlt(vec3, anchor) {
      const z = vec3.z;
    
      vec3.multiplyScalar(1 / cos(degToRad(anchor.lat)));
      const {lat, lng} = xyToLatLng([vec3.x, vec3.y]);
    
      return {lat, lng, altitude: anchor.altitude + z};
    }
    
    const animateAlongLine = () => {
      const newPosition = pointsPath.getPoint(fraction);
      const tangent = pointsPath.getTangent(fraction);
      // console.log(newPosition)
      // gltf.scene.position.set(newPosition.x, newPosition.y, 0);
      obj.position.copy(newPosition);

      axis.crossVectors( up, tangent ).normalize();
      const radians = Math.acos( up.dot( tangent ) );
      obj.quaternion.setFromAxisAngle( axis, radians );
      
      fraction +=0.0001 * 10;
      if (fraction > 1) {
        fraction = 0;
      }
      
      // const {lat, lng} = vec3ToLatLngAlt(obj.position, { ...mapOptions.center, altitude: 100 });
      const {lat, lng} = vec3ToLatLngAlt(obj.position, overlay.anchor);
      // l({lat: mapOptions.center.lat + lat, lng: mapOptions.center.lng + lng})
      // map.panTo({lat: mapOptions.center.lat + lat, lng: mapOptions.center.lng + lng})
  
      const heading = google.maps.geometry.spherical.computeHeading(
        start,
        end
      );
  
      // map.setCenter({lat: mapOptions.center.lat + lat, lng: mapOptions.center.lng + lng})
      // map.setHeading(heading);
      map.moveCamera({ heading });
  
      // map.panTo({lat, lng})
      
      // map.panTo(xyToLatLng(gltf.scene.position.x, gltf.scene.position.y))
      // map.panTo(map.getProjection().fromPointToLatLng(
      //   gltf.scene.position.x, gltf.scene.position.y
      // ))
      // overlay.camera.position.copy(newPosition)
      requestAnimationFrame(animateAlongLine);
    }
    
    requestAnimationFrame(animateAlongLine);
  });
  window.overlay = overlay;
  window.map = map;
  
  console.log(overlay)
}

declare global {
  interface Window {
    initMap: () => void;
  }
}
window.initMap = initMap;
export { initMap };
