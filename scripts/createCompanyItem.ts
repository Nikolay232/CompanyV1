import {Address, toNano} from '@ton/core';
import { CompanyMaster } from '../wrappers/CompanyMaster';
import {NetworkProvider} from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const companyMasterAddress = Address.parse(args.length > 0 ? args[0] : await ui.input('Smc address'));
    const newOwnerAddress = Address.parse(args.length > 0 ? args[0] : await ui.input('newOwnerAddress address'));

    const companyMaster = provider.open(CompanyMaster.fromAddress(companyMasterAddress));

    await companyMaster.send(
        provider.sender(),
        {
            value: toNano('0.1'),
        },
        {
            $$type: 'Company',
            post: "Owner 1",
            description: "Description 1",
        }
    );

    const itemAddress = await companyMaster.getGetCompanyAddressByOwner(newOwnerAddress)
    console.log(itemAddress)
    // provider.isContractDeployed()
    // expect(deployResult.transactions).toHaveTransaction({
    //     from: deployer.address,
    //     to: companyMaster.address,
    //     deploy: true,
    //     success: true,
    // });

    // await companyMaster.getGetCompanyAddressByOwner
    // await companyMaster.sendChangeOwner(provider.sender(), {
    //     value: toNano('0.1'),
    //     newOwner: newOwnerAddress,
    //     // newOwner: Address.parse('0QD2V6kah194n7n96eOVhHY6Iy_K3tfO2EwiIeAgfzPEzwhB'),
    // });

    ui.write('Changed successfully!');
}

