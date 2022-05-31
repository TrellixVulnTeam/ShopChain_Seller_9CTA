import { Injectable } from '@angular/core';
import { ethers } from 'ethers';
import { threadId } from 'worker_threads';
import address from '../../contracts/ShopChain.json';
import detectEthereumProvider from "@metamask/detect-provider";

import { Router } from "@angular/router";
declare let window: any;
@Injectable({
  providedIn: 'root'
})
export class MetamaskConnectionService {
  public signer: any;
  public signerAddress: any;
  public tokenContract: any;
  public tokenAddress: any;
  public connected: any;
  public sellerBalance: any;
  public sellerList: [] = [];
  public isSigned: boolean =  false;

  public static currentAddress : string;
  public static provider : any;
  public static chainId : number = 43113;
  public static rightChain : boolean = true;

  constructor(private router: Router) { console.log(this.tokenAddress);}
  // verifica che metamask sia installato
  async getMetamask(){
    if (this.isInstalled() === undefined) {
      console.log('MetaMask is NOT installed!');
    }else{
      console.log('MetaMask is installed');
      this.getContract();
    }
  }
  isInstalled(){
    return window.ethereum;
  }

  // Inizializza il contratto
  async getContract(): Promise<any>{
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    this.signer = provider.getSigner();
    this.tokenContract = new ethers.Contract(address.contractAddress, address.abi, this.signer);
    console.log(this.tokenContract);
    this.tokenAddress = this.tokenContract.address;
    this.signerAddress = await this.signer.getAddress();
    // balance del wallet connesso
    this.sellerBalance = await provider.getBalance(this.signerAddress).then((balances) => {
      // convert a currency unit from wei to ether
      const balanceInEth = ethers.utils.formatEther(balances);
      return balanceInEth;
     })
    if(await this.signer.getChainId() !== 43113){
      this.router.navigate(['/wrongnetwork']);
    }
    // popolare gli ordini
    //this.tokenContract.createOrder("0xEbDC67e05348AB26BF1a5662B3C7129BE08a601f",{value: ethers.utils.parseEther("0.1")});
    return this.tokenContract;
  }
  async getOrderList(): Promise<any[]>{
    this.tokenContract = await this.getContract();
    // returna un array con gli ordini
    //console.log( "Questi sono gli ordini nello sc: ", await this.tokenContract.getOrders());
    return await this.tokenContract.getOrders();
  }
  async getUserOrderList(address: any): Promise<any[]>{
    this.tokenContract = await this.getContract();
    console.log("ordini che risultano a nome di questo venditore:   ", await this.tokenContract.getOrdersOfUser(address));
    return await this.tokenContract.getOrdersOfUser(address);

  }
  async getSellerList(): Promise<any[]>{
    this.tokenContract = await this.getContract();
    //returna un array con i sellers
    //console.log( await this.tokenContract.getSellers());
    return this.sellerList =  await this.tokenContract.getSellers();
    // this.sellerList.forEach((element: any) => {
    //   if (element === this.signerAddress){
    //     // se trova l'address di questo wallet registrato come venditore nello smart contract, allora......
    //     this.isSigned = true;
    //   }
    // });
    // console.log("Questo Wallet é registrato come seller? : ",this.isSigned);
    // return this.isSigned;
  }
  async isRegistered(): Promise<boolean>{
    this.tokenContract = await this.getContract();
    const list = await this.getSellerList();
    if(list.includes(this.signerAddress)){
      console.log("Questo Wallet é registrato come seller");
      return true;
    }
    console.log("Questo Wallet NON é registrato come seller");
    return false;
  }
  async registerAsSeller(){
    //this.tokenContract.registerAsSeller();
    console.log("ora ti registra");
  }
  async getUserAddress(){
    this.tokenContract = await this.getContract();
    return this.signerAddress;
  }
  async isRightChain() : Promise<boolean> {
    const provider = await MetamaskConnectionService.getWebProvider();
    return (await provider.getNetwork()).chainId === MetamaskConnectionService.chainId;
  }
  private static async getWebProvider(requestAccounts = true) {
    MetamaskConnectionService.provider = await detectEthereumProvider();
    if (requestAccounts)
    MetamaskConnectionService.currentAddress =  await MetamaskConnectionService.provider.request({ method: 'eth_requestAccounts' })

    return new ethers.providers.Web3Provider(MetamaskConnectionService.provider)
  }
  public listenerAccountChange() : void {
    MetamaskConnectionService.provider.on("accountsChanged",async () => {
      await this.getContract();
      window.location.reload();
    })
  }
  public listenerNetworkChange() : void {
    MetamaskConnectionService.provider.on("chainChanged", () => {
      console.log(MetamaskConnectionService.provider.chainId);
      if (MetamaskConnectionService.provider.chainId === MetamaskConnectionService.chainId) {
        MetamaskConnectionService.rightChain = true;
      } else {
        MetamaskConnectionService.rightChain = false;
      }
      window.location.reload();
    })
  }
  public async changeNetwork() : Promise<void> {
    console.log("ci sono")
    console.log("0x" + MetamaskConnectionService.chainId.toString(16))
    try {
      await MetamaskConnectionService.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: "0x" + MetamaskConnectionService.chainId.toString(16) }],
      });
      window.location.reload();
    } catch (error : any) {
      console.log(error);
      if (error.code === 4902) {
        await MetamaskConnectionService.provider.request({
          method: "wallet_addEthereumChain",
          params: [{ chainId: MetamaskConnectionService.chainId }],
        });
      }
    }
  }
  async getSignerBalance(){
    this.sellerBalance = await MetamaskConnectionService.provider.getBalance(this.signerAddress).then((balances: ethers.BigNumberish) => {
      // convert a currency unit from wei to ether
      const balanceInEth = ethers.utils.formatEther(balances);
      return balanceInEth;
     })
  }
}
