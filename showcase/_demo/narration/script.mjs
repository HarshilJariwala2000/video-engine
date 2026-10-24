// Showcase demo: how the channel intro and ending sit inside a real video.
// tools/showcase.mjs copies this folder to showcase/demo-<x> and sets the intro.
export const INTRO = '__INTRO__';

export const meta = {
  title: `Channel kit demo · intro ${INTRO}`,
  aha: 'Demo of the shared intro and outro.',
  audience: 'channel',
  verify: [], titles: [], thumbnails: [], tags: [],
};

export const scenes = [
  {id: 'scene01', label: 'THE PROBLEM', title: 'Hook',
    text: "{table}Want to ruin your afternoon? Delete half of a ten gigabyte table. {disk}Then check the disk. {still}Still ten gigabytes. {why}So what is Postgres actually doing with your data?",
    visual: ['table box', 'disk bar', 'bar stays full, red', 'question'],
    handsOff: 'intro'},

  {id: 'intro', intro: INTRO},

  {id: 'scene02', label: 'TO SUMMARISE', title: 'Summary', bed: true,
    text: "{sum}To summarise everything. {p1}An update writes a new version of the row. {p2}A delete only stamps the old one. {p3}And vacuum sweeps up whatever nobody can see. {aha}Postgres never changes a row.",
    visual: ['heading', 'point 1', 'point 2', 'point 3', 'aha line']},

  {id: 'scene03', label: 'END', title: 'End card', endCard: true,
    text: "{like}If you liked the video, drop a like {sub}and subscribe, {next}and tell me what topics you want to see next.",
    visual: ['like()', 'subscribe() + click', 'suggest(next_topic)']},
];
