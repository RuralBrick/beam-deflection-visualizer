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
    }

    shared_glsl_code() {
        return `
            precision mediump float;

            uniform vec3 force;
            uniform vec3 force_position;

            uniform float E;
            uniform float L;
            uniform float I;

            varying vec3 world_position;
        `;
    }

    vertex_glsl_code() {
        return this.shared_glsl_code() + `
            uniform mat4 model_transform;
            uniform mat4 projection_camera_transform;

            attribute vec3 position;

            float worldXToBeamX(float x) {
                vec4 displacement = model_transform[3];
                return x - displacement.x + L/2.;
            }

            void main() {
                vec4 world_position = model_transform * vec4( position, 1. );

                float x = worldXToBeamX(world_position.x);
                float a = worldXToBeamX(force_position.x);
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
            void main() {
                gl_FragColor = vec4( 1., 0., 0., 1. );
            }
        `;
    }
}
