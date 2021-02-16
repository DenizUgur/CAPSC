import { spawn } from "child_process";
import { promises as fs } from "fs";
import kill from "tree-kill";

class FFmpeg {
	constructor(infile) {
		this.name = infile.split(".")[0];
		this.infile = `${process.env.INPUT_DIR}/${infile}`;
		this.outdir = `${process.env.COMMON_OUTPUT_DIR}/${this.name}`;
		this.state = "IDLE";
	}

	run() {
		this.process = spawn("/bin/sh", [
			`${process.env.SCRIPTS_DIR}/ingest.sh`,
			this.infile,
			this.name,
		]);

		this.process.stdout.on("data", (data) => {
			console.log(data?.toString());
			this.state = "RUNNING";
		});
		this.process.stderr.on("data", (data) => {
			console.log(data?.toString());
			this.state = "CRASHED";
		});
		this.process.on("exit", async (data) => {
			this.state = "FINISHED";
		});
	}

	async terminate() {
		kill(this.process.pid, "SIGINT");
		await fs.rm(this.outdir, { recursive: true });
	}
}

export { FFmpeg };
