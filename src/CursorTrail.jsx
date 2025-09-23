import React, { useEffect, useRef } from 'react';

const CursorTrail = () => {
  const canvasRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const trail = useRef([]);
  const particles = useRef([]);
  const isPointer = useRef(false);
  const animationId = useRef(null);

  // --- ADJUSTMENTS ARE HERE ---
  const trailLength = 10;
  // 1. Increased speed for a more responsive trail
  const followSpeed = 0.4;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const initialPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    trail.current = Array(trailLength).fill().map(() => ({ ...initialPos }));

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      
      const element = document.elementFromPoint(e.clientX, e.clientY);
      if (element) {
        const cursor = window.getComputedStyle(element).cursor;
        const wasPointer = isPointer.current;
        const nowPointer = cursor === 'pointer';
        
        if (!wasPointer && nowPointer) {
          createExplosion(e.clientX, e.clientY);
        }
        
        isPointer.current = nowPointer;
      }
    };

    const createExplosion = (x, y) => {
      // 4. Doubled the number of particles in the blast (from 15 to 30)
      for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 * i) / 30; // Divisor must match particle count
        const velocity = 3 + Math.random() * 4;
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          life: 1,
          // 3. Decreased the size of the blast particles
          size: 2 + Math.random() * 2,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!isPointer.current) {
        trail.current.forEach((point, i) => {
          const leader = i === 0 ? mousePos.current : trail.current[i - 1];
          
          point.x += (leader.x - point.x) * followSpeed;
          point.y += (leader.y - point.y) * followSpeed;
          
          const size = 20 * (1 - i / trailLength);
          const opacity = 1 - i / trailLength;
          
          ctx.beginPath();
          ctx.arc(point.x, point.y, Math.max(0, size / 2), 0, Math.PI * 2);
          
          // 2. Changed color to a lighter blue (Periwinkle: #A7B3FF)
          // This is similar to your background but visible on it.
          ctx.fillStyle = `rgba(167, 179, 255, ${opacity})`;
          
          ctx.fill();
        });
      }

      particles.current = particles.current.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.02;
        particle.vx *= 0.98;
        particle.vy *= 0.98;

        if (particle.life > 0) {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
          // Also changing the explosion particle color to match
          ctx.fillStyle = `rgba(167, 179, 255, ${particle.life})`;
          ctx.fill();
          return true;
        }
        return false;
      });

      animationId.current = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
};

export default CursorTrail;