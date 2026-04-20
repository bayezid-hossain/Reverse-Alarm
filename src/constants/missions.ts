import { TaskType } from '@/types/task.types';

export const TASK_TYPES: TaskType[] = ['steps', 'voice', 'photo', 'qr'];

export const TASK_DISPLAY = {
  steps: {
    label: 'KINETIC LOCK',
    sublabel: 'Walk steps to deactivate',
    icon: 'directions_walk',
  },
  voice: {
    label: 'VOICE AUTH',
    sublabel: 'Recite the daily manifesto',
    icon: 'mic',
  },
  photo: {
    label: 'VISUAL SYNC',
    sublabel: 'Scan a physical object',
    icon: 'camera_alt',
  },
  qr: {
    label: 'SECURE SCAN',
    sublabel: 'Scan your QR terminal',
    icon: 'qr_code_scanner',
  },
} as const;

export const DEFAULT_STEP_TARGET = 50;
export const VOICE_MANIFESTOS = [
  'I am the CEO of my own existence, and the coffee is my assistant. Today’s quarterly report indicates a 100% chance of greatness. Let the productivity begin.',
  'My bed is a time machine to breakfast, and I just landed. The engine is warm, the cargo is hunger, and the destination is delicious. Mission control, we are clear for omelets.',
  'Every sunrise is a chance to be less confused than yesterday. I will navigate this day with the confidence of a cat in a box. I may not know what I am doing, but I will look good doing it.',
  'I don’t need an inspirational quote, I need a very large latte. Once the caffeine hits my bloodstream, I will be unstoppable. For now, I am just a very motivated potato.',
  'I will conquer today like a squirrel conquers a bird feeder. I have the agility, the focus, and a suspicious amount of energy. Nothing can stand between me and my metaphorical nuts.',
  'My potential is infinite, my patience for morning people is not. I am a masterpiece in progress, currently in the "sketching" phase. Please do not touch the art until I’ve had breakfast.',
  'I am a productivity machine, once I find the "on" switch. It’s hidden somewhere behind my eyelids and the smell of bacon. Stand back, world, the boot sequence has started.',
  'Rising early doesn’t make me a hero, but it’s a solid start. I am trading my dreams for reality, one squinting step at a time. The legend begins at the kitchen sink.',
  'Today’s goal: Be the person my dog thinks I am. I will be loyal, enthusiastic, and easily excited by simple things. Bonus points if I find a stick worth carrying.',
  'I am awake. The universe should probably take cover. I am armed with intentions and slightly messy hair. Prepare for impact, because I am coming for it all.',
  'Success is 1% inspiration and 99% not hitting snooze. I have won the first battle of the day against the duvet. The war for greatness starts right now.',
  'I am biologically engineered for greatness and naps. I will spend the next few hours being incredibly useful and efficient. Then, I shall reward myself with horizontal stillness.',
  'Today is a clean slate. Try not to spill coffee on it. I will write a story worth reading, or at least one with a happy ending. Every page starts with this very moment.',
  'I am the architect of my life. I’m currently adding a balcony to my mindset. It’s going to have a great view of all my future successes.',
  'I will make today so awesome that yesterday gets jealous. I am breaking records and taking names, even if they’re my own. Watch me turn ordinary moments into something legendary.',
  'My alarm is not the boss of me, but it makes a compelling point. It’s loud, persistent, and has excellent timing. I accept its challenge and rise to the occasion.',
  'I am ready to seize the day, just as soon as my eyes finish loading. The system update is almost complete, and the firewall is up. Welcome to Version 2.0 of me.',
  'Champions are made in the early hours, or so the internet says. I am following the data and putting in the work. One day, people will ask how I did it, and I’ll say "I just stood up."',
  'I am a beacon of light, powered by caffeine and sheer willpower. I will illuminate the dark corners of my to-do list. Darkness has no chance against a human on a mission.',
  'Today I will move mountains. Or at least move to the kitchen. Success is measured in small steps, and I am currently stepping toward the toaster. Greatness is a marathon, not a sprint.',
  'I am stronger than my desire to stay under this duvet. My ambition is louder than the voice telling me to sleep five more minutes. I am the master of my morning.',
  'The early bird gets the worm, but the second mouse gets the cheese. I am aiming to be the bird who also finds a side of bacon. Strategic timing is my secret weapon.',
  'I am destined for big things. Starting with a big breakfast. I will fuel my engine for the adventures that lie ahead. Today is the day I finally get it right.',
  'My motivation is currently at 5%, but my battery is at 100%. I will rely on discipline when inspiration is hiding in the shadows. The results will speak for themselves by sunset.',
  'I will treat today like a high-score challenge in a video game. Every task completed is another level up. I am playtesting my way to a perfect life.',
  'I am not just awake; I am strategically deployed. I have a mission, a map, and a moderate amount of enthusiasm. The world is my sandbox, and I brought my own shovel.',
  'Failure is not an option. Neither is staying in bed for another hour. I choose the path of action over the path of least resistance. Let’s see what I’m made of.',
  'I am a warrior. A very sleepy, very hungry warrior. I will fight for my goals with the ferocity of a cat chasing a laser. Victory is the only acceptable outcome.',
  'Today I choose joy, and maybe an oversized bagel. I will sprinkle positivity on everything I do. It’s going to be a delicious, delightful, and extremely productive day.',
  'I am present. I am focused. I am definitely not dreaming right now, because the floor is cold and my goals are waiting. This is my time to shine.',
];

export const getRandomVoicePhrase = () => 
  VOICE_MANIFESTOS[Math.floor(Math.random() * VOICE_MANIFESTOS.length)];

export const DEFAULT_VOICE_PHRASE = VOICE_MANIFESTOS[0];
export const DEFAULT_VOICE_THRESHOLD = 0.65;
export const DEFAULT_COLOR_TOLERANCE = 25;
export const DEFAULT_MAX_SNOOZE = 3;
export const DEFAULT_SNOOZE_INTERVAL = 5;

export const DEFAULT_TASK_CONFIGS = {
  steps: { type: 'steps' as const, targetSteps: DEFAULT_STEP_TARGET },
  voice: { type: 'voice' as const, phrase: DEFAULT_VOICE_PHRASE, matchThreshold: DEFAULT_VOICE_THRESHOLD },
  photo: { type: 'photo' as const, targetColor: '#fe5e1e', colorToleranceDeltaE: DEFAULT_COLOR_TOLERANCE },
  qr: { type: 'qr' as const, expectedContent: 'REVERSE_ALARM_QR', matchMode: 'contains' as const },
};
