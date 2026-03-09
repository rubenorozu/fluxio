
import { detectTenant } from './lib/tenant/detection';

async function main() {
    console.log('Testing detectTenant...');
    try {
        const tenant = await detectTenant();
        console.log('Result:', tenant);
    } catch (error) {
        console.error('Caught error:', error);
    }
}

main();
