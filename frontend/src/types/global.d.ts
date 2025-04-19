export {}; // required to make this a module

declare global {
  interface Window {
    ethereum?: any; // you can replace `any` with a stricter type later
  }
}