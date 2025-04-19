import addresses from "./contract-addresses.json";
import lendingPoolAbi from "./abis/LendingPool.json";
import daiAbi from "./abis/MockDAI.json";

export const CONTRACTS = {
  ...addresses,
  LENDING_POOL_ABI: lendingPoolAbi.abi,
  DAI_ABI: daiAbi.abi,
};
