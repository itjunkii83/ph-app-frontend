'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

export interface GlassSettings {
  edgeIntensity: number;
  rimIntensity: number;
  baseIntensity: number;
  edgeDistance: number;
  rimDistance: number;
  baseDistance: number;
  cornerBoost: number;
  rippleEffect: number;
  blurRadius: number;
  tintOpacity: number;
  centerWarp: boolean;
}

interface WebGLLiquidGlassProps {
  children?: ReactNode;
  width?: number;
  height?: number;
  borderRadius?: number;
  settings?: GlassSettings;
  /** When provided, positions the glass at (x, y) instead of centered. */
  position?: { x: number; y: number };
  /** Path to the background image used for the glass refraction texture. */
  backgroundImage?: string;
}

interface WebGLState {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  texture: WebGLTexture;
  positionBuffer: WebGLBuffer;
  texcoordBuffer: WebGLBuffer;
  uniforms: Record<string, WebGLUniformLocation | null>;
  animationFrameId: number | null;
}

export const DEFAULT_GLASS_SETTINGS: GlassSettings = {
  edgeIntensity: 0.025,
  rimIntensity: 0.12,
  baseIntensity: 0.015,
  edgeDistance: 0.12,
  rimDistance: 0.5,
  baseDistance: 0.08,
  cornerBoost: 0.045,
  rippleEffect: 0.05,
  blurRadius: 8.0,
  tintOpacity: 0.05,
  centerWarp: false,
};

const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_position;
  attribute vec2 a_texcoord;
  varying vec2 v_texcoord;

  void main() {
    gl_Position = vec4(a_position, 0, 1);
    v_texcoord = a_texcoord;
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform vec2 u_resolution;
  uniform vec2 u_textureSize;
  uniform float u_scrollY;
  uniform float u_pageHeight;
  uniform float u_viewportHeight;
  uniform float u_blurRadius;
  uniform float u_borderRadius;
  uniform vec2 u_containerPosition;
  uniform float u_warp;
  uniform float u_edgeIntensity;
  uniform float u_rimIntensity;
  uniform float u_baseIntensity;
  uniform float u_edgeDistance;
  uniform float u_rimDistance;
  uniform float u_baseDistance;
  uniform float u_cornerBoost;
  uniform float u_rippleEffect;
  uniform float u_tintOpacity;
  varying vec2 v_texcoord;

  float roundedRectDistance(vec2 coord, vec2 size, float radius) {
    vec2 center = size * 0.5;
    vec2 pixelCoord = coord * size;
    vec2 toCorner = abs(pixelCoord - center) - (center - radius);
    float outsideCorner = length(max(toCorner, 0.0));
    float insideCorner = min(max(toCorner.x, toCorner.y), 0.0);
    return (outsideCorner + insideCorner - radius);
  }

  float circleDistance(vec2 coord, vec2 size, float radius) {
    vec2 center = vec2(0.5, 0.5);
    vec2 pixelCoord = coord * size;
    vec2 centerPixel = center * size;
    float distFromCenter = length(pixelCoord - centerPixel);
    return distFromCenter - radius;
  }

  bool isPill(vec2 size, float radius) {
    float heightRatioDiff = abs(radius - size.y * 0.5);
    bool radiusMatchesHeight = heightRatioDiff < 2.0;
    bool isWiderThanTall = size.x > size.y + 4.0;
    return radiusMatchesHeight && isWiderThanTall;
  }

  bool isCircle(vec2 size, float radius) {
    float minDim = min(size.x, size.y);
    bool radiusMatchesMinDim = abs(radius - minDim * 0.5) < 1.0;
    bool isRoughlySquare = abs(size.x - size.y) < 4.0;
    return radiusMatchesMinDim && isRoughlySquare;
  }

  float pillDistance(vec2 coord, vec2 size, float radius) {
    vec2 center = size * 0.5;
    vec2 pixelCoord = coord * size;
    vec2 capsuleStart = vec2(radius, center.y);
    vec2 capsuleEnd = vec2(size.x - radius, center.y);
    vec2 capsuleAxis = capsuleEnd - capsuleStart;
    float capsuleLength = length(capsuleAxis);

    if (capsuleLength > 0.0) {
      vec2 toPoint = pixelCoord - capsuleStart;
      float t = clamp(dot(toPoint, capsuleAxis) / dot(capsuleAxis, capsuleAxis), 0.0, 1.0);
      vec2 closestPointOnAxis = capsuleStart + t * capsuleAxis;
      return length(pixelCoord - closestPointOnAxis) - radius;
    } else {
      return length(pixelCoord - center) - radius;
    }
  }

  void main() {
    vec2 coord = v_texcoord;

    float scrollY = u_scrollY;
    vec2 containerSize = u_resolution;
    vec2 textureSize = u_textureSize;

    vec2 containerCenter = u_containerPosition + vec2(0.0, scrollY);

    vec2 containerOffset = (coord - 0.5) * containerSize;
    vec2 pagePixel = containerCenter + containerOffset;

    vec2 textureCoord = pagePixel / textureSize;

    float distFromEdgeShape;
    vec2 shapeNormal;

    if (isPill(u_resolution, u_borderRadius)) {
      distFromEdgeShape = -pillDistance(coord, u_resolution, u_borderRadius);

      vec2 center = vec2(0.5, 0.5);
      vec2 pixelCoord = coord * u_resolution;
      vec2 capsuleStart = vec2(u_borderRadius, center.y * u_resolution.y);
      vec2 capsuleEnd = vec2(u_resolution.x - u_borderRadius, center.y * u_resolution.y);
      vec2 capsuleAxis = capsuleEnd - capsuleStart;
      float capsuleLength = length(capsuleAxis);

      if (capsuleLength > 0.0) {
        vec2 toPoint = pixelCoord - capsuleStart;
        float t = clamp(dot(toPoint, capsuleAxis) / dot(capsuleAxis, capsuleAxis), 0.0, 1.0);
        vec2 closestPointOnAxis = capsuleStart + t * capsuleAxis;
        vec2 normalDir = pixelCoord - closestPointOnAxis;
        shapeNormal = length(normalDir) > 0.0 ? normalize(normalDir) : vec2(0.0, 1.0);
      } else {
        shapeNormal = normalize(coord - center);
      }
    } else if (isCircle(u_resolution, u_borderRadius)) {
      distFromEdgeShape = -circleDistance(coord, u_resolution, u_borderRadius);
      vec2 center = vec2(0.5, 0.5);
      shapeNormal = normalize(coord - center);
    } else {
      distFromEdgeShape = -roundedRectDistance(coord, u_resolution, u_borderRadius);
      vec2 center = vec2(0.5, 0.5);
      shapeNormal = normalize(coord - center);
    }
    distFromEdgeShape = max(distFromEdgeShape, 0.0);

    float distFromLeft = coord.x;
    float distFromRight = 1.0 - coord.x;
    float distFromTop = coord.y;
    float distFromBottom = 1.0 - coord.y;
    float distFromEdge = distFromEdgeShape / min(u_resolution.x, u_resolution.y);

    float normalizedDistance = distFromEdge * min(u_resolution.x, u_resolution.y);
    float baseIntensity = 1.0 - exp(-normalizedDistance * u_baseDistance);
    float edgeIntensity = exp(-normalizedDistance * u_edgeDistance);
    float rimIntensity = exp(-normalizedDistance * u_rimDistance);

    float baseComponent = u_warp > 0.5 ? baseIntensity * u_baseIntensity : 0.0;
    float totalIntensity = baseComponent + edgeIntensity * u_edgeIntensity + rimIntensity * u_rimIntensity;

    vec2 baseRefraction = shapeNormal * totalIntensity;

    float cornerProximityX = min(distFromLeft, distFromRight);
    float cornerProximityY = min(distFromTop, distFromBottom);
    float cornerDistance = max(cornerProximityX, cornerProximityY);
    float cornerNormalized = cornerDistance * min(u_resolution.x, u_resolution.y);

    float cornerBoost = exp(-cornerNormalized * 0.3) * u_cornerBoost;
    vec2 cornerRefraction = shapeNormal * cornerBoost;

    vec2 perpendicular = vec2(-shapeNormal.y, shapeNormal.x);
    float rippleEffect = sin(distFromEdge * 25.0) * u_rippleEffect * rimIntensity;
    vec2 textureRefraction = perpendicular * rippleEffect;

    vec2 totalRefraction = baseRefraction + cornerRefraction + textureRefraction;
    textureCoord += totalRefraction;

    // Gaussian blur
    vec4 color = vec4(0.0);
    vec2 texelSize = 1.0 / u_textureSize;
    float sigma = u_blurRadius / 2.0;
    vec2 blurStep = texelSize * sigma;

    float totalWeight = 0.0;

    for(float i = -6.0; i <= 6.0; i += 1.0) {
      for(float j = -6.0; j <= 6.0; j += 1.0) {
        float distance = length(vec2(i, j));
        if(distance > 6.0) continue;

        float weight = exp(-(distance * distance) / (2.0 * sigma * sigma));

        vec2 offset = vec2(i, j) * blurStep;
        color += texture2D(u_image, textureCoord + offset) * weight;
        totalWeight += weight;
      }
    }

    color /= totalWeight;

    // Simple vertical gradient
    float gradientPosition = coord.y;
    vec3 topTint = vec3(1.0, 1.0, 1.0);
    vec3 bottomTint = vec3(0.7, 0.7, 0.7);
    vec3 gradientTint = mix(topTint, bottomTint, gradientPosition);
    vec3 tintedColor = mix(color.rgb, gradientTint, u_tintOpacity);
    color = vec4(tintedColor, color.a);

    // Sampled gradient
    vec2 viewportCenter = containerCenter;
    float topY = (viewportCenter.y - containerSize.y * 0.4) / textureSize.y;
    float midY = viewportCenter.y / textureSize.y;
    float bottomY = (viewportCenter.y + containerSize.y * 0.4) / textureSize.y;

    vec3 topColor = vec3(0.0);
    vec3 midColor = vec3(0.0);
    vec3 bottomColor = vec3(0.0);

    float sampleCount = 0.0;
    for(float x = 0.0; x < 1.0; x += 0.05) {
      for(float yOffset = -5.0; yOffset <= 5.0; yOffset += 1.0) {
        vec2 topSample = vec2(x, topY + yOffset * texelSize.y);
        vec2 midSample = vec2(x, midY + yOffset * texelSize.y);
        vec2 bottomSample = vec2(x, bottomY + yOffset * texelSize.y);

        topColor += texture2D(u_image, topSample).rgb;
        midColor += texture2D(u_image, midSample).rgb;
        bottomColor += texture2D(u_image, bottomSample).rgb;
        sampleCount += 1.0;
      }
    }

    topColor /= sampleCount;
    midColor /= sampleCount;
    bottomColor /= sampleCount;

    vec3 sampledGradient;
    if (gradientPosition < 0.1) {
      sampledGradient = topColor;
    } else if (gradientPosition > 0.9) {
      sampledGradient = bottomColor;
    } else {
      float transitionPos = (gradientPosition - 0.1) / 0.8;
      if (transitionPos < 0.5) {
        float t = transitionPos * 2.0;
        sampledGradient = mix(topColor, midColor, t);
      } else {
        float t = (transitionPos - 0.5) * 2.0;
        sampledGradient = mix(midColor, bottomColor, t);
      }
    }

    vec3 finalTinted = mix(color.rgb, sampledGradient, u_tintOpacity * 0.3);
    color = vec4(finalTinted, color.a);

    // Shape mask
    float maskDistance;
    if (isPill(u_resolution, u_borderRadius)) {
      maskDistance = pillDistance(coord, u_resolution, u_borderRadius);
    } else if (isCircle(u_resolution, u_borderRadius)) {
      maskDistance = circleDistance(coord, u_resolution, u_borderRadius);
    } else {
      maskDistance = roundedRectDistance(coord, u_resolution, u_borderRadius);
    }
    float mask = 1.0 - smoothstep(-1.0, 1.0, maskDistance);

    gl_FragColor = vec4(color.rgb, mask);
  }
`;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) {
    console.error('Failed to create shader, GL context may be lost');
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    console.error(
      'Shader compile error:',
      log ?? '(no log available)',
      '\nShader type:',
      type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT',
    );
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string,
): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  gl.detachShader(program, vs);
  gl.detachShader(program, fs);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return program;
}

export default function WebGLLiquidGlass({
  children,
  width = 800,
  height = 800,
  borderRadius = 28,
  settings,
  position,
  backgroundImage = '/bg.jpg',
}: WebGLLiquidGlassProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glStateRef = useRef<WebGLState | null>(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const activeSettings = settings ?? DEFAULT_GLASS_SETTINGS;

  // Main initialization effect
  useEffect(() => {
    let mounted = true;
    let animFrameId: number | null = null;

    async function init() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = width;
      canvas.height = height;

      const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
      if (!gl) {
        setWebglSupported(false);
        return;
      }

      // Load background image directly (html2canvas has issues with fixed elements)
      const bgImg = new Image();
      bgImg.crossOrigin = 'anonymous';
      bgImg.src = backgroundImage;
      await new Promise<void>((resolve, reject) => {
        if (bgImg.complete && bgImg.naturalWidth > 0) {
          resolve();
        } else {
          bgImg.onload = () => resolve();
          bgImg.onerror = reject;
        }
      });
      if (!mounted) return;

      // Render background image to an offscreen canvas using cover/center logic
      // This replicates CSS background-size:cover; background-position:center
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const offscreen = document.createElement('canvas');
      offscreen.width = vw;
      offscreen.height = vh;
      const ctx = offscreen.getContext('2d');
      if (!ctx) {
        setWebglSupported(false);
        return;
      }

      // Calculate cover dimensions
      const imgAspect = bgImg.naturalWidth / bgImg.naturalHeight;
      const vpAspect = vw / vh;
      let drawW: number, drawH: number, drawX: number, drawY: number;
      if (vpAspect > imgAspect) {
        // Viewport wider than image — scale by width, crop top/bottom
        drawW = vw;
        drawH = vw / imgAspect;
        drawX = 0;
        drawY = (vh - drawH) / 2;
      } else {
        // Viewport taller than image — scale by height, crop left/right
        drawH = vh;
        drawW = vh * imgAspect;
        drawX = (vw - drawW) / 2;
        drawY = 0;
      }
      ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);

      // Use offscreen canvas as the texture source
      const img = offscreen;

      // Build shader program
      const program = createProgram(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);
      if (!program) {
        setWebglSupported(false);
        return;
      }

      gl.useProgram(program);

      // Geometry (full-screen quad)
      const positionBuffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );

      const texcoordBuffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]),
        gl.STATIC_DRAW,
      );

      // Attribute locations
      const positionLoc = gl.getAttribLocation(program, 'a_position');
      const texcoordLoc = gl.getAttribLocation(program, 'a_texcoord');

      // Uniform locations
      const uniforms: Record<string, WebGLUniformLocation | null> = {
        resolution: gl.getUniformLocation(program, 'u_resolution'),
        textureSize: gl.getUniformLocation(program, 'u_textureSize'),
        scrollY: gl.getUniformLocation(program, 'u_scrollY'),
        pageHeight: gl.getUniformLocation(program, 'u_pageHeight'),
        viewportHeight: gl.getUniformLocation(program, 'u_viewportHeight'),
        blurRadius: gl.getUniformLocation(program, 'u_blurRadius'),
        borderRadius: gl.getUniformLocation(program, 'u_borderRadius'),
        containerPosition: gl.getUniformLocation(program, 'u_containerPosition'),
        warp: gl.getUniformLocation(program, 'u_warp'),
        edgeIntensity: gl.getUniformLocation(program, 'u_edgeIntensity'),
        rimIntensity: gl.getUniformLocation(program, 'u_rimIntensity'),
        baseIntensity: gl.getUniformLocation(program, 'u_baseIntensity'),
        edgeDistance: gl.getUniformLocation(program, 'u_edgeDistance'),
        rimDistance: gl.getUniformLocation(program, 'u_rimDistance'),
        baseDistance: gl.getUniformLocation(program, 'u_baseDistance'),
        cornerBoost: gl.getUniformLocation(program, 'u_cornerBoost'),
        rippleEffect: gl.getUniformLocation(program, 'u_rippleEffect'),
        tintOpacity: gl.getUniformLocation(program, 'u_tintOpacity'),
        image: gl.getUniformLocation(program, 'u_image'),
      };

      // Create and bind texture
      const texture = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      // Set up viewport and blending
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      // Bind attributes
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
      gl.enableVertexAttribArray(texcoordLoc);
      gl.vertexAttribPointer(texcoordLoc, 2, gl.FLOAT, false, 0, 0);

      // Set uniform values
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform2f(uniforms.textureSize, img.width, img.height);
      gl.uniform1f(uniforms.blurRadius, activeSettings.blurRadius);
      gl.uniform1f(uniforms.borderRadius, borderRadius);
      gl.uniform1f(uniforms.warp, activeSettings.centerWarp ? 1.0 : 0.0);
      gl.uniform1f(uniforms.edgeIntensity, activeSettings.edgeIntensity);
      gl.uniform1f(uniforms.rimIntensity, activeSettings.rimIntensity);
      gl.uniform1f(uniforms.baseIntensity, activeSettings.baseIntensity);
      gl.uniform1f(uniforms.edgeDistance, activeSettings.edgeDistance);
      gl.uniform1f(uniforms.rimDistance, activeSettings.rimDistance);
      gl.uniform1f(uniforms.baseDistance, activeSettings.baseDistance);
      gl.uniform1f(uniforms.cornerBoost, activeSettings.cornerBoost);
      gl.uniform1f(uniforms.rippleEffect, activeSettings.rippleEffect);
      gl.uniform1f(uniforms.tintOpacity, activeSettings.tintOpacity);

      // Container position
      const rect = canvas.getBoundingClientRect();
      gl.uniform2f(
        uniforms.containerPosition,
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      );

      const pageHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
      );
      gl.uniform1f(uniforms.pageHeight, pageHeight);
      gl.uniform1f(uniforms.viewportHeight, window.innerHeight);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(uniforms.image, 0);

      // Store state
      glStateRef.current = {
        gl,
        program,
        texture,
        positionBuffer,
        texcoordBuffer,
        uniforms,
        animationFrameId: null,
      };

      // Render loop
      function render() {
        if (!mounted || !glStateRef.current || !canvas) return;
        const { gl, uniforms } = glStateRef.current;

        gl.clear(gl.COLOR_BUFFER_BIT);

        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        gl.uniform1f(uniforms.scrollY, scrollY);

        const rect = canvas.getBoundingClientRect();
        gl.uniform2f(
          uniforms.containerPosition,
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        animFrameId = requestAnimationFrame(render);
        glStateRef.current.animationFrameId = animFrameId;
      }

      render();
    }

    init();

    return () => {
      mounted = false;
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
      }
      const state = glStateRef.current;
      if (state) {
        const { gl, program, texture, positionBuffer, texcoordBuffer } = state;
        if (state.animationFrameId !== null) {
          cancelAnimationFrame(state.animationFrameId);
        }
        gl.deleteTexture(texture);
        gl.deleteBuffer(positionBuffer);
        gl.deleteBuffer(texcoordBuffer);
        gl.deleteProgram(program);
        glStateRef.current = null;
      }
    };
  }, [width, height, borderRadius, backgroundImage]);

  // Resize handler - re-render background at new viewport size
  useEffect(() => {
    let resizeTimeout: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(async () => {
        const state = glStateRef.current;
        const canvas = canvasRef.current;
        if (!state || !canvas) return;

        const { gl, uniforms, texture } = state;

        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        bgImg.src = backgroundImage;
        await new Promise<void>((resolve) => {
          if (bgImg.complete && bgImg.naturalWidth > 0) {
            resolve();
          } else {
            bgImg.onload = () => resolve();
            bgImg.onerror = () => resolve();
          }
        });

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const offscreen = document.createElement('canvas');
        offscreen.width = vw;
        offscreen.height = vh;
        const ctx = offscreen.getContext('2d');
        if (!ctx) return;

        const imgAspect = bgImg.naturalWidth / bgImg.naturalHeight;
        const vpAspect = vw / vh;
        let drawW: number, drawH: number, drawX: number, drawY: number;
        if (vpAspect > imgAspect) {
          drawW = vw;
          drawH = vw / imgAspect;
          drawX = 0;
          drawY = (vh - drawH) / 2;
        } else {
          drawH = vh;
          drawW = vh * imgAspect;
          drawX = (vw - drawW) / 2;
          drawY = 0;
        }
        ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, offscreen);
        gl.uniform2f(uniforms.textureSize, vw, vh);
        gl.uniform1f(uniforms.viewportHeight, vh);

        const pageHeight = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
        );
        gl.uniform1f(uniforms.pageHeight, pageHeight);
      }, 300);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [backgroundImage]);

  // Update uniforms when settings change (real-time control)
  useEffect(() => {
    const state = glStateRef.current;
    if (!state) return;
    const { gl, uniforms } = state;
    gl.uniform1f(uniforms.edgeIntensity, activeSettings.edgeIntensity);
    gl.uniform1f(uniforms.rimIntensity, activeSettings.rimIntensity);
    gl.uniform1f(uniforms.baseIntensity, activeSettings.baseIntensity);
    gl.uniform1f(uniforms.edgeDistance, activeSettings.edgeDistance);
    gl.uniform1f(uniforms.rimDistance, activeSettings.rimDistance);
    gl.uniform1f(uniforms.baseDistance, activeSettings.baseDistance);
    gl.uniform1f(uniforms.cornerBoost, activeSettings.cornerBoost);
    gl.uniform1f(uniforms.rippleEffect, activeSettings.rippleEffect);
    gl.uniform1f(uniforms.blurRadius, activeSettings.blurRadius);
    gl.uniform1f(uniforms.tintOpacity, activeSettings.tintOpacity);
    gl.uniform1f(uniforms.warp, activeSettings.centerWarp ? 1.0 : 0.0);
  }, [activeSettings]);

  const posStyle: React.CSSProperties = position
    ? { position: 'fixed', left: `${position.x}px`, top: `${position.y}px` }
    : { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  if (!webglSupported) {
    return (
      <div
        style={{
          ...posStyle,
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: `${borderRadius}px`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      data-glass-exclude="true"
      style={{
        ...posStyle,
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: `${borderRadius}px`,
        zIndex: 100,
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          borderRadius: `${borderRadius}px`,
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        {children}
      </div>
    </div>
  );
}
