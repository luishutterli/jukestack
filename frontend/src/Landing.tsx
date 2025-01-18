import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "./components/Header";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { Link } from "react-router";

function Landing() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollDownRef = useRef<HTMLDivElement>(null);
    const [canvasReady, setCanvasReady] = useState(false);

    const { scrollYProgress } = useScroll({
        target: scrollRef,
        offset: ["start end", "start center"],
    });

    const images = useMemo(() => {
        console.log("Loading images...");
        const loadImages: HTMLImageElement[] = [];

        for (let i = 1; i <= 80; i++) {
            const img = new Image();
            img.src = `/images/landingAnimation/${i}.webp`;
            loadImages.push(img);
        }

        return loadImages;
    }, []);

    const drawImage = useCallback((image: HTMLImageElement) => {
        if (!canvasRef.current || !containerRef.current) return false;

        const canvas = canvasRef.current;
        const container = containerRef.current;
        const context = canvas.getContext("2d");
        if (!context) return false;

        const dpi = window.devicePixelRatio;
        const rect = container.getBoundingClientRect();

        canvas.width = rect.width * dpi;
        canvas.height = rect.height * dpi;

        context.scale(dpi, dpi);

        try {
            context.clearRect(0, 0, rect.width, rect.height);
            context.drawImage(image, 0, 0, rect.width, rect.height);
            console.log("Drew image", {
                containerWidth: rect.width,
                containerHeight: rect.height,
                canvasWidth: canvas.width,
                canvasHeight: canvas.height,
            });
            return true;
        } catch (error) {
            console.error("Error drawing:", error);
            return false;
        }
    }, []);

    useEffect(() => {
        if (!images[0]) return;

        const handleResize = () => {
            drawImage(images[0]);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [images, drawImage]);

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        if (!images.length) return;

        if (!canvasReady) setCanvasReady(true);

        if (scrollDownRef.current) {
            scrollDownRef.current.classList.add("opacity-0");
        }

        const currentIndex = Math.round(latest * (images.length - 1));

        drawImage(images[currentIndex]);
    });

    return (
        <div>
            <Header sticky={true} />
            <div className="relative">
                <div ref={scrollDownRef} className="text-center font-bold text-lg">
                    ↓ Scrolle nach unten ↓
                </div>
                <div ref={containerRef} className="w-full sticky top-16" style={{ aspectRatio: "16/9" }}>
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
                    <img
                        src="/images/landingAnimation/1.webp"
                        alt=""
                        className="w-full h-full object-cover"
                        style={{
                            display: canvasReady ? "none" : "block",
                        }}
                    />
                </div>
                <div className="h-[600px] md:h-[400px] lg:h-[0px]" />
                <div ref={scrollRef} className="h-10 " />
            </div>
            <div className="py-16 px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-gray-800 mb-4">Willkommen bei JukeStack</h2>
                    <p className="text-lg text-gray-600 mb-8">
                        JukeStack ist eine moderne, schnelle und kostenlose NFT-Musikbibliothek, in der jedes Lied nur von einem Benutzer gleichzeitig ausgeliehen werden kann. Erleben Sie die Zukunft des Musikausleihens mit unserer hochmodernen Plattform.
                    </p>
                    <div className="flex justify-center space-x-4">
                        <Link
                            to="/app/login"
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition duration-300">
                            Jetzt starten
                        </Link>
                    </div>
                </div>
                <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <img
                            src="/images/speaker-phone.png"
                            alt="Placeholder"
                            className="w-full h-auto aspect-video object-cover rounded-t-lg rounded-b-md mb-4"
                        />
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Schnell und Modern</h3>
                        <p className="text-gray-600">
                            JukeStack ist mit der neuesten Technologie ausgestattet, um ein schnelles und modernes Erlebnis zu gewährleisten. Geniessen Sie nahtloses Musikausleihen mit unserer hochmodernen Plattform.
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <img
                            src="/images/free-music.png"
                            alt="Placeholder"
                            className="w-full h-auto aspect-video object-cover rounded-t-lg rounded-b-md mb-4"
                        />
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Kostenlos</h3>
                        <p className="text-gray-600">
                            Unsere Plattform ist völlig kostenlos. Leihen Sie Musik ohne Kosten. Treten Sie JukeStack bei und geniessen Sie Ihre Lieblingsmusik.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Landing;
