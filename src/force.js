export class Force {
    constructor(direction, magnitude = 1, position = vec3(0, 0, 0)) {
        this.direction = direction;
        this.magnitude = magnitude;
        this.position = position;
    }

    get normalized_direction() {
        return this.direction.normalized();
    }
}
