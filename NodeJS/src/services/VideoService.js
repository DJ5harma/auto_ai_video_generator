import path from "path";
import fs from "fs";
import { execSync } from "child_process";

const audioPath = path.join(process.cwd(), "data", "audio.wav");
const tempDir = path.join(process.cwd(), "data", "temp_frames");
const imagesDir = path.join(process.cwd(), "data", "images");
const videossDir = path.join(process.cwd(), "data", "videos");

export class VideoService {
	async generateVideoWithImagesAndAudio({ sections, outputPath, isPortrait }) {
		const TRANSITION_DURATION = 1; // seconds

		console.log("🎞️ Creating video from images and audio - VideoService");

		const durations = sections.map(({ time }) => time);
		const imageCount = sections.length;

		const WIDTH = isPortrait ? 720 : 1280;
		const HEIGHT = isPortrait ? 1280 : 720;


		// ensure videos directory
		fs.mkdirSync(videossDir, { recursive: true });
		
		// Clean temp directory
		fs.rmSync(tempDir, { recursive: true, force: true });
		fs.mkdirSync(tempDir, { recursive: true });

		// Get audio duration
		const getAudioDuration = () => {
			const output = execSync(
				`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
			)
				.toString()
				.trim();
			return parseFloat(output);
		};
		const audioDuration = getAudioDuration();

		// Step 1: Generate per-image video clips
		const inputVideos = [];
		for (let i = 0; i < imageCount; i++) {
			const clipDuration =
				durations[i] + (i < imageCount - 1 ? TRANSITION_DURATION : 0);
			const imagePath = path.join(imagesDir, `image${i}.png`);
			const tempVideo = path.join(tempDir, `clip${i}.mp4`);
			inputVideos.push(tempVideo);

			const ffmpegCmd = `ffmpeg -y -loop 1 -t ${clipDuration} -i "${imagePath}" -vf "scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease,pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -pix_fmt yuv420p -r 25 "${tempVideo}"`;
			console.log("Running FFmpeg:", ffmpegCmd);
			execSync(ffmpegCmd);
		}

		// Step 2: Create xfade transition chain
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
			currentOffset += durations[i];
		}

		const filterComplex = filterSteps.join("; ");
		const mergedVideoPath = path.join(tempDir, "merged_with_xfade.mp4");

		execSync(
			`ffmpeg -y ${inputArgs} -filter_complex "${filterComplex}" -map "${outputLabel}" -c:v libx264 -pix_fmt yuv420p -r 25 "${mergedVideoPath}"`
		);

		// Step 3: Extend video duration if shorter than audio
		const totalVideoDuration =
			durations.reduce((acc, t) => acc + t, 0) +
			TRANSITION_DURATION * (imageCount - 1);
		let finalVideoPath = mergedVideoPath;

		if (audioDuration > totalVideoDuration) {
			const extendedVideoPath = path.join(tempDir, "extended_video.mp4");
			const extraDuration = (audioDuration - totalVideoDuration).toFixed(2);
			const blackFramePath = path.join(tempDir, "black.mp4");

			// Generate black frame video
			execSync(
				`ffmpeg -y -f lavfi -i color=c=black:s=${WIDTH}x${HEIGHT}:d=${extraDuration} -r 25 "${blackFramePath}"`
			);

			// Concatenate original video with black frame
			const concatListPath = path.join(tempDir, "concat.txt");
			fs.writeFileSync(
				concatListPath,
				`file '${mergedVideoPath.replace(
					/\\/g,
					"/"
				)}'\nfile '${blackFramePath.replace(/\\/g, "/")}'`
			);

			execSync(
				`ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${extendedVideoPath}"`
			);

			finalVideoPath = extendedVideoPath;
		}

		// Step 4: Combine with audio
		execSync(
			`ffmpeg -y -i "${finalVideoPath}" -i "${audioPath}" -c:v copy -c:a aac -shortest "${outputPath}"`
		);

		console.log(
			isPortrait ? "Portrait" : "Landscape",
			` video generated at: ${outputPath} - VideoService`
		);
	}
}
