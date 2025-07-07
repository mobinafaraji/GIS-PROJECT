import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import Group from 'ol/layer/Group';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import TileWMS from 'ol/source/TileWMS';
import LayerSwitcher from 'ol-layerswitcher';
import 'ol-layerswitcher/dist/ol-layerswitcher.css';
import { ScaleLine, MousePosition } from 'ol/control';
import { createStringXY } from 'ol/coordinate';


const WMS_URL = 'https://www.gis-geoserver.polimi.it/geoserver/gisgeoserver_06/wms';


const osmBase = new TileLayer({
  title: 'OpenStreetMap',
  type: 'base',
  visible: true,
  source: new OSM()
});

const darkBase = new TileLayer({
  title: 'Dark Matter (Carto)',
  type: 'base',
  visible: false,
  source: new XYZ({
    url: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    attributions: '© CartoDB'
  })
});

const baseGroup = new Group({
  title: 'Base Maps',
  layers: [osmBase, darkBase]
});


function createWMSLayer(name, title, visible = false) {
  return new TileLayer({
    title: title,
    visible: visible,
    source: new TileWMS({
      url: WMS_URL,
      params: { 'LAYERS': `gisgeoserver_06:${name}`, 'TILED': true },
      serverType: 'geoserver',
      crossOrigin: 'anonymous'
    })
  });
}

const dec2022Group = new Group({
  title: 'Pollutant Maps – Dec 2022',
  layers: [
    createWMSLayer('Italy_CAMS_no2_2022_12', 'NO₂ – Dec 2022'),
    createWMSLayer('Italy_CAMS_pm10_2022_12', 'PM₁₀ – Dec 2022'),
    createWMSLayer('Italy_CAMS_pm2p5_2022_12', 'PM₂.₅ – Dec 2022')
  ]
});

const avgGroup = new Group({
  title: 'Air Quality Averages (2022)',
  layers: [
    createWMSLayer('Italy_average_no2_2022', 'NO₂ 2022', true),
    createWMSLayer('Italy_average_pm10_2022', 'PM₁₀ 2022'),
    createWMSLayer('Italy_average_pm2p5_2022', 'PM₂.₅ 2022')
  ]
});

const conc2020Group = new Group({
  title: 'Pollutant Concentration – 2020',
  layers: [
    createWMSLayer('Italy_no2_concentration_map_2020', 'NO₂ – Concentration 2020'),
    createWMSLayer('Italy_pm10_concentration_map_2020', 'PM₁₀ – Concentration 2020'),
    createWMSLayer('Italy_pm2p5_concentration_map_2020', 'PM₂.₅ – Concentration 2020')
  ]
});

const aadGroup = new Group({
  title: '2022 vs 2017–2021 Avg Diff',
  layers: [
    createWMSLayer('Italy_no2_2017-2021_AAD_map_2022', 'NO₂ AAD 2022'),
    createWMSLayer('Italy_pm10_2017-2021_AAD_map_2022', 'PM₁₀ AAD 2022'),
    createWMSLayer('Italy_pm2p5_2017-2021_AAD_map_2022', 'PM₂.₅ AAD 2022')
  ]
});

const lcGroup = new Group({
  title: 'Land Cover',
  layers: [
    createWMSLayer('Italy_LC_reclassified_2022', 'Land Cover – Reclassified 2022')
  ]
});

const bivariateGroup = new Group({
  title: 'Bivariate Maps',
  layers: [
    createWMSLayer('Italy_no2_2020_bivariate_map', 'NO₂ Bivariate 2020'),
    createWMSLayer('Italy_pm10_2020_bivariate_map', 'PM₁₀ Bivariate 2020'),
    createWMSLayer('pm2p5_2020_bivariate_map', 'PM₂.₅ Bivariate 2020')
  ]
});


const overlayGroup = new Group({
  title: 'Data Layers',
  layers: [
    dec2022Group,
    avgGroup,
    conc2020Group,
    aadGroup,
    lcGroup,
    bivariateGroup,
  ]
});


const map = new Map({
  target: 'map',
  layers: [baseGroup, overlayGroup],
  view: new View({
    center: [1300000, 5100000],
    zoom: 6,
    projection: 'EPSG:3857'
  })
});


map.addControl(new LayerSwitcher({ reverse: true, groupSelectStyle: 'group' }));
map.addControl(new ScaleLine({ bar: true }));
map.addControl(new MousePosition({
  coordinateFormat: createStringXY(4),
  projection: 'EPSG:4326',
  className: 'custom-mouse-position',
  target: document.getElementById('mouse-position')
}));


function getAllTileWMSLayers(layerOrGroup) {
  let layers = [];
  if (layerOrGroup instanceof Group) {
    layerOrGroup.getLayers().forEach(innerLayer => {
      layers = layers.concat(getAllTileWMSLayers(innerLayer));
    });
  } else if (layerOrGroup instanceof TileLayer) {
    const source = layerOrGroup.getSource?.();
    if (source instanceof TileWMS) {
      layers.push(layerOrGroup);
    }
  }
  return layers;
}

const tileWMSLayers = getAllTileWMSLayers(overlayGroup);

function updateLegend(layer) {
  const legendDiv = document.getElementById('legend');
  if (!layer || !layer.getSource || !(layer.getSource() instanceof TileWMS)) return;
  const title = layer.get('title');
  const layerName = layer.getSource().getParams().LAYERS;
  const legendURL = `${WMS_URL}?SERVICE=WMS&VERSION=1.1.0&REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=${layerName}&transparent=true`;

  legendDiv.innerHTML = `
  <img src="${legendURL}" alt="Legend" style="max-width:200px;">
`;
}


const visibleLayer = tileWMSLayers.find(layer => layer.getVisible());
if (visibleLayer) updateLegend(visibleLayer);


tileWMSLayers.forEach(layer => {
  layer.on('change:visible', () => {
    if (layer.getVisible()) {
  
      tileWMSLayers.forEach(l => { if (l !== layer) l.setVisible(false); });
      updateLegend(layer);
    }
  });
}); 
