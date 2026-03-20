
import fetch from 'node-fetch';

async function test() {
  const resourceId = 'cmmw4j60t0002js04i3k0q40r'; // Estudio de TV
  const url = `http://localhost:3000/api/public/availability?resourceId=${resourceId}&resourceType=space&start=2026-03-23T00:00:00.000Z&end=2026-03-29T23:59:59.000Z`;
  
  console.log('Testing URL:', url);
  // Note: This might fail if the server is not running, but I can't start the server here easily
  // Instead, I'll just check the logic by looking at the code I wrote.
}

test();
