/* ============================================
   WebGL Background Integration Module
   Drop this into any page for shader background
   ============================================ */

class ShaderBackground {
  constructor(canvasId, shaderType = 'grain') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    
    this.gl = this.canvas.getContext('webgl');
    if (!this.gl) return;
    
    this.shaderType = shaderType;
    this.mouse = { x: 0.5, y: 0.5 };
    this.time = 0;
    
    this.init();
  }

  init() {
    const vsSource = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const shaders = {
      grain: `
        precision mediump float;
        uniform float time;
        uniform vec2 resolution;
        
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        void main() {
          vec2 uv = gl_FragCoord.xy / resolution.xy;
          float grain = random(uv + time * 0.1) * 0.08;
          vec3 color = vec3(0.04 + grain, 0.04 + grain, 0.06 + grain * 0.5);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      
      gradient: `
        precision mediump float;
        uniform float time;
        uniform vec2 resolution;
        uniform vec2 mouse;
        
        void main() {
          vec2 uv = gl_FragCoord.xy / resolution.xy;
          float t = time * 0.3;
          
          vec3 c1 = vec3(0.0, 0.94, 1.0);
          vec3 c2 = vec3(1.0, 0.0, 0.33);
          vec3 c3 = vec3(0.04, 0.04, 0.06);
          
          float wave1 = sin(uv.x * 3.14159 + t) * 0.5 + 0.5;
          float wave2 = cos(uv.y * 2.0 + t * 0.7) * 0.5 + 0.5;
          float mouseInfluence = smoothstep(0.5, 0.0, distance(uv, mouse));
          
          vec3 color = mix(c3, mix(c1, c2, wave1), wave2 * 0.4 + mouseInfluence * 0.2);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      
      spotlight: `
        precision mediump float;
        uniform float time;
        uniform vec2 resolution;
        uniform vec2 mouse;
        
        void main() {
          vec2 uv = gl_FragCoord.xy / resolution.xy;
          float dist = distance(uv, mouse);
          float spotlight = 1.0 - smoothstep(0.15, 0.5, dist);
          float vignette = 1.0 - smoothstep(0.3, 1.0, length(uv - 0.5));
          
          vec3 bg = vec3(0.04, 0.04, 0.06);
          vec3 light = vec3(0.0, 0.55, 0.58) * spotlight;
          vec3 color = bg + light;
          color *= vignette;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      
      liquid: `
        precision mediump float;
        uniform float time;
        uniform vec2 resolution;
        uniform vec2 mouse;
        
        void main() {
          vec2 uv = gl_FragCoord.xy / resolution.xy;
          float dist = distance(uv, mouse);
          float distortion = sin(uv.y * 8.0 + time * 1.5) * 0.015 * (1.0 - smoothstep(0.0, 0.4, dist));
          uv.x += distortion;
          
          vec3 c1 = vec3(0.0, 0.55, 0.58);
          vec3 c2 = vec3(0.11, 0.21, 0.29);
          float mixFactor = sin(uv.x * 3.14159 + time * 0.5) * 0.5 + 0.5;
          vec3 color = mix(c1, c2, mixFactor) * (0.8 + dist * 0.2);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
    };

    this.program = this.createProgram(vsSource, shaders[this.shaderType] || shaders.grain);
    if (!this.program) return;

    this.setupBuffers();
    this.setupUniforms();
    this.setupEvents();
    this.resize();
    this.render();
  }

  createShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error(this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  createProgram(vsSource, fsSource) {
    const vs = this.createShader(this.gl.VERTEX_SHADER, vsSource);
    const fs = this.createShader(this.gl.FRAGMENT_SHADER, fsSource);
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vs);
    this.gl.attachShader(program, fs);
    this.gl.linkProgram(program);
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error(this.gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }

  setupBuffers() {
    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1
    ]), this.gl.STATIC_DRAW);

    const positionLocation = this.gl.getAttribLocation(this.program, 'position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
  }

  setupUniforms() {
    this.gl.useProgram(this.program);
    this.timeLocation = this.gl.getUniformLocation(this.program, 'time');
    this.resolutionLocation = this.gl.getUniformLocation(this.program, 'resolution');
    this.mouseLocation = this.gl.getUniformLocation(this.program, 'mouse');
  }

  setupEvents() {
    window.addEventListener('resize', () => this.resize());
    
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX / window.innerWidth;
      this.mouse.y = 1.0 - (e.clientY / window.innerHeight);
    });
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.canvas.width = this.canvas.parentElement.offsetWidth * dpr;
    this.canvas.height = this.canvas.parentElement.offsetHeight * dpr;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  render() {
    this.time += 0.016;
    
    this.gl.uniform1f(this.timeLocation, this.time);
    this.gl.uniform2f(this.resolutionLocation, this.canvas.width, this.canvas.height);
    if (this.mouseLocation) {
      this.gl.uniform2f(this.mouseLocation, this.mouse.x, this.mouse.y);
    }
    
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    requestAnimationFrame(() => this.render());
  }
}

// Usage:
// const bg = new ShaderBackground('bgCanvas', 'grain');
// const bg = new ShaderBackground('bgCanvas', 'gradient');
// const bg = new ShaderBackground('bgCanvas', 'spotlight');
// const bg = new ShaderBackground('bgCanvas', 'liquid');
