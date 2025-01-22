import { toNano } from '@ton/core';
import { HRContract } from '../wrappers/HRContract';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const hRContract = provider.open(await HRContract.fromInit());

    await hRContract.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(hRContract.address);

    // run methods on `hRContract`
}
