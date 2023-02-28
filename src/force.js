import { defs, tiny } from '../examples/common.js';

const { Material, Mat4, color, vec3 } = tiny;

export class Force {
    static _radius_scale = 0.1;
    static _length_scale = 0.5;

    static shapes = {
        cylinder: new defs.Capped_Cylinder(15, 15),
        cone: new defs.Closed_Cone(15, 15),
    };

    static materials = {
        phong: new Material(
            new defs.Phong_Shader(),
            {
                ambient: 1,
                color: color(1, 0, 1, 1)
            }
        ),
    };

    static set radius_scale(factor) {
        Force._radius_scale = factor;
    }

    static set length_scale(factor) {
        Force._length_scale = factor;
    }

    constructor(direction, magnitude = 1, position = vec3(0, 0, 0)) {
        this.direction = direction;
        this.magnitude = magnitude;
        this.position = position;
    }

    get normalized_direction() {
        return this.direction.normalized();
    }

    get abs_magnitude() {
        return Math.abs(this.magnitude);
    }

    draw(context, program_state) {
        const k = vec3(0, 0, 1);

        const radius = Force._radius_scale * Math.log(this.abs_magnitude + 1);
        const cylinder_length = Force._length_scale * this.abs_magnitude;

        // Make an arrow that points at origin, towards +z
        const cone_mat = Mat4.translation(0, 0, -2*radius).times(
                         Mat4.scale(2*radius, 2*radius, 2*radius));
        const cylinder_mat = Mat4.translation(0, 0, -cylinder_length/2 - 4*radius).times(
                             Mat4.scale(radius, radius, cylinder_length));

        // Rigidbody transformation to direction and position
        let model_transform = Mat4.translation(...this.position).times(
                              Mat4.rotation(
                                  Math.acos(k.dot(this.normalized_direction)),
                                  ...k.cross(this.direction)));

        Force.shapes.cone.draw(context, program_state, model_transform.times(cone_mat), Force.materials.phong);
        Force.shapes.cylinder.draw(context, program_state, model_transform.times(cylinder_mat), Force.materials.phong);
    }
}
