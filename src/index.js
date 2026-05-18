import * as Constants from './constants.js';
import { parse } from './parser.js';
import { morph } from './morph.js';
import { mount, createNode, updateNode, setHeapLimit } from './dom.js';

const FlatMorph = {
  parse, morph, mount, createNode, updateNode, setHeapLimit,
  ...Constants
};

export { FlatMorph, parse, morph, mount, createNode, updateNode, setHeapLimit };
export default FlatMorph;
