import "./messages.tact";
import "@stdlib/ownable";

const minTonsForStorage: Int = ton("0.1");
const gasConsumption: Int = ton("0.02");

//contract CompanyItem with Deployable {
//contract CompanyItem with OwnableTransferable {
contract CompanyItem {
    // Empty init() function is present by default in all Tact contracts
    // since v1.3.0, so the following may be omitted:

    // telegram_id
    master_contract: Address;

//    owner: Address; // owner csn withdraw coins to address
    coowners: map<Address, Bool>; // rest only coowners dict; add owner to coowners

    index: Int; // is timestamp
    is_initialized: Bool;
//    owner_post: String?;
    description: String?;

//    trusted_persons: map<Address, Bool>;

    created_at: Int?;

    init(master_contract: Address, owner: Address, index: Int) {
        require(sender() == master_contract, "not from master_contract");
        self.master_contract = master_contract;
//        self.owner = owner;
        self.coowners.set(owner, true);
        self.index = index;
        self.is_initialized = false;
    }

    receive(msg: Transfer) {
        let ctx: Context = context(); // Reference: https://docs.tact-lang.org/language/ref/common#context
        let msgValue: Int = self.msgValue(ctx.value);

        if (self.is_initialized == false) {  // Initial Transfer, aka the "Minting" of the NFT
            require(ctx.sender == self.master_contract, "initialized tx need from collection");
            self.is_initialized = true;
//            self.owner = msg.new_owner;
//            self.owner_post = msg.post;
            self.coowners.set(msg.new_owner, true);
            self.description = msg.description;
            self.created_at = now();
//            if (msg.response_destination != null) {
//                send(SendParameters{
//                    to: msg.response_destination!!,
//                    value: msgValue,
//                    mode: SendPayGasSeparately,
//                    body: Excesses { query_id: msg.query_id }.toCell()
//                });
//            }
        } else {
            self.requireOwner();
//            self.owner = msg.new_owner;  // change current owner to the new_owner
            self.coowners.set(ctx.sender, null);
            self.coowners.set(msg.new_owner, true);
//            if (msg.forward_amount > 0) {
//                send(SendParameters{
//                    to: msg.new_owner,
//                    value: msg.forward_amount,
//                    mode:  SendPayGasSeparately,
//                    bounce: true,
//                    body: OwnershipAssigned{
//                        query_id: msg.query_id,
//                        prev_owner: ctx.sender,
//                        forward_payload: msg.forward_payload
//                    }.toCell()
//                });
//            }

//            msgValue = msgValue - ctx.readForwardFee();
//            if (msg.response_destination != null) {
//                send(SendParameters{
//                    to: msg.response_destination!!,
//                    value: msgValue - msg.forward_amount,
//                    mode: SendPayGasSeparately,
//                    bounce: true,
//                    body: Excesses { query_id: msg.query_id }.toCell()
//                });
//            }
        }
    }

    receive(msg: CreateContract) {
        let ctx: Context = context();

//        require(ctx.sender == self.owner, "CreateContract can call only owner");
        self.requireOwner();
        // test TrustedPerson
        // test coowner

        let msgValue: Int = context().value;
        msgValue = msgValue - gasConsumption;
//        let master_contract: StateInit =  initOf MasterContract(myAddress(), sender_address);
//        let company_init: StateInit = self.MasterContract(sender());
        send(SendParameters{
            to: self.master_contract,
            value: msgValue,
            bounce: false,
            mode: SendIgnoreErrors,
            //            mode: SendBounceIfActionFail,
            body: CreateContract {
                company_address: myAddress(),
                employee_address: msg.employee_address,
                company_owner: self.owner,
                company_index: self.index,
                contract_index: msg.contract_index
            }.toCell()
        });
    }

    receive(msg: AddTrustedPerson) {
        // tests ++
        // set not owner ++
        // success ++
        let ctx: Context = context();

//        require(ctx.sender == self.owner, "trusted person can set only owner");
        self.requireOwner();
        self.trusted_persons.set(msg.trusted_person, true);
    }

    receive(msg: DeleteTrustedPerson) {
        // tests ++
        // set not owner ++
        // success ++
        let ctx: Context = context();

//        require(ctx.sender == self.owner, "trusted person can set only owner");
        self.requireOwner();

        self.trusted_persons.set(msg.trusted_person, null);
    }

    receive(msg: AddCoowner) {
        // tests ++
        // set not owner ++
        // success ++
        let ctx: Context = context();

//        require(ctx.sender == self.owner, "coowner can set only owner");

        self.requireOwner();
        self.coowners.set(msg.coowner, true);
    }

    receive(msg: DeleteCoowner) { // test ++
        // tests ++
        // set not owner ++
        // success ++
        let ctx: Context = context();

//        require(ctx.sender == self.owner, "coowner can set only owner");

        self.requireOwner();
        self.coowners.set(msg.coowner, null);
    }

    receive(msg: StopEmployeeContract) { // test ++
        // set not owner ++
        // success ++

        // only owner; coowner or trusted person can call
        self.requireOwner();

        let msgValue: Int = context().value;
        msgValue = msgValue - gasConsumption;

        send(SendParameters{
            to: msg.employee_contract!!,
            value: msgValue,
            bounce: false,
            mode: SendIgnoreErrors,
//            mode: SendBounceIfActionFail,
            body: msg.toCell()
        });
    }

    receive(msg: FinishEmployeeContract) { // test ++
        // set not owner ++
        // success ++

        // only owner; coowner or trusted person can call
        self.requireOwner();

        let msgValue: Int = context().value;
        msgValue = msgValue - gasConsumption;

        send(SendParameters{
            to: msg.employee_contract!!,
            value: msgValue,
            bounce: false,
            mode: SendIgnoreErrors,
//            mode: SendBounceIfActionFail,
            body: msg.toCell()
        });
    }

    fun msgValue(value: Int): Int {
        let tonBalanceBeforeMsg: Int = myBalance() - value;
        let storageFee: Int = minTonsForStorage - min(tonBalanceBeforeMsg, minTonsForStorage);
        return value - (storageFee + gasConsumption);
    }

    fun requireOwner() {
        nativeThrowUnless(132, self.coowners.get(sender()));
    }

    get fun trustedPersons(): map<Address, Bool> {
        return self.trusted_persons;
    }

    get fun isTrustedPerson(person_address: Address): Bool? { // test ++
        return self.trusted_persons.get(person_address);
    }

    get fun coowners(): map<Address, Bool> {
        return self.coowners;
    }

    get fun isCoowner(coowner_address: Address): Bool? { // test ++
        return self.coowners.get(coowner_address);
    }

    get fun masterContract(): Address { // test ++
        return self.master_contract;
    }
//    get fun owner(): Address { // test ++
//        return self.owner;
//    }

    get fun isInitialized(): Bool { // test ++
        return self.is_initialized;
    }

    get fun createdAt(): Int? { // test ++
        return self.created_at;
    }
}
