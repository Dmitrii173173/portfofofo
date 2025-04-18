var icov = `#version 300 es
layout(location = 0) in vec4 pos;
layout(location = 1) in vec4 displacedPos;
layout(location = 2) in vec4 musicDisplacedPos;
layout(location = 3) in vec4 mouseVelocity;
layout(location = 4) in vec4 fx;
layout(location = 5) in vec4 fx2;

uniform mat4 projection;
uniform mat4 model;
uniform mat4 view;  

#define PI 3.1415926535897932384626433832795
#define RS 0.4142135623730950488016887242097



uniform float uTime;
uniform float uDeltaTime;


out vec4 Color;
out float vSize;


/*  defines  */
` + shaderPart_colors + `

/*  constants declarations  */
` + shaderPart_sphereRadius + `   
` + shaderPart_canvasHeight + `   

void main() {		

    float saveTheAttributes = pos.x + fx.x + fx2.x + mouseVelocity.x + displacedPos.x;


    vec4 transformedPos = musicDisplacedPos;

    
    gl_Position = projection * view * model * vec4(transformedPos.xyz,   1.0);
    
    float world_point_size = 0.15;
    float distance_from_view = -(view * model * vec4(transformedPos.xyz, 1.0)).z;
    float r = RS; //tan(22.5 * (PI / 180.0));
    float whsize = distance_from_view * r * 2.0;
    float size   = (world_point_size / whsize) * canvasHeight;

    // points closer to the attractor will be smaller in size, the distance was measured (inside pointsTF) as the 
    // Arc length between the two points
    float attractorArcDistance = fx.x;
    float attrSizeMult         = min(fx.x / (sphereCircleLength * 0.15) + 0.1, 1.0);



    float sizeSinWave = ((sin(uTime * 3.0 + pos.w * 0.05) * 0.5 + 0.5) * 1.5 + 0.6);


    gl_PointSize = size * attrSizeMult * sizeSinWave;

    Color = vec4(1,1,1,1);


    float mouseSpeed = length(mouseVelocity.xy);

   
    Color.xyz = ` + shaderPart_pointsMouseSpeedColor + ` 
   
    // if(pos.x < 0.0) Color.xyz = + shaderPart_pointsOutsideSpeedColor +   



    // if this is a hidden point let it's opacity grow only if its moving
    if(fx2.x > 0.9) {
        Color.a = clamp(mouseSpeed, 0.0, 1.0);
    }

    
    gl_PointSize *= length(mouseVelocity.xy) * 0.3 + 1.0;

    // DOF effect - once every 3 points    
    vSize = mod(pos.w, 3.0) == 0.0 ? 70.0 * (gl_PointSize / canvasHeight) : 0.0;
}`;
 
var icof = `#version 300 es
precision mediump float;

in vec4 Color;
in float vSize;

out vec4 FragColor;

void main() {
    float distance = length(gl_PointCoord - vec2(0.5, 0.5));
    float alpha    = 1.0;
    if(distance > 0.4) alpha = 1.0 - (distance - 0.4) / 0.1; 
    if(distance > 0.5) discard;		

    // DOF effect
    if(vSize > 0.0 && distance < 0.4) alpha = mix(1.0, pow((distance / 0.4), 1.5), min(vSize, 2.0));
    
    FragColor = vec4(Color.xyz, alpha * 0.6 * Color.a);
}`;