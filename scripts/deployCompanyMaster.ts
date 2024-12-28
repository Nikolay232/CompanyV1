import { toNano } from '@ton/core';
import { CompanyMaster } from '../wrappers/CompanyMaster';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const companyMaster = provider.open(await CompanyMaster.fromInit(0n));

    await companyMaster.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(companyMaster.address);

}
