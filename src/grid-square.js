import { defs, tiny } from '../examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Grid_Square extends defs.Grid_Patch {
    constructor(rows, columns, texture_coord_range = [[0, rows], [0, columns]]) {
        const initial_corner_point = vec3(-1, -1, 0);
        const row_operation = (s, p) => p ? Mat4.translation(0, 2/rows, 0).times(p.to4(1)).to3()
            : initial_corner_point;
        const column_operation = (t, p) => Mat4.translation(2/columns, 0, 0).times(p.to4(1)).to3();
        super(rows, columns, row_operation, column_operation, texture_coord_range);
    }
}
