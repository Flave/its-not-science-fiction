import { autorun, when } from 'mobx';
import uiState from 'app/uiState';
import {
  select as d3_select,
  selectAll as d3_selectAll,
  event as d3_event,
} from 'd3-selection';
import { Marker } from 'mapbox-gl';

const WorldMap = function(map) {
  const markers = [];
  const update = transition => {
    // If there uiState map params are not same as set map params it means that some other component initiated a map transition
    if (
      uiState.mapZoom !== map.getZoom() ||
      uiState.mapCenter !== map.getCenter()
    ) {
      map.flyTo({
        zoom: uiState.mapZoom,
        center: uiState.mapCenter,
        speed: 0.7,
        curve: 1.1,
      });
    }

    d3_selectAll('.map__marker').classed(
      'is-selected',
      site => site.properties.id === uiState.selectedSite,
    );
  };

  const updateMapParams = e => {
    uiState.setMapParams(map.getCenter(), map.getZoom(), map.getBounds());
  };

  const handleSiteClick = site => {
    const [lng, lat] = site.geometry.coordinates;
    uiState.setSelectedSite(site.properties.id);
  };

  const handleMapClick = () => {
    uiState.setSelectedSite();
  };

  const initSites = () => {
    uiState.sites.forEach(site => {
      const [lng, lat] = site.geometry.coordinates;
      const { name } = site.properties;
      const el = d3_select(document.body)
        .datum(site)
        .append('div')
        .attr('data-site-id', site.properties.id)
        .html(`<div class="map__marker-inner">💥</div>`)
        .on('click', function(e) {
          handleSiteClick(site);
          d3_event.stopPropagation();
        })
        .classed('map__marker', true);

      const marker = new Marker(el.node()).setLngLat({ lng, lat }).addTo(map);

      markers.push(marker);
    });
  };

  map.on('zoom', updateMapParams);
  map.on('move', updateMapParams);
  map.on('click', handleMapClick);
  map.on('load', uiState.setMapIsInitialized);

  autorun(update);
  when(() => uiState.sites.length, initSites);
};

export default WorldMap;
