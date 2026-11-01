import{r as y,b as nt,c as at,j as _e,a as it}from"./index-Dhy2wWBR.js";const me=8,De=4,ut=`#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`,st=`#version 300 es
precision highp float;
uniform vec2 uView;
uniform float uZoom;
uniform float uPhase;
uniform float uTwinkleClock;
uniform float uRings;
uniform vec3 uColors[8];
uniform int uColorCount;
uniform int uStreakCount;
uniform int uColumns;
uniform float uWidth;
uniform float uTail;
uniform float uTwinkle;
uniform float uHead;
uniform float uDepth;
uniform vec4 uMouse;
uniform vec3 uLens;
uniform float uLightMode;
uniform float uEncode;
out vec4 outColor;

const vec3 CAMERA = vec3(0.0, -0.8888889, -0.2222222);
const float TAU = 6.28318530718;
const float SPACING = 0.005;
const float REACH = 0.32;

uint scramble(uint x) {
  x ^= x >> 16;
  x *= 0x7feb352du;
  x ^= x >> 15;
  x *= 0x846ca68bu;
  x ^= x >> 16;
  return x;
}

float unit(uint x) {
  return float(x & 0xffffu) / 65535.0;
}

float stroke(float d, float w) {
  float s = max(0.75 * w, 0.55);
  return 0.75 * w / s * exp(-0.5 * d * d / (s * s));
}

float orb(float d, float r) {
  float s = max(0.6 * r, 0.7);
  float e = 0.6 * r / s;
  return e * e * exp(-0.5 * d * d / (s * s));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 screen = (2.0 * frag - uView) / uView.x;
  vec2 p = screen;
  mat2 warp = mat2(1.0);
  if (uLens.z > 0.0) {
    vec2 o = p - uLens.xy;
    float e = uLens.z * exp(-dot(o, o) / (REACH * REACH));
    p -= o * e;
    warp = mat2(1.0 - e) + outerProduct(o, o) * (2.0 * e / (REACH * REACH));
  }

  vec3 dir = vec3(p, uZoom);
  vec3 exits = (1.0 - CAMERA * sign(dir)) / max(abs(dir), vec3(1e-6));
  float u = min(exits.x, min(exits.y, exits.z));
  for (int i = 0; i < 5; i++) {
    vec3 h = CAMERA + u * dir;
    vec3 h2 = h * h;
    u -= (dot(h2, h2) - 1.0) / (4.0 * dot(dir, h2 * h));
  }
  vec3 hit = CAMERA + u * dir;
  vec3 normal = hit * hit * hit;
  float facing = dot(normal, dir);
  vec3 stepX = u * (vec3(1.0, 0.0, 0.0) - dir * (normal.x / facing));
  vec3 stepY = u * (vec3(0.0, 1.0, 0.0) - dir * (normal.y / facing));
  float ring = hit.y * hit.y + hit.z * hit.z;
  float theta = atan(hit.z, hit.y);
  mat2 jacobian = mat2(
    stepX.x,
    (hit.y * stepX.z - hit.z * stepX.y) / ring,
    stepY.x,
    (hit.y * stepY.z - hit.z * stepY.y) / ring
  ) * warp * (2.0 / uView.x);

  vec2 gradX = vec2(jacobian[0][0], jacobian[1][0]);
  vec2 gradTheta = vec2(jacobian[0][1], jacobian[1][1]);
  float scale = max(length(gradX), 1e-8);
  float det = max(abs(gradX.x * gradTheta.y - gradX.y * gradTheta.x), 1e-12);
  float along = scale / det;
  float skew = dot(gradX, gradTheta) / det;
  float spacing = SPACING / scale;
  float detail = smoothstep(1.6, 3.2, spacing);
  if (detail <= 0.0) {
    outColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  float halfWidth = min(uWidth / scale, 0.2 * spacing);
  float headRadius = min(2.0 * uWidth / scale, 0.35 * spacing);
  float headReach = 4.0 * max(0.6 * headRadius, 0.7);
  float edge = uColumns > 1 ? 1.0 : 0.5;
  float period = TAU / uRings;
  float fog = exp(-max(u * length(dir) - 0.6, 0.0) * 1.6 * uDepth);

  float boost = 1.0;
  if (uMouse.z > 0.0) {
    vec2 m = screen - uMouse.xy;
    boost += 2.0 * uMouse.z * exp(-dot(m, m) / max(uMouse.w * uMouse.w, 1e-4));
  }

  int count = max(uColorCount, 1);
  vec3 total = vec3(0.0);
  for (int layer = 0; layer < 16; layer++) {
    if (layer >= uStreakCount) break;
    float x = hit.x + float(layer) * SPACING / 8.0;
    float nearest = floor(x / SPACING + 0.5);
    float side = x >= nearest * SPACING ? 1.0 : -1.0;
    for (int k = 0; k < 2; k++) {
      if (k >= uColumns) break;
      float column = nearest + side * float(k);
      float across = (x - column * SPACING) / scale;
      uint seed = scramble(uint(int(column) + 65536) + uint(layer) * 0x9e3779b9u);
      uint next = scramble(seed);
      float hue = unit(seed >> 16);
      float delta = theta - uPhase * (1.0 + floor(unit(seed) * 16.0) / 16.0) - unit(next) * period;
      delta -= period * floor(delta / period + 0.5);
      float ahead = delta * along - across * skew;
      if (abs(ahead) > headReach && (delta > 0.0 || -delta * uTail > 3.2)) continue;
      float behind = max(-delta, 0.0);
      float fall = exp(-uTail * behind) * (1.0 - smoothstep(0.5, 0.95, behind / (0.5 * period)));
      fall *= 1.0 - smoothstep(1.2, 3.2, uTail * behind);
      float reach = length(vec2(across, ahead));
      float trail = stroke(ahead > 0.0 ? reach : abs(across), halfWidth * mix(0.4, 1.0, fall)) * fall;
      float glint = orb(reach, headRadius) * mix(3.0, 1.8, uLightMode);
      float weight = mix(1.5, 1.0 + sin(uTwinkleClock + 7.0 * hue + 4.0), uTwinkle);
      weight *= 1.0 - smoothstep(0.72 * edge, edge, abs(across) / spacing);
      vec3 color = uColors[min(int(hue * float(count)), count - 1)];
      vec3 hot = mix(color, vec3(1.0), uHead * (1.0 - uLightMode));
      total += (trail * color + glint * hot) * weight;
    }
  }

  outColor = vec4(total * fog * boost * detail * uEncode, 1.0);
}`,ct=`#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform vec2 uTarget;
uniform vec2 uTexel;
uniform float uLimit;
out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uTarget;
  vec3 color = texture(uSource, uv - uTexel).rgb;
  color += texture(uSource, uv + uTexel).rgb;
  color += texture(uSource, uv + vec2(uTexel.x, -uTexel.y)).rgb;
  color += texture(uSource, uv + vec2(-uTexel.x, uTexel.y)).rgb;
  outColor = vec4(min(color * 0.25, vec3(uLimit)), 1.0);
}`,lt=`#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform vec2 uTarget;
uniform vec2 uStep;
out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uTarget;
  vec3 color = texture(uSource, uv).rgb * 0.181862;
  color += (texture(uSource, uv + uStep * 1.423135).rgb + texture(uSource, uv - uStep * 1.423135).rgb) * 0.284316;
  color += (texture(uSource, uv + uStep * 3.326702).rgb + texture(uSource, uv - uStep * 3.326702).rgb) * 0.106598;
  color += (texture(uSource, uv + uStep * 5.242989).rgb + texture(uSource, uv - uStep * 5.242989).rgb) * 0.018156;
  outColor = vec4(color, 1.0);
}`,ft=`#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uBloom0;
uniform sampler2D uBloom1;
uniform sampler2D uBloom2;
uniform sampler2D uBloom3;
uniform vec2 uView;
uniform float uDecode;
uniform float uGlow;
uniform float uBloom;
uniform float uPresence;
uniform float uOpacity;
uniform float uFade;
uniform float uLightMode;
uniform vec3 uTopColor;
uniform float uTopGlow;
out vec4 outColor;

float smootherstep01(float t) {
  t = clamp(t, 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uView;
  vec3 light = texelFetch(uScene, ivec2(gl_FragCoord.xy), 0).rgb;
  if (uBloom > 0.0) {
    vec3 halo = texture(uBloom0, uv).rgb * 0.42;
    halo += texture(uBloom1, uv).rgb * 0.3;
    halo += texture(uBloom2, uv).rgb * 0.18;
    halo += texture(uBloom3, uv).rgb * 0.1;
    light += halo * uBloom * (uLightMode > 0.5 ? 0.2 : 1.0);
  }
  light *= uDecode * uGlow * uPresence;

  if (uLightMode < 0.5 && uTopGlow > 0.0) {
    float aspect = uView.x / uView.y;
    vec2 q = vec2((uv.x - 0.5) * aspect, 1.04 - uv.y);
    float spread = 0.34 * max(aspect, 0.75);
    float core = exp(-q.x * q.x / (spread * spread) - q.y * q.y / 0.06);
    float halo = exp(-q.x * q.x / (3.6 * spread * spread) - q.y * q.y / 0.18);
    light += uTopColor * uTopGlow * (core * 0.85 + halo * 0.3) * uPresence;
  }

  vec3 lit = max(light, 0.0);
  vec3 mapped = sqrt(1.0 - exp(-1.3 * lit * lit / (lit + 0.025)));
  float peak = max(mapped.r, max(mapped.g, mapped.b));

  float mask = uOpacity;
  float edge = uFade * 0.5;
  if (edge > 0.0) {
    mask *= smootherstep01(uv.x / edge) * smootherstep01((1.0 - uv.x) / edge);
    mask *= smootherstep01(uv.y / edge) * smootherstep01((1.0 - uv.y) / edge);
  }
  float grain = (fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) - 0.5) / 255.0;

  if (uLightMode > 0.5) {
    float coverage = clamp(smoothstep(0.0, 0.5, peak) * mask * 0.94 + grain, 0.0, 1.0);
    vec3 chroma = sqrt(clamp(lit / max(max(lit.r, max(lit.g, lit.b)), 1e-6), 0.0, 1.0));
    chroma = pow(chroma, vec3(1.35));
    chroma /= max(max(chroma.r, max(chroma.g, chroma.b)), 1e-4);
    float saturation = 1.0 - min(chroma.r, min(chroma.g, chroma.b));
    chroma = mix(vec3(0.3), chroma, smoothstep(0.08, 0.35, saturation));
    outColor = vec4(chroma * coverage, coverage);
  } else {
    vec3 color = clamp(mapped + grain, 0.0, 1.0) * mask;
    outColor = vec4(color, max(color.r, max(color.g, color.b)));
  }
}`,mt=2.6,dt=9,de=Math.PI*2,X=(n,b,p)=>Math.min(p,Math.max(b,n)),Xe=(n,b,p)=>{const f=n.createShader(b);return f?(n.shaderSource(f,p),n.compileShader(f),n.getShaderParameter(f,n.COMPILE_STATUS)?f:(n.deleteShader(f),null)):null},J=(n,b)=>{const p=Xe(n,n.VERTEX_SHADER,ut),f=Xe(n,n.FRAGMENT_SHADER,b),l=n.createProgram();if(!p||!f||!l)return p&&n.deleteShader(p),f&&n.deleteShader(f),l&&n.deleteProgram(l),null;if(n.attachShader(l,p),n.attachShader(l,f),n.bindAttribLocation(l,0,"aPosition"),n.linkProgram(l),n.deleteShader(p),n.deleteShader(f),!n.getProgramParameter(l,n.LINK_STATUS))return n.deleteProgram(l),null;const Y={},ee=n.getProgramParameter(l,n.ACTIVE_UNIFORMS);for(let I=0;I<ee;I++){const G=n.getActiveUniform(l,I);G&&(Y[G.name.replace(/\[0\]$/,"")]=n.getUniformLocation(l,G.name))}return{program:l,uniforms:Y}},xt=({colors:n=["#ffffff"],backgroundColor:b="#94a3b8",speed:p=.3,streakCount:f=2,streakWidth:l=.8,streakLength:Y=1,glow:ee=1,density:I=.6,twinkle:G=.3,zoom:Ie=3,backgroundGlow:Ge=.1,headGlow:Ue=.6,depth:Be=.5,bloom:Ne=.35,opacity:Oe=1,mouseInteraction:Ve=!0,mouseStrength:We=.4,mouseRadius:Ye=.45,mouseDampening:ze=.15,lens:qe=.5,holdToWarp:He=!0,intro:je=!0,fade:$e=0,lightMode:Ze=!1,mixBlendMode:he,paused:Ke=!1,dpr:Qe,className:xe="",style:Je})=>{const pe=y.useRef(null),ve=y.useRef(null),te=y.useRef(null),R=y.useRef(null),[et,tt]=y.useState(0);return R.current={colors:(Array.isArray(n)&&n.length?n:["#ffffff"]).slice(0,me).map(String),backgroundColor:String(b),speed:p,streakCount:Math.round(X(f,1,16)),streakWidth:Math.max(.05,l),streakLength:Math.max(.05,Y),glow:Math.max(0,ee),density:I,twinkle:X(G,0,1),zoom:Math.max(.1,Ie),backgroundGlow:Math.max(0,Ge),headGlow:X(Ue,0,1),depth:Math.max(0,Be),bloom:Math.max(0,Ne),opacity:X(Oe,0,1),mouseInteraction:Ve,mouseStrength:Math.max(0,We),mouseRadius:Math.max(.01,Ye),mouseDampening:Math.max(0,ze),lens:X(qe,0,1),holdToWarp:He,intro:je,fade:X($e,0,1),lightMode:Ze,paused:Ke,dpr:Qe},y.useEffect(()=>{const g=pe.current,m=ve.current,ge=nt(),e=m?.getContext("webgl2",{alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1,powerPreference:"high-performance"});if(!g||!m||!e)return;const we=!!e.getExtension("EXT_color_buffer_float"),z=J(e,st),q=J(e,ct),U=J(e,lt),H=J(e,ft);if(!z||!q||!U||!H){[z,q,U,H].forEach(t=>{t&&e.deleteProgram(t.program)});return}let L=!1;const Ee=t=>{t.preventDefault(),L=!0,cancelAnimationFrame(d),d=0},Te=()=>tt(t=>t+1);m.addEventListener("webglcontextlost",Ee),m.addEventListener("webglcontextrestored",Te);const be=e.createBuffer(),oe=e.createVertexArray();e.bindVertexArray(oe),e.bindBuffer(e.ARRAY_BUFFER,be),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);const ot=we?e.RGBA16F:e.RGBA8,re=we?1:.25,ne=()=>({texture:null,framebuffer:e.createFramebuffer(),width:0,height:0}),B=ne(),j=Array.from({length:De},()=>[ne(),ne()]),ae=(t,o,a)=>{t.texture&&t.width===o&&t.height===a||(t.texture&&e.deleteTexture(t.texture),t.texture=e.createTexture(),t.width=o,t.height=a,e.bindTexture(e.TEXTURE_2D,t.texture),e.texStorage2D(e.TEXTURE_2D,1,ot,o,a),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),e.bindFramebuffer(e.FRAMEBUFFER,t.framebuffer),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t.texture,0))},N=(t,o)=>(e.bindFramebuffer(e.FRAMEBUFFER,t?t.framebuffer:null),e.viewport(0,0,t?t.width:m.width,t?t.height:m.height),e.useProgram(o.program),o.uniforms),P=(t,o)=>{e.activeTexture(e.TEXTURE0+t),e.bindTexture(e.TEXTURE_2D,o)},k=document.createElement("canvas").getContext("2d",{willReadFrequently:!0}),ie=new Map,rt=t=>{if(ie.has(t))return ie.get(t);let o=[1,1,1];if(k){k.clearRect(0,0,1,1),k.fillStyle="#ffffff",k.fillStyle=t,k.fillRect(0,0,1,1);const[a,h,O]=k.getImageData(0,0,1,1).data;o=[a/255,h/255,O/255]}return ie.set(t,o),o},Re=t=>rt(t).map(o=>o*o),ue=window.matchMedia("(prefers-reduced-motion: reduce)");let v=ue.matches;const se=new Float32Array(me*3),u={x:0,y:0,inside:!1,held:!1},r={travel:0,intro:R.current.intro&&!v?0:1,mouseX:0,mouseY:0,lensX:0,lensY:0,touch:0,warp:0};let d=0,w=0,A=!0;const ce=()=>{const t=R.current,o=m.width,a=m.height,h=Math.max(1,g.clientWidth),O=Math.max(1,g.clientHeight);e.bindVertexArray(oe),ae(B,o,a),j.forEach((i,c)=>{const T=Math.max(1,Math.round(h/2**(c+1))),S=Math.max(1,Math.round(O/2**(c+1)));ae(i[0],T,S),ae(i[1],T,S)});const V=r.intro,K=Math.min(1,V*2.2),F=1+5*Math.pow(1-V,2)+2.5*r.warp,M=Math.max(1,Math.floor(de*Math.max(t.density,.05)+.5)),_=de/M,W=9+r.travel,D=t.colors.map(Re);se.fill(0);for(let i=0;i<me;i++)se.set(D[Math.min(i,D.length-1)],i*3);const Q=i=>(2*i-o)/o,Fe=i=>(2*i-a)/o,s=N(B,z);if(e.uniform2f(s.uView,o,a),e.uniform1f(s.uZoom,t.zoom),e.uniform1f(s.uPhase,W%(16*_)),e.uniform1f(s.uTwinkleClock,W%de),e.uniform1f(s.uRings,M),e.uniform3fv(s.uColors,se),e.uniform1i(s.uColorCount,D.length),e.uniform1i(s.uStreakCount,t.streakCount),e.uniform1i(s.uColumns,t.streakWidth>1?2:1),e.uniform1f(s.uWidth,5e-4*t.streakWidth),e.uniform1f(s.uTail,19/(t.streakLength*F)),e.uniform1f(s.uTwinkle,t.twinkle),e.uniform1f(s.uHead,t.headGlow),e.uniform1f(s.uDepth,t.depth),e.uniform4f(s.uMouse,Q(r.mouseX),Fe(r.mouseY),t.mouseInteraction?t.mouseStrength*r.touch:0,t.mouseRadius),e.uniform3f(s.uLens,Q(r.lensX),Fe(r.lensY),t.mouseInteraction?.5*t.lens*r.touch:0),e.uniform1f(s.uLightMode,t.lightMode?1:0),e.uniform1f(s.uEncode,re),e.drawArrays(e.TRIANGLES,0,3),t.bloom>0){let i=B;j.forEach(([c,T])=>{const S=N(c,q);P(0,i.texture),e.uniform1i(S.uSource,0),e.uniform2f(S.uTarget,c.width,c.height),e.uniform2f(S.uTexel,1/i.width,1/i.height),e.uniform1f(S.uLimit,4*re),e.drawArrays(e.TRIANGLES,0,3);let C=N(T,U);P(0,c.texture),e.uniform1i(C.uSource,0),e.uniform2f(C.uTarget,T.width,T.height),e.uniform2f(C.uStep,1/c.width,0),e.drawArrays(e.TRIANGLES,0,3),C=N(c,U),P(0,T.texture),e.uniform1i(C.uSource,0),e.uniform2f(C.uTarget,c.width,c.height),e.uniform2f(C.uStep,0,1/T.height),e.drawArrays(e.TRIANGLES,0,3),i=c})}const x=N(null,H);P(0,B.texture),e.uniform1i(x.uScene,0),j.forEach(([i],c)=>{P(c+1,i.texture),e.uniform1i(x[`uBloom${c}`],c+1)}),e.uniform2f(x.uView,o,a),e.uniform1f(x.uDecode,1/re),e.uniform1f(x.uGlow,t.glow),e.uniform1f(x.uBloom,t.bloom),e.uniform1f(x.uPresence,K),e.uniform1f(x.uOpacity,t.opacity),e.uniform1f(x.uFade,t.fade),e.uniform1f(x.uLightMode,t.lightMode?1:0),e.uniform3fv(x.uTopColor,Re(t.backgroundColor)),e.uniform1f(x.uTopGlow,t.backgroundGlow),e.drawArrays(e.TRIANGLES,0,3);for(let i=De;i>=0;i--)P(i,null)},le=t=>{if(d=0,!A||document.hidden||L)return;if(w&&t-w<ge.frameInterval-1){d=requestAnimationFrame(le);return}const o=R.current,a=w?Math.min(.05,(t-w)/1e3):1/60;w=t,!o.intro||v?r.intro=1:r.intro<1&&(r.intro=Math.min(1,r.intro+a/mt));const h=o.holdToWarp&&u.held&&u.inside&&!v;r.warp+=((h?1:0)-r.warp)*(1-Math.exp(-a*(h?2.2:1.6)));const O=dt*Math.pow(1-r.intro,2)+6*r.warp,V=!o.paused&&!v;V&&(r.travel+=a*.1*o.speed*(1+O));const K=m.width/Math.max(1,g.clientWidth),F=u.x*K,M=(g.clientHeight-u.y)*K,_=o.mouseInteraction&&u.inside&&!v;_&&r.touch<.01&&(r.mouseX=F,r.mouseY=M,r.lensX=F,r.lensY=M);const W=o.mouseDampening>0?1-Math.exp(-a/o.mouseDampening):1;r.mouseX+=(F-r.mouseX)*W,r.mouseY+=(M-r.mouseY)*W;const D=1-Math.exp(-a*6);r.lensX+=(F-r.lensX)*D,r.lensY+=(M-r.lensY)*D,r.touch+=((_?1:0)-r.touch)*(1-Math.exp(-a*(_?4:2))),ce();const Q=r.intro<1||r.warp>.001||Math.abs((_?1:0)-r.touch)>.002;V&&o.speed!==0||Q?d=requestAnimationFrame(le):w=0},E=()=>{!d&&!L&&A&&!document.hidden&&(d=requestAnimationFrame(le))},fe=()=>{const t=R.current,o=Math.max(1,g.clientWidth),a=Math.max(1,g.clientHeight),h=it(o,a,t.dpr,ge);m.width=Math.max(1,Math.round(o*h)),m.height=Math.max(1,Math.round(a*h)),!d&&!L&&ce(),E()},Ae=t=>{const o=g.getBoundingClientRect(),a=t.clientX-o.left,h=t.clientY-o.top;return{x:a,y:h,inside:a>=0&&h>=0&&a<=o.width&&h<=o.height}},Me=t=>{if(!A||document.hidden||v||v)return;const o=Ae(t);u.x=o.x,u.y=o.y,u.inside=o.inside,E()},Se=t=>{if(!A||document.hidden||v||v)return;const o=Ae(t);o.inside&&(u.x=o.x,u.y=o.y,u.inside=!0,u.held=!0,E())},$=t=>{u.held=!1,t.pointerType!=="mouse"&&(u.inside=!1),E()},Z=()=>{u.inside=!1,u.held=!1,E()},Ce=()=>{document.hidden&&(cancelAnimationFrame(d),d=0,w=0),document.hidden&&(u.inside=u.held=!1),w=0,E()},ye=t=>{v=t.matches,v&&(u.inside=u.held=!1,r.warp=r.touch=0,r.intro=1),E()};ue.addEventListener("change",ye);const Le=new ResizeObserver(fe);Le.observe(g);const Pe=new IntersectionObserver(t=>{A=t.some(o=>o.isIntersecting),A||(cancelAnimationFrame(d),d=0,w=0),A&&(w=0,E())});Pe.observe(g),window.addEventListener("pointermove",Me,{passive:!0}),window.addEventListener("pointerdown",Se,{passive:!0}),window.addEventListener("pointerup",$,{passive:!0}),window.addEventListener("pointercancel",$,{passive:!0}),document.documentElement.addEventListener("pointerleave",Z),window.addEventListener("blur",Z),document.addEventListener("visibilitychange",Ce),fe();let ke=R.current.dpr;return te.current=()=>{const t=R.current;if(t.dpr!==ke){ke=t.dpr,fe();return}!d&&!L&&ce(),E()},()=>{at(m,e),cancelAnimationFrame(d),te.current=null,m.removeEventListener("webglcontextlost",Ee),m.removeEventListener("webglcontextrestored",Te),Le.disconnect(),Pe.disconnect(),window.removeEventListener("pointermove",Me),window.removeEventListener("pointerdown",Se),window.removeEventListener("pointerup",$),window.removeEventListener("pointercancel",$),document.documentElement.removeEventListener("pointerleave",Z),window.removeEventListener("blur",Z),ue.removeEventListener("change",ye),document.removeEventListener("visibilitychange",Ce),!L&&!e.isContextLost()&&([B,...j.flat()].forEach(t=>{t.texture&&e.deleteTexture(t.texture),e.deleteFramebuffer(t.framebuffer)}),[z,q,U,H].forEach(t=>e.deleteProgram(t.program)),e.deleteBuffer(be),e.deleteVertexArray(oe))}},[et]),y.useEffect(()=>{te.current?.()}),_e.jsx("div",{ref:pe,className:`lightfall-container${xe?` ${xe}`:""}`,style:{...he?{mixBlendMode:he}:null,...Je},children:_e.jsx("canvas",{ref:ve,className:"lightfall-canvas","aria-hidden":"true"})})};export{xt as default};
