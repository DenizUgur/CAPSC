import { spawn } from "child_process";
import { promises as fs } from "fs";
import { nanoid } from "nanoid";
import kill from "tree-kill";

class FFmpeg {
	constructor(inFile, startOffset) {
		this.videoName = inFile.split(".")[0];
		this.startOffset = startOffset;
		this.name = `${this.videoName}_${nanoid()}`;
		this.inFile = `${process.env.INPUT_DIR}/${inFile}`;
		this.outDir = `${process.env.COMMON_OUTPUT_DIR}/${this.name}`;
	}

	run() {
		this.process = spawn(
			"/bin/sh",
			[
				`${process.env.SCRIPTS_DIR}/ingest.sh`,
				this.inFile,
				this.name,
				this.startOffset,
			],
			{ stdio: "ignore" }
		);
	}

	async terminate() {
		kill(this.process.pid, "SIGINT");
		await fs.rm(this.outDir, { recursive: true });
	}
}

export { FFmpeg };
