import "@stdlib/deploy";
import "@stdlib/ownable";
import "./contract_item.tact";
import "./h_r_contract.tact";
//import "./company_item.tact";

contract MasterContract with Deployable, Ownable {
    // Empty init() function is present by default in all Tact contracts
    // since v1.3.0, so the following may be omitted:
    minTonsForStorage: Int = ton("0.1");
    gasConsumption: Int = ton("0.02");

    owner: Address; // company_master; only owner can deploy contract
    index: Int;
    company_master_address: Address?; // всё-таки нужен мастер контракт который будет создавать контракты (или нет), для проверки, что создание контракта может быть вызвано только из мастер компании, например, надо хранить аго адрес, для этого мастер контракт должен быть Deployable???

//    company_address: Address;
//    employee_address: Address;
    start_time: Int? as uint32;


    init(index: Int) {
        self.owner = sender();
        self.index = index;
//        self.company_address = company_address;
//        self.employee_address = employee_address;
    }

    receive(msg: CreateContract) {
        require(self.company_master_address != null, "company_master_address is not set");

        let ctx: Context = context();

        require(ctx.sender == self.company_master_address, "only company_master can call this method");
        // OR IS HR; check hr address by copany address, hr_address, hr_contract_index(add to msg)
        // mint contract item

        let contract_init: StateInit = self.getContractItemInit(msg);
        let msgValue: Int = context().value;
        msgValue = msgValue - (self.gasConsumption + self.minTonsForStorage);

        send(SendParameters{
            to: contractAddress(contract_init),
            value: msgValue,
            bounce: false,
            mode: SendIgnoreErrors,
            //            mode: SendBounceIfActionFail,
            body: msg.toCell(),
            code: contract_init.code,
            data: contract_init.data
        });
    }


//    receive(msg: CreateContractFromHR) {
//        //        require(self.company_master_address != null, "company_master_address is not set");
//
//        let ctx: Context = context();
//
//        require(ctx.sender == self.hrContractAddress(msg.company_address, msg.hr_address, msg.hr_contract_index), "only HR can call this method");
//        // OR IS HR; check hr address by copany address, hr_address, hr_contract_index(add to msg)
//        // mint contract item
//
//        let createContractMsg: CreateContract = CreateContract{
//        company_address: msg.company_address,
//        hr_address: msg.hr_address,
//        employee_address: msg.employee_address,
//        company_index: msg.company_index,
//        contract_index: msg.contract_index
//        };
//
//        let contract_init: StateInit = self.getContractItemInit(createContractMsg);
//        let msgValue: Int = context().value;
//        msgValue = msgValue - (self.gasConsumption + self.minTonsForStorage);
//
//        send(SendParameters{
//        to: contractAddress(contract_init),
//        value: msgValue,
//        bounce: false,
//        mode: SendIgnoreErrors,
//        //            mode: SendBounceIfActionFail,
//        body: createContractMsg.toCell(),
//        code: contract_init.code,
//        data: contract_init.data
//        });
//    }

    get fun getContractItemInit(msg: CreateContract): StateInit {
        return initOf ContractItem(myAddress(), msg.company_address, msg.employee_address, msg.contract_index); // duplicate this for checking that company is item of company master
    }

    get fun contractItemAddress(company_address: Address, employee_address: Address, contract_index: Int): Address {
        let initCode: StateInit = self.getContractItemInit(
            CreateContract{
                company_address: company_address,
                employee_address: employee_address,
                company_index: 0,
                contract_index: contract_index
            }
        );

        return contractAddress(initCode);
    }

    receive(msg: CreateHRContract) {
        require(self.company_master_address != null, "company_master_address is not set"); // test ++

        let ctx: Context = context();

        require(ctx.sender == self.company_master_address, "only company_master can call this method"); // test ++

        // mint contract item
        let contract_init: StateInit = self.getHRContractInit(msg);
        let msgValue: Int = context().value;
        msgValue = msgValue - (self.gasConsumption + self.minTonsForStorage);

        send(SendParameters{
            to: contractAddress(contract_init),
            value: msgValue,
            bounce: false,
            mode: SendIgnoreErrors,
            //            mode: SendBounceIfActionFail,
            body: msg.toCell(),
            code: contract_init.code,
            data: contract_init.data
        });
    }

    get fun getHRContractInit(msg: CreateHRContract): StateInit {
        return initOf HRContract(myAddress(), msg.company_address, msg.hr_address, msg.contract_index); // duplicate this for checking that company is item of company master
    }

    get fun hrContractAddress(company_address: Address, hr_address: Address, contract_index: Int): Address {
        let initCode: StateInit = self.getHRContractInit(
            CreateHRContract{
                company_address: company_address,
                hr_address: hr_address,
                company_index: 0,
                contract_index: contract_index
            }
        );

        return contractAddress(initCode);
    }

    //    get fun getCompanyItemInit(sender_address: Address): Address {
//        let company_init: StateInit = initOf CompanyItem(self.company_master, sender_address);
//        return contractAddress(company_init);
//    }

    receive(msg: SetCompanyMasterAddress) {
        // only owner
        self.requireOwner();
        self.company_master_address = msg.company_master_address;
    }

    receive(msg: FinishEmployeeContract) { // test ++
        // check balance
        self.requireOwner(); // test ++

        require(msg.employee_contract != null, "message employee_contract is null"); // test ++

        let ctx: Context = context();
        let msgValue: Int = context().value;
        msgValue = msgValue - self.gasConsumption;

        send(SendParameters{
            to: msg.employee_contract!!,
            value: msgValue,
            bounce: false,
            mode: SendIgnoreErrors,
            //            mode: SendBounceIfActionFail,
            body: msg.toCell()
        });
    }
}
