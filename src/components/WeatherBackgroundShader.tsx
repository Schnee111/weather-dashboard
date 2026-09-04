import React, { useEffect, useRef } from 'react';

interface WeatherBackgroundShaderProps {
  currentBgUrl: string;
  previousBgUrl?: string;
  isTransitioning: boolean;
  transitionProgress: number; // 0.0 to 1.0
  weatherType: string;
  isRaining?: boolean;
}

const VERTEX_SHADER_SRC = `#version 300 es
in vec2 position;
out vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uTexCurrent;
uniform sampler2D uTexPrevious;
uniform float uProgress; // 0.0 to 1.0
uniform float uTime;
uniform int uIsTransitioning;
uniform float uAspect;

// Simplex 2D noise generator for atmospheric cloud morphing
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = vUv;
  
  // Subtle atmospheric breathing / Ken Burns drift
  float drift = sin(uTime * 0.08) * 0.012;
  vec2 uvDrift = (uv - 0.5) * (1.0 + drift) + 0.5;

  if (uIsTransitioning == 0) {
    fragColor = texture(uTexCurrent, uvDrift);
    return;
  }

  // Smooth Cloud/Fluid Displacement Transition
  float p = clamp(uProgress, 0.0, 1.0);
  // Ease curve (cubic-bezier approximation)
  float ep = p * p * (3.0 - 2.0 * p);

  // Generate multi-octave noise displacement
  float n1 = snoise(uv * 3.5 + vec2(uTime * 0.05, uTime * 0.02));
  float n2 = snoise(uv * 7.0 - vec2(uTime * 0.03, uTime * 0.06));
  float noise = n1 * 0.7 + n2 * 0.3;

  // Displacement vectors
  vec2 dispFrom = uvDrift + vec2(noise * 0.08 * ep, noise * 0.05 * ep);
  vec2 dispTo   = uvDrift - vec2(noise * 0.08 * (1.0 - ep), noise * 0.05 * (1.0 - ep));

  vec4 colFrom = texture(uTexPrevious, dispFrom);
  vec4 colTo   = texture(uTexCurrent, dispTo);

  // Luma-guided soft blend
  float lumaFrom = dot(colFrom.rgb, vec3(0.299, 0.587, 0.114));
  float blendFactor = smoothstep(0.0, 1.0, (ep - lumaFrom * 0.2 + noise * 0.15));

  fragColor = mix(colFrom, colTo, blendFactor);
}
`;

export const WeatherBackgroundShader: React.FC<WeatherBackgroundShaderProps> = ({
  currentBgUrl,
  previousBgUrl,
  isTransitioning,
  transitionProgress,
  isRaining = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const texCurrentRef = useRef<WebGLTexture | null>(null);
  const texPreviousRef = useRef<WebGLTexture | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(performance.now());

  // Texture loader helper
  const loadTexture = (gl: WebGL2RenderingContext, url: string, callback: (tex: WebGLTexture) => void) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      if (tex) callback(tex);
    };
    img.src = url;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { alpha: false, antialias: true });
    if (!gl) {
      console.warn('WebGL2 not supported, falling back to CSS background');
      return;
    }
    glRef.current = gl;

    // Compile shaders
    const createShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Shader error:', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vert = createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const frag = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vert || !frag) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(prog));
      return;
    }
    programRef.current = prog;

    // Quad geometry (2 triangles covering clip space)
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const posAttr = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    // Initial textures
    loadTexture(gl, currentBgUrl, (tex) => {
      texCurrentRef.current = tex;
    });

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Update current texture when url changes
  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;
    loadTexture(gl, currentBgUrl, (tex) => {
      texCurrentRef.current = tex;
    });
  }, [currentBgUrl]);

  // Update previous texture when transitioning
  useEffect(() => {
    const gl = glRef.current;
    if (!gl || !previousBgUrl) return;
    loadTexture(gl, previousBgUrl, (tex) => {
      texPreviousRef.current = tex;
    });
  }, [previousBgUrl]);

  // Render loop
  useEffect(() => {
    const gl = glRef.current;
    const prog = programRef.current;
    const canvas = canvasRef.current;
    if (!gl || !prog || !canvas) return;

    let active = true;

    const render = () => {
      if (!active) return;

      // Handle resize
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      gl.useProgram(prog);

      const elapsed = (performance.now() - startTimeRef.current) / 1000.0;
      gl.uniform1f(gl.getUniformLocation(prog, 'uTime'), elapsed);
      gl.uniform1f(gl.getUniformLocation(prog, 'uProgress'), transitionProgress);
      gl.uniform1i(gl.getUniformLocation(prog, 'uIsTransitioning'), isTransitioning ? 1 : 0);
      gl.uniform1f(gl.getUniformLocation(prog, 'uAspect'), canvas.width / Math.max(1, canvas.height));

      // Bind texture 0 (Current)
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texCurrentRef.current);
      gl.uniform1i(gl.getUniformLocation(prog, 'uTexCurrent'), 0);

      // Bind texture 1 (Previous)
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texPreviousRef.current || texCurrentRef.current);
      gl.uniform1i(gl.getUniformLocation(prog, 'uTexPrevious'), 1);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      active = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isTransitioning, transitionProgress]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
      {/* WebGL Canvas Shader */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
        style={{ filter: 'brightness(0.92) contrast(1.04)' }}
      />

      {/* Atmospheric Procedural Rain Streaks Canvas on Glass */}
      {isRaining && <RainGlassCanvas />}
    </div>
  );
};

// Procedural dynamic raindrops and streaks on glass canvas
const RainGlassCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.clientWidth);
    let height = (canvas.height = canvas.clientHeight);

    interface Drop {
      x: number;
      y: number;
      radius: number;
      speed: number;
      length: number;
      opacity: number;
    }

    const drops: Drop[] = [];
    const dropCount = Math.floor(width * 0.12);

    for (let i = 0; i < dropCount; i++) {
      drops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.2 + 0.8,
        speed: Math.random() * 0.4 + 0.1,
        length: Math.random() * 18 + 8,
        opacity: Math.random() * 0.45 + 0.15,
      });
    }

    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle condensation layer
      ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.fillRect(0, 0, width, height);

      // Render drops
      for (const d of drops) {
        // Drop head
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${d.opacity})`;
        ctx.fill();

        // Wet drip trail
        ctx.beginPath();
        ctx.moveTo(d.x, d.y - d.length);
        ctx.lineTo(d.x, d.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${d.opacity * 0.4})`;
        ctx.lineWidth = d.radius * 0.8;
        ctx.stroke();

        // Specular micro-highlight
        ctx.beginPath();
        ctx.arc(d.x - d.radius * 0.3, d.y - d.radius * 0.3, d.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${d.opacity * 0.9})`;
        ctx.fill();

        // Move down
        d.y += d.speed;
        if (d.y > height + 20) {
          d.y = -10;
          d.x = Math.random() * width;
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = canvas.width = canvas.clientWidth;
      height = canvas.height = canvas.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      style={{ opacity: 0.85 }}
    />
  );
};
