import { defs, tiny } from '../examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Rainbow_Shader extends Shader {
    update_GPU(context, gpu_addresses, program_state, model_transform, material) {
        const [P, C, M] = [program_state.projection_transform, program_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));
        context.uniform1f(gpu_addresses.iTime, program_state.animation_time / 1000);
    }

    shared_glsl_code() {
        return `
            precision mediump float;

            varying vec3 fragCoord;
        `;
    }

    vertex_glsl_code() {
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;

            void main() {
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                fragCoord = position;
            }
        `;
    }

    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            uniform float iTime;

            void main() {
                vec3 uv = fragCoord;

                vec3 col = 0.5 + 0.5*cos(iTime+uv+vec3(0,2,4));

                gl_FragColor = vec4(col, 1.0);
            }
        `
    }
}
