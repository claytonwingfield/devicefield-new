"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import ThreeGlobe from "three-globe";
import BusinessCategories from "@/components/business-categories";

export default function FeaturesPlanet() {
  const globeContainerRef = useRef<HTMLDivElement>(null);

  // Store references in refs inside the component
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeRef = useRef<any>(null); // three-globe object
  const animationIdRef = useRef<number | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    // ——————————————————————————
    // 1) SCENE + CAMERA
    // ——————————————————————————
    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    if (!globeContainerRef.current) return;

    // Clear any existing children to prevent duplication on re-mounts
    while (globeContainerRef.current.firstChild) {
      globeContainerRef.current.removeChild(
        globeContainerRef.current.firstChild,
      );
    }

    const width = globeContainerRef.current.clientWidth;
    const height = globeContainerRef.current.clientHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

    // FIX: Adjusted Z values to zoom in closer (Lower number = Bigger Globe)
    if (window.innerWidth < 768) {
      camera.position.z = 400; // Mobile: Closer
    } else {
      camera.position.z = 280; // Desktop: Closer
    }

    cameraRef.current = camera;

    // ——————————————————————————
    // 2) RENDERER
    // ——————————————————————————
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Fix: Ensure canvas is block level to prevent inline spacing issues
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.outline = "none";

    globeContainerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ——————————————————————————
    // 3) GLOBE
    // ——————————————————————————
    const globe = new ThreeGlobe()
      .globeImageUrl(
        "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
      )
      .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png");
    globeRef.current = globe;

    scene.add(globe);

    // ——————————————————————————
    // LIGHTING
    // ——————————————————————————
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(400, 200, 200);
    scene.add(directionalLight);

    // —————————————————————————————————————
    // ARCS Logic
    // —————————————————————————————————————
    function getRandomArcs(count = 5) {
      const colors = ["#ffeb3b"];
      return [...Array(count)].map(() => {
        const startLat = (Math.random() - 0.5) * 180;
        const startLng = (Math.random() - 0.5) * 360;
        const endLat = (Math.random() - 0.5) * 180;
        const endLng = (Math.random() - 0.5) * 360;
        const color = colors[Math.floor(Math.random() * colors.length)];
        return { startLat, startLng, endLat, endLng, color };
      });
    }

    function spawnArcs() {
      const arcs = getRandomArcs(5);
      globe
        .arcsData(arcs)
        .arcColor((arc: any) => arc.color)
        .arcAltitude(0.2)
        .arcStroke(0.7)
        .arcDashLength(0.3)
        .arcDashGap(1)
        .arcDashInitialGap(-1)
        .arcDashAnimateTime(5000);
    }

    spawnArcs();

    const clock = new THREE.Clock();
    function animate() {
      animationIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      globe.rotation.y += delta * 0.05;
      renderer.render(scene, camera);
    }
    animate();

    // ——————————————————————————
    // HANDLE RESIZE (ResizeObserver)
    // ——————————————————————————
    // This is the key fix for the "jumping" issue. It watches the container size
    // and updates the renderer immediately when the layout settles.
    const onResize = (entries: ResizeObserverEntry[]) => {
      if (!Array.isArray(entries) || !entries.length) return;

      const { contentRect } = entries[0];
      const newWidth = contentRect.width;
      const newHeight = contentRect.height;

      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = newWidth / newHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(newWidth, newHeight);

        // Re-check breakpoints on resize to adjust zoom level
        if (window.innerWidth < 768) {
          cameraRef.current.position.z = 250;
        } else {
          cameraRef.current.position.z = 280;
        }
      }
    };

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(globeContainerRef.current);
    resizeObserverRef.current = resizeObserver;

    // ——————————————————————————
    // CLEANUP
    // ——————————————————————————
    return () => {
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (renderer) renderer.dispose();

      // Cleanup DOM
      if (globeContainerRef.current) {
        // Remove all children to be safe
        while (globeContainerRef.current.firstChild) {
          globeContainerRef.current.removeChild(
            globeContainerRef.current.firstChild,
          );
        }
      }
    };
  }, []);

  return (
    <section
      id="services"
      className="relative before:absolute before:inset-0 before:-z-20 before:content-[''] before:bg-black z-40"
      data-aos="zoom-y-out"
      data-aos-delay={50}
    >
      <div className="mx-auto max-w-full px-4 sm:px-6">
        {/* Section header */}
        <div
          className="text-center "
          data-aos="zoom-y-out"
          data-aos-delay={200}
        >
          <span
            className="absolute mt-8 bg-gradient-to-r blur-xl from-white via-yellow-primary to-white bg-clip-text lg:text-5xl text-4xl font-extrabold text-transparent select-none"
            style={{
              transform: "perspective(1000px) rotateX(5deg)",
              display: "inline-block",
            }}
          >
            Your Vision <br />
            Delivered Worldwide
          </span>
          <h2
            className="block mt-8 bg-gradient-to-r from-white via-yellow-primary to-white bg-clip-text lg:text-5xl text-4xl font-extrabold text-transparent select-auto"
            style={{
              transform: "perspective(1000px) rotateX(5deg)",
              display: "inline-block",
            }}
          >
            Your Vision <br /> Delivered Worldwide
          </h2>
        </div>

        {/* Globe Container + Grid Wrapper */}
        <div className="relative">
          {/* Globe Container Wrapper */}
          {/* FIX: Added 'relative' here to act as the anchor for the absolute child */}
          <div
            className="relative flex items-center justify-center h-[300px] sm:h-[400px] md:h-[500px]"
            data-aos="zoom-y-out"
            data-aos-delay={300}
          >
            {/* FIX: Changed to absolute inset-0 to force perfect fit and ignore flex alignment issues */}
            <div
              ref={globeContainerRef}
              className="absolute inset-0 w-full h-full"
            />
          </div>

          {/* Grid Section... (Same as before) */}
          <div
            className="
    relative
    z-10
    mt-[-150px]         
    sm:mt-[-200px]       
    backdrop-blur-sm    
    bg-white/10         
    rounded-xl          
    p-4                  
  "
            data-aos="zoom-y-out"
            data-aos-delay={150}
          >
            <div
              className="
      grid 
      overflow-hidden
      sm:grid-cols-2 
      lg:grid-cols-3
      [&>*]:relative
      [&>*]:p-6
      [&>*]:before:absolute
      [&>*]:before:bg-gray-800
      [&>*]:before:[block-size:100vh]
      [&>*]:before:[inline-size:1px]
      [&>*]:before:[inset-block-start:0]
      [&>*]:before:[inset-inline-start:-1px]
      [&>*]:after:absolute
      [&>*]:after:bg-gray-800
      [&>*]:after:[block-size:1px]
      [&>*]:after:[inline-size:100vw]
      [&>*]:after:[inset-block-start:-1px]
      [&>*]:after:[inset-inline-start:0]
      md:[&>*]:p-10
    "
            >
              {/* Box 1: Website Development */}
              <Link
                href="/services/website-development"
                className="group block h-full"
              >
                <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-200">
                  <svg
                    width={16}
                    height={16}
                    xmlns="http://www.w3.org/2000/svg"
                    id="Html"
                    viewBox="0 0 48 48"
                  >
                    <g fill="#000000" className="color000000 svgShape">
                      <path
                        fill="#ffeb3b"
                        d="M24,47.5C11,47.5,0.5,37,0.5,24S11,0.5,24,0.5S47.5,11,47.5,24S37,47.5,24,47.5z M24,4.4   C13.2,4.4,4.4,13.2,4.4,24c0,10.8,8.8,19.6,19.6,19.6c10.8,0,19.6-8.8,19.6-19.6C43.6,13.2,34.8,4.4,24,4.4z"
                        className="color010101 svgShape"
                      ></path>
                      <g fill="#000000" className="color000000 svgShape">
                        <path
                          fill="#ffeb3b"
                          d="M29.2 33.2c-.5 0-1-.2-1.4-.6-.8-.8-.8-2 0-2.8l5.8-5.8-5.8-5.8c-.8-.8-.8-2 0-2.8.8-.8 2-.8 2.8 0l7.2 7.2c.8.8.8 2 0 2.8l-7.2 7.2C30.2 33 29.7 33.2 29.2 33.2zM18.8 33.2c-.5 0-1-.2-1.4-.6l-7.2-7.2c-.8-.8-.8-2 0-2.8l7.2-7.2c.8-.8 2-.8 2.8 0 .8.8.8 2 0 2.8L14.3 24l5.8 5.8c.8.8.8 2 0 2.8C19.8 33 19.3 33.2 18.8 33.2z"
                          className="color010101 svgShape"
                        ></path>
                      </g>
                    </g>
                  </svg>

                  <span>Website Development</span>
                </h3>
                <p className="mb-4 text-[15px] text-gray-400">
                  We create robust, visually appealing websites customized to
                  meet your unique business objectives. From initial design to
                  full-scale deployment, we guarantee flawless performance,
                  user-centric layouts, and adaptable solutions that enhance
                  user engagement and foster business expansion.
                </p>
                {/* Changed inner Link to span with group-hover logic */}
                <span className="inline-flex items-center text-sm font-medium text-yellow-primary group-hover:text-yellow-400 transition-colors">
                  Learn More
                  <svg
                    className="ml-1 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </Link>

              {/* Box 2: App Development */}
              <Link
                href="/services/app-development"
                className="group block h-full"
              >
                <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-200">
                  <svg
                    width={20}
                    height={20}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 200 200"
                    id="app"
                  >
                    <path
                      fill="#ffeb3b"
                      d="M81.19 42.0925v39h-39v-39h39m13-13h-65v65h65v-65zM157.6076 42.0925v39h-39v-39h39m13-13h-65v65h65v-65zM81.19 118.51v39h-39v-39h39m13-13h-65v65h65v-65zM157.6076 118.51v39h-39v-39h39m13-13h-65v65h65v-65z"
                      className="color050b1e svgShape"
                    ></path>
                  </svg>
                  <span>App Development</span>
                </h3>
                <p className="mb-4 text-[15px] text-gray-400">
                  We building high-performance, user-friendly mobile
                  applications tailored to your business needs. From concept to
                  deployment, we ensure seamless functionality, intuitive
                  interfaces, and scalable solutions that drive engagement and
                  growth.
                </p>
                <span className="inline-flex items-center text-sm font-medium text-yellow-primary group-hover:text-yellow-400 transition-colors">
                  Learn More
                  <svg
                    className="ml-1 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </Link>

              {/* Box 3: API Development */}
              <Link
                href="/services/api-development"
                className="group block h-full"
              >
                <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-200">
                  <svg
                    width={20}
                    height={20}
                    xmlns="http://www.w3.org/2000/svg"
                    enableBackground="new 0 0 64 64"
                    viewBox="0 0 64 64"
                    id="Api"
                  >
                    <path
                      d="M50.272,20.325c-0.222-5.283-4.548-9.512-9.835-9.512c-1.688,0-3.323,0.438-4.795,1.276C33.246,9.475,29.935,8,26.375,8
c-6.838,0-12.426,5.491-12.649,12.326C10.262,21.953,8,25.394,8,29.187c0,4.978,3.749,9.104,8.598,9.754
c0.079,0.795,0.229,1.605,0.453,2.443l-1.774,1.025c-0.672,0.388-0.903,1.248-0.515,1.921l2.813,4.871
c0.388,0.672,1.248,0.903,1.921,0.515l1.779-1.027c1.861,1.822,4.078,3.123,6.507,3.817v2.088c0,0.777,0.629,1.406,1.406,1.406
h5.625c0.777,0,1.406-0.629,1.406-1.406v-2.088c2.429-0.694,4.646-1.995,6.507-3.817l1.779,1.027
c0.672,0.388,1.533,0.158,1.921-0.515l2.812-4.871c0.388-0.673,0.158-1.533-0.515-1.921l-1.774-1.025
c0.224-0.837,0.374-1.647,0.453-2.443C52.25,38.291,56,34.165,56,29.187C56,25.394,53.737,21.952,50.272,20.325L50.272,20.325z
 M44.693,46.577l-1.519-0.876c-0.578-0.334-1.311-0.215-1.754,0.284c-1.871,2.106-4.253,3.504-6.889,4.041
c-0.655,0.133-1.125,0.709-1.125,1.378v1.784h-2.812v-1.784c0-0.668-0.47-1.245-1.125-1.378c-2.635-0.537-5.017-1.935-6.889-4.041
c-0.443-0.499-1.176-0.618-1.754-0.284l-1.518,0.876l-1.406-2.436l1.521-0.878c0.579-0.334,0.842-1.03,0.63-1.664
c-0.301-0.9-0.504-1.75-0.613-2.568h2.818c0.684,4.764,4.792,8.438,9.743,8.438c4.951,0,9.059-3.673,9.743-8.438h2.818
c-0.109,0.819-0.312,1.669-0.613,2.569c-0.212,0.634,0.052,1.33,0.63,1.664l1.521,0.878L44.693,46.577z M25.11,39.03H38.89
c-0.653,3.207-3.494,5.626-6.89,5.626C28.604,44.656,25.764,42.237,25.11,39.03L25.11,39.03z M46.062,36.219H17.938
c-3.929,0-7.125-3.154-7.125-7.031c0-2.947,1.939-5.602,4.826-6.608c0.587-0.205,0.97-0.77,0.943-1.39
c-0.006-0.145-0.025-0.271-0.038-0.362c-0.004-0.03-0.01-0.069-0.012-0.088c0.006-5.475,4.419-9.926,9.844-9.926
c3.105,0,5.971,1.452,7.862,3.983c0.224,0.3,0.559,0.499,0.93,0.551c0.371,0.053,0.748-0.045,1.046-0.272
c1.25-0.948,2.711-1.449,4.224-1.449c3.874,0,7.027,3.192,7.031,7.117c-0.002,0.02-0.008,0.066-0.013,0.1
c-0.012,0.087-0.027,0.196-0.035,0.324c-0.038,0.628,0.347,1.205,0.941,1.412c2.886,1.006,4.826,3.661,4.826,6.608
C53.188,33.064,49.991,36.219,46.062,36.219L46.062,36.219z"
                      fill="#ffeb3b"
                      className="color000000 svgShape"
                    ></path>
                  </svg>
                  <span>API Development</span>
                </h3>
                <p className="mb-4 text-[15px] text-gray-400">
                  We offer robust and scalable APIs that enable seamless
                  integration between your applications and third-party
                  services, ensuring efficient data exchange, enhanced
                  functionality, and secure communication channels.
                </p>
                <span className="inline-flex items-center text-sm font-medium text-yellow-primary group-hover:text-yellow-400 transition-colors">
                  Learn More
                  <svg
                    className="ml-1 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </Link>

              {/* Box 4: Instant Analytics */}
              <Link href="/services/analytics" className="group block h-full">
                <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-200">
                  <svg
                    className="fill-yellow-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    width={16}
                    height={16}
                  >
                    <path d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Zm2-4a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V4a4 4 0 0 0-4-4H4Zm1 10a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H5Z" />
                  </svg>
                  <span>Instant Analytics</span>
                </h3>
                <p className="mb-4 text-[15px] text-gray-400">
                  Collect essential insights about how visitors are using your
                  site with in-depth page view metrics like pages, referring
                  sites, and more.
                </p>
                <span className="inline-flex items-center text-sm font-medium text-yellow-primary group-hover:text-yellow-400 transition-colors">
                  Learn More
                  <svg
                    className="ml-1 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </Link>

              {/* Box 5: Metadata */}
              <Link href="/services/metadata" className="group block h-full">
                <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-200">
                  <svg
                    className="fill-yellow-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    width={16}
                    height={16}
                  >
                    <path d="M14.29 2.614a1 1 0 0 0-1.58-1.228L6.407 9.492l-3.199-3.2a1 1 0 1 0-1.414 1.415l4 4a1 1 0 0 0 1.496-.093l7-9ZM1 14a1 1 0 1 0 0 2h14a1 1 0 1 0 0-2H1Z" />
                  </svg>
                  <span>Metadata</span>
                </h3>
                <p className="mb-4 text-[15px] text-gray-400">
                  Collect essential insights about how visitors are using your
                  site with in-depth page view metrics like pages, referring
                  sites, and more.
                </p>
                <span className="inline-flex items-center text-sm font-medium text-yellow-primary group-hover:text-yellow-400 transition-colors">
                  Learn More
                  <svg
                    className="ml-1 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </Link>

              {/* Box 6: SEO & Performance */}
              <Link
                href="/services/seo-performance"
                className="group block h-full"
              >
                <h3 className="mb-2 flex items-center space-x-2 font-medium text-gray-200">
                  <svg
                    className="fill-yellow-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    width={16}
                    height={16}
                  >
                    <path
                      d="M2.248 6.285a1 1 0 0 1-1.916-.57A8.014 8.014 0 0 1 5.715.332a1 1 0 0 1 .57 1.916 6.014 6.014 0 0 0-4.037 4.037Z"
                      opacity=".3"
                    />
                    <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm0-2a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm1.715-6.752a1 1 0 0 1 .57-1.916 8.014 8.014 0 0 1 5.383 5.383 1 1 0 1 1-1.916.57 6.014 6.014 0 0 0-4.037-4.037Zm4.037 7.467a1 1 0 1 1 1.916.57 8.014 8.014 0 0 1-5.383 5.383 1 1 0 1 1-.57-1.916 6.014 6.014 0 0 0 4.037-4.037Zm-7.467 4.037a1 1 0 1 1-.57 1.916 8.014 8.014 0 0 1-5.383-5.383 1 1 0 1 1 1.916-.57 6.014 6.014 0 0 0 4.037 4.037Z" />
                  </svg>
                  <span>SEO &amp; Performance</span>
                </h3>
                <p className="mb-4 text-[15px] text-gray-400">
                  Collect essential insights about how visitors are using your
                  site with in-depth page view metrics like pages, referring
                  sites, and more.
                </p>
                <span className="inline-flex items-center text-sm font-medium text-yellow-primary group-hover:text-yellow-400 transition-colors">
                  Learn More
                  <svg
                    className="ml-1 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 mt-4 pb-6">
        <div
          className="relative overflow-hidden rounded-2xl text-center shadow-xl before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-2xl before:bg-black border border-yellow-primary"
          data-aos="zoom-y-out"
        >
          {/* Glow */}
          <div
            className="absolute bottom-0 left-1/2 -z-10 -translate-x-1/2 translate-y-1/2"
            aria-hidden="true"
          >
            <div className="h-56 w-[480px] rounded-full border-[20px] border-yellow-primary blur-3xl" />
          </div>
          {/* Stripes illustration */}

          <div className="px-4 py-12 md:px-12 md:py-20">
            <h2 className="mb-6  text-3xl font-bold text-gray-200  md:mb-12 md:text-4xl">
              Create your next project with us
            </h2>
            <div className="mx-auto max-w-xs sm:flex sm:max-w-none sm:justify-center">
              <Link
                className="btn group mb-4 w-full bg-gradient-to-t from-yellow-primary to-yellow-primary bg-[length:100%_100%] bg-[bottom] text-white shadow hover:bg-[length:100%_150%] sm:mb-0 sm:w-auto"
                href="/get-started"
              >
                <span className="relative inline-flex items-center text-black">
                  Get Started{" "}
                  <span className="ml-1 tracking-normal text-black transition-transform group-hover:translate-x-0.5">
                    -&gt;
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </div>
        <BusinessCategories />
      </div>
    </section>
  );
}
