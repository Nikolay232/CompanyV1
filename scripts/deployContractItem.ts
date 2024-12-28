import { toNano } from '@ton/core';
import { ContractItem } from '../wrappers/ContractItem';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const contractItem = provider.open(await ContractItem.fromInit());

    await contractItem.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(contractItem.address);

    // run methods on `contractItem`
}
