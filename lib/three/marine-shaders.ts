export const marineVertex = /* glsl */ `
uniform float uTime;
uniform float uKind;
uniform float uSpeed;
attribute float aPart;
attribute float aGlow;
attribute float aSeed;
varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vLocal;
varying float vGlow;

void main() {
  vec3 p = position;
  float time = uTime + aSeed * 17.0;
  // Swim cadence scales with cruise speed so small/fast animals don't
  // flap at the same rate as rays and turtles.
  float cadence = clamp(uSpeed * 22.0, 0.6, 3.2);
  if (uKind < 0.5 || uKind > 5.5) {
    // A travelling body wave strengthens toward the caudal fin.
    float tail = pow(clamp((0.65-p.x)/2.2, 0.0, 1.0), 1.7);
    p.z += sin(time * 5.0 * cadence + p.x * 2.6) * tail * 0.27;
    if (aPart > 0.5) p.y += sin(time*5.0*cadence+p.x*2.6)*tail*0.035;
  } else if (uKind < 2.5) {
    if (aPart > 0.5 && aPart < 1.5) {
      float wing = pow(abs(p.z)/(uKind < 1.5 ? 1.85 : 1.4), 1.5);
      // Rays glide: slower flap with a hold phase; turtles paddle slightly faster.
      float flap = uKind < 1.5 ? 1.05 : 1.6;
      float glide = 0.65 + 0.35*sin(time*0.22+aSeed*6.0);
      p.y += sin(time*flap*cadence-abs(p.z)*1.7)*wing*(uKind < 1.5 ? 0.48 : 0.32)*glide;
    }
    if (aPart > 1.5) p.z += sin(time*1.7*cadence-p.x*2.0)*0.06;
  } else if (uKind < 3.5) {
    float pulse = sin(time*2.1);
    if(aPart < 1.5) {p.xz *= 0.94+pulse*0.065; p.y*=1.0-pulse*0.1;}
    else {float t=max(0.0,-p.y);p.x+=sin(time*1.5+t*3.0)*t*0.09;p.z+=cos(time*1.1+t*2.0)*t*0.065;}
  } else if (uKind < 4.5) {
    if(aPart > 1.5) {float tail=max(0.0,-p.x-0.5);p.y+=sin(time*2.4*cadence+tail*3.5)*tail*0.09;p.z+=cos(time*1.7*cadence+tail*3.0)*tail*0.08;}
    if(aPart > 0.5 && aPart < 1.5) p.y+=sin(time*3.5*cadence+p.x*5.0)*abs(p.z)*0.1;
    if(aPart < 0.5) p.yz *= 1.0+sin(time*2.3*cadence)*0.035;
  } else {p.x+=sin(time*0.7+p.y*1.8)*0.12;p.z+=cos(time*0.6+p.y*1.5)*0.08;}
  vec4 world = modelMatrix * instanceMatrix * vec4(p, 1.0);
  vec4 mv = viewMatrix * world;
  vPosition = mv.xyz;
  vNormal = normalize(normalMatrix * mat3(instanceMatrix) * normal);
  vColor = color;
  vLocal = p;
  vGlow = aGlow;
  gl_Position = projectionMatrix * mv;
}`;

export const marineFragment = /* glsl */ `
uniform float uDepth;
uniform float uOpacity;
uniform float uKind;
varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vLocal;
varying float vGlow;

void main() {
  vec3 n = normalize(vNormal);
  if (!gl_FrontFacing) n = -n;
  vec3 light = normalize(vec3(-0.5, 1.0, 0.8));
  vec3 view = normalize(-vPosition);
  float diffuse = max(dot(n,light),0.0);
  float fresnel = pow(1.0-abs(dot(n,view)),2.8);
  float specular = pow(max(dot(reflect(-light,n),view),0.0),34.0);
  // Physical falloff: sunlit → twilight → near-black aphotic, with only
  // bioluminescence remaining at 1000m.
  float sun = 1.0-smoothstep(40.0,650.0,uDepth);
  float twilight = (1.0-smoothstep(150.0,850.0,uDepth))*0.35;
  float illumination = sun*0.8+twilight*0.5+0.015;
  vec3 color = vColor * (0.2 + diffuse*0.85) * illumination;
  color += vec3(0.45,0.73,0.78)*specular*0.28*illumination;
  float organic = sin(vLocal.x*83.0)*sin(vLocal.y*99.0+vLocal.z*51.0);
  color *= 0.975 + organic*0.025;
  // Bioluminescent glow takes over as sunlight vanishes.
  float bio = smoothstep(250.0,900.0,uDepth);
  color += vec3(0.21,0.63,0.69)*vGlow*(0.25+bio*1.4);
  float alpha=uOpacity;
  if(uKind>2.5 && uKind<3.5) {
    color+=vec3(0.27,0.57,0.66)*(fresnel*0.3+0.08);
    alpha*=0.42+fresnel*0.43+vGlow*0.5;
  }
  float fogDensity = 0.022+clamp(uDepth/1000.0,0.0,1.0)*0.055;
  float fog=1.0-exp(-max(0.0,-vPosition.z-6.0)*fogDensity);
  color=mix(color,vec3(0.008,0.032,0.048),fog);
  gl_FragColor=vec4(color,alpha*(1.0-fog*0.72));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
