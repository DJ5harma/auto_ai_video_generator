import { GoogleGenAI, Modality } from "@google/genai";
import path from "path";
import fs from "fs";
import { sleep } from "../../utils/sleep.js";

export class ImageGenService {
	#ai;
	constructor(apiKey) {
		this.#ai = new GoogleGenAI({ apiKey });
	}

	async generateImage({ prompt, imageName, retries_left = 5 }) {
		if (retries_left === 0) {
			throw new Error("Retried lots of times, stopping retries");
		}

		console.log(`Generating image: ${imageName} -ImageGenService`);

		// Set responseModalities to include "Image" so the model can generate  an image
		try {
			const response = await this.#ai.models.generateContent({
				model: "gemini-2.0-flash-preview-image-generation",
				contents: prompt,
				config: {
					responseModalities: [Modality.TEXT, Modality.IMAGE],
				},
			});
			for (const part of response.candidates[0].content.parts) {
				if (part.text) {
					console.log(
						`${imageName}'s response text came:`,
						part.text,
						"-ImageGenService"
					);
				} else if (part.inlineData) {
					const imageData = part.inlineData.data;
					const buffer = Buffer.from(imageData, "base64");

					const imageDir = path.join(process.cwd(), "data", "images");
					fs.mkdirSync(imageDir, { recursive: true });

					const imagePath = path.join(imageDir, imageName);
					fs.writeFileSync(imagePath, buffer);

					console.log("Image at: ", imagePath, "-ImageGenService");
				}
			}
			console.log(`Generated image: ${imageName} -ImageGenService`);
			return true;
		} catch ({ message }) {
			console.log(message);
			sleep(70);
			console.log("Will retry in 60 secs", retries_left, "times");

			return await this.generateImage({
				prompt,
				imageName,
				retries_left: retries_left - 1,
			});
		}
	}
}
