import { GoogleGenAI } from "@google/genai";
import wav from "wav";
import path from "path";

export class SpeechGenService {
	#ai;
	constructor(apiKey) {
		this.#ai = new GoogleGenAI({ apiKey });
	}

	async #saveWaveFile(
		pcmData,
		channels = 1,
		rate = 24000,
		sampleWidth = 2
	) {
		console.log("Saving generated speech's audio.... -SpeechGenService");
		return new Promise((resolve, reject) => {
			
			const writer = new wav.FileWriter(path.join(process.cwd(), "data", "audio.wav"), {
				channels,
				sampleRate: rate,
				bitDepth: sampleWidth * 8,
			});
			
			writer.on("finish", () => {
				console.log("Generated Speech Saved! -SpeechGenService");
				resolve();
			});
			writer.on("error", () => {
				console.log("Error saving Generated Speech !!! -SpeechGenService");
				reject();
			});
			
			writer.write(pcmData);
			writer.end();
		});
	}

	async convertTextToSpeech(prompt) {
		try {
			console.log(`Generating text to speech for ${prompt.length} characters... -SpeechGenService`);
			
			const response = await this.#ai.models.generateContent({
				model: "gemini-2.5-flash-preview-tts",
				contents: prompt,
				config: {
					responseModalities: ["AUDIO"],
					speechConfig: {
						voiceConfig: {
							prebuiltVoiceConfig: { voiceName: "Kore" },
						},
					},
				},
			});
			
			const data =
			response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
			const audioBuffer = Buffer.from(data, "base64");
			
			console.log("Generated speech! -SpeechGenService");
			await this.#saveWaveFile(audioBuffer);
		} catch (error) {
			console.log(error);
		}
	}
}
