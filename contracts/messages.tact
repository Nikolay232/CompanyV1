message Company {
    post: String;
    description: String;
    index: Int;
}

message Transfer {
    new_owner: Address;
    post: String;
    description: String;
    response_destination: Address?;
}

message CreateContract {
    company_address: Address;
    employee_address: Address;
    company_owner: Address?;
    company_index: Int;
    contract_index: Int;
}

//message EmployeeConfirm {
//    company_address: Address;
//}

message SetCompanyMasterAddress {
    company_master_address: Address;
}

message SetContractMasterAddress {
    contract_master_address: Address;
}

message CompanyComment {
    comment: String;
}

message EmployeeComment {
    comment: String;
}

message AddTrustedPerson {
    trusted_person: Address;
}

message DeleteTrustedPerson {
    trusted_person: Address;
}

message AddCoowner {
    coowner: Address;
}

message DeleteCoowner {
    coowner: Address;
}

message StopEmployeeContract {
    employee_contract: Address?;
    reason: String?;
}

message FinishEmployeeContract {
    employee_contract: Address?;
}

message Test {
    employee_contract: Address;
}
