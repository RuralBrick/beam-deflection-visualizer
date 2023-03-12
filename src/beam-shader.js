import { defs, tiny } from '../examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

/**
 * NOTE: Assumes `length` is measured from leftmost x to rightmost x in *world
 * coordinates*.
 */
export class Beam_Shader extends Shader {
    update_GPU(context, gpu_addresses, program_state, model_transform, material) {
        const [P, C, M] = [program_state.projection_transform, program_state.camera_inverse, model_transform],
            PC = P.times(C);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(M.transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_transform, false,
            Matrix.flatten_2D_to_1D(PC.transposed()));

        // Bridge properties
        context.uniform1f(gpu_addresses.E, material.youngs_modulus);
        context.uniform1f(gpu_addresses.L, material.length);
        context.uniform1f(gpu_addresses.I, material.moment_of_inertia);

        // External factors
        context.uniform3fv(gpu_addresses.force, material.force.normalized_direction.times(material.force.abs_magnitude));
        context.uniform3fv(gpu_addresses.force_position, material.force.position);

        // Colors
        context.uniform4fv(gpu_addresses.neg_color, material.neg_color);
        context.uniform4fv(gpu_addresses.zero_color, material.zero_color);
        context.uniform4fv(gpu_addresses.pos_color, material.pos_color);
        context.uniform1f(gpu_addresses.min_stress, material.min_stress);
        context.uniform1f(gpu_addresses.max_stress, material.max_stress);
    }

    shared_glsl_code() {
        return `
            precision mediump float;

            uniform mat4 model_transform;
            
            uniform vec3 force;
            uniform vec3 force_position;

            uniform float E;
            uniform float L;
            uniform float I;

            varying vec3 beam_position;
            
            vec3 worldToBeamCoord(vec3 coord) {
                vec4 displacement = model_transform[3];
                coord -= vec3( displacement );
                coord.x += L/2.;
                coord.y *= -1.;
                return coord;
            }
        `;
    }

    vertex_glsl_code() {
        return this.shared_glsl_code() + `
            uniform mat4 projection_camera_transform;

            attribute vec3 position;

            void main() {
                vec4 world_position = model_transform * vec4( position, 1. );
                beam_position = worldToBeamCoord( vec3( world_position ) );

                float x = beam_position.x;
                float a = worldToBeamCoord(force_position).x;
                float b = L - a;
                float P = -force.y;

                float y;
                if (x < a)
                    y = P*b*x/(6.*L*E*I)*(L*L - x*x - b*b);
                else
                    y = P*b/(6.*L*E*I)*(L/b*pow(x-a,3.) + (L*L-b*b)*x - x*x*x);

                world_position.y -= y;

                gl_Position = projection_camera_transform * world_position;
            }
        `;
    }

    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            uniform vec4 neg_color;
            uniform vec4 zero_color;
            uniform vec4 pos_color;
            uniform float min_stress;
            uniform float max_stress;

            void main() {
                float x = beam_position.x;
                float y = beam_position.y;
                float c = worldToBeamCoord(force_position).x;
                float P = -force.y;

                float stress;
                if (x < c)
                    stress = y/I*P*(1.-c/L)*x;
                else
                    stress = y/I*P*c*(1.-x/L);
                
                float clamped_stress = clamp( stress, min_stress, max_stress );

                if (clamped_stress < 0.)
                    gl_FragColor = mix( zero_color, neg_color, clamped_stress/min_stress );
                else
                    gl_FragColor = mix( zero_color, pos_color, clamped_stress/max_stress );
            }
        `;
    }
}
