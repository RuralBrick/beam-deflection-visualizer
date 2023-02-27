import { defs, tiny } from '../examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Refract_Shader extends Shader {
    update_GPU(context, gpu_addresses, program_state, model_transform, material) {
        const [P, C, M] = [program_state.projection_transform, program_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        context.uniformMatrix4fv(gpu_addresses.inv_trans_model_transform, false,
            Matrix.flatten_2D_to_1D(Mat4.inverse(model_transform).transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));
        context.uniform3fv(gpu_addresses.camera_center, program_state.camera_transform.times(vec4(0, 0, 0, 1)).to3());
    }

    shared_glsl_code() {
        return `
            precision mediump float;

            varying vec3 viewDir;
            varying vec3 normalDir;
        `;
    }

    vertex_glsl_code() {
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;
            uniform vec3 camera_center;
            uniform mat4 model_transform;
            uniform mat4 inv_trans_model_transform;
            uniform mat4 projection_camera_model_transform;

            void main() {
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                normalDir = normalize( vec3( inv_trans_model_transform * vec4(normal, 0.0) ) );
                viewDir = normalize( vec3( model_transform * vec4( position, 1.0 ) - vec4(camera_center, 1.0) ) );
            }
        `;
    }

    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            void main() {
                float refractiveIndex = 1.5;
                vec3 refractedDirection = refract(viewDir, normalDir, 1.0 / refractiveIndex);
                gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // FIXME: Sample/raycast a texture (or other) somehow
            }
        `
    }
}
