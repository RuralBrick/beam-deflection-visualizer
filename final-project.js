import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Final_Project extends Scene {
    constructor(webgl_manager, control_panel) {
        super(webgl_manager, control_panel);

        this.shapes = {
            torus: new defs.Torus(15, 15),
            cube: new defs.Cube(),
        };

        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            refract: new Material(new Refract_Shader()),
            rainbow: new Material(new Rainbow_Shader()),
        };
    }

    setup(context, program_state) {
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.translation(0, 0, -5));
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        // *** Lights: *** Values of vector or point lights.
        const light_position = vec4(0, 5, 5, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
    }

    make_control_panel() {

    }

    display(context, program_state) {
        this.setup(context, program_state);

        this.shapes.cube.draw(
            context,
            program_state,
            Mat4.identity().times(Mat4.scale(4, 3, 1))
                           .times(Mat4.translation(0, 0, -5)),
            this.materials.rainbow
        );

        this.shapes.torus.draw(
            context,
            program_state,
            Mat4.identity(),
            this.materials.refract,
        );
    }
}

class Refract_Shader extends Shader {
    update_GPU(context, gpu_addresses, program_state, model_transform, material) {
        const [P, C, M] = [program_state.projection_transform, program_state.camera_inverse, model_transform],
            PCM = P.times(C).times(M);
        context.uniformMatrix4fv(gpu_addresses.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        context.uniformMatrix4fv(gpu_addresses.projection_camera_model_transform, false,
            Matrix.flatten_2D_to_1D(PCM.transposed()));
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
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;

            void main() {
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
            }
        `;
    }

    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            void main() {
                gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
            }
        `
    }
}

class Rainbow_Shader extends Shader {
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
