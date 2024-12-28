import { toNano } from '@ton/core';
import { MasterContract } from '../wrappers/MasterContract';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const masterContract = provider.open(await MasterContract.fromInit());

    await masterContract.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(masterContract.address);

    // run methods on `masterContract`
}
