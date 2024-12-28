import { toNano } from '@ton/core';
import { CompanyItem } from '../wrappers/CompanyItem';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const companyItem = provider.open(await CompanyItem.fromInit());

    await companyItem.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(companyItem.address);

    // run methods on `companyItem`
}
