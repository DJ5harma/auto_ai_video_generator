import path from "path";
import fs from "fs";
import { execSync } from "child_process";

// const concatFilePath = path.join(process.cwd(), "data", "input.txt");

export class VideoService {
	async generateVideoWithImagesAndAudio(
		imageCount,
		durations,
		outputFile = "output.mp4"
	) {
        console.log("Merging images and speech audio to create a video -VideoService");

		const audioPath = path.join(process.cwd(), "data", "audio.wav");
		const tempDir = path.join(process.cwd(), "data", "temp_frames");
		const imagesDir = path.join(process.cwd(), "data", "images");

		// Step 1: Prepare temp frames directory
		fs.rmSync(tempDir, { recursive: true, force: true });
		fs.mkdirSync(tempDir, { recursive: true });

		// Step 2: Create temporary videos per image
		const inputVideos = [];

		for (let i = 0; i < imageCount; i++) {
			const imagePath = path.join(imagesDir, `image${i}.png`);
			const tempVideo = path.join(tempDir, `image${i}.mp4`);
			inputVideos.push(tempVideo);

			// Generate a video from a single image with specific duration
			execSync(`ffmpeg -y -loop 1 -t ${durations[i]} -i "${imagePath}" -vf "scale=w=1280:h=720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" -c:v libx264 -pix_fmt yuv420p -r 25 "${tempVideo}"`);

		}

		// Step 3: Concatenate video segments
		const concatListPath = path.join(tempDir, "list.txt");
		const concatFileContent = inputVideos
			.map((video) => `file '${video}'`)
			.join("\n");
		fs.writeFileSync(concatListPath, concatFileContent);

		const mergedVideoPath = path.join(tempDir, "merged.mp4");

		execSync(
			`ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${mergedVideoPath}"`
		);

		// Step 4: Add audio to final output
		const finalOutputPath = path.join(process.cwd(), "data", outputFile);
		execSync(
			`ffmpeg -y -i "${mergedVideoPath}" -i "${audioPath}" -c:v copy -c:a aac -shortest "${finalOutputPath}"`
		);

		console.log(`✅ Video generated at: ${finalOutputPath} -VideoService`);
	}
}
