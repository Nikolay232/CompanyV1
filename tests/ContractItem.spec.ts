import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import {Address, toNano} from '@ton/core';
import { ContractItem } from '../wrappers/ContractItem';
import '@ton/test-utils';
import {CompanyMaster} from "../build/CompanyMaster/tact_CompanyMaster";
import {MasterContract} from "../build/MasterContract/tact_MasterContract";
import {CompanyItem} from "../build/CompanyItem/tact_CompanyItem";

describe('ContractItem', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let companyOwner: SandboxContract<TreasuryContract>;
    let employee: SandboxContract<TreasuryContract>;

    let companyMaster: SandboxContract<CompanyMaster>;
    let contractMaster: SandboxContract<MasterContract>;
    let companyItem: SandboxContract<CompanyItem>;
    let contractItem: SandboxContract<ContractItem>;

    let contract_index = 5n;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        // contractItem = blockchain.openContract(await ContractItem.fromInit());

        deployer = await blockchain.treasury('deployer');
        companyOwner = await blockchain.treasury('owner');
        employee = await blockchain.treasury('employee');

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


        let companyAddress = await companyMaster.getCompanyAddressByOwner(companyOwner.address, 1n)

        // console.log(companyAddress)
        // let company = CompanyItem.fromAddress(companyAddress)

        companyItem = blockchain.openContract(await CompanyItem.fromInit(companyMaster.address, companyOwner.address, 1n))

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
                index: 1n
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

        // const contract_index = 5n;

        const createContractRes = await companyItem.send(
            companyOwner.getSender(),
            {
                value: toNano('0.9'),
            },
            {
                $$type: 'CreateContract',
                company_address: companyItem.address,
                employee_address: employee.address,
                company_owner: null, // set in company_item
                company_index: 1n,
                contract_index: contract_index
            }
        );

        // console.log(employer.address)
        // console.log(companyItemAddress)

        expect(createContractRes.transactions).toHaveTransaction({
            from: companyOwner.address,
            to: companyItem.address,
            success: true,
            // exitCode: 44142
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

        const contractItemAddress = await contractMaster.getContractItemAddress(companyItem.address, employee.address, contract_index);
        contractItem = blockchain.openContract(ContractItem.fromAddress(contractItemAddress));
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and contractItem are ready to use
    });

    // TRANSFER TO CONTRACT ITEM TEST
    it('should contract item; employee confirm', async () => {
        expect(await contractItem.getIsInitialized()).toEqual(true);
        expect(await contractItem.getIsActive()).toEqual(false);
        expect(await contractItem.getIsFinished()).toEqual(false);
        expect(await contractItem.getIsStopped()).toEqual(false);
        expect(await contractItem.getCreatedAt()).toBeLessThan(Date.now()/1000 + 1);
        expect(await contractItem.getCreatedAt()).toBeGreaterThan(Date.now()/1000 - 1);

        // confirm contract - not employee
        expect(await contractItem.getIsActive()).toEqual(false);

        let confirmContractRes = await contractItem.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            'confirm'
        );
        expect(confirmContractRes.transactions).toHaveTransaction({
            from: deployer.address,
            to: contractItem.address,
            success: false
        });

        expect(await contractItem.getIsActive()).toEqual(false);

        confirmContractRes = await contractItem.send(
            employee.getSender(),
            {
                value: toNano('0.05'),
            },
            'confirm'
        );
        expect(confirmContractRes.transactions).toHaveTransaction({
            from: employee.address,
            to: contractItem.address,
            success: true
        });

        expect(await contractItem.getIsActive()).toEqual(true);
        expect(await contractItem.getConfirmedAt()).toBeLessThan(Date.now()/1000 + 1);
        expect(await contractItem.getConfirmedAt()).toBeGreaterThan(Date.now()/1000 - 1);
    });

    it('should employee stop contract', async () => {
        let confirmContractRes = await contractItem.send(
            employee.getSender(),
            {
                value: toNano('0.05'),
            },
            'confirm'
        );
        expect(confirmContractRes.transactions).toHaveTransaction({
            from: employee.address,
            to: contractItem.address,
            success: true
        });

        expect(await contractItem.getIsActive()).toEqual(true);
        expect(await contractItem.getIsStopped()).toEqual(false);

        let stopContractRes = await contractItem.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'StopEmployeeContract',
                employee_contract: null,
                reason: "Stop_reason",
            }
        );
        expect(stopContractRes.transactions).toHaveTransaction({
            from: deployer.address,
            to: contractItem.address,
            success: false
        });

        expect(await contractItem.getIsStopped()).toEqual(false);
        expect(await contractItem.getStopReason()).toBeNull();

        stopContractRes = await contractItem.send(
            employee.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'StopEmployeeContract',
                employee_contract: null,
                reason: "Stop_reason",
            }
        );
        expect(stopContractRes.transactions).toHaveTransaction({
            from: employee.address,
            to: contractItem.address,
            success: true
        });

        expect(await contractItem.getIsStopped()).toEqual(true);
        expect(await contractItem.getStopReason()).toEqual("Stop_reason")
    });

    it('should company stop contract', async () => {
        let confirmContractRes = await contractItem.send(
            employee.getSender(),
            {
                value: toNano('0.05'),
            },
            'confirm'
        );
        expect(confirmContractRes.transactions).toHaveTransaction({
            from: employee.address,
            to: contractItem.address,
            success: true
        });

        expect(await contractItem.getIsActive()).toEqual(true);
        expect(await contractItem.getIsStopped()).toEqual(false);

        let stopContractRes = await companyItem.send(
            deployer.getSender(),
            {
                value: toNano('0.9'),
            },
            {
                $$type: 'StopEmployeeContract',
                employee_contract: contractItem.address,
                reason: "Stop_reason",
            }
        );
        expect(stopContractRes.transactions).toHaveTransaction({
            from: deployer.address,
            to: companyItem.address,
            success: false
        });

        expect(await contractItem.getIsStopped()).toEqual(false);
        expect(await contractItem.getStopReason()).toBeNull();

        stopContractRes = await companyItem.send(
            companyOwner.getSender(),
            {
                value: toNano('0.9'),
            },
            {
                $$type: 'StopEmployeeContract',
                employee_contract: contractItem.address,
                reason: "Stop_reason",
            }
        );
        expect(stopContractRes.transactions).toHaveTransaction({
            from: companyOwner.address,
            to: companyItem.address,
            success: true
        });
        expect(stopContractRes.transactions).toHaveTransaction({
            from: companyItem.address,
            to: contractItem.address,
            success: true
        });

        expect(await contractItem.getIsStopped()).toEqual(true);
        expect(await contractItem.getStopReason()).toEqual("Stop_reason")
    });

    it('should employee finish contract', async () => {
        let confirmContractRes = await contractItem.send(
            employee.getSender(),
            {
                value: toNano('0.05'),
            },
            'confirm'
        );
        expect(confirmContractRes.transactions).toHaveTransaction({
            from: employee.address,
            to: contractItem.address,
            success: true
        });

        expect(await contractItem.getIsActive()).toEqual(true);
        expect(await contractItem.getIsFinished()).toEqual(false);

        let finishContractRes = await contractItem.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'FinishEmployeeContract',
                employee_contract: null,
            }
        );
        expect(finishContractRes.transactions).toHaveTransaction({
            from: deployer.address,
            to: contractItem.address,
            success: false
        });

        expect(await contractItem.getIsFinished()).toEqual(false);

        finishContractRes = await contractItem.send(
            employee.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'FinishEmployeeContract',
                employee_contract: null,
            }
        );
        expect(finishContractRes.transactions).toHaveTransaction({
            from: employee.address,
            to: contractItem.address,
            success: true
        });

        expect(await contractItem.getIsFinished()).toEqual(true);
    });

    it('should company finish contract', async () => {
        let confirmContractRes = await contractItem.send(
            employee.getSender(),
            {
                value: toNano('0.05'),
            },
            'confirm'
        );
        expect(confirmContractRes.transactions).toHaveTransaction({
            from: employee.address,
            to: contractItem.address,
            success: true
        });

        expect(await contractItem.getIsActive()).toEqual(true);
        expect(await contractItem.getIsFinished()).toEqual(false);

        let finishContractRes = await companyItem.send(
            deployer.getSender(),
            {
                value: toNano('0.9'),
            },
            {
                $$type: 'FinishEmployeeContract',
                employee_contract: contractItem.address,
            }
        );
        expect(finishContractRes.transactions).toHaveTransaction({
            from: deployer.address,
            to: companyItem.address,
            success: false
        });

        expect(await contractItem.getIsFinished()).toEqual(false);

        finishContractRes = await companyItem.send(
            companyOwner.getSender(),
            {
                value: toNano('0.9'),
            },
            {
                $$type: 'FinishEmployeeContract',
                employee_contract: contractItem.address,
            }
        );
        expect(finishContractRes.transactions).toHaveTransaction({
            from: companyOwner.address,
            to: companyItem.address,
            success: true
        });
        expect(finishContractRes.transactions).toHaveTransaction({
            from: companyItem.address,
            to: contractItem.address,
            success: true
        });

        expect(await contractItem.getIsFinished()).toEqual(true);
    });

});
