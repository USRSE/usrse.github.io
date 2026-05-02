import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useInView } from "@/hooks/useInView";

/**
 * Full-bleed interactive map — a cinematic section that breaks the page grid.
 * Toggle between US view and International view.
 *
 * Empty by design — data points will be added in a future iteration.
 */

const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

// View presets
const VIEWS = {
  us: { center: [-98.5, 39.5] as [number, number], zoom: 3.8, zoomMobile: 2.8 },
  international: { center: [-20, 20] as [number, number], zoom: 1.5, zoomMobile: 0.8 },
};

export function CommunityMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const { ref: sectionRef, isInView } = useInView(0.1);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeView, setActiveView] = useState<"us" | "international">("us");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const isMobile = window.innerWidth < 768;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DARK_STYLE,
      center: VIEWS.us.center,
      zoom: isMobile ? VIEWS.us.zoomMobile : VIEWS.us.zoom,
      minZoom: 0.5,
      maxZoom: 10,
      attributionControl: false,
      scrollZoom: false,
      dragPan: true,
      pitchWithRotate: false,
      dragRotate: false,
      renderWorldCopies: false,
    });

    map.on("load", () => {
      setMapLoaded(true);
    });

    // Zoom controls
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right"
    );

    // Custom 1:1 reset button
    class ResetControl implements maplibregl.IControl {
      _container?: HTMLDivElement;
      onAdd() {
        this._container = document.createElement("div");
        this._container.className = "maplibregl-ctrl maplibregl-ctrl-group";
        const button = document.createElement("button");
        button.type = "button";
        button.title = "Reset view";
        button.setAttribute("aria-label", "Reset view");
        button.innerHTML = `<span style="font-size:11px;font-weight:700;font-family:monospace;color:rgba(255,255,255,0.6);display:block;text-align:center;line-height:32px">1:1</span>`;
        button.addEventListener("click", () => {
          const isMob = window.innerWidth < 768;
          const view = VIEWS.us;
          map.flyTo({
            center: view.center,
            zoom: isMob ? view.zoomMobile : view.zoom,
            duration: 1200,
          });
        });
        this._container.appendChild(button);
        return this._container;
      }
      onRemove() {
        this._container?.remove();
      }
    }

    map.addControl(new ResetControl(), "bottom-right");

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Fly to view when toggle changes
  const switchView = (view: "us" | "international") => {
    setActiveView(view);
    const map = mapRef.current;
    if (!map) return;

    const isMobile = window.innerWidth < 768;
    const preset = VIEWS[view];
    map.flyTo({
      center: preset.center,
      zoom: isMobile ? preset.zoomMobile : preset.zoom,
      duration: 1400,
    });
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-neutral-950"
      style={{ height: "min(70vh, 640px)" }}
    >
      {/* Map container */}
      <div
        ref={containerRef}
        className={`absolute inset-0 transition-opacity duration-1000 ${
          mapLoaded && isInView ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Top fade */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-neutral-950 to-transparent z-10 pointer-events-none" />

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-neutral-950 to-transparent z-10 pointer-events-none" />

      {/* Toggle — US / International */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30">
        <div
          className={`flex items-center bg-black/40 backdrop-blur-md border border-white/10 rounded-full p-1 transition-opacity duration-500 ${
            mapLoaded && isInView ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDelay: "600ms" }}
          role="tablist"
          aria-label="Map view scope"
        >
          <button
            role="tab"
            aria-selected={activeView === "us"}
            onClick={() => switchView("us")}
            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
              activeView === "us"
                ? "bg-white/15 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            US
          </button>
          <button
            role="tab"
            aria-selected={activeView === "international"}
            onClick={() => switchView("international")}
            className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
              activeView === "international"
                ? "bg-white/15 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            International
          </button>
        </div>
      </div>

      {/* Overlay content — typographic statement */}
      <div className="absolute inset-0 z-20 flex items-end pointer-events-none">
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-10 pb-12 lg:pb-16">
          <div
            className={`transition-all duration-700 ${
              mapLoaded && isInView
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: "400ms" }}
          >
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-teal-400/70 mb-3">
              {activeView === "us"
                ? "Our Community Across the US"
                : "Global Research Software Impact"}
            </p>
            <h2 className="font-display text-3xl lg:text-5xl font-bold text-white/90 tracking-tight leading-tight max-w-lg">
              {activeView === "us" ? (
                <>
                  190+ institutions.
                  <br />
                  <span className="text-white/40">One mission.</span>
                </>
              ) : (
                <>
                  Worldwide reach.
                  <br />
                  <span className="text-white/40">Local impact.</span>
                </>
              )}
            </h2>
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div
          className={`flex flex-col items-center gap-1 transition-opacity duration-500 ${
            mapLoaded && isInView ? "opacity-40" : "opacity-0"
          }`}
          style={{ transitionDelay: "800ms" }}
        >
          <span className="text-[10px] font-mono text-white/30 tracking-wider">
            scroll
          </span>
          <svg className="w-3 h-3 text-white/20 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M19 14l-7 7m0 0l-7-7" />
          </svg>
        </div>
      </div>
    </section>
  );
}
