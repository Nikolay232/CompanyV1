import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import '@ton/test-utils';
import {CompanyMaster} from "../build/CompanyMaster/tact_CompanyMaster";
import {MasterContract} from "../build/MasterContract/tact_MasterContract";
import {CompanyItem} from "../build/CompanyItem/tact_CompanyItem";
import { HRContract } from '../build/CompanyMaster/tact_HRContract';

describe('HRContract', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    // let hrContract: SandboxContract<HRContract>;
    let companyOwner: SandboxContract<TreasuryContract>;
    let hr_employee: SandboxContract<TreasuryContract>;

    let companyMaster: SandboxContract<CompanyMaster>;
    let contractMaster: SandboxContract<MasterContract>;
    let companyItem: SandboxContract<CompanyItem>;
    let hrContractItem: SandboxContract<HRContract>;

    let contract_index = 5n;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
        companyOwner = await blockchain.treasury('owner');
        hr_employee = await blockchain.treasury('hr_employee');

        companyMaster = blockchain.openContract(await CompanyMaster.fromInit(0n));

        const deployResult = await companyMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: companyMaster.address,
            deploy: true,
            success: true,
        });

        contractMaster = blockchain.openContract(await MasterContract.fromInit(0n));

        const deployResultContractMaster = await contractMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResultContractMaster.transactions).toHaveTransaction({
            from: deployer.address,
            to: contractMaster.address,
            deploy: true,
            success: true,
        });


        let companyAddress = await companyMaster.getCompanyAddressByIndex(0n)

        companyItem = blockchain.openContract(await CompanyItem.fromInit(companyMaster.address, 0n))

        expect(companyAddress.toString()).toEqual(companyItem.address.toString());

        // create company

        const createCompanyRes = await companyMaster.send(
            companyOwner.getSender(),
            {
                value: toNano('0.9'),
            },
            {
                $$type: 'Company',
                post: '',
                description: '',
                index: 0n
            }
        );

        expect(createCompanyRes.transactions).toHaveTransaction({
            from: companyOwner.address,
            to: companyMaster.address,
            success: true,
        });

        const setContractMasterRes = await companyMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'SetContractMasterAddress',
                contract_master_address: contractMaster.address
            }
        );

        expect(setContractMasterRes.transactions).toHaveTransaction({
            from: deployer.address,
            to: companyMaster.address,
            success: true,
        });

        const setCompanyAddressRes = await contractMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'SetCompanyMasterAddress',
                company_master_address: companyMaster.address,
            }
        );

        expect(setCompanyAddressRes.transactions).toHaveTransaction({
            from: deployer.address,
            to: contractMaster.address,
            success: true,
        });

        const createContractRes = await companyItem.send(
            companyOwner.getSender(),
            {
                value: toNano('0.9'),
            },
            {
                $$type: 'CreateHRContract',
                company_address: companyItem.address,
                hr_address: hr_employee.address,
                company_index: 0n,
                contract_index: contract_index
            }
        );

        expect(createContractRes.transactions).toHaveTransaction({
            from: companyOwner.address,
            to: companyItem.address,
            success: true,
        });
        expect(createContractRes.transactions).toHaveTransaction({
            from: companyItem.address,
            to: companyMaster.address,
            success: true
        });
        expect(createContractRes.transactions).toHaveTransaction({
            from: companyItem.address,
            to: companyMaster.address,
            success: true
        });
        expect(createContractRes.transactions).toHaveTransaction({
            from: companyMaster.address,
            to: contractMaster.address,
            success: true
        });

        const hrContractItemAddress = await contractMaster.getHrContractAddress(companyItem.address, hr_employee.address, contract_index);
        hrContractItem = blockchain.openContract(HRContract.fromAddress(hrContractItemAddress));
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and hRContract are ready to use
    });

    it('should create hr contract; not master contract', async () => {
        const hrContractCreateRes = await hrContractItem.send(
            companyOwner.getSender(),
            {
                value: toNano('0.9'),
            },
            {
                $$type: 'CreateHRContract',
                company_address: companyItem.address,
                hr_address: hr_employee.address,
                company_index: 0n,
                contract_index: contract_index
            }
        )

        expect(hrContractCreateRes.transactions).toHaveTransaction({
            from: companyOwner.address,
            to: hrContractItem.address,
            success: false,
            exitCode: 29303
        });
    });

    it('should check hr contract item created at', async () => {
        expect(await hrContractItem.getCreatedAt()).toBeLessThan(Date.now()/1000 + 2);
        expect(await hrContractItem.getCreatedAt()).toBeGreaterThan(Date.now()/1000 - 2);
    })

    it('should check hr contract master contract address', async () => {
        const masterContractAddress = await hrContractItem.getMasterContract()
        expect(masterContractAddress.toString()).toEqual(contractMaster.address.toString());
    })

    it('should check hr contract company address', async () => {
        const companyAddress = await hrContractItem.getCompanyAddress()
        expect(companyAddress.toString()).toEqual(companyItem.address.toString());
    })

    it('should check hr contract hr address', async () => {
        const hrAddress = await hrContractItem.getHrAddress()
        expect(hrAddress.toString()).toEqual(hr_employee.address.toString());
    })

    it('should check hr contract is initialized', async () => {
        // const masterContractAddress = await hrContractItem.getMasterContract()
        expect(await hrContractItem.getIsInitialized()).toEqual(true);
    })

    it('should confirm; user is not HR', async () => {
        const confirmHRContractRes = await hrContractItem.send(
            deployer.getSender(),
            {
                value: toNano('0.1'),
            },
            "confirm"
        )

        expect(confirmHRContractRes.transactions).toHaveTransaction({
            from: deployer.address,
            to: hrContractItem.address,
            success: false,
            exitCode: 26521
        });
    });

    it('should confirm; user is HR', async () => {
        expect(await hrContractItem.getConfirmed()).toEqual(false);

        const confirmHRContractRes = await hrContractItem.send(
            hr_employee.getSender(),
            {
                value: toNano('0.1'),
            },
            "confirm"
        )

        expect(confirmHRContractRes.transactions).toHaveTransaction({
            from: hr_employee.address,
            to: hrContractItem.address,
            success: true,
        });

        expect(await hrContractItem.getConfirmed()).toEqual(true);
        expect(await hrContractItem.getConfirmedAt()).toBeLessThan(Date.now()/1000 + 2);
        expect(await hrContractItem.getConfirmedAt()).toBeGreaterThan(Date.now()/1000 - 2);
    });

    // it('should confirm; user is HR', async () => {
    //     expect(await hrContractItem.getConfirmed()).toEqual(false);
    //
    //     const confirmHRContractRes = await hrContractItem.send(
    //         hr_employee.getSender(),
    //         {
    //             value: toNano('0.1'),
    //         },
    //         "confirm"
    //     )
    //
    //     expect(confirmHRContractRes.transactions).toHaveTransaction({
    //         from: hr_employee.address,
    //         to: hrContractItem.address,
    //         success: true,
    //     });
    //
    //     expect(await hrContractItem.getConfirmed()).toEqual(true);
    //     expect(await hrContractItem.getConfirmedAt()).toBeLessThan(Date.now()/1000 + 2);
    //     expect(await hrContractItem.getConfirmedAt()).toBeGreaterThan(Date.now()/1000 - 2);
    // });
});
