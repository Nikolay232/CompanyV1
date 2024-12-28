import "@stdlib/deploy";
import "@stdlib/ownable";
import "./company_item.tact";
import "./messages.tact";
import "./master_contract.tact";

//const minTonsForStorage: Int = ton("0.02");
//const gasConsumption: Int = ton("0.02");

contract CompanyMaster with Deployable, OwnableTransferable {
    // Empty init() function is present by default in all Tact contracts
    // since v1.3.0, so the following may be omitted:
//    owner_address: Address;

    owner: Address;
    index: Int;
    next_item_index: Int as uint32 = 0;

    contract_master_address: Address?;

    init(index: Int) {
        self.owner = sender();
        self.index = index;
    }

    receive(msg: Company) {
        // check amount; test --
        // check company already exists; what to do
        let company_init: StateInit = self.companyItemInit(self.next_item_index);
        let msgValue: Int = context().value;
        msgValue = msgValue - (gasConsumption + minTonsForStorage);

        send(SendParameters{
            to: contractAddress(company_init),
            value: msgValue,
            bounce: false,
            mode: SendIgnoreErrors,
//            mode: SendBounceIfActionFail,
            body: Transfer {
                new_owner: sender(),
                post: msg.post,
                description: msg.description
            }.toCell(),
            code: company_init.code,
            data: company_init.data
        });

        // take percent???
    }

    receive(msg: CreateContract) {
        // check sender is company
        let ctx: Context = context();
//        require(self.companyAddressByOwner(msg.company_address, msg.index) == ctx.sender, "only company can call CreateContract method");
//        DUMP
//        dump(self.companyAddressByOwner(msg.company_owner!!, msg.index));
//        dump(ctx.sender);
        require(self.companyAddressByIndex(msg.company_index) == ctx.sender, "only company can call CreateContract method");
        // if change owner, function companyAddressByOwner not work right; ONLY INDEX!!!
        require(ctx.sender == msg.company_address, "you can not create contract for foreing company"); // test --

        if (self.contract_master_address != null) {
            let msgValue: Int = context().value;
            msgValue = msgValue - (gasConsumption + minTonsForStorage);
//            dump(msgValue);
            send(SendParameters{
                to: self.contract_master_address!!,
                value: msgValue,
                bounce: false,
                mode: SendIgnoreErrors,
                //            mode: SendBounceIfActionFail,
                body: msg.toCell()
            });
            self.next_item_index = self.next_item_index + 1;
        } else {
            // return coins to sender
//            nativeThrow(1);
            require(false, "contract_master_address is not set");
//            return;
        }
    }

//    get fun companyItemInit(sender_address: Address, company_index: Int): StateInit {
    get fun companyItemInit(next_item_index: Int): StateInit {
        return initOf CompanyItem(myAddress(), next_item_index); // duplicate this for checking that company is item of company master
    }

    get fun companyAddressByIndex(company_index: Int): Address {
        let initCode: StateInit = self.companyItemInit(company_index);
        return contractAddress(initCode);
    }

    receive(msg: SetContractMasterAddress) {
        // only owner test ++
        self.requireOwner();
        self.contract_master_address = msg.contract_master_address;
    }

    get fun contractMasterAddress(): Address? {
        return self.contract_master_address;
    }

    get fun nextItemIndex(): Int { // test --
        return self.next_item_index;
    }
}
