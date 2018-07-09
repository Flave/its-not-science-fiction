import { observable, action, computed } from 'mobx';
import {
  addEvent,
  windowWidth,
  windowHeight,
  getDistances,
  getDistancesPx,
  getTranslate,
  getLocationString,
} from './utils';
import { scaleLinear as d3_scaleLinear } from 'd3-scale';
import { selectAll as d3_selectAll } from 'd3-selection';
import { max as d3Max } from 'd3-array';

import _minBy from 'lodash.minBy';
import _debounce from 'lodash.debounce';
import _groupBy from 'lodash.groupBy';
import _map from 'lodash.map';
import { LngLatBounds, LngLat, Marker } from 'mapbox-gl';

import dataAPI from 'app/data/dataAPI';
import { MAX_ZOOM, MIN_ZOOM, MAX_LAT, MIN_LAT } from './config';

const SURFACE_CACHE_SIZE = 100;
const ZOOM_BUFFER_SIZE = 40;
const MIN_VOLUME = -75;
const MAX_LAT_MOVEMENT = Math.abs(MIN_LAT - MAX_LAT);

class UiState {
  @observable mapCenter = { lng: 11, lat: 50 };
  @observable mapZoom = 6;
  @observable mapInitialized = false;
  @observable sitesData = [];
  @observable
  mapBounds = new LngLatBounds(new LngLat(0, 0), new LngLat(50, 50));
  @observable selectedSite;

  @observable.struct
  windowDimensions = {
    width: windowWidth(),
    height: windowHeight(),
  };

  constructor() {
    // hacky helper to prevent blips of sounds when jumping to different location
    this.updateSounds = true;
    addEvent(
      window,
      'resize',
      _debounce(() => {
        this.windowDimensions = {
          width: windowWidth(),
          height: windowHeight(),
        };
      }),
      500,
    );

    dataAPI.load(d => {
      this.setSites(d);
    });
  }

  setMap(map) {
    this.map = map;
  }

  @action
  setSites(data) {
    this.sitesData = data.features;
  }

  @action
  transitionMap(center, zoom) {
    this.mapCenter = {
      lat: center.lat,
      lng: center.lng,
    };
    this.mapZoom = zoom;
  }

  @action
  setMapParams(center, zoom, bounds) {
    this.mapCenter = center || this.mapCenter;
    this.mapZoom = zoom || this.mapZoom;
    this.mapBounds = bounds || this.mapBounds;
  }

  @action
  setMapIsInitialized() {
    this.mapInitialized = true;
  }

  @action
  setSelectedSite(id) {
    this.selectedSite = id;
  }

  // COMPUTES

  //-----
  // MAP
  //-----

  /**
   * Utility function to simplify access to the corner points of the map
   */
  @computed
  get mapBoundsAsObject() {
    const { lng: left, lat: top } = this.mapBounds.getNorthWest();
    const { lng: right, lat: bottom } = this.mapBounds.getSouthEast();
    return {
      left,
      top,
      right,
      bottom,
    };
  }

  /**
   * Returns an array of lat/lng coordinates for the four corners of the map bounds (used manily to position the canvas source)
   */
  @computed
  get mapBoundsAsArray() {
    const { left, top, right, bottom } = this.mapBoundsAsObject;
    return [[left, top], [right, top], [right, bottom], [left, bottom]];
  }

  /**
   * Retuns the width and height of the map in geographical distance (degrees)
   */
  @computed
  get mapDimensions() {
    const { left, top, right, bottom } = this.mapBoundsAsObject;
    return {
      width: Math.abs(right - left),
      height: Math.abs(bottom - top),
    };
  }

  @computed
  get mapCenterPx() {
    return this.map.project([this.mapCenter.lng, this.mapCenter.lat]);
  }

  @computed
  get mapBoundsPx() {
    return {
      sw: {
        lng: this.map.project(this.mapBounds.sw.lng),
        lat: this.map.project(this.mapBounds.sw.lat),
      },
      ne: {
        lng: this.map.project(this.mapBounds.ne.lng),
        lat: this.map.project(this.mapBounds.ne.lat),
      },
    };
  }

  //---------
  // ISLANDS
  //---------

  @computed
  get sites() {
    const sites = this.sitesData.map(site => {
      const [lng, lat] = site.geometry.coordinates;
      this.mapCenter;
      return {
        ...site,
        locationPx: this.map.project([lng, lat]),
      };
    });
    return sites;
  }

  @computed
  get popupCandidate() {
    if (!this.sites.length) return;
    const candidate = this.sites.filter(
      site => site.properties.id === this.selectedSite,
    );
    if (candidate.length) {
      const { x, y } = this.getPopupPosition(candidate[0].locationPx);
      return {
        ...candidate[0],
        x,
        y,
      };
    }
    return undefined;
  }

  getPopupPosition({ x, y }) {
    const pPos = this.cartesianToPolar(x, y);
    const pos = this.polarToCartesian(pPos.radius - 350, pPos.angle);
    return pos;
  }

  //---------
  // HELPERS
  //---------

  // getLocationPx({ id }) {
  //   //const mockMarker = new Marker().setLngLat(location).addTo(this.map);
  //   const translate = { x: 0, y: 0 };
  //   d3_selectAll('.map__island').each(function(d) {
  //     if (d.id === id) {
  //       const _translations = getTranslate(this.style.transform);
  //       translate.x = _translations[0];
  //       translate.y = _translations[1];
  //     }
  //   });
  //   // const translate = getTranslate(mockMarker.getElement().style.transform);
  //   // mockMarker.remove();
  //   return translate; //{ x: translate[0], y: translate[1] };
  // }

  polarToCartesian(radius, angle) {
    return {
      x: this.mapCenterPx.x + radius * Math.cos(angle),
      y: this.mapCenterPx.y + radius * Math.sin(angle),
    };
  }

  cartesianToPolar(x, y) {
    const cx = this.mapCenterPx.x;
    const cy = this.mapCenterPx.y;
    const dx = cx - x;
    const dy = cy - y;
    const radius = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    let angle = Math.atan2(-dy, -dx);
    if (x < cx && y < cy) angle = Math.PI * 2 + angle;
    if (y < cy && x > cx) angle = Math.PI * 2 + angle;
    return {
      angle,
      radius,
    };
  }
}

export default new UiState();
