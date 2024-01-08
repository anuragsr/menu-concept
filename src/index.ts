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
import { ThreeJSOverlayView } from "@googlemaps/three";
import gsap from "gsap";

import { l } from "./helpers";

class Map3D {
  map: google.maps.Map;
  directionsService: google.maps.DirectionsService;
  start: any;
  end: any;
  mapOptions: any;
  mesh: THREE.Mesh;

  constructor() {
    this.start = { lat: 35.6594945, lng: 139.6999859 };
    this.end = { lat: 35.66, lng: 139.705 };
    this.mapOptions = {
      tilt: 70,
      heading: 0,
      zoom: 18,
      center: this.start,
      mapId: "15431d2b469f209e",
    };
  }
  initMap(): void {
    l("map init");
    const mapDiv = document.getElementById("map") as HTMLElement;
    const map = new google.maps.Map(mapDiv, this.mapOptions);
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();

    map.setHeading(
      google.maps.geometry.spherical.computeHeading(this.start, this.end)
    );
    directionsRenderer.setMap(map);

    this.map = map;
    this.directionsService = directionsService;
    this.addOverlay();
    this.calcRoute().then();
    this.addMarkers();
    this.addButtons();
  }
  addOverlay() {
    const { map, mapOptions } = this;
    const scene = new THREE.Scene();
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25);

    scene.add(ambientLight);

    directionalLight.position.set(0, 10, 50);
    scene.add(directionalLight);

    const arrowFn = () => {
      const material = new THREE.MeshNormalMaterial();
      const coneGeom = new THREE.ConeGeometry(1, 5, 10);
      const cone = new THREE.Mesh(coneGeom, material);

      cone.scale.multiplyScalar(5);
      return cone;
    };

    this.mesh = arrowFn();
    scene.add(this.mesh);

    this.scene = scene;
    this.overlay = new ThreeJSOverlayView({
      animationMode: "always",
      upAxis: "Y",
      map,
      scene,
      anchor: { ...mapOptions.center, altitude: 0 },
    });
  }
  addButtons() {
    const { map } = this;

    const buttons = [
      ["Rotate Left", "rotate", 20, google.maps.ControlPosition.LEFT_CENTER],
      ["Rotate Right", "rotate", -20, google.maps.ControlPosition.RIGHT_CENTER],
      ["Tilt Down", "tilt", 20, google.maps.ControlPosition.TOP_CENTER],
      ["Tilt Up", "tilt", -20, google.maps.ControlPosition.BOTTOM_CENTER],
    ];

    buttons.forEach(([text, mode, amount, position]) => {
      const controlDiv = document.createElement("div");
      const controlUI = document.createElement("button");

      controlUI.classList.add("ui-button");
      controlUI.innerText = `${text}`;
      controlUI.addEventListener("click", () => {
        adjustMap(mode, amount);
      });
      controlDiv.appendChild(controlUI);
      map.controls[position].push(controlDiv);
    });

    const adjustMap = function (mode: string, amount: number) {
      switch (mode) {
        case "tilt":
          map.setTilt(map.getTilt()! + amount);
          break;
        case "rotate":
          map.setHeading(map.getHeading()! + amount);
          break;
        default:
          break;
      }
    };
  }
  addMarkers() {
    const { map, start, end } = this;
    // Start
    new google.maps.Marker({
      position: start,
      map,
      title: "start",
    });

    // End
    new google.maps.Marker({
      position: end,
      map,
      title: "end",
    });
  }
  async calcRoute() {
    const { start, end } = this;
    const request = {
      origin: start,
      destination: end,
      travelMode: "DRIVING",
    };

    const result = await this.directionsService.route(request);
    // l(result);
    this.createTL(result.routes[0].overview_path);
  }
  createTL(path) {
    const { map, overlay, scene, mesh } = this;
    const tl = gsap.timeline({
      delay: 2,
      repeat: -1,
      yoyo: true,
    });

    let prevHeading = map.getHeading(),
      newHeading;

    for (let i = 0; i < path.length - 1; i++) {
      const start = {
        lat: path[i].lat(),
        lng: path[i].lng(),
      };

      const end = {
        lat: path[i + 1].lat(),
        lng: path[i + 1].lng(),
      };

      const points = [];
      const positionS = overlay.latLngAltitudeToVector3(start);
      const positionE = overlay.latLngAltitudeToVector3(end);

      points.push(positionS);
      points.push(positionE);
      // points.push( new THREE.Vector3( -100, 10, -500 ) );

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x0000ff,
      });
      const line = new THREE.Line(geometry, material);
      scene.add(line);

      const lineCurve = new THREE.LineCurve3(positionS, positionE);

      const pointsPath = new THREE.CurvePath();
      pointsPath.add(lineCurve);
      // pointsPath.add(secondLine)

      const cameraOptions = { ...start };

      newHeading = google.maps.geometry.spherical.computeHeading(start, end);

      const headingObj = {
        value: prevHeading,
        // end: newHeading
      };

      tl.to(headingObj, {
        value: newHeading,
        onUpdate: function () {
          map.moveCamera({
            heading: headingObj.value,
          });
        },
      }).to(cameraOptions, {
        // repeat: -1,
        // yoyo:true,
        lat: end.lat,
        lng: end.lng,
        duration: 2,
        ease: "none",
        onUpdate: function () {
          // l(this.progress(), cameraOptions)
          const fraction = this.progress();
          const { lat, lng } = cameraOptions;
          map.moveCamera({
            center: { lat, lng },
          });

          overlay.latLngAltitudeToVector3(cameraOptions, mesh.position);
        },
      });

      prevHeading = newHeading;
    }
  }
}

const mapObj = new Map3D();

declare global {
  interface Window {
    initMap: () => void;
  }
}

window.initMap = mapObj.initMap.bind(mapObj);
