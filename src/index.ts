import * as core from "@actions/core";

export async function run(): Promise<void> {
    try {
        console.log("Hello, world!");
        throw new Error("Not yet implemented!");
    } catch (e) {
        core.setFailed(e.message);
    }
}

run();
