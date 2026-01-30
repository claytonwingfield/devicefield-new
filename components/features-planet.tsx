"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import {
  ChevronsLeftRight,
  GalleryThumbnails,
  Route,
  ChartLine,
  FlaskConical, // 'FlaskIcon' is usually exported as FlaskConical in Lucide
  FileText,
} from "lucide-react";
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import ThreeGlobe from "three-globe";
import BusinessCategories from "@/components/business-categories";

// ——————————————————————————————————————————————————————————————————————————
// SCROLL REVEAL HELPER COMPONENTS
// ——————————————————————————————————————————————————————————————————————————
const starData = [
  // --- LARGE STARS (Close/Bright) ---
  { cx: "10%", cy: "80%", r: 2.5, o: 1, d: "3s" },
  { cx: "35%", cy: "85%", r: 2.2, o: 0.9, d: "4s" },
  { cx: "65%", cy: "55%", r: 2.5, o: 1, d: "5s" },
  { cx: "75%", cy: "92%", r: 2.0, o: 0.8, d: "2s" },
  { cx: "90%", cy: "65%", r: 2.3, o: 0.9, d: "3.5s" },
  { cx: "5%", cy: "95%", r: 2.0, o: 0.8, d: "4.5s" },
  { cx: "48%", cy: "62%", r: 2.1, o: 1, d: "3s" },

  // --- MEDIUM STARS (Mid-distance) ---
  { cx: "20%", cy: "60%", r: 1.5, o: 0.7, d: "0s" }, // Static
  { cx: "50%", cy: "75%", r: 1.4, o: 0.6, d: "0s" }, // Static
  { cx: "80%", cy: "85%", r: 1.6, o: 0.7, d: "6s" },
  { cx: "15%", cy: "90%", r: 1.5, o: 0.6, d: "0s" },
  { cx: "45%", cy: "95%", r: 1.4, o: 0.7, d: "0s" },
  { cx: "95%", cy: "75%", r: 1.5, o: 0.7, d: "4s" },
  { cx: "25%", cy: "65%", r: 1.3, o: 0.6, d: "0s" },
  { cx: "60%", cy: "88%", r: 1.5, o: 0.8, d: "5s" },

  // --- SMALL STARS (Far away / Dust) ---
  { cx: "5%", cy: "70%", r: 0.8, o: 0.4, d: "0s" },
  { cx: "25%", cy: "50%", r: 0.6, o: 0.3, d: "0s" },
  { cx: "55%", cy: "60%", r: 0.7, o: 0.4, d: "0s" },
  { cx: "85%", cy: "55%", r: 0.8, o: 0.3, d: "0s" },
  { cx: "30%", cy: "95%", r: 0.7, o: 0.4, d: "0s" },
  { cx: "40%", cy: "55%", r: 0.6, o: 0.3, d: "0s" },
  { cx: "70%", cy: "70%", r: 0.9, o: 0.5, d: "0s" },
  { cx: "92%", cy: "90%", r: 0.7, o: 0.4, d: "0s" },
  { cx: "12%", cy: "55%", r: 0.8, o: 0.4, d: "0s" },
  { cx: "38%", cy: "75%", r: 0.6, o: 0.3, d: "0s" },
  { cx: "58%", cy: "52%", r: 0.7, o: 0.4, d: "0s" },
  { cx: "82%", cy: "62%", r: 0.8, o: 0.3, d: "0s" },
];
const ScrollRevealSpan = ({
  children,
  progress,
  range,
  className,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  className?: string;
}) => {
  // Opacity: Starts at 0.1 (Gray/Faded) and goes to 1 (Solid White/Black)
  const opacity = useTransform(progress, range, [0.1, 1]);
  // Blur: Adds a subtle blur to the unread text for extra depth
  const filter = useTransform(progress, range, ["blur(1px)", "blur(0px)"]);

  return (
    <motion.span
      style={{ opacity, filter }}
      className={`inline-block mr-[0.25em] transition-colors duration-200 ${className}`}
    >
      {children}
    </motion.span>
  );
};

const ScrollRevealParagraph = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  const element = useRef(null);
  const { scrollYProgress } = useScroll({
    target: element,
    // Start revealing when the top of the text hits 90% of the viewport height
    // Finish revealing when it hits 50% (center)
    offset: ["start 0.9", "start 0.5"],
  });

  const words = text.split(" ");

  return (
    <p ref={element} className={`flex flex-wrap justify-center ${className}`}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        return (
          <ScrollRevealSpan
            key={i}
            range={[start, end]}
            progress={scrollYProgress}
          >
            {word}
          </ScrollRevealSpan>
        );
      })}
    </p>
  );
};

// ——————————————————————————————————————————————————————————————————————————
// MAIN COMPONENT
// ——————————————————————————————————————————————————————————————————————————

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

    // Change FOV from 35 to 45 (Wider lens effect helps on mobile)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 4000); // Increased Far plane to 4000 to see distant stars

    // LOGIC UPDATE:
    if (window.innerWidth < 768) {
      camera.position.z = 180; // Mobile: MUCH closer (was 280)
    } else {
      camera.position.z = 280; // Desktop: Standard
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
    // 4) STARFIELD (Added Here)
    // ——————————————————————————
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 3.2,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true, // Makes distant stars smaller
    });

    const starVertices = [];
    for (let i = 0; i < 4000; i++) {
      const x = (Math.random() - 0.5) * 3000; // Large spread
      const y = (Math.random() - 0.5) * 3000;
      const z = (Math.random() - 0.5) * 3000;
      starVertices.push(x, y, z);
    }

    starGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starVertices, 3),
    );

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

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

      // Rotate Globe
      globe.rotation.y += delta * 0.05;

      // Rotate Stars (Added Here)
      // We rotate slower and in reverse to create depth/parallax
      // stars.rotation.y -= delta * 0.02;
      // stars.rotation.x += delta * 0.005;

      renderer.render(scene, camera);
    }
    animate();

    // ——————————————————————————
    // HANDLE RESIZE (ResizeObserver)
    // ——————————————————————————
    const onResize = (entries: ResizeObserverEntry[]) => {
      if (!Array.isArray(entries) || !entries.length) return;

      const { contentRect } = entries[0];
      const newWidth = contentRect.width;
      const newHeight = contentRect.height;

      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = newWidth / newHeight;

        // DYNAMIC ZOOM LOGIC:
        if (newWidth < 768) {
          // Mobile: Move camera closer to fill the narrow screen
          cameraRef.current.position.z = 330;
        } else {
          // Desktop: Move camera back
          cameraRef.current.position.z = 280;
        }

        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(newWidth, newHeight);
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
    >
      <div className="mx-auto max-w-full px-4 sm:px-6">
        {/* --- NEW WRAPPER START --- 
          This 'relative isolate' div holds the stars and text together.
          Added some padding/margin to give the stars space to breathe.
      */}
        <div className="relative isolate mb-0 pt-0">
          {/* 1. STAR BACKGROUND LAYER 
            (Pasted your code here. Note: ensure 'starData' is defined in your component) 
        */}
          <div className="absolute top-0 left-0 right-0 h-full w-full overflow-hidden -z-10 opacity-90 pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="star-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="white" stopOpacity="1" />
                  <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                </radialGradient>
              </defs>

              {starData.map((star, i) => (
                <circle
                  key={i}
                  cx={star.cx}
                  cy={star.cy}
                  r={star.r}
                  fill="white"
                  fillOpacity={star.o}
                  className={star.d !== "0s" ? "animate-pulse" : ""}
                  style={{
                    animationDuration: star.d,
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </svg>
          </div>

          {/* 2. TEXT CONTENT LAYER
            Added 'relative z-10' to ensure text sits ON TOP of stars.
        */}
          <motion.div
            className="relative z-10 text-center"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-150px" }}
            transition={{ duration: 1, ease: "easeOut" }}
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
          </motion.div>
        </div>

        {/* Globe Container + Grid Wrapper */}
        <div className="relative">
          {/* Globe Container Wrapper */}
          <div
            // Update: Increased mobile height to h-[450px]
            className="relative flex items-center justify-center h-[450px] sm:h-[450px] md:h-[500px]"
            data-aos="zoom-y-out"
            data-aos-delay={300}
          >
            <div
              ref={globeContainerRef}
              className="absolute inset-0 w-full h-full"
            />
          </div>

          {/* Grid Section */}
          <div
            className="
              relative
              z-10
              mt-[-80px]         
              sm:mt-[-200px]       
              backdrop-blur-sm    
              bg-white/10         
              rounded-xl          
              p-4                  
            "
            // Note: Changed mobile margin from -150px to -80px above
            // This reveals more of the globe's bottom curve on mobile
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
                  {/* ICON: ChevronsLeftRight */}
                  <ChevronsLeftRight
                    size={24}
                    className="text-yellow-primary"
                  />
                  <span>Website Development</span>
                </h3>
                <p className="mb-4 text-[15px] text-gray-400">
                  We create robust, visually appealing websites customized to
                  meet your unique business objectives.
                </p>
                <span className="inline-flex items-center text-sm font-medium text-yellow-primary  transition-colors">
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
                  {/* ICON: GalleryThumbnails */}
                  <GalleryThumbnails
                    size={24}
                    className="text-yellow-primary"
                  />
                  <span>App Development</span>
                </h3>
                <p className="mb-4 text-[15px] text-gray-400">
                  We building high-performance, user-friendly mobile
                  applications tailored to your business needs.
                </p>
                <span className="inline-flex items-center text-sm font-medium text-yellow-primary  transition-colors">
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
                  {/* ICON: Route */}
                  <Route size={24} className="text-yellow-primary" />
                  <span>API Development</span>
                </h3>
                <p className="mb-4 text-[15px] text-gray-400">
                  We offer robust and scalable APIs that enable seamless
                  integration between your applications and third-party
                  services.
                </p>
                <span className="inline-flex items-center text-sm font-medium text-yellow-primary  transition-colors">
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
                  {/* ICON: ChartLine */}
                  <ChartLine size={24} className="text-yellow-primary" />
                  <span>Instant Analytics</span>
                </h3>
                <p className="mb-4 text-[15px] text-gray-400">
                  Collect essential insights about how visitors are using your
                  site with in-depth page view metrics.
                </p>
                <span className="inline-flex items-center text-sm font-medium text-yellow-primary  transition-colors">
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
                  {/* ICON: Flask (FlaskConical) */}
                  <FlaskConical size={24} className="text-yellow-primary" />
                  <span>Metadata</span>
                </h3>
                <p className="mb-4 text-[15px] text-gray-400">
                  Optimize your content delivery with structured metadata
                  solutions.
                </p>
                <span className="inline-flex items-center text-sm font-medium text-yellow-primary  transition-colors">
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
                  {/* ICON: FileText */}
                  <FileText size={24} className="text-yellow-primary" />
                  <span>SEO &amp; Performance</span>
                </h3>
                <p className="mb-4 text-[15px] text-gray-400">
                  Enhance your site speed and search engine rankings with our
                  optimizations.
                </p>
                <span className="inline-flex items-center text-sm font-medium text-yellow-primary  transition-colors">
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

      {/* NEW SCROLL REVEAL SECTION */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 mt-16 pb-24 text-center">
        {/* Paragraph 1 - Updated for Tech/Evaluations */}
        <ScrollRevealParagraph
          className="text-2xl md:text-5xl font-semibold text-white leading-relaxed mb-16 max-w-5xl mx-auto"
          text="Your users don’t just visit. They validate. In seconds, they demand clarity, performance, and proof of scale. Anything less is a loss."
        />

        {/* Paragraph 2 - Updated for Authority/Building */}
        <ScrollRevealParagraph
          className="text-2xl md:text-5xl font-semibold text-white leading-relaxed max-w-5xl mx-auto"
          text="We engineer digital dominance. A sharper message. A robust architecture. A conversion-first platform that commands authority globally."
        />

        {/* Call to Action Button */}
        <div className="mt-16 flex justify-center">
          <Link
            className="btn group mb-4 w-full bg-gradient-to-t from-yellow-primary to-yellow-primary bg-[length:100%_100%] bg-[bottom] text-white shadow hover:bg-[length:100%_150%] sm:mb-0 sm:w-auto px-10 py-4 rounded-lg font-bold text-lg"
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

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-6">
        <BusinessCategories />
      </div>
    </section>
  );
}
