import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { ContractItem } from '../wrappers/ContractItem';
import '@ton/test-utils';
import {CompanyItem} from "../build/CompanyItem/tact_CompanyItem";
import {CompanyMaster} from "../build/CompanyMaster/tact_CompanyMaster";
import {MasterContract} from "../build/MasterContract/tact_MasterContract";

describe('ContractItem', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let companyOwner: SandboxContract<TreasuryContract>;
    let employee: SandboxContract<TreasuryContract>;

    let companyMaster: SandboxContract<CompanyMaster>;
    let contractMaster: SandboxContract<MasterContract>;
    let companyItem: SandboxContract<CompanyItem>;
    // let contractItem: SandboxContract<ContractItem>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
        companyOwner = await blockchain.treasury('owner');
        employee = await blockchain.treasury('employee');

        // contractItem = blockchain.openContract(await ContractItem.fromInit(0n));
        //
        //
        //
        // const deployResult = await contractItem.send(
        //     deployer.getSender(),
        //     {
        //         value: toNano('0.05'),
        //     },
        //     {
        //         $$type: 'Deploy',
        //         queryId: 0n,
        //     }
        // );
        //
        // expect(deployResult.transactions).toHaveTransaction({
        //     from: deployer.address,
        //     to: contractItem.address,
        //     deploy: true,
        //     success: true,
        // });

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

        // console.log(companyAddress)
        // let company = CompanyItem.fromAddress(companyAddress)

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
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and contractItem are ready to use
    });

    it('should check company item master contract', async () => {
        const companyItemMasterContract = await companyItem.getMasterContract()

        expect(companyItemMasterContract.toString()).toEqual(companyMaster.address.toString());
    })

    it('should check company item created at', async () => {
        expect(await companyItem.getCreatedAt()).toBeLessThan(Date.now()/1000 + 2);
        expect(await companyItem.getCreatedAt()).toBeGreaterThan(Date.now()/1000 - 2);
    })

// ---------------------------------------------------------------------------------------------------------------------
    // it('should check company item owner', async () => {
    //     const companyItemOwner = await companyItem.getOwner()
    //
    //     expect(companyItemOwner.toString()).toEqual(companyOwner.address.toString());
    //
    //     console.log(await companyItem.getTrustedPersons())
    // })
    //
    // it('should check company item owner', async () => {
    //     const companyItemOwner = await companyItem.getOwner()
    //
    //     expect(companyItemOwner.toString()).toEqual(companyOwner.address.toString());
    // })
// ---------------------------------------------------------------------------------------------------------------------

    it('should company set and delete trusted person', async () => {
        // let is_initialized = await companyItem.getIsInitialized()
        // expect(is_initialized).toBe(true);

        expect(await companyItem.getIsTrustedPerson(deployer.address)).toBeNull();

        let setAddTrustedPersonResult = await companyItem.send(
            deployer.getSender(),
            {
                value: toNano('0.9'),
            },
            {
                $$type: 'AddTrustedPerson',
                trusted_person: deployer.address,
            }
        );

        expect(setAddTrustedPersonResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: companyItem.address,
            success: false,
        });

        setAddTrustedPersonResult = await companyItem.send(
            companyOwner.getSender(),
            {
                value: toNano('0.9'),
            },
            {
                $$type: 'AddTrustedPerson',
                trusted_person: deployer.address,
            }
        );

        expect(setAddTrustedPersonResult.transactions).toHaveTransaction({
            from: companyOwner.address,
            to: companyItem.address,
            success: true,
        });

        expect(await companyItem.getIsTrustedPerson(deployer.address)).toEqual(true);

        let setDeleteTrustedPersonResult = await companyItem.send(
            deployer.getSender(),
            {
                value: toNano('0.9'),
            },
            {
                $$type: 'DeleteTrustedPerson',
                trusted_person: deployer.address,
            }
        );

        expect(setDeleteTrustedPersonResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: companyItem.address,
            success: false,
        });

        expect(await companyItem.getIsTrustedPerson(deployer.address)).toEqual(true);

        setDeleteTrustedPersonResult = await companyItem.send(
            companyOwner.getSender(),
            {
                value: toNano('0.9'),
            },
            {
                $$type: 'DeleteTrustedPerson',
                trusted_person: deployer.address,
            }
        );

        expect(setDeleteTrustedPersonResult.transactions).toHaveTransaction({
            from: companyOwner.address,
            to: companyItem.address,
            success: true,
        });

        expect(await companyItem.getIsTrustedPerson(deployer.address)).toBeNull();
    });

    it('should company set and delete coowner', async () => {
        let is_initialized = await companyItem.getIsInitialized()
        // console.log(is_initialized)
        expect(is_initialized).toBe(true);

        expect(await companyItem.getIsCoowner(deployer.address)).toBeNull()

        let setAddCoownerResult = await companyItem.send(
            deployer.getSender(),
            {
                value: toNano('0.9'),
            },
            {
                $$type: 'AddCoowner',
                coowner: deployer.address,
            }
        );

        expect(setAddCoownerResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: companyItem.address,
            success: false,
        });

        setAddCoownerResult = await companyItem.send(
            companyOwner.getSender(),
            {
                value: toNano('0.9'),
            },
            {
                $$type: 'AddCoowner',
                coowner: deployer.address,
            }
        );

        expect(setAddCoownerResult.transactions).toHaveTransaction({
            from: companyOwner.address,
            to: companyItem.address,
            success: true,
        });

        expect(await companyItem.getIsCoowner(deployer.address)).toEqual(true);

        let setDeleteCoownerResult = await companyItem.send(
            employee.getSender(),
            {
                value: toNano('0.9'),
            },
            {
                $$type: 'DeleteCoowner',
                coowner: deployer.address,
            }
        );

        expect(setDeleteCoownerResult.transactions).toHaveTransaction({
            from: employee.address,
            to: companyItem.address,
            success: false,
        });

        setDeleteCoownerResult = await companyItem.send(
            companyOwner.getSender(),
            {
                value: toNano('0.9'),
            },
            {
                $$type: 'DeleteCoowner',
                coowner: deployer.address,
            }
        );

        expect(setDeleteCoownerResult.transactions).toHaveTransaction({
            from: companyOwner.address,
            to: companyItem.address,
            success: true,
        });

        expect(await companyItem.getIsCoowner(deployer.address)).toBeNull()
    });

    it('should company item create contract, sender is not companyOwner', async () => {
        // let companyItemAddress = await companyMaster.getCompanyAddressByOwner(companyOwner.address, 1n)
        //
        // let companyItem = blockchain.openContract(await CompanyItem.fromInit(companyMaster.address, companyOwner.address, 1n))
        //
        // expect(companyItemAddress.toString()).toEqual(companyItem.address.toString());
        //
        // // create company
        //
        // const createCompanyRes = await companyMaster.send(
        //     companyOwner.getSender(),
        //     {
        //         value: toNano('0.9'),
        //     },
        //     {
        //         $$type: 'Company',
        //         post: '',
        //         description: '',
        //         index: 1n
        //     }
        // );
        //
        // expect(createCompanyRes.transactions).toHaveTransaction({
        //     from: companyOwner.address,
        //     to: companyMaster.address,
        //     success: true,
        // });

        expect(await companyItem.getIsCoowner(deployer.address)).toBeNull()

        const createContractRes = await companyItem.send(
            deployer.getSender(),
            {
                value: toNano('0.9'),
            },
            {
                $$type: 'CreateContract',
                company_address: companyItem.address,
                employee_address: employee.address,
                company_index: 0n,
                contract_index: 5n
            }
        );

        expect(createContractRes.transactions).toHaveTransaction({
            from: deployer.address,
            to: companyItem.address,
            success: false,
            exitCode: 132
        });
    });

    it('should company item create contract, sender is companyOwner, master contract is not set', async () => {
        // const companyItemIndex = 1n;
        //
        // let companyItemAddress = await companyMaster.getCompanyAddressByOwner(companyOwner.address, companyItemIndex)
        //
        // let companyItem = blockchain.openContract(await CompanyItem.fromInit(companyMaster.address, companyOwner.address, companyItemIndex))
        //
        // expect(companyItemAddress.toString()).toEqual(companyItem.address.toString());

        // create company

        // const createCompanyRes = await companyMaster.send(
        //     companyOwner.getSender(),
        //     {
        //         value: toNano('0.9'),
        //     },
        //     {
        //         $$type: 'Company',
        //         post: '',
        //         description: '',
        //         index: companyItemIndex
        //     }
        // );
        //
        // expect(createCompanyRes.transactions).toHaveTransaction({
        //     from: companyOwner.address,
        //     to: companyMaster.address,
        //     success: true,
        // });

        const createContractRes = await companyItem.send(
            companyOwner.getSender(),
            {
                value: toNano('0.9'),
            },
            {
                $$type: 'CreateContract',
                company_address: companyItem.address,
                employee_address: employee.address,
                // company_owner: null,
                company_index: 0n,
                contract_index: 5n
            }
        );

        expect(createContractRes.transactions).toHaveTransaction({
            from: companyOwner.address,
            to: companyItem.address,
            success: true,
            // exitCode: 44142
        });
        expect(createContractRes.transactions).toHaveTransaction({
            from: companyItem.address,
            to: companyMaster.address,
            success: false,
            exitCode: 5115
        });
    });

    it('should company item create contract, sender is companyOwner, master contract is set', async () => {
        // const companyItemIndex = 1n;
        //
        // let companyItemAddress = await companyMaster.getCompanyAddressByOwner(companyOwner.address, companyItemIndex)
        //
        // let companyItem = blockchain.openContract(await CompanyItem.fromInit(companyMaster.address, companyOwner.address, companyItemIndex))
        //
        // expect(companyItemAddress.toString()).toEqual(companyItem.address.toString());
        // // set contract master
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

        // // create company
        //
        // const createCompanyRes = await companyMaster.send(
        //     companyOwner.getSender(),
        //     {
        //         value: toNano('0.9'),
        //     },
        //     {
        //         $$type: 'Company',
        //         post: '',
        //         description: '',
        //         index: companyItemIndex
        //     }
        // );
        //
        // expect(createCompanyRes.transactions).toHaveTransaction({
        //     from: companyOwner.address,
        //     to: companyMaster.address,
        //     success: true,
        // });

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

        const contract_index = 5n;

        const createContractRes = await companyItem.send(
            companyOwner.getSender(),
            {
                value: toNano('0.9'),
            },
            {
                $$type: 'CreateContract',
                company_address: companyItem.address,
                employee_address: employee.address,
                // company_owner: null, // set in company_item
                company_index: 0n,
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

        // check contract item
        // console.log(await contractMaster.getContractItemAddress(companyItemAddress, employer.address, contract_index))
        const contractItemAddress = await contractMaster.getContractItemAddress(companyItem.address, employee.address, contract_index);
        let contractItem = blockchain.openContract(ContractItem.fromAddress(contractItemAddress));

        // console.log(await contractItem.getEmployeeAddress());
        // console.log(await contractItem.getCompanyAddress());
        // console.log(await contractItem.getIsInitialized());

        expect(await contractItem.getIsInitialized()).toEqual(true);
        expect(await contractItem.getIsActive()).toEqual(false);
        expect(await contractItem.getIsFinished()).toEqual(false);
        expect(await contractItem.getIsStopped()).toEqual(false);
        expect(await contractItem.getCreatedAt()).toBeLessThan(Date.now()/1000 + 2);
        expect(await contractItem.getCreatedAt()).toBeGreaterThan(Date.now()/1000 - 2);
    });

    // it('should company item create contract, sender is companyOwner, master contract is set', async () => {
    //
    // })

});
