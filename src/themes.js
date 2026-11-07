import { autoInk, mixHex } from './util';

export const EVENT_TYPES = [
  { id: 'travel', name: 'Travelogue', emoji: '🧭', blurb: 'Trips and adventures, day by day, with a page about each place.',
    place: true, dayWord: 'Day', palette: 'sunset', font: 'editorial', cover: 'full',
    storyHint: 'What happened today? Where did you eat, who did you meet, what surprised you?',
    titles: ['{p} Diaries', 'Postcards from {p}', 'Lost in {p}', 'Wanderlust: {p}', 'The Journey', 'Roads We Took'] },
  { id: 'family', name: 'Family Gathering', emoji: '👨‍👩‍👧', blurb: 'Reunions, holidays and get-togethers with everyone in it.',
    place: false, dayWord: 'Day', palette: 'pastel', font: 'handwritten', cover: 'collage',
    storyHint: 'Who came? What did you cook, play or laugh about?',
    titles: ['Together', 'Family Chronicles', 'Home for the Holidays', 'Our People', 'Full House'] },
  { id: 'wedding', name: 'Wedding', emoji: '💍', blurb: 'The ceremony, the celebrations and every happy tear.',
    place: false, dayWord: 'Day', palette: 'navy', font: 'classic', cover: 'framed',
    storyHint: 'Describe the rituals, the speeches, the dance floor moments…',
    titles: ['Forever Begins', 'Two Hearts, One Story', 'The Big Day', 'Happily Ever After'] },
  { id: 'birthday', name: 'Birthday / Party', emoji: '🎂', blurb: 'Milestones, surprises and cake.',
    place: false, dayWord: 'Day', palette: 'festive', font: 'modern', cover: 'collage',
    storyHint: 'What was the surprise? Who gave the best toast?',
    titles: ['Another Trip Around the Sun', 'Party Time', 'The Big One', 'Cheers!'] },
  { id: 'festival', name: 'Festival / Celebration', emoji: '🎉', blurb: 'Diwali, Christmas, Eid, a concert, a community fest…',
    place: true, dayWord: 'Day', palette: 'festive', font: 'editorial', cover: 'full',
    storyHint: 'What were the traditions, food, music and colours?',
    titles: ['Festival of Lights', 'Celebrate', 'Joy in Every Colour', 'The Season'] },
  { id: 'school', name: 'School / Graduation', emoji: '🎓', blurb: 'Graduations, school trips, team seasons and reunions.',
    place: false, dayWord: 'Day', palette: 'navy', font: 'modern', cover: 'split',
    storyHint: 'What are you proud of? Who were the friends who made it special?',
    titles: ['Class Act', 'The Yearbook', 'We Made It', 'Chapter Closed'] },
  { id: 'custom', name: 'Something Else', emoji: '✨', blurb: 'Any event or project you want to remember.',
    place: true, dayWord: 'Day', palette: 'ocean', font: 'editorial', cover: 'framed',
    storyHint: 'Tell the story of this day.',
    titles: ['Moments', 'Remember This', 'The Story So Far', 'Snapshots'] },
];

export const PALETTES = [
  { id: 'sunset', name: 'Sunset Coast', bg: '#FFF6EC', ink: '#2B1B17', accent: '#D6453D', accent2: '#F7B267', soft: '#FBE3CF' },
  { id: 'forest', name: 'Forest Trail', bg: '#F3F6EE', ink: '#1D2B22', accent: '#2F6F4E', accent2: '#E0A458', soft: '#DDE8D3' },
  { id: 'navy', name: 'Navy & Gold', bg: '#F8F5EE', ink: '#0B1F3A', accent: '#0B3C5D', accent2: '#D4A017', soft: '#E7E1D2' },
  { id: 'pastel', name: 'Pastel Garden', bg: '#FFF9FB', ink: '#3A2C45', accent: '#B8487A', accent2: '#8FC6E9', soft: '#F6E3EE' },
  { id: 'noir', name: 'Monochrome', bg: '#F4F4F2', ink: '#111111', accent: '#111111', accent2: '#C8A24B', soft: '#E4E4E0' },
  { id: 'festive', name: 'Festive Red', bg: '#FFF7E8', ink: '#3B0D0D', accent: '#B3202A', accent2: '#E8A317', soft: '#F8E1B8' },
  { id: 'ocean', name: 'Ocean Breeze', bg: '#F0F8FA', ink: '#0A2A38', accent: '#0E7C93', accent2: '#FF8A5B', soft: '#D3EBF0' },
  { id: 'vintage', name: 'Vintage Sepia', bg: '#F5EBD8', ink: '#3A2A1A', accent: '#A4562B', accent2: '#6B7F5E', soft: '#E8D7B8' },
];

export const FONTS = [
  { id: 'editorial', name: 'Editorial', sample: 'Aa', head: "'Playfair Display', Georgia, serif", body: "'DM Sans', system-ui, sans-serif" },
  { id: 'modern', name: 'Modern Bold', sample: 'Aa', head: "'Oswald', Impact, sans-serif", body: "'DM Sans', system-ui, sans-serif" },
  { id: 'handwritten', name: 'Handwritten', sample: 'Aa', head: "'Caveat', cursive", body: "'DM Sans', system-ui, sans-serif" },
  { id: 'classic', name: 'Classic Serif', sample: 'Aa', head: "'Playfair Display', Georgia, serif", body: "'Playfair Display', Georgia, serif" },
];

export const COVERS = [
  { id: 'full', name: 'Full-bleed' },
  { id: 'framed', name: 'Framed arch' },
  { id: 'split', name: 'Split band' },
  { id: 'collage', name: 'Collage' },
];

export const PLACE_PROMPTS = [
  ["What it's known for", "This place is known for "],
  ['Best thing we ate', 'The best thing we ate here was '],
  ['A local tip', 'A tip if you go: '],
  ['Fun fact', 'Fun fact: '],
  ['Who we met', 'We met '],
  ['Why it mattered', 'It mattered to us because '],
];

export function getPalette(theme) {
  if (theme.palette === 'custom' && theme.customPalette) return { id: 'custom', name: 'Custom', ...theme.customPalette };
  return PALETTES.find((p) => p.id === theme.palette) || PALETTES[0];
}
export const getFont = (theme) => FONTS.find((f) => f.id === theme.font) || FONTS[0];
export const customPalette = (bg, accent, accent2) => ({ bg, accent, accent2, ink: autoInk(bg) === '#ffffff' ? '#f5f5f5' : '#1b1b1b', soft: mixHex(bg, accent2, 0.22) });
