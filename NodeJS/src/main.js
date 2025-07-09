import { config } from "dotenv";
// import { sampleSections } from "./samples/sampleSections.js";
import { PROMPTS } from "./utils/prompts.js";
import { TextGenService } from "./services/gen/TextGenService.js";
import { ImageGenService } from "./services/gen/ImageGenService.js";
import { VideoService } from "./services/VideoService.js";
import { SpeechGenService } from "./services/gen/SpeechGenService.js";
import { sleep } from "./utils/sleep.js";
config();

export const { GEMINI_API_KEY_1, GEMINI_API_KEY_2 } = process.env;

// separating gemini for every service incase some implementations change in da futureee
const textGenService = new TextGenService(GEMINI_API_KEY_1);
const speechGenService = new SpeechGenService(GEMINI_API_KEY_1);
const imageGenService = new ImageGenService(GEMINI_API_KEY_2);
const videoService = new VideoService();

console.log("Starting automatic video generation....");

const REFRESH_TIME_IN_SECONDS = 60 + 10; // +10 just to be safe

async function run() {
	const { sections } = await textGenService.generateJson(PROMPTS.story);

	let completeString = "";
	sections.forEach(({ section }) => {
		completeString += section + " ";
	});

	await speechGenService.convertTextToSpeech(completeString);

	for (let i = 0; i < sections.length; i += 10) {
		const batch = sections.slice(i, i + 10);

		// Get 10 image generation promises in parallel
		const promises = batch.map((item, j) => {
			const index = i + j;
			return imageGenService.generateImage(
				"Generate 16:9 image according to this theme: " + item.section,
				`image${index}.png`
			);
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

	await videoService.generateVideoWithImagesAndAudio(
		sections.length,
		sections.map(({ time }) => time)
	);
}

try {
	await run();
} catch (error) {
	console.log(error);
}

// // .thens
// textGenService.generateJson(PROMPTS.story).then(async ({ sections }) => {
// 	let completeString = "";
// 	sections.forEach(({ section }) => {
// 		completeString += section + " ";
// 	});
// 	speechGenService.convertTextToSpeech(completeString).then(async () => {
// 		for (let i = 0; i < sections.length; ++i) {
// 			const { section } = sections[i];
// 			await imageGenService.generateImage(
// 				"Generate 16:9 image according to this theme: " + section,
// 				`image${i}.png`
// 			);
// 		}
// 		videoService.generateVideoWithImagesAndAudio(
// 			sections.length,
// 			sections.map(({ time }) => time)
// 		);
// 	});
// });
