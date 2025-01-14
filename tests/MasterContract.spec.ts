import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { MasterContract } from '../wrappers/MasterContract';
import '@ton/test-utils';
import {CompanyMaster} from "../build/CompanyMaster/tact_CompanyMaster";

describe('MasterContract', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let companyOwner: SandboxContract<TreasuryContract>;

    let masterContract: SandboxContract<MasterContract>;
    let companyMaster: SandboxContract<CompanyMaster>;
    // let contractMaster: SandboxContract<MasterContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        companyOwner = await blockchain.treasury('owner');

        masterContract = blockchain.openContract(await MasterContract.fromInit(0n));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await masterContract.send(
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
            to: masterContract.address,
            deploy: true,
            success: true,
        });

        companyMaster = blockchain.openContract(await CompanyMaster.fromInit(0n));

        const deployResultCompanyMaster = await companyMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResultCompanyMaster.transactions).toHaveTransaction({
            from: deployer.address,
            to: companyMaster.address,
            deploy: true,
            success: true,
        });

    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and masterContract are ready to use
    });

    it('should set master company address only master contract owner', async () => {
        const masterContractOwner = await masterContract.getOwner()

        expect(masterContractOwner.toString()).toEqual(deployer.address.toString())

        let setCompanyAddressRes = await masterContract.send(
            companyOwner.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'SetCompanyMasterAddress',
                company_master_address: companyMaster.address
            }
        );

        expect(setCompanyAddressRes.transactions).toHaveTransaction({
            from: companyOwner.address,
            to: masterContract.address,
            success: false,
        });

        setCompanyAddressRes = await masterContract.send(
            deployer.getSender(),
            {
                value: toNano('0.005'),
            },
            {
                $$type: 'SetCompanyMasterAddress',
                company_master_address: masterContract.address,
            }
        );

        expect(setCompanyAddressRes.transactions).toHaveTransaction({
            from: deployer.address,
            to: masterContract.address,
            success: true,
        });
    });

    it('should finish contract not contract owner', async () => {
        const masterContractOwner = await masterContract.getOwner()

        expect(masterContractOwner.toString()).toEqual(deployer.address.toString())

        const finishEmployeeContractRes = await masterContract.send(
            companyOwner.getSender(),
            {
                value: toNano('0.005'),
            },
            {
                $$type: 'FinishEmployeeContract',
                employee_contract: companyMaster.address
            }
        );

        expect(finishEmployeeContractRes.transactions).toHaveTransaction({
            from: companyOwner.address,
            to: masterContract.address,
            success: false,
        });
    });

    it('should finish contract owner success and employee_contract is null', async () => {
        const masterContractOwner = await masterContract.getOwner()

        expect(masterContractOwner.toString()).toEqual(deployer.address.toString())


        let finishEmployeeContractRes = await masterContract.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'FinishEmployeeContract',
                employee_contract: null
            }
        );

        expect(finishEmployeeContractRes.transactions).toHaveTransaction({
            from: deployer.address,
            to: masterContract.address,
            success: false,
        });

        finishEmployeeContractRes = await masterContract.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'FinishEmployeeContract',
                employee_contract: companyMaster.address
            }
        );

        expect(finishEmployeeContractRes.transactions).toHaveTransaction({
            from: deployer.address,
            to: masterContract.address,
            success: true,
        });
    });
});
