'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './Features.module.css';

// Import Matter.js types from the official type definitions
import { Engine, Render, Runner, Body, Bodies, Mouse, MouseConstraint, Events, Composite, IBodyDefinition } from 'matter-js';

// Define more specific interfaces for Matter.js functions missing in type definitions
interface RenderStatic {
  setPixelRatio: (render: Render, pixelRatio: number) => void;
  setSize: (render: Render, width: number, height: number) => void;
}

interface BodyRender {
  strokeStyle: string | CanvasGradient;
}

// Define a proper type for the bubble object
interface BubbleBody extends Body {
  id: number;
  feature: string;
  circleRadius: number;
}

// Define our extended render interface
interface ExtendedRender extends Render {
  render: (time?: number) => void;
}

// Define extended body definition to include our custom properties
interface ExtendedBodyDefinition extends IBodyDefinition {
  id?: number;
  feature?: string;
}

// Utility functions for Matter.js that are missing in TypeScript definitions
const MatterHelpers = {
  setPixelRatio: (render: Render, pixelRatio: number) => {
    // This function exists in Matter.js but is missing from type definitions
    ((Render as unknown) as RenderStatic).setPixelRatio(render, pixelRatio);
  },
  setSize: (render: Render, width: number, height: number) => {
    // This function exists in Matter.js but is missing from type definitions
    ((Render as unknown) as RenderStatic).setSize(render, width, height);
  }
};

const Features = () => {
  // Use more specific types for refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Feature bubbles for GradeGenius
  const features = [
    'Automated Assessment',
    'Customizable Rubrics',
    'Personalized Detailed Feedback',
    'Real-time Grading',
    'Multi-course Compatible',
    'Learning Analytics',
    'Plagiarism Detection',
    'Seamless Integrations',
    'Multi-platform Integration'
  ];

  // Default sizes for initial/server-side rendering
  const defaultSizes = [
    140, // Automated Assessment
    130, // Customizable Rubrics 
    160, // Detailed Feedback
    140, // Real-time Grading
    120, // Multi-course Compatible
    140, // Learning Analytics
    140, // Plagiarism Detection
    130, // Seamless Integrations
    130  // Multi-platform Integration
  ];
  
  // Initialize sizes state with default sizes
  const [sizes, setSizes] = useState(defaultSizes);
  
  // Configure sizes - create responsive sizes based on screen width
  const getResponsiveSizes = () => {
    // Only run this on the client side
    if (typeof window === 'undefined') {
      return defaultSizes;
    }
    
    const isSmallScreen = window.innerWidth <= 600;
    const isMediumScreen = window.innerWidth <= 900 && window.innerWidth > 600;
    
    // Size multiplier based on screen size
    const multiplier = isSmallScreen ? 0.65 : isMediumScreen ? 0.85 : 1;

    return [
      200 * multiplier, // Automated Assessment
      180 * multiplier, // Customizable Rubrics 
      220 * multiplier, // Detailed Feedback (reduced from 250 for better fit)
      190 * multiplier, // Real-time Grading
      150 * multiplier, // Multi-course Compatible
      200 * multiplier, // Learning Analytics
      190 * multiplier, // Plagiarism Detection
      180 * multiplier, // Seamless Integrations
      170 * multiplier  // Multi-platform Integration
    ];
  };
  
  // First useEffect - just to set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Second useEffect - update sizes when client is ready
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      setSizes(getResponsiveSizes());
      
      const handleResize = () => {
        setSizes(getResponsiveSizes());
      };
      
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isClient]);
  
  // Main physics initialization useEffect
  useEffect(() => {
    // Only run on client after component is mounted
    if (!isClient || typeof window === 'undefined') return;
    
    // Properly type Matter.js modules
    let engine: Engine;
    let render: ExtendedRender;
    let runner: Runner;
    const bubbles: BubbleBody[] = [];
    const timeouts: NodeJS.Timeout[] = [];
    
    // Define resize handler outside so it's in scope for cleanup
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current?.clientHeight || 550; // Match CSS height
      
      // Update render size
      if (render) {
        MatterHelpers.setPixelRatio(render, window.devicePixelRatio);
        MatterHelpers.setSize(render, containerWidth, containerHeight);
      }
    };
    
    // Update bubble elements
    const updateBubbleElements = () => {
      if (!bubbles || bubbles.length === 0) return;
      
      bubbles.forEach(bubble => {
        const element = document.getElementById(`bubble-${bubble.id}`);
        if (!element) return;
        
        // Set position based on Matter.js body
        element.style.transform = `translate(${bubble.position.x - bubble.circleRadius}px, ${bubble.position.y - bubble.circleRadius}px)`;
        
        // Make sure the bubble is visible once it's in the physics world
        element.style.opacity = '1';
      });
    };
    
    // Create a canvas gradient for our borders
    const createGradientCanvas = (ctx: CanvasRenderingContext2D, width: number) => {
      // Create a linear gradient similar to the hero section
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, '#0d263b');
      gradient.addColorStop(0.4, '#53adf0');
      gradient.addColorStop(0.7, '#a78bfa');
      gradient.addColorStop(1, '#a78bfa');
      return gradient;
    };
    
    // Define initial bubble positions to be well-distributed and robustly non-overlapping
    const getInitialPositions = (containerWidth: number) => {
      const wallThickness = Math.max(...sizes) / 2 + 10;
      const containerHeight = containerRef.current?.clientHeight || 550;
      
      interface PlacedBubble {
        x: number;
        y: number;
        radius: number;
      }
      
      const placed: PlacedBubble[] = [];
      const maxAttempts = 1000;
    
      return features.map((_, index) => {
        let radius = sizes[index] / 2;
        let x = 0;
        let y = 0;
        let attempts = 0;
        let overlapping = false;
    
        do {
          const minX = wallThickness + radius;
          const maxX = containerWidth - wallThickness - radius;
          const minY = wallThickness + radius;
          const maxY = containerHeight - wallThickness - radius;
    
          x = Math.random() * (maxX - minX) + minX;
          y = Math.random() * (maxY - minY) + minY;
    
          overlapping = placed.some(pos => {
            const dx = pos.x - x;
            const dy = pos.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            return dist < (pos.radius + radius + 12); // Add buffer
          });
    
          attempts++;
          if (attempts > maxAttempts && radius > 20) {
            radius -= 3; // Reduce radius slightly
            attempts = 0;
          }
        } while (overlapping && attempts < maxAttempts * 2);
    
        placed.push({ x, y, radius });
        return { x, y };
      });
    };
    
    
    // Load Matter.js and initialize physics
    const initPhysics = async () => {
      try {
        // Import Matter.js dynamically (not needed for types anymore, but still needed for runtime)
        await import('matter-js');
        
        if (!containerRef.current || !canvasRef.current) return;
        
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const maxBubbleRadius = Math.max(...sizes) / 2;
        
        // Create engine with more realistic gravity
        engine = Engine.create({
          gravity: { x: 0, y: 0.5 },  // Reduced gravity for mobile
          positionIterations: 6,
          velocityIterations: 4,
        });
        
        // Create renderer
        render = Render.create({
          canvas: canvasRef.current,
          engine: engine,
          options: {
            width: containerWidth,
            height: containerHeight,
            wireframes: false,
            background: 'transparent',
            pixelRatio: window.devicePixelRatio
          }
        }) as ExtendedRender;
        
        // Custom render function to keep canvas clean
        const originalRender = render.render;
        render.render = function(time?: number) {
          const ctx = render.context;
          // Ensure width and height are defined
          const width = render.options.width || containerWidth;
          const height = render.options.height || containerHeight;
          ctx.clearRect(0, 0, width, height);
          originalRender.call(this, time);
        };
        
        // Create runner
        runner = Runner.create();
        
        // Create walls (inset by maxBubbleRadius)
        const wallThickness = maxBubbleRadius + 10;
        const left = wallThickness / 2;
        const right = containerWidth - wallThickness / 2;
        const top = wallThickness / 2;
        const bottom = containerHeight - wallThickness / 2;
        const walls = [
          // Bottom wall
          Bodies.rectangle(
            containerWidth / 2, 
            bottom + wallThickness / 2, 
            containerWidth - wallThickness, 
            wallThickness, 
            { isStatic: true, render: { visible: false }, friction: 0.5 }
          ),
          // Top wall (to prevent tossing out)
          Bodies.rectangle(
            containerWidth / 2, 
            top - wallThickness / 2, 
            containerWidth - wallThickness, 
            wallThickness, 
            { isStatic: true, render: { visible: false } }
          ),
          // Left wall
          Bodies.rectangle(
            left - wallThickness / 2, 
            containerHeight / 2, 
            wallThickness, 
            containerHeight - wallThickness, 
            { isStatic: true, render: { visible: false } }
          ),
          // Right wall
          Bodies.rectangle(
            right + wallThickness / 2, 
            containerHeight / 2, 
            wallThickness, 
            containerHeight - wallThickness, 
            { isStatic: true, render: { visible: false } }
          )
        ];
        
        Composite.add(engine.world, walls);
        
        // Add MouseConstraint for interactivity
        const mouse = Mouse.create(render.canvas);
        const mouseConstraint = MouseConstraint.create(engine, {
          mouse: mouse,
          constraint: {
            stiffness: 0.2,
            render: { visible: false }
          }
        });

        // Properly type the wheel handler to avoid 'any'
        interface MouseWithWheel extends Mouse {
          mousewheel?: EventListener;
        }
        
        interface MouseConstraintWithWheel extends MouseConstraint {
          mouse: MouseWithWheel;
        }
        
        const typedMouse = mouse as MouseWithWheel;
        const typedConstraint = mouseConstraint as MouseConstraintWithWheel;
        const wheelHandler = typedMouse.mousewheel || typedConstraint.mouse.mousewheel;

        ['wheel', 'mousewheel', 'DOMMouseScroll'].forEach(type => {
          mouse.element.removeEventListener(type, wheelHandler as EventListener);
        });

        Composite.add(engine.world, mouseConstraint);
        render.mouse = mouse;
        
        // Get context for gradient
        const ctx = render.context;
        const gradient = createGradientCanvas(ctx, containerWidth);
        
        // Get initial well-distributed positions
        const initialPositions = getInitialPositions(containerWidth);
        
        // Create bubbles but don't add them to the world yet
        const createdBubbles = features.map((feature, index) => {
          const radius = sizes[index] / 2;
          // Clamp X and Y so bubbles always spawn fully inside the container
          const minX = wallThickness + radius;
          const maxX = containerWidth - wallThickness - radius;
          let { x, y } = initialPositions[index];
          x = Math.max(minX, Math.min(maxX, x));
          const minY = wallThickness + radius;
          const maxY = containerHeight - wallThickness - radius;
          y = Math.max(minY, Math.min(maxY, y));
          
          // Create the body definition with our custom properties
          const bodyDef: ExtendedBodyDefinition = {
            restitution: 0.2, // Less bouncy
            friction: 0.1,    // More friction
            frictionAir: 0.03, // More air resistance
            density: 0.002,    // Slightly heavier
            id: index,
            feature: feature,
            render: {
              fillStyle: 'transparent',
              strokeStyle: '#53adf0', // Fallback color
              lineWidth: 2
            }
          };
          
          // Create circle body with more realistic physics
          const bubble = Bodies.circle(x, y, radius, bodyDef) as BubbleBody;
          
          // Set the strokeStyle directly with the gradient
          if (bubble.render) {
            // Use type assertion with a specific interface to get around TypeScript's type checking
            // At runtime, this will work fine with CanvasGradient
            ((bubble.render as unknown) as BodyRender).strokeStyle = gradient;
          }
          
          // Add the circle radius property
          bubble.circleRadius = radius;
          
          // Add a small random initial velocity for realism (smaller value)
          Body.setVelocity(bubble, {
            x: (Math.random() - 0.5) * 0.5,
            y: Math.random() * 0.8
          });
          return bubble;
        });
        
        // Run the engine and renderer
        Render.run(render);
        Runner.run(runner, engine);
        
        // Update positions on each tick
        Events.on(engine, 'afterUpdate', updateBubbleElements);
        
        // Add resize listener
        window.addEventListener('resize', handleResize);
        
        // Add bubbles one at a time with delay
        createdBubbles.forEach((bubble, index) => {
          const delay = 300 * (index + 1); // 300ms between each bubble
          const timeout = setTimeout(() => {
            Composite.add(engine.world, bubble);
            bubbles.push(bubble);
          }, delay);
          timeouts.push(timeout);
        });
        
      } catch (error) {
        console.error("Failed to initialize physics:", error);
      }
    };
    
    // Start the physics initialization
    initPhysics();
    
    // Cleanup function - this will run when component unmounts
    return () => {
      // Clear all timeouts
      timeouts.forEach(timeout => clearTimeout(timeout));
      
      // Remove resize listener
      window.removeEventListener('resize', handleResize);
      
      // Clean up Matter.js resources if they exist
      if (engine) {
        try {
          // Remove event listeners
          Events.off(engine, 'afterUpdate', updateBubbleElements);
          
          // Stop renderer and runner
          if (render) Render.stop(render);
          if (runner) Runner.stop(runner);
          
          // Clear the engine
          Engine.clear(engine);
        } catch (error) {
          console.error("Error during cleanup:", error);
        }
      }
    };
  }, [isClient, features, sizes]); // Include all dependencies
  
  // Render the component - conditionally render content based on client-side state
  return (
    <div id="features" className={styles.verticalLayout}>
      {/* Title/Sub for Bubble Section */}
      <div className={styles.bubbleTitleSection}>
        <h5 className={styles.subtitle}>Tons of Features</h5>
        <h2 className={styles.title}>Make Your Grading Effortless</h2>
      </div>

      {/* Physics Bubbles - Only render the interactive part on client-side */}
      <div ref={containerRef} className={styles.physicsContainer}>
        {isClient ? (
          <>
            <canvas ref={canvasRef} className={styles.physicsCanvas} />
            <div className={styles.bubblesLayer}>
              {features.map((feature, index) => (
                <div
                  key={index}
                  id={`bubble-${index}`}
                  className={`${styles.bubble} features-font`}
                  style={{
                    width: sizes[index],
                    height: sizes[index],
                    transform: `translate(0px, -${sizes[index] + 50}px)`,
                    opacity: 0,
                    transition: 'opacity 0.4s ease-in-out',
                  }}
                >
                  <div className={styles.bubbleContent}>{feature}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          // Simple static placeholder during server-side rendering
          <div className={styles.staticPlaceholder}>
            <p>Loading features visualization...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Features;