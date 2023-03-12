import {defs, tiny} from '../examples/common.js';
import { Shear_Shader } from './shear-shader.js';
import {Force} from "./force.js";
import { Shape_From_File } from '../examples/obj-file-demo.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Final_Project extends Scene {
    constructor(webgl_manager, control_panel) {
        super(webgl_manager, control_panel);

        this.shapes = {
            torus: new defs.Torus(15, 15),
            cube: new defs.Cube(),
            s4: new defs.Subdivision_Sphere(4),
            cylinder: new defs.Capped_Cylinder(50, 15),
            lucy: new Shape_From_File('../assets/lucy.obj'),
            teapot: new Shape_From_File('../assets/teapot.obj'),
        };

        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            stress: new Material(
                new Shear_Shader(),
                {
                    forces: [],
                    neg_color: color(0, 0, 1, 1),
                    zero_color: color(0, 1, 0, 1),
                    pos_color: color(1, 0, 0, 1),
                    min_force: -10,
                    max_force: 10
                }
            ),
        };
    }

    setup(context, program_state) {
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(Mat4.translation(0, 0, -30));
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

        // TODO: Maybe draw axes

        const t = program_state.animation_time / 1000;
        const period = 5;
        const magnitude = 0.5 + 0.5*Math.cos(2*Math.PI*t/period);

        const forces = [
            new Force(vec3(0, 1, 0), 10 * magnitude, vec3(-10, -1, 0)),
            new Force(vec3(0, -1, 0), 20 * magnitude, vec3(0, 1, 0)),
            new Force(vec3(0, 1, 0), 10 * magnitude, vec3(10, -1, 0)),
        ];

        for (const force of forces)
            force.draw(context, program_state);

        this.shapes.cylinder.draw(
            context,
            program_state,
            Mat4.identity().times(Mat4.rotation(Math.PI/2, 0, 1, 0))
                           .times(Mat4.scale(1, 1, 20)),
            this.materials.stress.override({forces: forces})
        );
    }
}
