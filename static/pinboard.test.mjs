import * as pinboard from './pinboard.mjs';
import * as test from './test.mjs';

export const PINBOARD_XML = `<?xml version="1.0" encoding="UTF-8"?>
<posts user="asmithee">
<post href="http://c-faq.com/decl/spiral.anderson.html" time="2022-05-21T06:26:01Z" description="Clockwise/Spiral Rule" extended="" tag="c c++" hash="970c1c894ea099f677fbfa18e74e5e31"  shared="no"  />
<post href="https://www.intel.com/content/www/us/en/developer/tools/oneapi/vtune-profiler.html#gs.x8oazh" time="2022-04-13T13:12:10Z" description="Fix Performance Bottlenecks with Intel® VTune™ Profiler" extended="" tag="performance profiling tools" hash="2ab1611711c8bb5ed9273b8f4b612fca"  shared="no"  />
<post href="https://docs.microsoft.com/en-us/sysinternals/downloads/procmon" time="2020-11-24T02:24:59Z" description="Process Monitor - Windows Sysinternals | Microsoft Docs" extended="Monitor file system, Registry, process, thread and DLL activity in real-time." tag="windows-dev" hash="b87fcc08e549f4076ebeeeaf095482a5"  shared="no"  />
</posts>
`;

const parseTest = test.makeTest('parsePosts should parse posts', () => {
  const parser = new DOMParser();
  const posts = pinboard.parsePosts(parser, PINBOARD_XML);
  console.log(posts);
  test.assert(posts.length === 3);
});

export const tests = [parseTest];
