import { Injectable } from '@angular/core';
import { Contract, ethers } from 'ethers';
import { threadId } from 'worker_threads';
import abi from '../../contracts/ShopChain.json';
import detectEthereumProvider from "@metamask/detect-provider";
import truncateEthAddress from 'truncate-eth-address';
import { Router } from "@angular/router";
import { Meta } from '@angular/platform-browser';
import { getContractAddress } from 'ethers/lib/utils';
import {EventEmitter} from 'events';
import {waitFor} from 'wait-for-event';
import fake from './tesABI.json';
import web3 from 'web3';
declare let window: any;
@Injectable({
  providedIn: 'root'
})
export class MetamaskConnectionService {
  public static chainId : number = 43113;
  public signer: any;
  public static signerAddress: any;
  public static tokenContract: any;
  public tokenAddress: any;
  public sellerBalance: any;
  public sellerList: [] = [];
  public isSigned: boolean =  false;
  public truncatedSignerAddress: any;
  public pending = false;
  public currentAddress : string | undefined;
  public static provider : any;
  public static web3Contract: any;
  public static FAKETokenContract: any;
  public static errorMessage: any;

  constructor(private router: Router) {}
   ///////////////////////////////////////////////////////
  //      GET METAMASK E INIZIALIZZA CONTRATTO        ///
  //////////////////////////////////////////////////////
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
    await provider.send('eth_requestAccounts', []); // <- this promps user to connect metamask
    const signer = provider.getSigner();
    MetamaskConnectionService.tokenContract = new ethers.Contract(abi.contractAddress, abi.abi, signer);


    //////FAKE PER PROVE////////
    MetamaskConnectionService.FAKETokenContract = new ethers.Contract('0xd9145CCE52D386f254917e481eB44e9943F39138', fake, signer);
    //////////////////

    this.tokenAddress = MetamaskConnectionService.tokenContract.address;
    MetamaskConnectionService.signerAddress = await signer.getAddress();
    this.truncatedSignerAddress = truncateEthAddress(MetamaskConnectionService.signerAddress);
    // balance del wallet connesso
    this.sellerBalance = await provider.getBalance(MetamaskConnectionService.signerAddress).then((balances) => {
      // convert a currency unit from wei to ether
      const balanceInEth = ethers.utils.formatEther(balances);
      return balanceInEth;
     })
    this.signer = signer;
    // FUNZIONE BETA FORSE DA TOGLIERE????
    if(!window.ethereum._metamask.isUnlocked()) this.gotToAnotherPage(undefined);
    if(await signer.getChainId() !== MetamaskConnectionService.chainId){
      this.gotToAnotherPage(undefined);
    }
    /// dovrebbe risolvere eroorre//////
    window.addEventListener('load', async () => {
      try {
                 await window.ethereum.enable();
             } catch (error) {}
      });
    return MetamaskConnectionService.tokenContract;
  }
  ///////////////////////////////////////////////////////
  //         INFORMAZIONI SUL SIGNER                 ///
  /////////////////////////////////////////////////////
  async getUserAddress(){
    MetamaskConnectionService.tokenContract = await this.getContract();
    return await MetamaskConnectionService.signerAddress;
  }
  async getSignerBalance(){
    this.sellerBalance = await MetamaskConnectionService.provider.getBalance(MetamaskConnectionService.signerAddress).then((balances: ethers.BigNumberish) => {
      // convert a currency unit from wei to ether
      const balanceInEth = ethers.utils.formatEther(balances);
      return balanceInEth;
     })
  }
  ///////////////////////////////////////////////////////
  //               ORDER LIST                        ///
  //////////////////////////////////////////////////////
  static async getOrderList(): Promise<any[]>{
    return await MetamaskConnectionService.tokenContract.getOrders();
  }
  async getUserOrderList(address: any): Promise<any[]>{
    //MetamaskConnectionService.tokenContract = await this.getContract();
    return await MetamaskConnectionService.tokenContract.getOrdersOfUser(address);
  }
  ////////////error handler/////
  public UserException(message: any) {
    var message = message;
    var name = 'UserException';
  }
  ///////////////////////////////////////////////////////
  //              DELETE ORDER                        ///
  //////////////////////////////////////////////////////
  public static async deleteOrder(orderId: any): Promise<any>{
    const del =  await MetamaskConnectionService.tokenContract.deleteOrder(orderId).catch((error: any) => { 
      console.log("Error:",error.code);
      MetamaskConnectionService.errorMessage = error.message;
    });
    if(del){
    const tx = await del.wait();
    return tx.status === 1;
  }
}
  ///////////////////////////////////////////////////////
  //            SIGN AS SHIPPED                       ///
  //////////////////////////////////////////////////////
  public static async shipOrder(orderId: any): Promise<any>{
    const ship = await MetamaskConnectionService.tokenContract.shipOrder(orderId).catch((error: any) => { 
      console.log("Error:",error.code);
      MetamaskConnectionService.errorMessage = error.message;
    });
    if(ship){
    const tx = await ship.wait();
    return tx.status === 1;
    }
  }
  ///////////////////////////////////////////////////////
  //             REFUND BUYER                         ///
  //////////////////////////////////////////////////////
  public static async refundBuyer(orderId: any, amount: any): Promise<any>{
    const refund = await MetamaskConnectionService.tokenContract.refundBuyer(orderId,amount).catch((error: any) => { 
      console.log("Error:",error.code);
      MetamaskConnectionService.errorMessage = error.message;
    });
    if(refund){
    const tx = await refund.wait();
    return tx.status === 1;
  }
  }
  ///////////////////////////////////////////////////////
  //            GET ORDER LOG                         ///
  //////////////////////////////////////////////////////
  static async getLogsOfOrder(orderId: any){
    return await MetamaskConnectionService.tokenContract.getLogsOfOrder(orderId);
  }
  ////////////////////////////////////////////////////////
  //            GESTIONE DEI SELLER                   ///
  //////////////////////////////////////////////////////
  async getSellerList(): Promise<any[]>{
    MetamaskConnectionService.tokenContract = await this.getContract();
    return this.sellerList =  await MetamaskConnectionService.tokenContract.getSellers();
  }
  async isRegistered(): Promise<boolean>{
    //MetamaskConnectionService.tokenContract = await this.getContract();
    const list = await this.getSellerList();
    if(list.includes(MetamaskConnectionService.signerAddress)){
      console.log("Questo Wallet é registrato come seller");
      return true;
    }
    console.log("Questo Wallet NON é registrato come seller");
    return false;
  }
  async registerAsSeller(){
    //MetamaskConnectionService.tokenContract.registerAsSeller();
    console.log("ora ti registra");
  }
  ///////////////////////////////////////////////////////
  // AGGIORNAMENTO IN BASE A CAMBIO NETWORK E ACCOUNT///
  //////////////////////////////////////////////////////
  async gotToAnotherPage(data: undefined){
    if(!data) await this.router.navigate(['/wrongnetwork']);
    else this.router.navigate(['/orderlist:data']);
  };

  async onRightChain() : Promise<boolean> {
    const provider =  await MetamaskConnectionService.getWebProvider();
    return (await provider.getNetwork()).chainId === MetamaskConnectionService.chainId;
  }
  private static async getWebProvider() {
    MetamaskConnectionService.provider = await detectEthereumProvider();
    return new ethers.providers.Web3Provider(MetamaskConnectionService.provider)
  }

  public accountChanged() : void {
    MetamaskConnectionService.provider.on("accountsChanged",async () => {
      //await this.getContract();
      window.location.reload();
    })
  }

  public async chainChanged() : Promise<void> {
    MetamaskConnectionService.provider.on("chainChanged", async () => {
      if ( await MetamaskConnectionService.provider.chainId === MetamaskConnectionService.chainId) {
      window.location.reload();
    } else {
      window.location.reload();
    }
     })
  }
  ///////////////////////////////////////
  //LIVE UPDATE AT TRANSACTION PENDING//
  /////////////////////////////////////
  // public async pendingTransaction() : Promise<any>{
  // const transferEvents = await MetamaskConnectionService.tokenContract.queryFilter('Transfer');
  // console.log(transferEvents);
  // }
  // funzione trovata su https://stackoverflow.com/questions/68252365/how-to-trigger-change-blockchain-network-request-on-metamask
  public async changeNetwork() : Promise<void> {
    try {
      await MetamaskConnectionService.provider.request({
        method: 'wallet_switchEthereumChain',
        // prende il chainId in esadecimali
        params: [{ chainId: "0x" + MetamaskConnectionService.chainId.toString(16) }],
      });
      this.router.navigate(['/login']);
    } catch (error : any) {
      console.log(error);
      // This error code indicates that the chain has not been added to MetaMask
        // if it is not, then install it into the user MetaMask
      if (error.code === 4902) {
        await MetamaskConnectionService.provider.request({
          method: "wallet_addEthereumChain",
          params: [{ chainId: MetamaskConnectionService.chainId }],
        });
      }
    }
  }
  ////////////////////////////////////
  ///ROBA BUYER ORDER DA RIMUOVERE/////
  /////////////////////////////////////
  async askRefund(orderId: any){
    return await MetamaskConnectionService.tokenContract.askRefund(orderId);
  }
  async createOrder(buyer: any, amount: any){
    const create = await MetamaskConnectionService.tokenContract.createOrder('0x0Ca317B657C9F6E35B57Ea94DE308A40f2B63a6D', {value: ethers.utils.parseEther("0.02")});
    const tx = await create.wait();
    return tx.status === 1;
  }

}

