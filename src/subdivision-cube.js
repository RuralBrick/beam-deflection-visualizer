import { defs, tiny } from '../examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Subdivision_Cube extends Shape {
    // NOTE: References to use
    // * examples/common.js -- Cylindrical_Tube
    // * examples/common.js -- Cone_Tip
    // * examples/common.js -- Surface_Of_Revolution
    // * examples/common.js -- Grid_Patch
    // * tiny-graphics.js -- Vector3.cast()
    // * examples/common.js -- Cube

    constructor(rows, cols) {
        // TODO: Maybe refactor out into different shape
        const row_operation = i => Grid_Patch.sample_array(Vector3.cast([-1, 0, 0], [1, 0, 0]), i);
        const column_operation = (j, p) => Grid_Patch.sample_array(Vector3.cast([0, -1, 0], [0, 1, 0]), j);

        // TODO: Create 6 faces using Grid_Patch and rotate to appropriate positions

        // for (let i = 0; i < 3; i++)
        //     for (let j = 0; j < 2; j++) {
        //         const square_transform = Mat4.rotation(i == 0 ? Math.PI / 2 : 0, 1, 0, 0)
        //             .times(Mat4.rotation(Math.PI * j - (i == 1 ? Math.PI / 2 : 0), 0, 1, 0))
        //             .times(Mat4.translation(0, 0, 1));
        //         // Calling this function of a Square (or any Shape) copies it into the specified
        //         // Shape (this one) at the specified matrix offset (square_transform):
        //         Square.insert_transformed_copy_into(this, [], square_transform);
        //     }
    }
}
