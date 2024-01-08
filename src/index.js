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
    this.start = { lat: 35.6594945, lng: 139.6999859 };
    this.end = { lat: 35.66543, lng: 139.705 };
    // this.end = { lat: 35.66, lng: 139.705 };
    this.mapOptions = {
      tilt: 70,
      // tilt: 0,
      heading: 0,
      zoom: 20,
      center: this.start,
      mapId: "15431d2b469f209e",
    };
  }
  initMap() {
    const mapDiv = document.getElementById("map");
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
    // this.addButtons();

    google.maps.event.addListenerOnce(map, "tilesloaded", () => {
      // do something only the first time the map is loaded
      l("Loaded");
      this.tl.play();
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

    const arrowFn = () => {
      const material = new THREE.MeshStandardMaterial({
        color: "yellow",
      });
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
    const { map, scene, overlay } = this;
    const points = path.map((p) => overlay.latLngAltitudeToVector3(p));
    l(points);

    const shape1 = new THREE.Shape([
      new THREE.Vector2(5 / 4, 5),
      new THREE.Vector2(5 / 4, -5),
      new THREE.Vector2(-5 / 4, -5),
      new THREE.Vector2(-5 / 4, 5),
    ]);
    const closedSpline = new THREE.CatmullRomCurve3(points);
    const geometry1 = new THREE.ExtrudeGeometry(shape1, {
      steps: 50,
      extrudePath: closedSpline,
    });
    const material1 = new THREE.MeshLambertMaterial({
      color: "purple",
      wireframe: false,
    });
    const mesh1 = new THREE.Mesh(geometry1, material1);
    scene.add(mesh1);

    // const clipPlanes = [
    //   new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
    //   new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
    //   new THREE.Plane(new THREE.Vector3(0, 0, -1), 0),
    // ];
    //
    // const group = new THREE.Group();
    //
    // for (let i = 1; i <= 30; i += 2) {
    //   const geometry = new THREE.SphereGeometry(i / 30, 48, 24);
    //
    //   const material = new THREE.MeshLambertMaterial({
    //     color: new THREE.Color().setHSL(
    //       Math.random(),
    //       0.5,
    //       0.5,
    //       THREE.SRGBColorSpace
    //     ),
    //     side: THREE.DoubleSide,
    //     clippingPlanes: clipPlanes,
    //     clipIntersection: true,
    //   });
    //
    //   group.add(new THREE.Mesh(geometry, material));
    // }
    // group.scale.multiplyScalar(100);
    // scene.add(group);
    //
    // // helpers
    //
    // const helpers = new THREE.Group();
    // helpers.add(new THREE.PlaneHelper(clipPlanes[0], 2, 0xff0000));
    // helpers.add(new THREE.PlaneHelper(clipPlanes[1], 2, 0x00ff00));
    // helpers.add(new THREE.PlaneHelper(clipPlanes[2], 2, 0x0000ff));
    // // helpers.visible = false;
    // helpers.scale.multiplyScalar(100);
    //
    // scene.add(helpers);
    // const geometry = new MeshLineGeometry();
    // // geometry.setPoints(path.map((p) => overlay.latLngAltitudeToVector3(p)));
    // const points = [];
    // for (let j = 0; j < Math.PI; j += (2 * Math.PI) / 100)
    //   points.push(Math.cos(j), Math.sin(j), 0);
    //
    // geometry.setPoints(path.map((p) => overlay.latLngAltitudeToVector3(p)));
    //
    // (window as any).geometry = geometry;
    // const material = new MeshLineMaterial({
    //   color: "purple",
    //   sizeAttenuation: 0,
    //   lineWidth: 0.0001,
    // });
    //
    // const mesh = new THREE.Mesh(geometry, material);
    // scene.add(mesh);
    // const spline = new THREE.CatmullRomCurve3(points);
    // const divisions = Math.round(12 * points.length);
    // const point = new THREE.Vector3();
    // const color = new THREE.Color();
    // const positions = [];
    // const colors = [];
    //
    // for (let i = 0, l = divisions; i < l; i++) {
    //   const t = i / l;
    //
    //   spline.getPoint(t, point);
    //   positions.push(point.x, point.y, point.z);
    //
    //   color.setHSL(t, 1.0, 0.5, THREE.SRGBColorSpace);
    //   colors.push(color.r, color.g, color.b);
    // }
    //
    // // Line2 ( LineGeometry, LineMaterial )
    //
    // const geometry = new LineGeometry();
    // geometry.setPositions(positions);
    // geometry.setColors(colors);
    //
    // window.geometry = geometry;
    //
    // const matLine = new LineMaterial({
    //   color: "purple",
    //   linewidth: 0.01 * 1, // in world units with size attenuation, pixels otherwise
    //   // vertexColors: true,
    //
    //   //resolution:  // to be set by renderer, eventually
    //   dashed: false,
    //   alphaToCoverage: false,
    // });
    //
    // const line = new Line2(geometry, matLine);
    // line.computeLineDistances();
    // line.scale.set(1, 1, 1);
    // scene.add(line);
  }
  createTL(path) {
    this.createPath(path);

    const { map, overlay, scene, mesh } = this;
    const tl = gsap.timeline({
      delay: 2,
      repeat: -1,
      // yoyo: true,
      // paused: true,
    });

    this.tl = tl;
    window.tl = tl;

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

    tl.progress(0).pause();
  }
}

const mapObj = new Map3D();

// declare global {
//   interface Window {
//     initMap: () => void;
//   }
// }

window.initMap = mapObj.initMap.bind(mapObj);
