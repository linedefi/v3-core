import 'dotenv/config'
import 'hardhat-typechain'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@nomicfoundation/hardhat-verify'
import '@nomiclabs/hardhat-ethers'
import 'hardhat-deploy'
import 'hardhat-deploy-ethers'
import { task, types } from 'hardhat/config'
import { MaxUint128 } from './test/shared/utilities'
const sleep = require('util').promisify(setTimeout)

if (!process.env.DEPLOYER) throw new Error("DEPLOYER not found. Set DEPLOYER to the .env file");
const deployer = process.env.DEPLOYER;

if (!process.env.PRIVATE_KEY) throw new Error("PRIVATE_KEY not found. Set PRIVATE_KEY to the .env file");
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!process.env.LINEA_RPC_URL) throw new Error("LINEA_RPC_URL not found. Set LINEA_RPC_URL to the .env file");
const LINEA_RPC_URL = process.env.LINEA_RPC_URL;

task('add-fee-tier', 'Add fee tier')
  .addParam('fee', 'Fee', 100, types.int)
  .addParam('tickSpacing', 'Tick Spacing', 1, types.int)
  .setAction(async (taskArgs, hre) => {
    const { fee, tickSpacing } = taskArgs
    const { getNamedAccounts, ethers, deployments } = hre
    const factory = await ethers.getContract('UniswapV3Factory')
    await factory.enableFeeAmount(fee, tickSpacing)
    console.log('Enabled fee amount')
  })

task('set-fee-protocol', 'Set fee protocol')
  // .addParam(
  //   'poolAddresses',
  //   'Pool Addresses'
  // )
  .addParam('feeProtocol0', 'Fee Protocol 0', 4, types.int)
  .addParam('feeProtocol1', 'Fee Protocol 1', 4, types.int)
  .setAction(async (taskArgs, hre) => {
    const poolAddresses: string[] = []

    const { feeProtocol0, feeProtocol1 } = taskArgs
    const { ethers } = hre

    for (const poolAddress of poolAddresses) {
      const pool = await ethers.getContractAt('UniswapV3Pool', poolAddress)
      await (await pool.setFeeProtocol(feeProtocol0, feeProtocol1)).wait()
      // await sleep(10000)
      console.log(`Fee protocol set for pool ${poolAddress}`)
    }

    console.log(`Fee protocol set for pool addresses ${poolAddresses}`)
  })

task('collect', 'Collect')
  // .addParam(
  //   'poolAddresses',
  //   'Pool Addresses'
  // )
  .addParam('amount0Requested', 'Amount 0 Requested', MaxUint128.toString(), types.string)
  .addParam('amount1Requested', 'Amount 1 Requested', MaxUint128.toString(), types.string)
  .setAction(async (taskArgs, hre) => {
    const poolAddresses: string[] = []
    const { amount0Requested, amount1Requested } = taskArgs
    const { ethers } = hre
    for (const poolAddress of poolAddresses) {
      const pool = await ethers.getContractAt('UniswapV3Pool', poolAddress)
      await (await pool.collectProtocol(deployer, amount0Requested, amount1Requested)).wait()
      console.log(`Fees collected for pool ${poolAddress}`)
    }
    console.log(`Fees collected for pool addresses ${poolAddresses}`)
  })

export default {
  networks: {
    hardhat: {
      allowUnlimitedContractSize: false,
    },
    linea: {
      url: LINEA_RPC_URL,
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 59144,
      live: true,
      saveDeployments: true,
    },
  },
  namedAccounts: {
    deployer,
    alice: {
      default: 1,
    },
    bob: {
      default: 2,
    },
    carol: {
      default: 3,
    },
    dev: {
      default: 4,
    },
    feeTo: {
      default: 5,
    },
  },
  etherscan: {
    apiKey: {
      linea: 'W9EEZBTK4YQC8PMZNJ75C6QI126D25ZVV4',
    },
    customChains: [
      {
        network: "linea",
        chainId: 59144,
        urls: {
          apiURL: "https://api.lineascan.build/api",
          browserURL: "https://lineascan.build/"
        }
      },
    ],
  },
  solidity: {
    version: '0.7.6',
    settings: {
      optimizer: {
        enabled: true,
        runs: 800,
      },
      metadata: {
        // do not include the metadata hash, since this is machine dependent
        // and we want all generated code to be deterministic
        // https://docs.soliditylang.org/en/v0.7.6/metadata.html
        bytecodeHash: 'none',
      },
    },
  },
}
