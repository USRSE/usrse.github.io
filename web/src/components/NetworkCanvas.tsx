import { useEffect, useRef } from "react";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  pulse: number;
  pulseSpeed: number;
}

/**
 * Animated network graph canvas — represents the interconnected
 * US-RSE community. Nodes drift organically, connected by subtle
 * lines when within proximity. Colors use brand teal/purple.
 */
export function NetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);

    // Initialize nodes
    const nodeCount = Math.min(60, Math.floor(window.innerWidth / 20));
    const width = canvas.getBoundingClientRect().width;
    const height = canvas.getBoundingClientRect().height;

    nodesRef.current = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1.5,
      opacity: Math.random() * 0.5 + 0.3,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
    }));

    const connectionDistance = 140;
    const teal = { r: 24, g: 142, b: 172 }; // #188eac
    const purple = { r: 116, g: 23, b: 85 }; // #741755

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      const nodes = nodesRef.current;

      // Update positions
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        node.pulse += node.pulseSpeed;

        // Soft boundary bounce
        if (node.x < 0 || node.x > w) node.vx *= -1;
        if (node.y < 0 || node.y > h) node.vy *= -1;

        // Keep in bounds
        node.x = Math.max(0, Math.min(w, node.x));
        node.y = Math.max(0, Math.min(h, node.y));
      }

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.15;
            // Interpolate between teal and purple based on position
            const mix = (nodes[i].y / h + nodes[j].y / h) / 2;
            const r = Math.round(teal.r + (purple.r - teal.r) * mix);
            const g = Math.round(teal.g + (purple.g - teal.g) * mix);
            const b = Math.round(teal.b + (purple.b - teal.b) * mix);

            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const node of nodes) {
        const pulseRadius =
          node.radius + Math.sin(node.pulse) * 0.5;
        const mix = node.y / h;
        const r = Math.round(teal.r + (purple.r - teal.r) * mix);
        const g = Math.round(teal.g + (purple.g - teal.g) * mix);
        const b = Math.round(teal.b + (purple.b - teal.b) * mix);

        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${node.opacity})`;
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  );
}
