export const PROMPTS = {
	story: `Write a 2000 character, engaging fictional story suitable for a YouTube narration. 
    Split the story into sections of some seconds each. 
    Each section should be part of the ongoing story and keep the audience engaged.
    Return the result strictly in the following JSON format:
    
    {
    sections: [
        {"section": "text here", "time": 8},
        {"section": "text here", "time": 10}, 
        ...
    ]}
    
    Make sure the output has no explanation or formatting, just valid JSON.
    `,
};
