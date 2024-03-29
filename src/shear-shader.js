import { defs, tiny } from '../examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Shear_Shader extends Shader {
    constructor(num_forces = 100) {
        super();
        this.num_forces = num_forces;
    }

    update_GPU(context, gpu_addresses, program_state, model_transform, material) {
        const [P, C, M] = [program_state.projection_transform, program_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));

        context.uniform4fv(gpu_addresses.neg_color, material.neg_color);
        context.uniform4fv(gpu_addresses.zero_color, material.zero_color);
        context.uniform4fv(gpu_addresses.pos_color, material.pos_color);
        context.uniform1f(gpu_addresses.min_force, material.min_force);
        context.uniform1f(gpu_addresses.max_force, material.max_force);

        const flattened_forces = [];
        const flattened_force_positions = [];
        for (const force of material.forces) {
            const force_components =  force.normalized_direction.times(force.abs_magnitude);
            flattened_forces.push(...force_components);
            flattened_force_positions.push(...force.position);
        }
        context.uniform3fv(gpu_addresses.forces, flattened_forces);
        context.uniform3fv(gpu_addresses.force_positions, flattened_force_positions);
    }

    shared_glsl_code() {
        return `
            precision mediump float;

            const int N_FORCES = ` + this.num_forces + `;

            uniform vec3 forces[N_FORCES];
            uniform vec3 force_positions[N_FORCES];
            uniform float min_force;
            uniform float max_force;

            varying vec3 world_position;
        `;
    }

    vertex_glsl_code() {
        return this.shared_glsl_code() + `
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;

            attribute vec3 position;

            void main() {
                vec4 homogenous_position = vec4( position, 1.0 );

                gl_Position = projection_camera_model_transform * homogenous_position;
                world_position = vec3( model_transform * homogenous_position );
            }
        `;
    }

    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            uniform vec4 neg_color;
            uniform vec4 zero_color;
            uniform vec4 pos_color;

            void main() {
                float shear_force = 0.0;
                for (int i = 0; i < N_FORCES; i++) {
                    if (force_positions[i].x < world_position.x)
                        shear_force += forces[i].y;
                }
                float clamped_shear = clamp( shear_force, min_force, max_force );

                if (clamped_shear < 0.0)
                    gl_FragColor = mix( zero_color, neg_color, clamped_shear/min_force );
                else
                    gl_FragColor = mix( zero_color, pos_color, clamped_shear/max_force );
            }
        `;
    }
}
