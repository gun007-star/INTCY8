import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Minus, Plus, Maximize, Minimize, Satellite, Layers, Radio, Navigation, Globe, Activity } from 'lucide-react';

export type ThreatType = 'all' | 'ddos' | 'ransomware' | 'zeroday';
const nodes: { name: string; pos: [number, number]; status: string; color: string }[] = [
  { name: 'JAKARTA', pos: [-6.2, 106.82], status: 'GATEWAY 01 · Mitigasi aktif 99.4%', color: '#ff7d91' },
  { name: 'IKN NUSANTARA', pos: [-0.96, 116.7], status: 'GATEWAY 02 · Perisai quantum aktif', color: '#29e6d4' },
  { name: 'SURABAYA', pos: [-7.25, 112.75], status: 'GATEWAY 03 · Jaringan terlindungi', color: '#38c7ec' },
  { name: 'MAKASSAR', pos: [-5.14, 119.43], status: 'GATEWAY 04 · Jaringan terlindungi', color: '#38c7ec' },
  { name: 'JAYAPURA', pos: [-2.53, 140.7], status: 'GATEWAY 05 · Jaringan terlindungi', color: '#38c7ec' },
  { name: 'MEDAN', pos: [3.59, 98.67], status: 'GATEWAY 06 · Pemantauan aktif', color: '#38c7ec' },
];
const attacks: { type: ThreatType; start: [number, number]; end: [number, number]; curve: number }[] = [
  { type: 'ddos', start: [15, 94], end: [-6.2, 106.82], curve: 8 },
  { type: 'ddos', start: [20, 116], end: [-6.2, 106.82], curve: -10 },
  { type: 'ddos', start: [5, 90], end: [-6.2, 106.82], curve: 6 },
  { type: 'ransomware', start: [16, 136], end: [-0.96, 116.7], curve: 8 },
  { type: 'ransomware', start: [9, 130], end: [-7.25, 112.75], curve: 6 },
  { type: 'zeroday', start: [-15, 127], end: [-6.2, 106.82], curve: 8 },
];
const colors = { all: '#38c7ec', ddos: '#ff7d91', ransomware: '#27e5d1', zeroday: '#c8a2ff' };
const nationalBounds: L.LatLngBoundsExpression = [[-11, 94], [9, 143]];

export default function CyberMap({ filter, setFilter, paused }: { filter: ThreatType; setFilter: (value: ThreatType) => void; paused: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const vectors = useRef<L.LayerGroup | null>(null);
  const [mode, setMode] = useState('cyber');
  const [expanded, setExpanded] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [coords, setCoords] = useState('02.50° S  ·  117.50° E');
  const [zoom, setZoom] = useState(4.5);
  useEffect(() => {
    if (!container.current) return;
    const map = L.map(container.current, { zoomControl: false, scrollWheelZoom: false, attributionControl: true, zoomSnap: 0.25, zoomDelta: 0.5, minZoom: 3, maxZoom: 15 }).setView([-2.5, 117.5], 4.5);
    mapRef.current = map;
    map.fitBounds(nationalBounds, { padding: [18, 24], maxZoom: 4.5, animate: false });
    map.attributionControl.setPrefix(false);
    L.imageOverlay('/images/indonesia-satellite.jpg', [[-15.241548373907845, 90], [20.23494561549811, 145]], { pane: 'tilePane', attribution: 'Imagery © Esri, Vantor, Earthstar Geographics, GIS User Community' }).addTo(map);
    const tiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, crossOrigin: true }).addTo(map);
    tiles.on('tileerror', () => setTileError(true));
    tiles.on('tileload', () => setTileError(false));
    for (let lat = -20; lat <= 25; lat += 5) L.polyline([[lat, 85], [lat, 150]], { color: '#56b7c9', weight: 0.6, opacity: 0.12, interactive: false }).addTo(map);
    for (let lng = 85; lng <= 150; lng += 5) L.polyline([[-20, lng], [25, lng]], { color: '#56b7c9', weight: 0.6, opacity: 0.12, interactive: false }).addTo(map);
    [450000, 900000, 1450000].forEach(radius => L.circle([-3, 114], { radius, color: '#36e1d5', weight: 0.8, opacity: 0.16, fill: false, interactive: false }).addTo(map));
    nodes.forEach(node => {
      const marker = L.marker(node.pos, { title: node.name, icon: L.divIcon({ className: 'cyber-marker', html: `<span class="node-ring" style="--node-color:${node.color}"><i></i></span><span class="node-label">${node.name}</span>`, iconSize: [18, 18], iconAnchor: [9, 9] }) }).addTo(map);
      marker.bindPopup(`<div class="node-popup"><small>NODE NASIONAL / SIMULASI</small><strong>${node.name}</strong><p>${node.status}</p><span>Latensi 1.4 ms · Koneksi aman</span></div>`, { closeButton: true });
    });
    [ { text: 'SUMATRA', pos: [-1, 100] }, { text: 'KALIMANTAN', pos: [1.5, 112.8] }, { text: 'SULAWESI', pos: [0, 123.1] }, { text: 'PAPUA', pos: [-4.8, 136] }, { text: 'JAWA', pos: [-9, 111] }, { text: 'MALAYSIA', pos: [5, 109] }, { text: 'LAUT JAWA', pos: [-4, 111] }, { text: 'SAMUDRA HINDIA', pos: [-11.5, 99] } ].forEach(label => L.marker(label.pos as [number, number], { interactive: false, icon: L.divIcon({ className: 'geo-label', html: label.text, iconSize: [110, 12], iconAnchor: [55, 6] }) }).addTo(map));
    vectors.current = L.layerGroup().addTo(map);
    map.on('mousemove', (e: L.LeafletMouseEvent) => setCoords(`${Math.abs(e.latlng.lat).toFixed(2)}° ${e.latlng.lat < 0 ? 'S' : 'N'}  ·  ${Math.abs(e.latlng.lng).toFixed(2)}° ${e.latlng.lng < 0 ? 'W' : 'E'}`));
    map.on('zoomend', () => setZoom(map.getZoom()));
    let previousWidth = container.current.clientWidth;
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      const width = container.current?.clientWidth ?? previousWidth;
      if (Math.abs(width - previousWidth) > 100) {
        map.fitBounds(nationalBounds, { padding: [18, 24], maxZoom: 4.5, animate: false });
        previousWidth = width;
      }
    });
    observer.observe(container.current);
    setZoom(map.getZoom());
    return () => { observer.disconnect(); map.remove(); mapRef.current = null; };
  }, []);
  useEffect(() => {
    const group = vectors.current;
    if (!group) return;
    group.clearLayers();
    attacks.filter(a => filter === 'all' || a.type === filter).forEach(a => {
      const points: [number, number][] = [];
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        points.push([a.start[0] * (1 - t) + a.end[0] * t + Math.sin(t * Math.PI) * a.curve, a.start[1] * (1 - t) + a.end[1] * t]);
      }
      L.polyline(points, { color: colors[a.type], opacity: 0.12, weight: 6, interactive: false }).addTo(group);
      L.polyline(points, { color: colors[a.type], opacity: 0.7, weight: 1.3, dashArray: '5 7', className: 'attack-line', interactive: false }).addTo(group);
      L.circleMarker(a.start, { radius: 3, color: colors[a.type], fillOpacity: 0.9, weight: 1 }).bindTooltip(`${a.type.toUpperCase()} · Vektor simulasi`).addTo(group);
    });
  }, [filter]);
  useEffect(() => {
    if (!expanded) return;
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpanded(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [expanded]);
  return <section className={`panel map-panel ${expanded ? 'map-expanded' : ''} ${paused ? 'paused' : ''}`} id="threat-map">
    <div className="section-heading map-heading"><div className="heading-label"><Globe size={19} /><div><h2>Peta Sebaran Serangan Siber</h2><p>RADAR SEKTOR STRATEGIS NASIONAL</p></div></div><span className="live-label"><i className="status-dot" />{paused ? 'DIJEDA' : 'REAL-TIME'}</span></div>
    <div className="map-toolbar"><div className="filter-group">{([['all','Semua'],['ddos','DDoS'],['ransomware','Ransomware'],['zeroday','Zero-Day']] as [ThreatType,string][]).map(([type, label]) => <button key={type} className={filter === type ? 'selected' : ''} onClick={() => setFilter(type)}>{type !== 'all' && <i style={{ background: colors[type] }} />}{label}{type === 'all' && <span>6</span>}</button>)}</div><span className="map-source"><Satellite size={13} /> ESRI WORLD IMAGERY</span></div>
    <div className={`map-canvas ${mode === 'cyber' ? 'cyber-mode' : 'satellite-mode'}`}>
      <div ref={container} className="leaflet-host" />
      <div className="map-vignette" />
      <div className="map-hud"><div><Radio size={12} /><span>SATELLITE UPLINK</span><i className="status-dot" /></div><strong>{tileError ? 'CITRA CADANGAN LOKAL' : 'KONEKSI TERHUBUNG'}</strong><p>RESOLUSI MULTI-SKALA · WGS 84</p></div>
      <div className="map-layers"><button className={mode === 'cyber' ? 'active' : ''} onClick={() => setMode('cyber')}><Layers size={13} /> Cyber</button><button className={mode === 'satellite' ? 'active' : ''} onClick={() => setMode('satellite')}><Satellite size={13} /> Satelit</button></div>
      <div className="compass"><span>N</span><Navigation size={25}/></div>
      <div className="map-controls"><button title="Perbesar peta" aria-label="Perbesar peta" onClick={() => mapRef.current?.zoomIn()}><Plus size={17} /></button><button title="Perkecil peta" aria-label="Perkecil peta" onClick={() => mapRef.current?.zoomOut()}><Minus size={17} /></button><span/><button title="Kembali ke Indonesia" aria-label="Kembali ke Indonesia" onClick={() => mapRef.current?.flyToBounds(nationalBounds, { padding: [18, 24], maxZoom: 4.5 })}><Crosshair size={17}/></button><button title={expanded ? 'Tutup layar penuh' : 'Layar penuh'} aria-label={expanded ? 'Tutup layar penuh' : 'Layar penuh'} onClick={() => setExpanded(!expanded)}>{expanded ? <Minimize size={16}/> : <Maximize size={16}/>}</button></div>
      <div className="map-coordinates"><Crosshair size={12}/><span>{coords}</span><b>ZOOM {zoom.toFixed(1)}×</b></div>
      <div className="map-legend"><span><i style={{background:colors.ddos}}/>DDoS</span><span><i style={{background:colors.ransomware}}/>Ransomware</span><span><i style={{background:colors.zeroday}}/>Zero-Day</span></div>
    </div>
    <div className="map-bottom"><span><i className="status-dot"/>48 NODE TERHUBUNG</span><span>6 VEKTOR <span className="muted">/</span> {attacks.filter(a => filter === 'all' || a.type === filter).length} DITAMPILKAN</span><span><Activity size={12}/> LATENSI <b>1.4 ms</b></span></div>
  </section>;
}
