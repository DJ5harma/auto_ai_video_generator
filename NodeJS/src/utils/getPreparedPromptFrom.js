export function getPreparedPromptFrom(prompt) {
	let str = prompt;
	str += ` The content should be narratable. Split the content into sections of some seconds each. Each section should be part of the ongoing content and keep the audience engaged. Return the result strictly in the following JSON format: 
        {
            sections: [{"section": "text here", "time": 8}, {"section": "text here", "time": 10},...],
            title: "give an attractive title",
            description: "some description",
            tags: ["tag1, tag2", ...]
        }
        Make sure the output has no explanation or formatting, just valid JSON.`;
	return str;
}
