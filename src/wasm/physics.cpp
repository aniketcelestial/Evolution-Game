// Minimal physics integrator intended to be compiled to WebAssembly with Emscripten.
// Exports a function: void integrate_positions(float* pos, float* vel, int count, float dt)
// pos: array of length count*3 (x,y,z), vel: array of length count*3

extern "C" {
    void integrate_positions(float* pos, float* vel, int count, float dt) {
        for (int i = 0; i < count; ++i) {
            int base = i * 3;
            pos[base + 0] += vel[base + 0] * dt;
            pos[base + 1] += vel[base + 1] * dt;
            pos[base + 2] += vel[base + 2] * dt;
        }
    }
}
