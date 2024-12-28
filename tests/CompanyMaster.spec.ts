import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import {Address, toNano} from '@ton/core';
import { TonClient } from '@ton/ton';
import { CompanyMaster } from '../wrappers/CompanyMaster';
import { CompanyItem } from '../wrappers/CompanyItem';
import { MasterContract } from '../wrappers/MasterContract'
import { ContractItem } from '../wrappers/ContractItem'
import '@ton/test-utils';

describe('CompanyMaster', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let companyOwner: SandboxContract<TreasuryContract>;
    let notOwner: SandboxContract<TreasuryContract>;
    let employer: SandboxContract<TreasuryContract>;
    let companyMaster: SandboxContract<CompanyMaster>;
    let contractMaster: SandboxContract<MasterContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
        companyOwner = await blockchain.treasury('owner');
        notOwner = await blockchain.treasury('notOwner');
        employer = await blockchain.treasury('employer');

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
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and companyMaster are ready to use
    });

    it('should company master set owner', async () => {
        let companyMasterOwner = await companyMaster.getOwner();
        expect(companyMasterOwner.toString()).toEqual(deployer.address.toString());

        let res = await companyMaster.send(
            companyOwner.getSender(),
            {
                value: toNano('0.9'),
            },
            {
                $$type: 'ChangeOwner',
                queryId: 0n,
                newOwner: companyOwner.address
            }
        );

        expect(res.transactions).toHaveTransaction({
            from: companyOwner.address,
            to: companyMaster.address,
            success: false,
        });

        companyMasterOwner = await companyMaster.getOwner();
        expect(companyMasterOwner.toString()).toEqual(deployer.address.toString());

        res = await companyMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.9'),
            },
            {
                $$type: 'ChangeOwner',
                queryId: 0n,
                newOwner: companyOwner.address
            }
        );

        expect(res.transactions).toHaveTransaction({
            from: deployer.address,
            to: companyMaster.address,
            success: true,
        });

        companyMasterOwner = await companyMaster.getOwner();
        expect(companyMasterOwner.toString()).toEqual(companyOwner.address.toString());

        // let is_initialized = await company.getIsInitialized()
        // // console.log(is_initialized)
        // expect(is_initialized).toBe(true);
    });

    it('should create company contract', async () => {
        let companyAddress = await companyMaster.getCompanyAddressByOwner(companyOwner.address, 1n)

        // console.log(companyAddress)
        // let company = CompanyItem.fromAddress(companyAddress)

        let company = blockchain.openContract(await CompanyItem.fromInit(companyMaster.address, companyOwner.address, 1n))

        expect(companyAddress.toString()).toEqual(company.address.toString());

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

        expect(await company.getIsInitialized()).toEqual(true);
        expect(await company.getCreatedAt()).toBeLessThan(Date.now()/1000 + 1);
        expect(await company.getCreatedAt()).toBeGreaterThan(Date.now()/1000 - 1);
    });

    // it('should set contract address', async () => {
    //     let setContractAddressRes = await companyMaster.send(
    //         companyOwner.getSender(),
    //         {
    //             value: toNano('0.05'),
    //         },
    //         {
    //             $$type: 'SetContractMasterAddress',
    //             contract_master_address: contractMaster.address,
    //         }
    //     );
    //
    //     expect(setContractAddressRes.transactions).toHaveTransaction({
    //         from: companyOwner.address,
    //         to: companyMaster.address,
    //         success: false,
    //     });
    //
    //     setContractAddressRes = await companyMaster.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.05'),
    //         },
    //         {
    //             $$type: 'SetContractMasterAddress',
    //             contract_master_address: contractMaster.address,
    //         }
    //     );
    //
    //     expect(setContractAddressRes.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: companyMaster.address,
    //         success: true,
    //     });
    // });


    it('should company master, set contract master address', async () => {
        const contractMasterAddressBefore = await companyMaster.getContractMasterAddress();
        expect(contractMasterAddressBefore).toBeNull();

        let setContractMasterRes = await companyMaster.send(
            notOwner.getSender(),
            {
                value: toNano('0.1'),
            },
            {
                $$type: 'SetContractMasterAddress',
                contract_master_address: contractMaster.address
            }
        );

        expect(setContractMasterRes.transactions).toHaveTransaction({
            from: notOwner.address,
            to: companyMaster.address,
            success: false,
            exitCode: 132
        });

        let contractMasterAddressAfter = await companyMaster.getContractMasterAddress();
        expect(contractMasterAddressAfter).toBeNull();

        // expect(contractMasterAddressAfter!.toString()).toEqual(contractMaster.address.toString());

        setContractMasterRes = await companyMaster.send(
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

        contractMasterAddressAfter = await companyMaster.getContractMasterAddress();

        expect(contractMasterAddressAfter!.toString()).toEqual(contractMaster.address.toString());
    });



    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    // it('should company set and delete trusted person', async () => {
    //     let companyAddress = await companyMaster.getCompanyAddressByOwner(companyOwner.address, 1n)
    //
    //     // console.log(companyAddress)
    //     // let company = CompanyItem.fromAddress(companyAddress)
    //
    //     let company = blockchain.openContract(await CompanyItem.fromInit(companyMaster.address, companyOwner.address, 1n))
    //
    //     expect(companyAddress.toString()).toEqual(company.address.toString());
    //
    //     // create company
    //
    //     const createCompanyRes = await companyMaster.send(
    //         companyOwner.getSender(),
    //         {
    //             value: toNano('0.9'),
    //         },
    //         {
    //             $$type: 'Company',
    //             post: '',
    //             description: '',
    //             index: 1n
    //         }
    //     );
    //
    //     expect(createCompanyRes.transactions).toHaveTransaction({
    //         from: companyOwner.address,
    //         to: companyMaster.address,
    //         success: true,
    //     });
    //
    //     let is_initialized = await company.getIsInitialized()
    //     expect(is_initialized).toBe(true);
    //
    //     expect(await company.getIsTrustedPerson(deployer.address)).toBeNull();
    //
    //     let setAddTrustedPersonResult = await company.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.9'),
    //         },
    //         {
    //             $$type: 'AddTrustedPerson',
    //             trusted_person: deployer.address,
    //         }
    //     );
    //
    //     expect(setAddTrustedPersonResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: company.address,
    //         success: false,
    //     });
    //
    //     setAddTrustedPersonResult = await company.send(
    //         companyOwner.getSender(),
    //         {
    //             value: toNano('0.9'),
    //         },
    //         {
    //             $$type: 'AddTrustedPerson',
    //             trusted_person: deployer.address,
    //         }
    //     );
    //
    //     expect(setAddTrustedPersonResult.transactions).toHaveTransaction({
    //         from: companyOwner.address,
    //         to: company.address,
    //         success: true,
    //     });
    //
    //     expect(await company.getIsTrustedPerson(deployer.address)).toEqual(true);
    //
    //     let setDeleteTrustedPersonResult = await company.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.9'),
    //         },
    //         {
    //             $$type: 'DeleteTrustedPerson',
    //             trusted_person: deployer.address,
    //         }
    //     );
    //
    //     expect(setDeleteTrustedPersonResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: company.address,
    //         success: false,
    //     });
    //
    //     expect(await company.getIsTrustedPerson(deployer.address)).toEqual(true);
    //
    //     setDeleteTrustedPersonResult = await company.send(
    //         companyOwner.getSender(),
    //         {
    //             value: toNano('0.9'),
    //         },
    //         {
    //             $$type: 'DeleteTrustedPerson',
    //             trusted_person: deployer.address,
    //         }
    //     );
    //
    //     expect(setDeleteTrustedPersonResult.transactions).toHaveTransaction({
    //         from: companyOwner.address,
    //         to: company.address,
    //         success: true,
    //     });
    //
    //     expect(await company.getIsTrustedPerson(deployer.address)).toBeNull();
    // });

    // it('should company set coowner', async () => {
    //     let companyAddress = await companyMaster.getCompanyAddressByOwner(companyOwner.address, 1n)
    //
    //     // console.log(companyAddress)
    //     // let company = CompanyItem.fromAddress(companyAddress)
    //
    //     let company = blockchain.openContract(await CompanyItem.fromInit(companyMaster.address, companyOwner.address, 1n))
    //
    //     expect(companyAddress.toString()).toEqual(company.address.toString());
    //
    //     // create company
    //
    //     const createCompanyRes = await companyMaster.send(
    //         companyOwner.getSender(),
    //         {
    //             value: toNano('0.9'),
    //         },
    //         {
    //             $$type: 'Company',
    //             post: '',
    //             description: '',
    //             index: 1n
    //         }
    //     );
    //
    //     expect(createCompanyRes.transactions).toHaveTransaction({
    //         from: companyOwner.address,
    //         to: companyMaster.address,
    //         success: true,
    //     });
    //
    //     let is_initialized = await company.getIsInitialized()
    //     // console.log(is_initialized)
    //     expect(is_initialized).toBe(true);
    //
    //     expect(await company.getIsCoowner(deployer.address)).toBeNull()
    //
    //     let setAddCoownerResult = await company.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.9'),
    //         },
    //         {
    //             $$type: 'AddCoowner',
    //             coowner: deployer.address,
    //         }
    //     );
    //
    //     expect(setAddCoownerResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: company.address,
    //         success: false,
    //     });
    //
    //     setAddCoownerResult = await company.send(
    //         companyOwner.getSender(),
    //         {
    //             value: toNano('0.9'),
    //         },
    //         {
    //             $$type: 'AddCoowner',
    //             coowner: deployer.address,
    //         }
    //     );
    //
    //     expect(setAddCoownerResult.transactions).toHaveTransaction({
    //         from: companyOwner.address,
    //         to: company.address,
    //         success: true,
    //     });
    //
    //     expect(await company.getIsCoowner(deployer.address)).toEqual(true);
    //
    //     let setDeleteCoownerResult = await company.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.9'),
    //         },
    //         {
    //             $$type: 'DeleteCoowner',
    //             coowner: deployer.address,
    //         }
    //     );
    //
    //     expect(setDeleteCoownerResult.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: company.address,
    //         success: false,
    //     });
    //
    //     setDeleteCoownerResult = await company.send(
    //         companyOwner.getSender(),
    //         {
    //             value: toNano('0.9'),
    //         },
    //         {
    //             $$type: 'DeleteCoowner',
    //             coowner: deployer.address,
    //         }
    //     );
    //
    //     expect(setDeleteCoownerResult.transactions).toHaveTransaction({
    //         from: companyOwner.address,
    //         to: company.address,
    //         success: true,
    //     });
    //
    //     expect(await company.getIsCoowner(deployer.address)).toBeNull()
    // });

    // it('should company item create contract, sender is not companyOwner', async () => {
    //     let companyItemAddress = await companyMaster.getCompanyAddressByOwner(companyOwner.address, 1n)
    //
    //     let companyItem = blockchain.openContract(await CompanyItem.fromInit(companyMaster.address, companyOwner.address, 1n))
    //
    //     expect(companyItemAddress.toString()).toEqual(companyItem.address.toString());
    //
    //     // create company
    //
    //     const createCompanyRes = await companyMaster.send(
    //         companyOwner.getSender(),
    //         {
    //             value: toNano('0.9'),
    //         },
    //         {
    //             $$type: 'Company',
    //             post: '',
    //             description: '',
    //             index: 1n
    //         }
    //     );
    //
    //     expect(createCompanyRes.transactions).toHaveTransaction({
    //         from: companyOwner.address,
    //         to: companyMaster.address,
    //         success: true,
    //     });
    //
    //     const createContractRes = await companyItem.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.9'),
    //         },
    //         {
    //             $$type: 'CreateContract',
    //             company_address: companyItemAddress,
    //             employee_address: companyItemAddress,
    //             company_owner: null,
    //             company_index: 0n,
    //             contract_index: 5n
    //         }
    //     );
    //
    //     expect(createContractRes.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: companyItem.address,
    //         success: false,
    //         exitCode: 44142
    //     });
    // });
    //
    // it('should company item create contract, sender is companyOwner, master contract is not set', async () => {
    //     const companyItemIndex = 1n;
    //
    //     let companyItemAddress = await companyMaster.getCompanyAddressByOwner(companyOwner.address, companyItemIndex)
    //
    //     let companyItem = blockchain.openContract(await CompanyItem.fromInit(companyMaster.address, companyOwner.address, companyItemIndex))
    //
    //     expect(companyItemAddress.toString()).toEqual(companyItem.address.toString());
    //
    //     // create company
    //
    //     const createCompanyRes = await companyMaster.send(
    //         companyOwner.getSender(),
    //         {
    //             value: toNano('0.9'),
    //         },
    //         {
    //             $$type: 'Company',
    //             post: '',
    //             description: '',
    //             index: companyItemIndex
    //         }
    //     );
    //
    //     expect(createCompanyRes.transactions).toHaveTransaction({
    //         from: companyOwner.address,
    //         to: companyMaster.address,
    //         success: true,
    //     });
    //
    //     const createContractRes = await companyItem.send(
    //         companyOwner.getSender(),
    //         {
    //             value: toNano('0.9'),
    //         },
    //         {
    //             $$type: 'CreateContract',
    //             company_address: companyItemAddress,
    //             employee_address: companyItemAddress,
    //             company_owner: null,
    //             company_index: companyItemIndex,
    //             contract_index: 5n
    //         }
    //     );
    //
    //     expect(createContractRes.transactions).toHaveTransaction({
    //         from: companyOwner.address,
    //         to: companyItem.address,
    //         success: true,
    //         // exitCode: 44142
    //     });
    //     expect(createContractRes.transactions).toHaveTransaction({
    //         from: companyItem.address,
    //         to: companyMaster.address,
    //         success: false,
    //         exitCode: 5115
    //     });
    // });






    // it('should company master, set contract master address, sender is not companyOwner', async () => {
    //     const contractMasterAddressBefore = await companyMaster.getContractMasterAddress();
    //     expect(contractMasterAddressBefore).toBeNull();
    //
    //     const createContractMasterRes = await companyMaster.send(
    //         notOwner.getSender(),
    //         {
    //             value: toNano('0.1'),
    //         },
    //         {
    //             $$type: 'SetContractMasterAddress',
    //             contract_master_address: contractMaster.address
    //         }
    //     );
    //
    //     expect(createContractMasterRes.transactions).toHaveTransaction({
    //         from: notOwner.address,
    //         to: companyMaster.address,
    //         success: false,
    //         exitCode: 132
    //     });
    //
    //     const contractMasterAddressAfter = await companyMaster.getContractMasterAddress();
    //     expect(contractMasterAddressAfter).toBeNull();
    //
    //     // expect(contractMasterAddressAfter!.toString()).toEqual(contractMaster.address.toString());
    // });





    //
    // it('should company item create contract, sender is companyOwner, master contract is set', async () => {
    //     const companyItemIndex = 1n;
    //
    //     let companyItemAddress = await companyMaster.getCompanyAddressByOwner(companyOwner.address, companyItemIndex)
    //
    //     let companyItem = blockchain.openContract(await CompanyItem.fromInit(companyMaster.address, companyOwner.address, companyItemIndex))
    //
    //     expect(companyItemAddress.toString()).toEqual(companyItem.address.toString());
    //     // set contract master
    //     const setContractMasterRes = await companyMaster.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.1'),
    //         },
    //         {
    //             $$type: 'SetContractMasterAddress',
    //             contract_master_address: contractMaster.address
    //         }
    //     );
    //
    //     expect(setContractMasterRes.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: companyMaster.address,
    //         success: true,
    //     });
    //
    //     // create company
    //
    //     const createCompanyRes = await companyMaster.send(
    //         companyOwner.getSender(),
    //         {
    //             value: toNano('0.9'),
    //         },
    //         {
    //             $$type: 'Company',
    //             post: '',
    //             description: '',
    //             index: companyItemIndex
    //         }
    //     );
    //
    //     expect(createCompanyRes.transactions).toHaveTransaction({
    //         from: companyOwner.address,
    //         to: companyMaster.address,
    //         success: true,
    //     });
    //
    //     const setCompanyAddressRes = await contractMaster.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.05'),
    //         },
    //         {
    //             $$type: 'SetCompanyMasterAddress',
    //             company_master_address: companyMaster.address,
    //         }
    //     );
    //
    //     expect(setCompanyAddressRes.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: contractMaster.address,
    //         success: true,
    //     });
    //
    //     const contract_index = 5n;
    //
    //     const createContractRes = await companyItem.send(
    //         companyOwner.getSender(),
    //         {
    //             value: toNano('0.9'),
    //         },
    //         {
    //             $$type: 'CreateContract',
    //             company_address: companyItemAddress,
    //             employee_address: employer.address,
    //             company_owner: null, // set in company_item
    //             company_index: companyItemIndex,
    //             contract_index: contract_index
    //         }
    //     );
    //
    //     // console.log(employer.address)
    //     // console.log(companyItemAddress)
    //
    //     expect(createContractRes.transactions).toHaveTransaction({
    //         from: companyOwner.address,
    //         to: companyItem.address,
    //         success: true,
    //         // exitCode: 44142
    //     });
    //     expect(createContractRes.transactions).toHaveTransaction({
    //         from: companyItem.address,
    //         to: companyMaster.address,
    //         success: true
    //     });
    //     expect(createContractRes.transactions).toHaveTransaction({
    //         from: companyItem.address,
    //         to: companyMaster.address,
    //         success: true
    //     });
    //     expect(createContractRes.transactions).toHaveTransaction({
    //         from: companyMaster.address,
    //         to: contractMaster.address,
    //         success: true
    //     });
    //
    //     // check contract item
    //     // console.log(await contractMaster.getContractItemAddress(companyItemAddress, employer.address, contract_index))
    //     const contractItemAddress = await contractMaster.getContractItemAddress(companyItemAddress, employer.address, contract_index);
    //     let contractItem = blockchain.openContract(ContractItem.fromAddress(contractItemAddress));
    //
    //     // console.log(await contractItem.getEmployeeAddress());
    //     // console.log(await contractItem.getCompanyAddress());
    //     // console.log(await contractItem.getIsInitialized());
    //
    //     expect(await contractItem.getIsInitialized()).toEqual(true);
    //     expect(await contractItem.getIsActive()).toEqual(false);
    //
    //     // confirm contract - not employee
    //     expect(await contractItem.getIsActive()).toEqual(false);
    //
    //     let confirmContractRes = await contractItem.send(
    //         deployer.getSender(),
    //         {
    //             value: toNano('0.05'),
    //         },
    //         'confirm'
    //     );
    //     expect(confirmContractRes.transactions).toHaveTransaction({
    //         from: deployer.address,
    //         to: contractItem.address,
    //         success: false
    //     });
    //
    //     expect(await contractItem.getIsActive()).toEqual(false);
    //
    //     confirmContractRes = await contractItem.send(
    //         employer.getSender(),
    //         {
    //             value: toNano('0.05'),
    //         },
    //         'confirm'
    //     );
    //     expect(confirmContractRes.transactions).toHaveTransaction({
    //         from: employer.address,
    //         to: contractItem.address,
    //         success: true
    //     });
    //
    //     expect(await contractItem.getIsActive()).toEqual(true);
    // });
    //
    // it('should company item create contract, sender is companyOwner, master contract is set', async () => {
    //
    // })
});
