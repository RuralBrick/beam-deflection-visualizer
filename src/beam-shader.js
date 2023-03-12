import { defs, tiny } from '../examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Beam_Shader extends Shader {
    update_GPU(context, gpu_addresses, program_state, model_transform, material) {
        const [P, C, M] = [program_state.projection_transform, program_state.camera_inverse, model_transform],
            PC = P.times(C);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(M.transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_transform, false,
            Matrix.flatten_2D_to_1D(PC.transposed()));

        // Bridge properties
        context.uniform1f(gpu_addresses.E, material.youngs_modulus);

        const b = material.width;
        const h = material.height;
        context.uniform1f(gpu_addresses.L, material.length);

        const moment_of_inertia = b*(h**3)/12;
        context.uniform1f(gpu_addresses.I, moment_of_inertia);

        // External factors
        context.uniform3fv(gpu_addresses.force, material.force.normalized_direction.times(force.abs_magnitude));
        context.uniform3fv(gpu_addresses.force_position, force.position);
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

            void main() {
                vec4 world_position = model_transform * vec4( position, 1. );

                vec4 displacement = model_transform[3];



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
