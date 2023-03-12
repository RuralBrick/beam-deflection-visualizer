# CS 174A Final Project

Visualization of stress and strain on a simple bridge as a car passes over it.
Implemented through a custom shader. Uses the [tiny-graphics.js
library](https://github.com/encyclopedia-of-code/tiny-graphics-js).

## Running the project

On Windows, run `host.bat`, and then open
[http://localhost:8000/](http://localhost:8000/) on a browser.

On Mac, run `host.command`, and then open
[http://localhost:8000/](http://localhost:8000/) on a browser.

Both scripts run the `server.py` Python script, which starts a fake server
listening on port 8000.

This project should also be compatible with any JavaScript IDE.

## High-Level Design

All non-`tiny-graphics` code is in `src/`, and our original models are
`assets/Bridge.obj`, `assets/Car.obj`, and `assets/Scene.obj`. We define our
scene in `src/final-project.js`, which includes importing our models, arranging
them, adding lights, selecting shaders, applying textures, and creating user
controls.

Our shader is defined in `src/beam-shader.js`. We calculate deflection in the
vertex shader and shift each vertex accordingly. We then calculate stress in the
fragment shader and color each pixel depending on the stress's magnitude and
sign at that point.

Lastly, we also define a custom `Force` class in `src/force.js` to hold basic
force information.

## Credits
Ian Galvez, iangalvez@g.ucla.edu, 105420038
- Set designer
- Textures

Theodore Lau, teddy1405@g.ucla.edu, 405462550
- Visualization shader

Gary Wang, thatgary@g.ucla.edu, 405517637
- Physics derivations
- Object modeling
