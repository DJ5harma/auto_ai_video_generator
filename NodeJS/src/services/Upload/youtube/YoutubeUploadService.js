import fs from "fs";
import path from "path";
import readline from "readline";
import { google } from "googleapis";
import open from "open";

// const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];
// const CLIENT_SECRET_PATH = "client_secret.json";
// const TOKEN_PATH = "token.json";

export class YoutubeUploadService {
	constructor(client_secret_path, token_path) {
		this.client_secret_path = client_secret_path;
		this.token_path = token_path;
		this.SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];
	}

	async upload(
		videoPath,
		title = "Untitled",
		description = "",
		privacy = "public",
		tags = []
	) {
		const credentials = JSON.parse(fs.readFileSync(this.client_secret_path));
		const auth = await this.#authorize(credentials);
		await this.#uploadVideo(auth, videoPath, title, description, privacy, tags);
		console.log("uploading", videoPath);
	}

	async #authorize(credentials) {
		const { client_secret, client_id, redirect_uris } = credentials.installed;
		const oAuth2Client = new google.auth.OAuth2(
			client_id,
			client_secret,
			redirect_uris[0]
		);

		if (fs.existsSync(this.token_path)) {
			const token = JSON.parse(fs.readFileSync(this.token_path));
			oAuth2Client.setCredentials(token);
			return oAuth2Client;
		}

		const authUrl = oAuth2Client.generateAuthUrl({
			access_type: "offline",
			scope: this.SCOPES,
		});

		console.log("Authorize this app by visiting this URL:\n", authUrl);
		await open(authUrl);

		const code = await this.#promptCode("Enter the code from that page here: ");
		const { tokens } = await oAuth2Client.getToken(code);
		oAuth2Client.setCredentials(tokens);

		fs.mkdirSync(path.dirname(this.token_path), { recursive: true });
		fs.writeFileSync(this.token_path, JSON.stringify(tokens));

		return oAuth2Client;
	}

	#promptCode(question) {
		return new Promise((resolve) => {
			const rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout,
			});
			rl.question(question, (code) => {
				rl.close();
				resolve(code);
			});
		});
	}

	async #uploadVideo(auth, filePath, title, description, privacy, tags) {
		const youtube = google.youtube({ version: "v3", auth });

		const requestBody = {
			snippet: {
				title,
				description,
				tags,
				categoryId: "22", // Default to "People & Blogs"
			},
			status: {
				privacyStatus: privacy,
			},
		};

		const media = {
			body: fs.createReadStream(filePath),
		};

		try {
			const response = await youtube.videos.insert({
				part: "snippet,status",
				requestBody,
				media,
			});

			console.log("✅ Video uploaded! Video ID:", response.data.id);
			return response.data.id;
		} catch (err) {
			console.error("❌ Upload failed:", err.message);
			throw err;
		}
	}
}
