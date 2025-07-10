import { config } from "dotenv";
import { PROMPTS } from "./utils/prompts.js";
import { TextGenService } from "./services/gen/TextGenService.js";
import { ImageGenService } from "./services/gen/ImageGenService.js";
import { VideoService } from "./services/VideoService.js";
import { SpeechGenService } from "./services/gen/SpeechGenService.js";
import { sleep } from "./utils/sleep.js";
import { getPreparedPromptFrom } from "./utils/getPreparedPromptFrom.js";
import fs from "fs";
import path from "path";
config({ quiet: true });

export const { GEMINI_API_KEY_1, GEMINI_API_KEY_2 } = process.env;

// separating gemini for every service incase some implementations change in da futureee
const textGenService = new TextGenService(GEMINI_API_KEY_1);
const speechGenService = new SpeechGenService(GEMINI_API_KEY_1);
const imageGenService = new ImageGenService(GEMINI_API_KEY_2);
const videoService = new VideoService();

console.log("Starting automatic video generation....");

const REFRESH_TIME_IN_SECONDS = 60 + 10; // +10 just to be safe
const imagesDir = path.join(process.cwd(), "data", "images");

// ensure data directory
fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });

async function run({ prompt, isPortrait, voiceName, languageCode }) {
	const { sections, title, description, tags } =
		await textGenService.generateJson({
			prompt: getPreparedPromptFrom(
				prompt + `. In languageCode: ${languageCode}`
			),
		});

	let completeString = "";
	sections.forEach(({ section }) => {
		completeString += section + " ";
	});

	fs.rmSync(imagesDir, { recursive: true, force: true });
	fs.mkdirSync(imagesDir, { recursive: true });

	await speechGenService.convertTextToSpeech({
		prompt: completeString,
		voiceName,
		languageCode,
	});

	for (let i = 0; i < sections.length; i += 10) {
		const batch = sections.slice(i, i + 10);

		// Get 10 image generation promises in parallel
		const promises = batch.map((item, j) => {
			const index = i + j;
			return imageGenService.generateImage({
				prompt:
					`Generate a ${
						isPortrait ? "9:16" : "16:9"
					} image according to this theme: ` +
					item.section +
					` DO NOT WRITE ANY TEXT ON THE IMAGE`,
				imageName: `image${index}.png`,
				retries_left: 5,
			});
		});

		// Wait for all 10 to finish
		await Promise.all(promises);

		// Sleep if more batches are remaining
		if (i + 10 < sections.length) {
			console.log(
				`Batch complete — waiting ${REFRESH_TIME_IN_SECONDS} seconds to avoid rate limit...`
			);
			await sleep(REFRESH_TIME_IN_SECONDS * 1000);
		}
	}

	const videoID = Date.now();
	await videoService.generateVideoWithImagesAndAudio({
		sections,
		outputPath: path.join(process.cwd(), "data", "videos", `output.mp4`),
		isPortrait,
	});

	const videoMetadataJson = {
		title,
		description,
		tags,
		isPortrait,
	};

	fs.writeFileSync(
		path.join(process.cwd(), "data", "videos", `${videoID}.json`),
		JSON.stringify(videoMetadataJson)
	);
	console.log(videoMetadataJson);
}

try {
	await run({
		prompt: PROMPTS.SHORT_VIDEO.HORROR,
		isPortrait: true,
		voiceName: "Leda",
		languageCode: "en-US", // en-US | hi-IN
	});
} catch (error) {
	console.log(error);
}
