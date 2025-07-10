export const PROMPTS = {
	NORMAL_VIDEO: {
		HORROR: `
            Write a 4500-character, dark and atmospheric horror content. 
            The content should focus on psychological fear, build tension slowly, and include a chilling twist. 
            It must be written in the first person to feel personal and immersive. You have the liberty to think of anything out of the box as much as you want...
        `,
	},
	SHORT_VIDEO: {
		HORROR: `
            Write a dark and atmospheric horror content for a short video (50 seconds at max). 
            The content should focus on psychological fear, build tension slowly, and include a chilling twist. 
            It must be written in the first person to feel personal and immersive. You have the liberty to think of anything out of the box as much as you want...
        `,
		DARK_COMEDY: `
            Write a dark, comedic and thriller content for a short video (50 seconds at max). 
            The content should burst anybody into uncontrollable laughter, have a chilling twist. 
            You have the liberty to think of anything out of the box as much as you you want...
        `,
	},
};

console.log(PROMPTS.list.length);
