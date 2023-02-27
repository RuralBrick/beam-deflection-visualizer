//21/09/20 : Fixed the spectrum function.

#define exposure 1.
#define DISPLAY_GAMMA 2.2
#define DISPERSION 8.
#define SAMPLES 8
const float N_AIR = 1.0;

const vec3 GLASS_COL = vec3(0.9);
//const vec3 GLASS_COL = vec3(0.9,0.5,0.2);
//const vec3 GLASS_COL = vec3(0.99,0.61,0.5);
const vec3 GLASS_REF = pow(GLASS_COL,vec3(0.6));

//Minimal sphere raytrace
float trace(vec3 rd, vec3 ro) {
    float r = (sin(iTime/1.5)*0.5+0.5)*0.6+0.4;
    float x0 = max(dot(-ro,rd),0.);
    vec3 a = x0*rd+ro;
    float b = dot(a,a);
    float c = sqrt(r*r-b);
    return (x0-c*sign(x0-c))*step(b,r*r);
}

float get_fresnel(vec3 rd, vec3 n, float n1, float n2){
    float cosI = abs(dot(rd, n));
    float cosR = n1/n2 * sqrt(1.-cosI*cosI);
    if(cosR > 1.0) return 1.0; // total internal reflection
    cosR = sqrt(1.0 - cosR * cosR);
    float Rs = (n1*cosI - n2*cosR)/(n1*cosI + n2*cosR);
    float Rp = (n1*cosR - n2*cosI)/(n1*cosR + n2*cosI);
    return (Rs*Rs+Rp*Rp)*0.5;
}

vec3 _sample(vec3 rd) {
	vec3 col = texture(iChannel0,rd).rgb;
    col = pow(col*1.3,vec3(DISPLAY_GAMMA+3.5));
    col *= mix(vec3(0.1,0.3,0.9),vec3(0.9,0.27,0.08),rd.x*0.5+0.5);
    //col *= mix(vec3(0.1,0.9,0.3),vec3(1.,.5,.2),rd.z*0.5+0.5);
    return col;
}

//Cauchy's equation
float get_n_glass(float lambda, float disp)
{
    lambda *= 1e-3;
    return 1.5046 + 0.0042*disp / (lambda*lambda);
}

//spectral_zucconi6 but corrected so it integrates to white (1,1,1) ---------------------
vec3 bump3(vec3 x, vec3 yoffset)
{
    vec3 y = 1. - x * x;
    y = clamp(y-yoffset,0.,1.);
    return y;
}

vec3 spectral(float lambda)
{
    float x = (lambda - 400.)/ 300.;
    const vec3 c1 = vec3(3.54585, 2.93225, 2.41594);
    const vec3 x1 = vec3(0.69549, 0.49228, 0.27700);
    const vec3 y1 = vec3(0.02313, 0.15225, 0.52608);
    const vec3 c2 = vec3(3.90307, 3.21183, 3.96587);
    const vec3 x2 = vec3(0.11749, 0.86755, 0.66078);
    const vec3 y2 = vec3(0.84897, 0.88445, 0.73949);
    return pow((bump3(c1 * (x - x1), y1) + bump3(c2 * (x - x2), y2)),vec3(2.2)) * vec3(3.64499, 4.4228, 15.6893);
}
//---------------------------------------------------------------------------------------

void mainImage(out vec4 O, in vec2 U) {
    vec2 R = iResolution.xy;
    vec2 uv = (2.*U-R)/R.x;
    float a = (iMouse.z>0.) ? iMouse.x/R.x*3.14 : iTime*0.5;
    vec3 viewPos = vec3(0,0,-1.8);//-cos(iTime)*0.6);

    mat2 mat = mat2(cos(a),-sin(a),sin(a),cos(a));
    vec3 ro = viewPos;
    ro.xz = mat * ro.xz;

    vec3 rd = normalize(vec3(uv,0.8));
    //vec3 rd = normalize(vec3(vec3(uv,0.,1. )));
    rd.xz = mat * rd.xz;

    //Hit depth, pos and normal
    float t = trace(rd,ro);
    vec3 p = ro + rd*t;
    p += rd*0.001;
    vec3 n = normalize(p);

    vec3 acc;

    if (t>0.) {
        float noise = texelFetch(iChannel1,ivec2(U)%1024,0).r;
        noise = fract(noise+1.61803398*float(iFrame%100))*2.-1.;

        for (float lambda = 400.+300.*(0.5+noise*0.5)/float(SAMPLES); lambda<700.; lambda+=300./float(SAMPLES)) {

            float n_glass = get_n_glass(lambda,DISPERSION);

            float ratio = n_glass/N_AIR; //Swap these for an interesting (albeit incorrect) look

            //Bounce 1----------------------------
            float fresnel = get_fresnel(rd,n,N_AIR,n_glass);
            vec3 reflect_rd = reflect(rd,n);
            vec3 refract_rd = refract(rd,n,N_AIR/n_glass);

            //Stop reflected ray
            vec3 reflect_col = _sample(reflect_rd  ) * GLASS_REF;

            //Continue refracted ray
            vec3 bounce_rd = refract_rd;
            float t1 = trace(bounce_rd,p)*0.999;
            vec3 bounce_p = p + bounce_rd*t1;
            vec3 bounce_n = -normalize(bounce_p);

            //Bounce 2-----------------------------
            float fresnel_2 = get_fresnel(bounce_rd,bounce_n,n_glass,N_AIR);
            vec3 reflect_2_rd = reflect(bounce_rd,bounce_n);
            vec3 refract_2_rd = refract(bounce_rd,bounce_n,ratio);

            //Stop refracted ray
            vec3 refract_2_col = _sample(refract_2_rd);

            //Continue reflected ray
            bounce_rd = reflect_2_rd;
            float t2 = trace(bounce_rd,bounce_p)*0.999;
            bounce_p = bounce_p+t2*bounce_rd;
            bounce_n = -normalize(bounce_p);

            //Bounce 3-----------------------------
            float fresnel_3 = get_fresnel(bounce_rd,bounce_n,n_glass,N_AIR);
            vec3 reflect_3_rd = reflect(bounce_rd,bounce_n);
            vec3 refract_3_rd = refract(bounce_rd,bounce_n,ratio);

            //Stop refracted ray
            vec3 refract_3_col = _sample(refract_3_rd);
            vec3 reflect_3_col = _sample(reflect_3_rd);

            //Continue reflected ray
            bounce_rd = reflect_3_rd;
            float t3 = trace(bounce_rd,bounce_p)*0.999;
            bounce_p = bounce_p+t3*bounce_rd;
            bounce_n = -normalize(bounce_p);

            //Combine results----------------------
            vec3 reflect_2_col = mix(refract_3_col,reflect_3_col,fresnel_3); //Fresnel
            reflect_2_col *= pow(GLASS_COL,vec3(t2));                        //Attenuation

            vec3 refract_col = mix(refract_2_col,reflect_2_col,fresnel_2); //Fresnel
            refract_col *= pow(GLASS_COL,vec3(t1));                        //Attenuation

            vec3 col = mix(refract_col,reflect_col,fresnel); //Fresnel for bounce 1

            //Add as a spectral componant
            acc += col*spectral(lambda);
        }

        acc /= float(SAMPLES);
    } else {
        //Background
        acc = _sample(rd)*0.8;
    }

    vec3 col = acc;

    //Tone mapping
    col = vec3(1.0) - exp(-col * exposure);
    //Gamma correction
	col = pow(max(col,0.), vec3(1./DISPLAY_GAMMA));


    O = vec4(col,1.0);
}
