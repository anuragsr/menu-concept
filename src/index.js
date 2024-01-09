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
  constructor() {
    this.start = { lat: 35.659560000000006, lng: 139.70000000000002 };
    // this.start = { lat: 35.6594945, lng: 139.6999859 };
    this.end = { lat: 35.66543, lng: 139.705 };
    // this.end = { lat: 35.66, lng: 139.705 };
    this.mapOptions = {
      // tilt: 70,
      // zoom: 20,
      // heading: 0,
      // center: this.start,
      disableDefaultUI: true,
      isFractionalZoomEnabled: true,
      tilt: 0,
      heading: 134.68366871950434,
      zoom: 17.17965036156561,
      center: { lat: 35.66293661561679, lng: 139.70511765713638 },
      mapId: "15431d2b469f209e",
    };
  }
  initMap() {
    const mapDiv = document.getElementById("map");
    const map = new google.maps.Map(mapDiv, this.mapOptions);
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    this.map = window.map = map;
    this.directionsService = directionsService;
    this.addOverlay();
    this.addObjects();
    this.calcRoute().then();
    this.addMarkers();
    this.addButtons();

    google.maps.event.addListenerOnce(map, "tilesloaded", () => {
      l("Loaded");
      // this.tl.play();
    });
  }
  addOverlay() {
    const { map, mapOptions } = this;
    const scene = new THREE.Scene();
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25);

    scene.add(ambientLight);

    directionalLight.position.set(0, 10, 50);
    scene.add(directionalLight);

    this.scene = scene;
    this.overlay = new ThreeJSOverlayView({
      animationMode: "always",
      upAxis: "Y",
      map,
      scene,
      anchor: { ...mapOptions.center, altitude: 0 },
    });
  }
  addObjects() {
    const { scene } = this;
    const arrowFn = () => {
      const material = new THREE.MeshStandardMaterial({
        color: "yellow",
      });
      const coneGeom = new THREE.ConeGeometry(1, 5, 10);
      const cone = new THREE.Mesh(coneGeom, material);
      cone.visible = false;
      cone.scale.multiplyScalar(5);
      return cone;
    };
    this.mesh = arrowFn();
    // this.mesh = glb.scene;
    scene.add(this.mesh);
  }
  addButtons() {
    const { map } = this;

    const adjustMap = function (mode, amount) {
      switch (mode) {
        case "tilt":
          map.setTilt(map.getTilt() + amount);
          break;
        case "rotate":
          map.setHeading(map.getHeading() + amount);
          break;
        default:
          break;
      }
    };

    // let buttons = [
    //   ["Rotate Left", "rotate", 20, google.maps.ControlPosition.LEFT_CENTER],
    //   ["Rotate Right", "rotate", -20, google.maps.ControlPosition.RIGHT_CENTER],
    //   ["Tilt Down", "tilt", 20, google.maps.ControlPosition.TOP_CENTER],
    //   ["Tilt Up", "tilt", -20, google.maps.ControlPosition.BOTTOM_CENTER],
    // ];

    let buttons = [];

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

    const div = document.createElement("div");
    const btn = document.createElement("button");
    btn.innerText = "Play Animation";
    btn.classList.add("ui-button");
    btn.addEventListener("click", () => {
      this.tl.progress(0).play();
    });
    div.appendChild(btn);

    map.controls[google.maps.ControlPosition.TOP_CENTER].push(div);
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
  createPath(path) {
    const { scene, overlay, mesh } = this;
    const points = path.map((p) => overlay.latLngAltitudeToVector3(p));
    // l(path, points);

    const shape1 = new THREE.Shape([
      new THREE.Vector2(5 / 4, 5),
      new THREE.Vector2(5 / 4, -5),
      new THREE.Vector2(-5 / 4, -5),
      new THREE.Vector2(-5 / 4, 5),
    ]);
    const closedSpline = new THREE.CatmullRomCurve3(points);
    const geometry1 = new THREE.ExtrudeGeometry(shape1, {
      steps: 5200,
      extrudePath: closedSpline,
    });
    const material1 = new THREE.MeshLambertMaterial({
      color: "purple",
      wireframe: false,
    });
    const mesh1 = new THREE.Mesh(geometry1, material1);
    scene.add(mesh1);
  }
  createTL(path) {
    this.createPath(path);

    const { map, overlay, scene, mesh, spline } = this;
    overlay.latLngAltitudeToVector3(path[0], mesh.position);
    mesh.position.y += 10;
    mesh.rotation.z = -Math.PI / 2;
    mesh.visible = true;

    const focusParams = {
      value: {
        heading: map.getHeading(),
        tilt: map.getTilt(),
        zoom: map.getZoom(),
        lat: map.getCenter().lat(),
        lng: map.getCenter().lng(),
      },
      target: {
        // heading: 70,
        heading: map.getHeading(),
        tilt: 70,
        zoom: 20,
        lat: path[0].lat(),
        lng: path[0].lng(),
      },
    };
    const { heading, tilt, zoom, lat, lng } = focusParams.target;
    const tl = gsap
      .timeline({
        // delay: 2,
        repeat: -1,
        // yoyo: true,
        paused: true,
      })
      .to(focusParams.value, {
        heading,
        tilt,
        zoom,
        lat,
        lng,
        duration: 3,
        onUpdate: function () {
          const { heading, tilt, zoom, lat, lng } = focusParams.value;
          map.moveCamera({
            heading,
            tilt,
            zoom,
            center: {
              lat,
              lng,
            },
          });
        },
      });

    this.tl = window.tl = tl;

    const up = new THREE.Vector3(0, 1, 0);
    const axis = new THREE.Vector3();

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
      // scene.add(line);

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
          const fraction = this.progress();
          map.moveCamera({
            heading: headingObj.value,
          });

          const tangent = pointsPath.getTangent(fraction);
          axis.crossVectors(up, tangent).normalize();
          const radians = Math.acos(up.dot(tangent));
          mesh.quaternion.setFromAxisAngle(axis, radians);
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
          mesh.position.y += 10;

          const tangent = pointsPath.getTangent(fraction);
          axis.crossVectors(up, tangent).normalize();
          const radians = Math.acos(up.dot(tangent));
          mesh.quaternion.setFromAxisAngle(axis, radians);
        },
      });

      prevHeading = newHeading;
    }

    // tl.progress(0.01).pause();
  }
}

const mapObj = new Map3D();

window.initMap = mapObj.initMap.bind(mapObj);
