import 'html/index.html';
import 'style/index.scss';

import mapboxgl from 'mapbox-gl';
import { autorun } from 'mobx';

import MapComponent from 'components/Map';
import Popups from 'components/Popups';

import uiState from './uiState';
import {
  MAX_ZOOM,
  MIN_ZOOM,
  MAX_LAT,
  MIN_LAT,
  MAX_LNG,
  MIN_LNG,
} from './config';
import { USER_AGENT } from './utils';

mapboxgl.accessToken =
  'pk.eyJ1IjoiY2xhdWRpYWJ1ZWhsZXIiLCJhIjoiY2pqZWpvanNqNG1ncTNxbzR4dXp5c2V1YiJ9.rThfiYyrc_-ahzJuTJ1BRQ';

// //Setup mapbox-gl map
const map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'mapbox://styles/claudiabuehler/cjjejry6u8y722sp8cnzoe3c7',
  center: [uiState.mapCenter.lng, uiState.mapCenter.lat],
  zoom: uiState.mapZoom,
  minZoom: MIN_ZOOM,
  maxZoom: MAX_ZOOM,
  maxBounds: [[MIN_LNG, MIN_LAT], [MAX_LNG, MAX_LAT]],
});

// map.dragRotate.disable();
// map.touchZoomRotate.disableRotation();
// map.addControl(new mapboxgl.ScaleControl(), 'top-left');
// map.addControl(new mapboxgl.NavigationControl(), 'top-left');
uiState.setMap(map);
MapComponent(map);
Popups()(map);

//if (uiState.mapInitialized)
