import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/h_r_contract.tact',
    options: {
        debug: true,
    },
};
