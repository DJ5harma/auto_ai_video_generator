import path from "path";
import fs from "fs";
import { execSync } from "child_process";

// const concatFilePath = path.join(process.cwd(), "data", "input.txt");

const TRANSITION_DURATION = 1; // seconds
export class VideoService {
	async generateVideoWithImagesAndAudio(sections, outputFile = "output.mp4") {
		const TRANSITION_DURATION = 1; // seconds
		const FONT_PATH = path.join(process.cwd(), "data", "fonts", "OpenSans.ttf");

		console.log(
			"🎞️ Merging images and speech audio to create a video - VideoService"
		);

		const subtitles = sections.map(({ section }) => section);
		const durations = sections.map(({ time }) => time);
		const imageCount = sections.length;

		const audioPath = path.join(process.cwd(), "data", "audio.wav");
		const tempDir = path.join(process.cwd(), "data", "temp_frames");
		const imagesDir = path.join(process.cwd(), "data", "images");

		// Prepare clean temp directory
		fs.rmSync(tempDir, { recursive: true, force: true });
		fs.mkdirSync(tempDir, { recursive: true });

		// Step 1: Generate per-image video clips
		const inputVideos = [];

		for (let i = 0; i < imageCount; i++) {
			const clipDuration =
				durations[i] + (i < imageCount - 1 ? TRANSITION_DURATION : 0);
			const imagePath = path.join(imagesDir, `image${i}.png`);
			const tempVideo = path.join(tempDir, `clip${i}.mp4`);
			inputVideos.push(tempVideo);

			const safeSubtitle = subtitles[i].replace(/["\\]/g, ""); // escape quotes and backslashes
			const drawtext = `drawtext=fontfile='${FONT_PATH}':text='${safeSubtitle}':fontcolor=white:fontsize=32:borderw=2:x=(w-text_w)/2:y=h-th-40`;

			execSync(
				`ffmpeg -y -loop 1 -t ${clipDuration} -i "${imagePath}" -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,${drawtext}" -c:v libx264 -pix_fmt yuv420p -r 25 "${tempVideo}"`
			);
		}

		// Step 2: Create input string and xfade filter chain
		const inputArgs = inputVideos.map((v) => `-i "${v}"`).join(" ");
		const filterSteps = [];
		let lastLabel = `[0:v]`;
		let outputLabel = "";
		let currentOffset = durations[0];

		for (let i = 1; i < inputVideos.length; i++) {
			outputLabel = `[xf${i}]`;
			filterSteps.push(
				`${lastLabel}[${i}:v]xfade=transition=fade:duration=${TRANSITION_DURATION}:offset=${currentOffset}${outputLabel}`
			);

			lastLabel = outputLabel;
			currentOffset += durations[i]; // add current segment's duration (excluding transition)
		}

		const filterComplex = filterSteps.join("; ");

		// Step 3: Merge video with transitions
		const mergedVideoPath = path.join(tempDir, "merged_with_xfade.mp4");
		execSync(
			`ffmpeg -y ${inputArgs} -filter_complex "${filterComplex}" -map "${outputLabel}" -c:v libx264 -pix_fmt yuv420p -r 25 "${mergedVideoPath}"`
		);

		// Step 4: Combine with audio
		const finalOutputPath = path.join(process.cwd(), "data", outputFile);
		execSync(
			`ffmpeg -y -i "${mergedVideoPath}" -i "${audioPath}" -c:v copy -c:a aac -shortest "${finalOutputPath}"`
		);

		console.log(`✅ Video generated at: ${finalOutputPath} - VideoService`);
	}
}
