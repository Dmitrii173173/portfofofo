let computeVert = `
precision highp float;

attribute vec2 aPosition;

varying vec2 vUv;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vUv = aPosition * 0.5 + 0.5;
}`;

let computeFrag = `
precision highp float;


uniform sampler2D uPrevBuffer;   // previous ping-pong texture
uniform sampler2D uPebbles;      // 2D pebbles texture
uniform sampler2D uNoiseTexture; // 2D pebbles texture

uniform float     uTime;
uniform vec2      uResolution;
uniform vec2      uMouse;

varying vec2 vUv;























const int   VIEW_SAMPLES    = 35;
const int   LIGHT_SAMPLES   = 20;
const int   AMBIENT_SAMPLES = 8;
const float SAMPLING_RATIO = float(VIEW_SAMPLES) / float(LIGHT_SAMPLES);
const float AMBIENT_SAMPLING_RATIO = float(VIEW_SAMPLES) / float(AMBIENT_SAMPLES);
// 					    light DIAMETER (not radius!) / samples count
const float STEP_SIZE = (30.0 / float(VIEW_SAMPLES)) * 1.5;
const float STEP_INCREMENTOR = 0.0;
const float LIGHT_STEP_SIZE = STEP_SIZE * SAMPLING_RATIO;
//const float AMBIENT_STEP_SIZE = STEP_SIZE * AMBIENT_SAMPLING_RATIO;
const float DENSITY = 2.8095;

const float RAIN_CHARGE = 1.0;      
const float LIGHT_STRENGHT = 25.0;
const float AMBIENT_STRENGHT = 0.6;
 
const float REPROJECTION_FACTOR = 1.0;
const float JITTER_STRENGHT = 0.8;

// #define HALVE_RENDER_SIZE
#define VOLUME_TEXTURES

const vec3  LIGHT_COLOR = vec3(1.0, 0.4, 0.15) * LIGHT_STRENGHT;
// const float G = 0.4;    // <--- That's also VEEEERY NICE!!
const float G = 0.2;
const float G2 = G * G;

const bool BEERS_POWDER = false;







float noise(in vec3 x){
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
// #ifdef VOLUME_TEXTURES    
//     return textureLod(iChannel2, (p+f+0.5)/32.0, 0.0).x;
// #else
 	vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;
 	vec2 rg = texture2D( uNoiseTexture/*iChannel2*/, (uv+0.5)/256.0, 0.0).yx;
 	return mix( rg.x, rg.y, f.z );
// #endif
}


float fbm( vec3 p )
{
    mat3 m = mat3( 0.00,  0.80,  0.60,
              -0.80,  0.36, -0.48,
              -0.60, -0.48,  0.64 );    
    float f;
    f  = 0.5000*noise( p ); p = m*p*2.02;
    f += 0.2500*noise( p ); p = m*p*2.03;
    f += 0.1250*noise( p );
    return f;
}

// Noise generation functions (by iq)
float hash( float n )
{
    return fract(sin(n)*43758.5453);
}

float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

float rand(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float numericalMieFit(float costh)
{
    // This function was optimized to minimize (delta*delta)/reference in order to capture
    // the low intensity behavior.
    float bestParams[10];
    bestParams[0]=9.805233e-06;
    bestParams[1]=-6.500000e+01;
    bestParams[2]=-5.500000e+01;
    bestParams[3]=8.194068e-01;
    bestParams[4]=1.388198e-01;
    bestParams[5]=-8.370334e+01;
    bestParams[6]=7.810083e+00;
    bestParams[7]=2.054747e-03;
    bestParams[8]=2.600563e-02;
    bestParams[9]=-4.552125e-12;
    
    float p1 = costh + bestParams[3];
    vec4 expValues = exp(vec4(bestParams[1] *costh+bestParams[2], bestParams[5] *p1*p1, bestParams[6] *costh, bestParams[9] *costh));
    vec4 expValWeight= vec4(bestParams[0], bestParams[4], bestParams[7], bestParams[8]);
    return dot(expValues, expValWeight);
}

float HenyeyGreensteinPhase(float LdV) {
    // return 1.0;
	return 0.07957747154 * ((1.0 - G2) / (1.0 + G2 - 2.0 * G * pow(LdV, 3.0 / 2.0)));
}

float sphereDensity(vec3 point) {
    float distance = length(point - vec3(0.0, 0.0, 20.0));
    if (distance > 15.0) return 0.0;
    
    
    float distance_attenuator = pow(1.0 - distance / 15.0, 1.3);
    /*float distance_attenuator = 1.0;
    if(point.z < 7.0 || point.z > 15.0)   distance_attenuator = 0.0;    
    //if(point.x < -10.0 || point.x > 10.0) distance_attenuator = 0.0;
    if(point.y < -6.0 || point.y > 6.0)   distance_attenuator = 0.0;*/
   
    float increaser = 1.0 - (distance / 6.0);
    increaser = clamp(increaser, 0.0, 1.0);
    increaser = pow(increaser, 0.75);
    
    
    float largeWeather = distance_attenuator * 5.0;
    float den = max(0.0, largeWeather - 0.9*fbm(point * 0.4 + uTime * 0.2));
    if(den <= 0.0)
        return 0.0;
    
    
    den= max(0.0, den-0.2*fbm(point*0.05));
    
    if(point.y > 2.0) {
    	float decreaser = 1.0 - texture2D(uPebbles /*iChannel1*/, point.xz * 0.025 +uTime * 0.02).x;
        decreaser = pow(decreaser, 6.0) * (point.y - 2.0);
        //largeWeather -= decreaser;
    }
    
    if(largeWeather < 0.0) largeWeather = 0.0;
    
    
    largeWeather = largeWeather*0.06*min(1.0, 5.0*den);
    
    if(point.y > 0.5) {
        //float buggerStrenght = 0.0135 + (point.y - 0.5) * 0.0075;
		//float buggerStrenght = pow(distance, 2.0) * 0.0005; //(point.y - 0.5) * 0.0075 + abs(point.x) * 0.01;
		float buggerStrenght = -0.03 + (point.y - 0.5) * 0.0075 + abs(point.x) * 0.01;
        
        
        if(buggerStrenght < 0.0) buggerStrenght = 0.0;
        
        float bugger = pow(texture2D(uPebbles /*iChannel1*/, point.xy * 0.05 + vec2(uTime * 0.02, 0.0)).x, 2.0) * 1.5;
        bugger *= buggerStrenght;
        float buggedLargeWeather = clamp(largeWeather, 0.0, bugger);
        float t = clamp((point.y - 0.5) * 1.0, 0.0, 1.0);
        
        largeWeather = buggedLargeWeather * t + largeWeather * (1.0 - t); // smoothstep(buggedLargeWeather, largeWeather, 0.07);
    
        if(point.y > 1.5 && point.z > 15.0) {
        	// largeWeather *= 0.1;
        	float t2 = length(point.xy);
        	t2 = clamp(   pow(max(t2 - 7.0, 0.0), 3.5)    , 0.0, 1000.0) * 0.000524;
        
    		largeWeather = clamp(largeWeather * 2.0, 0.0, t2);	
        }
    }
    if(point.y < 1.0) {
    	//largeWeather = largeWeather * (1.0 + abs(1.0 - point.y) * 0.3);
    }
    if(point.y < -3.0) {
        //largeWeather = clamp(        largeWeather * (1.0 - abs(-3.0 - point.y) * 0.25),      0.0, 1.0);
    }
    
    
    //if (point.z > 6.0 && point.z < 8.5)
    //	largeWeather += 0.4*fbm(point * 2.115 + uTime * 0.2);
            
    
    
    return largeWeather + increaser * 1.0;
    
    
    
    float computedDensity = largeWeather;
    computedDensity = clamp(computedDensity, 0.0, 6.0);
    
    
	return computedDensity;
}


float calculateDensity(vec3 raymarchPosition) {
	return sphereDensity(raymarchPosition);
}

// float calculateTransmittance(float density) {
// 	 return clamp(2.0 * exp(-density) * (1.0 - exp(-density * 2.0)), 0.0, 1.0);
// }


vec3 sampleSun(vec3 samplePosition, vec3 lightDir) {
    
    float accumulatedLinearDensity = 0.0;
    float transmittance = 1.0;
    
    vec3 raymarchPosition = samplePosition + lightDir * STEP_SIZE * JITTER_STRENGHT * hash(dot(samplePosition * 5.0, vec3(12.256, 2.646, 6.356)) + uTime);
    for(int i = 0; i < LIGHT_SAMPLES; i++) {
    	
    	raymarchPosition += lightDir * LIGHT_STEP_SIZE;
        
        float densityAtPoint = calculateDensity(raymarchPosition) * DENSITY; //LIGHT_DENSITY;
        
        accumulatedLinearDensity += densityAtPoint;
        
        transmittance *= exp( -densityAtPoint * LIGHT_STEP_SIZE );
        //transmittance = calculateTransmittance( accumulatedLinearDensity * LIGHT_STEP_SIZE );
    }
    
    
    if(BEERS_POWDER) 
        return LIGHT_COLOR * transmittance * (1.0 - exp(-accumulatedLinearDensity * LIGHT_STEP_SIZE * float(LIGHT_SAMPLES)));
    else
    	return LIGHT_COLOR * transmittance;
}


float Ei( float z )
{
    
	return 0.5772156649015328606065 + log( 0.0001 + abs(z) ) + z * (1.0 + z * (0.25 + z * ( (1.0/18.0) + z * ( (1.0/96.0) + z *
		   (1.0/600.0) ) ) ) ); // For x!=0
    
	return 0.5772156649015328606065 + log( 1e-4 + abs(z) ) + z * (1.0 + z * (0.25 + z * ( (1.0/18.0) + z * ( (1.0/96.0) + z *
		   (1.0/600.0) ) ) ) ); // For x!=0
}

vec3 sampleAmbient(vec3 samplePosition, float density) {
     
    
    float VolumeTop = 10.0;
    float VolumeBottom = -10.0;
    vec3 IsotropicLightTop = vec3(0.25, 0.66, 0.9) * AMBIENT_STRENGHT;
    vec3 IsotropicLightBottom = vec3(0.75, 0.3, 0.2) * AMBIENT_STRENGHT;
    
    //float Hp = VolumeTop - samplePosition.y; // Height to the top of the volume
    
    float AMBIENT_STEP_SIZE = (VolumeTop - VolumeBottom) / float(AMBIENT_SAMPLES * 3);
    
    
    {
    float accumulatedLinearDensity = 0.0;
    
    vec3 raymarchPosition = samplePosition + vec3(0.0, 1.0, 0.0) * STEP_SIZE * JITTER_STRENGHT * hash(dot(samplePosition * 5.0, vec3(12.256, 2.646, 6.356)) + uTime);;
    for(int i = 0; i < AMBIENT_SAMPLES; i++) {
    	
    	raymarchPosition += vec3(0.0, 1.0, 0.0) * AMBIENT_STEP_SIZE;
        
        float densityAtPoint = calculateDensity(raymarchPosition) * DENSITY; //LIGHT_DENSITY;
        accumulatedLinearDensity += densityAtPoint;
    }
    density = accumulatedLinearDensity;
    }
    
    
    
    float a = -density * AMBIENT_STEP_SIZE * float(AMBIENT_SAMPLES) * 0.06;// * Hp;
    vec3 IsotropicScatteringTop = IsotropicLightTop * max( 0.0, exp( a ) - a * Ei( a ));
    //float Hb = samplePosition.y - VolumeBottom; // Height to the bottom of the volume
    

    
    
    {
    float accumulatedLinearDensity = 0.0;
    
    vec3 raymarchPosition = samplePosition;
    for(int i = 0; i < AMBIENT_SAMPLES; i++) {
    	
    	raymarchPosition += vec3(0.0, -1.0, 0.0) * AMBIENT_STEP_SIZE;
        
        float densityAtPoint = calculateDensity(raymarchPosition) * DENSITY; //LIGHT_DENSITY;
        
        accumulatedLinearDensity += densityAtPoint;
    }
    density = accumulatedLinearDensity;
    }
    
    
    a = -density * AMBIENT_STEP_SIZE * float(AMBIENT_SAMPLES) * 0.06;// * Hb;
    vec3 IsotropicScatteringBottom = IsotropicLightBottom * max( 0.0, exp( a ) - a * Ei( a ));

    
    //return vec3(0.0);
    return (IsotropicScatteringTop + IsotropicScatteringBottom) * AMBIENT_STRENGHT;
    
    /*float accumulatedLinearDensity = 0.0;
    float transmittance = 1.0;
    
    vec3 rayDir = -lightDir; // vec3(0.0, 1.0, 0.0);
    if (pass > 0.0) rayDir = vec3(0.0, -1.0, 0.0);
    
    vec3 ambientColor = vec3(0.25, 0.66, 0.9);
    if (pass > 0.0) ambientColor = vec3(0.75, 0.3, 0.2);

    ambientColor *= AMBIENT_STRENGHT;
    
    vec3 raymarchPosition = samplePosition;
    for(int i = 0; i < LIGHT_SAMPLES; i++) {
    	
    	raymarchPosition += rayDir * LIGHT_STEP_SIZE;
        
        float densityAtPoint = calculateDensity(raymarchPosition) * LIGHT_DENSITY;
        
        accumulatedLinearDensity += densityAtPoint;   
        
        transmittance *= exp( -densityAtPoint * LIGHT_STEP_SIZE );
    }
    
    return ambientColor * transmittance;*/
}


vec3 robobo1221Tonemap(vec3 color)
{
    #define rTOperator(x) (x / sqrt(x*x+1.0))

    float l = length(color);

    color = mix(color, color * 0.5, l / (l+1.0));
    color = rTOperator(color);

    return color;
}

void main()
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = gl_FragCoord.xy/uResolution.xy;
	float aspect = uResolution.x / uResolution.y;
 
   
    vec4 prevColor = vec4(0.0); // texture(iChannel0, uv);
    
    
    #ifdef HALVE_RENDER_SIZE
    // at the moment this doesn't seem to help with performance
      float pixnum = mod(gl_FragCoord.x, 2.0) + mod(gl_FragCoord.y, 2.0);
      float pixtarget = mod(float(iFrame), 4.0);
    
      if(pixnum != pixtarget) {
          fragColor = prevColor;
       	  return;
      }
    #endif
    
    
    vec2 ndc = uv * 2.0 - 1.0;
    ndc.x *= aspect;
    
    vec3 rayOrigin = vec3(0.0);
    vec3 rayDir    = normalize(     vec3(0.0, 0.0, 1.0) + vec3(ndc.xy, 0.0)     );
    
    vec2 mousePosNDC = (uMouse.xy / uResolution.xy) * 2.0 - 1.0;
    mousePosNDC.x *= aspect;
    vec3 lightDir  = normalize(vec3(mousePosNDC.xy * 2.0, 1.0));
    
    
    
    
    
    float accumulatedLinearDensity = 0.0;
    
    float LdV         = dot(rayDir, lightDir);
    if(LdV < 0.0) LdV = dot(rayDir, -lightDir);
    float A1dV         = dot(rayDir, vec3(0.0, 1.0, 0.0));
    if(A1dV < 0.0) A1dV = dot(rayDir, -vec3(0.0, 1.0, 0.0));
    float A2dV         = dot(rayDir, vec3(0.0, -1.0, 0.0));
    if(A2dV < 0.0) A2dV = dot(rayDir, -vec3(0.0, -1.0, 0.0));
    
    // LdV = pow(LdV, 0.4);
    
    float PhaseSun      = numericalMieFit(LdV);    
    float PhaseAmbient1 = numericalMieFit(A1dV);
    float PhaseAmbient2 = numericalMieFit(A2dV);
   
    
    vec3 scattering = vec3(0.0);
    vec3 raymarchPosition = rayOrigin + rayDir * 5.0 + rayDir * STEP_SIZE * JITTER_STRENGHT * hash(dot(rayDir * 5.0, vec3(12.256, 2.646, 6.356)) + uTime);
    
	float transmittance = 1.0;
    for(int i = 0; i < VIEW_SAMPLES; i++) {
    	
    	raymarchPosition += rayDir * STEP_SIZE;
        
        vec3 littleJitter = vec3(0.0, 0.0, rand(gl_FragCoord.xy * 0.34) * 0.4); 
        float densityAtPoint = calculateDensity(raymarchPosition/* + littleJitter*/) * DENSITY;
        
        // skip non-contributing sample
        if(densityAtPoint == 0.0) continue;
   
        
        // from now on a light sample is required
        accumulatedLinearDensity += densityAtPoint;        
        
      
        // transmittance *= exp( -densityAtPoint * STEP_SIZE );
        // transmittance = calculateTransmittance( accumulatedLinearDensity * STEP_SIZE );

        
        //scattering += sampleSun(raymarchPosition, phase, lightDir) * transmittance;    
        vec3 SunColor = sampleSun(raymarchPosition, lightDir);
        vec3 AmbientColor1 = sampleAmbient(raymarchPosition, densityAtPoint);
        // vec3 AmbientColor2 = sampleAmbient(raymarchPosition, 1.0);
        vec3 StepScattering = densityAtPoint * /*STEP_SIZE **/ (PhaseSun * SunColor + 
                                                                /*PhaseAmbient1 **/ AmbientColor1);// + 
                                                              //PhaseAmbient2 * AmbientColor2);

        
 		//scattering += transmittance * StepScattering; // Accumulate scattering attenuated by extinction
        scattering += transmittance * (StepScattering - StepScattering * exp(-densityAtPoint * STEP_SIZE)) / densityAtPoint;
        
        transmittance *= exp( -densityAtPoint * STEP_SIZE );
    }
    
   
    vec4 computedColor = vec4(scattering, transmittance);

	// vec3 backgroundColor = vec3(0.25, 0.66, 0.9) * 0.199; //     * 0.0;
	vec3 backgroundColor = vec3(0.025, 0.025, 0.025); //     * 0.0;
    vec3 col = mix(vec3(backgroundColor), vec3(computedColor), 1.0 - computedColor.a);
    
    vec3 color = pow(col, vec3(1.0 / 2.2));
    color = robobo1221Tonemap(color);
    
    
    
    // Output to screen
    float rf = 1.0 / REPROJECTION_FACTOR;
    // gl_FragColor = vec4(color * rf + prevColor.rgb * (1.0 - rf), 1.0);
    gl_FragColor = vec4(color, 1.0);
}`;