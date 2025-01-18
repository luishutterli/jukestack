import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Header from "./components/Header";
import { useMotionValueEvent, useScroll } from "framer-motion";

function Landing() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canvasReady, setCanvasReady] = useState(false);

    const { scrollYProgress } = useScroll({
        target: scrollRef,
        offset: ["start end", "end start"],
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

        const currentIndex = Math.round(latest * (images.length - 1));

        drawImage(images[currentIndex]);
    });

    return (
        <div>
            <Header sticky={true} />
            <div className="h-[5000px] relative">
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
                <div className="h-[600px] lg:h-[400px]" />
                <div ref={scrollRef} className="h-10" />
            </div>
        </div>
    );
}

export default Landing;
