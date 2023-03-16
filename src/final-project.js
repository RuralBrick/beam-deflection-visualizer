import {defs, tiny} from '../examples/common.js';
import { Shear_Shader } from './shear-shader.js';
import {Force} from "./force.js";
import { Shape_From_File } from '../examples/obj-file-demo.js';
import { Beam_Shader } from './beam-shader.js';
import { Subdivision_Cube } from './subdivision-cube.js';

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
            car: new Shape_From_File('../assets/Car.obj'),
            beam: new Subdivision_Cube(15, 15),
        };

        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#ffffff")}),
            shear: new Material(
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

        this.shaders = {
            beam: new Beam_Shader(),
        };

        this.max_width = 4;
        this.min_width = 2;

        this.max_height = 2;
        this.min_height = 0.75;

        this.use_animation = true;
        this.force_location = 0;
        this.frames = 0;
        this.width = 2;
        this.height = 2;
        this.length = 10;

        this.max_stress = 0;

        this.E = 1.4e9;
        this.current_material = "plastic";
        this.use_exaggerated_strain = false;
        this.exaggerated_strain_string = " (realistic)";
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
        this.key_triggered_button("Toggle Animation", ["t"], () => {
            this.use_animation ^= 1;
        });
        this.new_line();

        this.key_triggered_button("Decrease width", ["j"], () => {
            if(this.width > this.min_width){
                this.width -= 0.25;
            };
        });

        this.live_string(box => {
            box.textContent = "Width: " + this.width.toFixed(2)
        });

        this.key_triggered_button("Increase width", ["l"], () => {
            if(this.width < this.max_width){
                this.width += 0.25;
            };
        });

        this.new_line();


        this.key_triggered_button("Decrease height", ["k"], () => {
            if(this.height > this.min_height){
                this.height -= 0.25;
            };
        });

        this.live_string(box => {
            box.textContent = "Height: " + this.height.toFixed(2)
        });

        this.key_triggered_button("Increase height", ["i"], () => {
            if(this.height < this.max_height){
                this.height += 0.25;
            };
        });

        this.new_line();

        this.live_string(box => {
            box.textContent = "max stress: " + this.max_stress.toFixed(2)
        });

        this.new_line();

        this.live_string(box => {
            box.textContent = "Current material: " + this.current_material + this.exaggerated_strain_string;
        });

        this.new_line();

        this.key_triggered_button("Material: Plastic (1.4GPa)", ["7"], () => {
            this.E = 1.4e9;
            this.current_material = "plastic";
        });
        this.new_line();
        this.key_triggered_button("Material: Wood (13GPa)", ["8"], () => {
            this.E = 13e9;
            this.current_material = "wood";
        });
        this.new_line();

        this.key_triggered_button("Material: Steel (180GPa)", ["9"], () => {
            this.E = 180e9;
            this.current_material = "steel";
        });
        this.new_line();
        this.key_triggered_button("Toggle exaggerate strain", ["0"], () => {
            this.use_exaggerated_strain ^= 1;
            if (this.use_exaggerated_strain == true){
                this.exaggerated_strain_string = " (exaggerated)";
            }
            else{
                this.exaggerated_strain_string = " (realistic)"
            }
        });


    }

    display(context, program_state) {
        this.setup(context, program_state);

        // TODO: Maybe draw axes

        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;
        const period = 5;
        let magnitude = 0.5 + 0.5*Math.cos(2*Math.PI*t/period);
        if(this.use_animation){
            this.force_location = 5 * Math.cos(2*Math.PI*this.frames/period);
            this.frames = this.frames + dt;
        }


        const force = new Force(vec3(0, -1, 0), 10 * magnitude, vec3(this.force_location, 1, 0));
        force.draw(context, program_state);

        const b = this.width;
        const h = this.height;
        const l = this.length;

        const I = b*h**3/12;
        let E = this.E;
        if(this.use_exaggerated_strain){
            E *= 0.75e-7;
        }

        this.shapes.car.draw(
            context,
            program_state,
            Mat4.translation(0,0,10).times(Mat4.scale(3,3,3)),
            this.materials.test
        );

        this.shapes.beam.draw(
            context,
            program_state,
            Mat4.scale(l/2, h/2, b/2),
            new Material(
                this.shaders.beam,
                {
                    force: force,
                    length: l,
                    youngs_modulus: E,
                    moment_of_inertia: I,
                    neg_color: color(0, 0, 1, 1),
                    zero_color: color(0, 1, 0, 1),
                    pos_color: color(1, 0, 0, 1),
                    min_stress: -10,
                    max_stress: 10,
                }
            )
        );

        this.max_stress = this.find_max_stress(l, b, h, this.force_location, magnitude, this.force_location);
    }

    find_max_stress(L, b, h, c, P, x){
        let stress = 0;
        c += L/2;
        x += L/2;
        let y = h;
        let I = b*h**3/12;
        if (x < c)
            stress = y/I*P*(1.-c/L)*x;
        else
            stress = y/I*P*c*(1.-x/L)
        return stress;
    }
}
