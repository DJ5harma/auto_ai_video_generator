import { GoogleGenAI } from "@google/genai";

export class TextGenService {
	#ai;
	constructor(apiKey) {
		this.#ai = new GoogleGenAI({ apiKey });
	}

	async generateJson(prompt) {
		try {
			console.log("Generating json.... -TextGenService");
			
			const response = await this.#ai.models.generateContent({
				model: "gemini-2.0-flash",
				contents: prompt,
			});
			console.log(response.text);
			const validJsonString = response.text.slice(7, response.text.length - 3);

			const parsedJson = JSON.parse(validJsonString)

			console.log("Generated json! -TextGenService:\n", parsedJson);
			return parsedJson;
		} catch (error) {
			console.log(error);
			return null;
		}
	}
}
