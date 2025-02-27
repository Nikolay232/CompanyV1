import "./messages.tact";

contract ContractItem {
    // Empty init() function is present by default in all Tact contracts
    // since v1.3.0, so the following may be omitted:
    master_contract: Address;

    company_address: Address;
    employee_address: Address;
    // employee_telegram_id
    // index ???
    index: Int;
    owner: Address?;

    company_comment: String?;
    employee_comment: String?;

    is_active: Bool = false; // after employee confirm, become true
    confirmed_at : Int?;
    is_initialized: Bool = false;
    created_at: Int?;
    is_finished: Bool = false; // success finished
    finished_at: Int?;
    is_stopped: Bool = false; // stopped by one of the side
    stopped_at: Int?;
    stop_reason: String?;

    init(master_contract: Address, company_address: Address, employee_address: Address, index: Int) {
        require(sender() == master_contract, "not from master contract");
        self.master_contract = master_contract;

        self.company_address = company_address;
        self.employee_address = employee_address;
        self.index = index;

//        self.is_initialized = false;
    }

    receive(msg: CreateContract) {
        let ctx: Context = context();
        require(ctx.sender == self.master_contract, "only master_contract can call this method");
        // mint contract item

        if (self.is_initialized == false) {
            self.is_initialized = true;
            self.owner = ctx.sender;
            self.company_address = msg.company_address;
            self.employee_address = msg.employee_address;
            self.created_at = now(); // test ++

            //            if (msg.response_destination != null) {
            //                send(SendParameters{
            //                    to: msg.response_destination!!,
            //                    value: msgValue,
            //                    mode: SendPayGasSeparately,
            //                    body: Excesses { query_id: msg.query_id }.toCell()
            //                });
            //            }
        }
//        else {
//            // return coins to sender???
//            return;
//        }
    }

    receive("confirm") {  // test ++
        // test only owner ++
        // test success ++
        require(sender() == self.employee_address, "only employer can confirm contract");
        self.confirmed_at = now();
        self.is_active = true;
    }

    receive(msg: CompanyComment) { // test --
        // after contract finished
        require(sender() == self.company_address, "only company can leave company comment");
        self.company_comment = msg.comment;
    }

    receive(msg: EmployeeComment) { // test --
        // after contract finished
        require(sender() == self.employee_address, "only employee can leave employee comment");
        self.employee_comment = msg.comment;
    }

    get fun companyAddress(): Address { // test ++

        return self.company_address;
    }

    get fun employeeAddress(): Address { // test --

        return self.employee_address;
    }

    get fun isInitialized(): Bool { // test ++

        return self.is_initialized;
    }

    get fun isActive(): Bool { // test ++

        return self.is_active;
    }

    receive(msg: FinishEmployeeContract) { // test ++
        let ctx: Context = context();
        // master contract, company or employee can finish contract
        require(ctx.sender == self.company_address || ctx.sender == self.employee_address, "only company or employee can finish contract");
        require(self.is_active, "only active contract can be stopped");// test --
        self.finished_at = now();
        self.is_finished = true;
    }

    get fun isFinished(): Bool { // test ++
        return self.is_finished;
    }

    receive(msg: StopEmployeeContract) { // test ++
        let ctx: Context = context();
        // master contract, company or employee can stop contract
        require(ctx.sender == self.company_address || ctx.sender == self.employee_address, "only company or employee can stop contract");
        require(self.is_active, "only active contract can be stopped");// test --

        self.stopped_at = now();
        self.is_stopped = true;
        if (msg.reason != null) {
            self.stop_reason = msg.reason;
        }
    }
//
//    receive(msg: Test) {
//        dump("--------------------------------------TEST--------------------------------------");
//    }

    get fun isStopped(): Bool { // test ++
        return self.is_stopped;
    }

    get fun stopReason(): String? { // test ++
        return self.stop_reason;
    }

    get fun createdAt(): Int? { // test ++
        return self.created_at;
    }

    get fun confirmedAt(): Int? { // test ++
        return self.confirmed_at;
    }
}
