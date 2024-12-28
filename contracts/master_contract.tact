import "@stdlib/deploy";
import "@stdlib/ownable";
import "./contract_item.tact";
//import "./company_item.tact";

contract MasterContract with Deployable, Ownable {
    // Empty init() function is present by default in all Tact contracts
    // since v1.3.0, so the following may be omitted:
    minTonsForStorage: Int = ton("0.1");
    gasConsumption: Int = ton("0.02");

    owner: Address; // company_master; only owner con deploy contract
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
        let ctx: Context = context();
        if (self.company_master_address != null) {
            require(ctx.sender == self.company_master_address, "only company_master can call this method");
            // mint contract item

            //        require(ctx.sender == msg.companyAddress, "initialized tx need from collection");
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
    }

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

    //    get fun getCompanyItemInit(sender_address: Address): Address {
//        let company_init: StateInit = initOf CompanyItem(self.company_master, sender_address);
//        return contractAddress(company_init);
//    }

    receive(msg: SetCompanyMasterAddress) {
        // only owner
        self.requireOwner();
        self.company_master_address = msg.company_master_address;
    }
}
