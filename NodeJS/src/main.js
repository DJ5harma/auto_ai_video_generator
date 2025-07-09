import { config } from "dotenv";
// import { sampleSections } from "./samples/sampleSections.js";
import { PROMPTS } from "./utils/prompts.js";
import { TextGenService } from "./services/gen/TextGenService.js";
import { ImageGenService } from "./services/gen/ImageGenService.js";
import { VideoService } from "./services/VideoService.js";
import { SpeechGenService } from "./services/gen/SpeechGenService.js";
config();

export const { GEMINI_API_KEY } = process.env;

// separating gemini for every service incase some implementations change in da futureee 
const textGenService = new TextGenService(GEMINI_API_KEY);
const speechGenService = new SpeechGenService(GEMINI_API_KEY);
const imageGenService = new ImageGenService(GEMINI_API_KEY);
const videoService = new VideoService();

console.log("Starting automatic video generation....");

async function run() {
	const { sections } = await textGenService.generateJson(PROMPTS.story);

	let completeString = "";
	sections.forEach(({ section }) => {
		completeString += section + " ";
	});

	await speechGenService.convertTextToSpeech(completeString);

	for (let i = 0; i < sections.length; ++i) {
		const { section } = sections[i];
		await imageGenService.generateImage(
			"Generate 16:9 image according to this theme: " + section,
			`image${i}.png`
		);
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
