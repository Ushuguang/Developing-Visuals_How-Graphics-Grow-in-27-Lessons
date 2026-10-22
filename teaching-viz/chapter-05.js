import { attributesDefinition } from './chapter-05-attributes.js';
import { namesDefinition, calendarDefinition } from './chapter-05-names-calendar.js';
import { spiralDefinition } from './chapter-05-spiral.js';
import { storyDefinition } from './chapter-05-story.js?v=20261021-labels';
export function chapter05(d3){return[attributesDefinition(d3),namesDefinition(d3),calendarDefinition(d3),spiralDefinition(d3),storyDefinition(d3)].map(definition=>({...definition,motionByDefault:true,stepFeedback:true}));}
