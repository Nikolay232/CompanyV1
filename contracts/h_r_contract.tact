import "@stdlib/deploy";
import "./messages.tact";

//const minTonsForStorage: Int = ton("0.1");
const gasHRConsumption: Int = ton("0.02");

contract HRContract {
    // Empty init() function is present by default in all Tact contracts
    // since v1.3.0, so the following may be omitted:

    master_contract: Address;
    hr_address: Address;
    company_address: Address;
    index: Int; // timestamp??

    confirmed: Bool = false; // after employee confirm, become true
    confirmed_at : Int?;
    is_initialized: Bool = false;
    created_at: Int?;

    init(master_contract: Address, company_address: Address, hr_address: Address, index: Int) {
        require(sender() == master_contract, "only master contract can create HR contract");
        self.master_contract = master_contract;

        self.company_address = company_address;
        self.hr_address = hr_address;
        self.index = index;
    }

    receive(msg: CreateHRContract) {
        let ctx: Context = context();
        require(ctx.sender == self.master_contract, "only master_contract can call this method"); // test ++
        // mint hr contract item

        if (self.is_initialized == false) {
            self.is_initialized = true;
            self.company_address = msg.company_address;
            self.hr_address = msg.hr_address;
            self.created_at = now();
        }
        //        else {
        //            // return coins to sender???
        //            return;
        //        }
    }

    receive(msg: CreateContractFromHR) {
        let ctx: Context = context();

        require(ctx.sender == self.hr_address, "only HR can call this method"); // test ++

        let msgValue: Int = context().value;
        msgValue = msgValue - gasHRConsumption;
        //        let master_contract: StateInit =  initOf MasterContract(myAddress(), sender_address);
        //        let company_init: StateInit = self.MasterContract(sender());
        send(SendParameters{
            to: self.master_contract,
            value: msgValue,
            bounce: false,
            mode: SendIgnoreErrors,
            //            mode: SendBounceIfActionFail,
            body: msg.toCell()
        });
    }


    receive("confirm") {  // test ++
        // test only hr_address ++
        // test success ++
        require(sender() == self.hr_address, "only HR can confirm contract");
        self.confirmed_at = now();
        self.confirmed = true;
    }

    get fun masterContract(): Address { // test ++
        return self.master_contract;
    }

    get fun hrAddress(): Address { // test ++
        return self.hr_address;
    }

    get fun companyAddress(): Address { // test ++
        return self.company_address;
    }

    get fun confirmed(): Bool { // test ++
        return self.confirmed;
    }

    get fun confirmedAt(): Int? { // test ++
        return self.confirmed_at;
    }

    get fun isInitialized(): Bool { // test ++
        return self.is_initialized;
    }

    get fun createdAt(): Int? { // test ++
        return self.created_at;
    }
}
