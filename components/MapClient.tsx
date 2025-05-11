'use client';

import { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import TileWMS from 'ol/source/TileWMS';
import { fromLonLat } from 'ol/proj';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Style, Fill, Stroke } from 'ol/style';
import { Feature } from 'ol';
import { Geometry } from 'ol/geom';
import { GeoJSON } from 'ol/format';

// Implement throttle function to avoid dependency on lodash
const throttle = (func: Function, delay: number) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: any[]) => {
    if (timeout) return;
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, delay);
  };
};

export default function MapClient() {
  const mapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [featureInfo, setFeatureInfo] = useState<Record<string, any> | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupPosition, setPopupPosition] = useState<{ left: string, top: string }>({ left: '0px', top: '0px' });
  const [interactionType, setInteractionType] = useState<'click' | 'hover' | null>(null);

  const vectorSource = useRef(new VectorSource()).current;
  const vectorLayer = useRef(new VectorLayer({ source: vectorSource })).current;

  const highlightStyle = new Style({
    fill: new Fill({ color: 'rgba(255, 255, 0, 0.6)' }),
    stroke: new Stroke({ color: '#ff0', width: 3 }),
  });

  useEffect(() => {
    if (!mapRef.current) return;

    const jogja4326 = [110.364917, -7.801194];
    const center3857 = fromLonLat(jogja4326);

    const wmsSource = new TileWMS({
      url: 'http://localhost:8080/geoserver/BatasAdmDiy/wms',
      params: {
        'LAYERS': 'BatasAdmDiy:BatasAdministrasiDesaDIY',
        'TILED': true,
        'TRANSPARENT': true,
        'FORMAT': 'image/png',
      },
      serverType: 'geoserver',
      crossOrigin: 'anonymous',
    });

    const wmsLayer = new TileLayer({ source: wmsSource, opacity: 0.3 });

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        wmsLayer,
        vectorLayer,
      ],
      view: new View({
        center: center3857,
        zoom: 11,
      }),
    });

    const handleFeatureInfo = (evt: any, type: 'click' | 'hover') => {
      const view = map.getView();
      const url = wmsSource.getFeatureInfoUrl(
        evt.coordinate,
        view.getResolution() ?? 1,
        view.getProjection(),
        {
          'INFO_FORMAT': 'application/json',
          'QUERY_LAYERS': 'BatasAdmDiy:BatasAdministrasiDesaDIY',
        }
      );

      if (!url) {
        setFeatureInfo(null);
        setPopupVisible(false);
        vectorSource.clear();
        map.getTargetElement().style.cursor = '';
        return;
      }

      if (type === 'hover') {
        map.getTargetElement().style.cursor = 'wait';
      }

      fetch(url)
        .then(res => res.json())
        .then((data) => {
          const features = data.features;
          if (features.length > 0) {
            const props = features[0].properties;

            // Update posisi popup
            const mapRect = mapRef.current?.getBoundingClientRect();
            if (mapRect) {
              setPopupPosition({
                left: `${evt.originalEvent.clientX + 10}px`,
                top: `${evt.originalEvent.clientY + 10}px`,
              });
            }

            setFeatureInfo({
              WADMKD: props.WADMKD,
              WADMKC: props.WADMKC,
              WADMKK: props.WADMKK,
            });
            setPopupVisible(true);
            setInteractionType(type);
            map.getTargetElement().style.cursor = 'pointer';

            // Highlight geometry
            const geometry = features[0].geometry;
            const geoFormat = new GeoJSON();
            let olGeometry: Geometry;

            try {
              olGeometry = geoFormat.readGeometry(geometry);
            } catch {
              olGeometry = null!;
            }

            const highlightFeature = olGeometry ? new Feature(olGeometry) : null;
            vectorSource.clear();
            if (highlightFeature) {
              highlightFeature.setStyle(highlightStyle);
              vectorSource.addFeature(highlightFeature);
            }
          } else {
            if (type === 'hover') {
              map.getTargetElement().style.cursor = '';
            }
            setFeatureInfo(null);
            setPopupVisible(false);
            vectorSource.clear();
          }
        })
        .catch(() => {
          map.getTargetElement().style.cursor = '';
          setFeatureInfo(null);
          setPopupVisible(false);
          vectorSource.clear();
        });
    };

    map.on('singleclick', (evt) => handleFeatureInfo(evt, 'click'));

    const throttledPointerMove = throttle((evt: any) => {
      if (evt.dragging) return;
      handleFeatureInfo(evt, 'hover');
    }, 200);  // Adjust the throttle delay as needed

    map.on('pointermove', throttledPointerMove);

    return () => {
      map.setTarget(undefined);
    };
  }, []);

  return (
    <div style={{ position: 'relative', height: '80vh' }}>
      <div ref={mapRef} style={{ height: '100%' }} />

      {popupVisible && featureInfo && (
        <div
          ref={popupRef}
          style={{
            position: 'absolute',
            left: popupPosition.left,
            top: popupPosition.top,
            backgroundColor: '#fff',
            padding: '10px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            width: '130px',
            border: '1px solid #ccc',
            pointerEvents: interactionType === 'click' ? 'auto' : 'none',
          }}
        >
          <div style={{ marginTop: '8px', fontSize: '14px' }}>
            <p><strong>{featureInfo.WADMKD ?? '-'}</strong></p>
            <p><strong>{featureInfo.WADMKC ?? '-'}</strong></p>
            <p><strong>{featureInfo.WADMKK ?? '-'}</strong></p>
          </div>
        </div>
      )}
    </div>
  );
}
