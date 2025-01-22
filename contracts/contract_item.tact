import "./messages.tact";

contract ContractItem {
    // Empty init() function is present by default in all Tact contracts
    // since v1.3.0, so the following may be omitted:
    master_contract: Address;

    company_address: Address;
    hr_address: Address?;
    employee_address: Address;
    // employee_telegram_id
    // index ???
    index: Int; // timestamp??
//    owner: Address?;

    company_comment: String?;
    employee_comment: String?;

    confirmed: Bool = false; // after employee confirm, become true
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
//            self.owner = ctx.sender;
            self.company_address = msg.company_address;
            self.hr_address = msg.hr_address; // test
            self.employee_address = msg.employee_address;
            self.created_at = now(); // test ++

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
        self.confirmed = true;
    }

    receive(msg: CompanyComment) { // test ++
        // check comment length ??

        // after contract finished or stopped
        require(sender() == self.company_address, "only company can leave company comment"); // test ++
        require(self.is_stopped || self.is_finished, "contract is active"); // test ++
        self.company_comment = msg.comment;
    }

    get fun companyComment(): String? {
        return self.company_comment;
    }

    receive(msg: EmployeeComment) { // test --
        // check comment length

        // after contract finished or stopped
        require(sender() == self.employee_address, "only employee can leave employee comment"); // test ++
        require(self.is_stopped || self.is_finished, "contract is active"); // test ++
        self.employee_comment = msg.comment;
    }

    get fun employeeComment(): String? {
        return self.employee_comment;
    }

    get fun companyAddress(): Address { // test --
        return self.company_address;
    }

    get fun employeeAddress(): Address { // test --
        return self.employee_address;
    }

    get fun isInitialized(): Bool { // test ++
        return self.is_initialized;
    }

    get fun confirmed(): Bool { // test ++
        return self.confirmed;
    }

    receive(msg: FinishEmployeeContract) { // test ++
        let ctx: Context = context();
        // master contract, company or employee can finish contract
        require(
            ctx.sender == self.company_address || // test ++
            ctx.sender == self.employee_address || // test ++
            ctx.sender == self.master_contract, // test --
            "only company, employee or master contract can finish contract"
        );
        require(self.confirmed, "only active contract can be finished");// test --
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
        require(self.confirmed, "only active contract can be stopped");// test --

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
