import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { ActivatedRoute } from '@angular/router';
import { MetamaskConnectionService } from '../metamask-connection.service';
import { Orders, State } from '../orders';
import { BigNumber, Contract, ethers} from 'ethers';
import { QRCodeElementType } from 'angularx-qrcode';

@Component({
  selector: 'app-order-info',
  templateUrl: './order-info.component.html',
  styleUrls: ['./order-info.component.css']
})
export class OrderInfoComponent implements OnInit {
  public static AMOUNT : any;
  public qrInfo: string = '';
  orderList: any[] | undefined;
  sellerList: any[] | undefined;
  userOrders: any[] | undefined;
  public userOrdersList: Orders[] = [];
  displayedColumns: string[] = ['ID','buyer','amount','state'];
  numberId: number = 0;
  amount: BigNumber | undefined;
  public order: Orders | undefined;
  public userAddress: any;
  // per creare l'ordine
  //newAmount = BigNumber.from("1.4") ;
  state: State | undefined;
  Color: string[] = [
    'rgb(102 255 102)', // light green // created
    'rgb(0 204 0)' , // green // shipped
    'rgb(0 102 204)' , // blue // confirmed
    'rgb(227 85 86)' , // red // deleted
    'rgb(242 200 70)', // yellow // refundAsked
    'rgb(255 128 0)' // orange// refunded
 ];
  States: string[] =[
    'created',
    'shipped',
    'confirmed',
    'deleted',
    'refundAsked',
    'refunded',
  ];
  // abi = [
  //   "event Transfer(address indexed src, address indexed dst, uint val)"
  // ];
  signerAddress: any ;
  elementType = "canvas";
  constructor(private route: ActivatedRoute, private metamaskConnectionService: MetamaskConnectionService) {}

  async ngOnInit(): Promise<void> {
    this.order = await this.getId();
    this.signerAddress = await this.getUser();
  }
  //////////////////////////////////////
  //       GET ORDER DATA             ///
  //////////////////////////////////////
  async getUser(){
    return await this.metamaskConnectionService.getUserAddress();
  }
  async getOrderList(){
    this.orderList = await MetamaskConnectionService.getOrderList();
  }
  async getSellerList(){
    return this.sellerList =  await this.metamaskConnectionService.getSellerList();
  }
  async getId(): Promise<Orders>{
  const id = Number(this.route.snapshot.paramMap.get('id'));
  this.userAddress = await this.getUser();
  this.userOrders = await this.metamaskConnectionService.getUserOrderList(this.userAddress);
  let order: Orders = {
    id: 0,
    buyerAddress: '',
    sellerAddress: '',
    amount: '',
    state: 0
  };
  this.userOrders.map((e: any[]) => {
      this.numberId = e[0].toNumber();
      if(id === this.numberId){
      order = {
        id: this.numberId,
        buyerAddress: e[1],
        sellerAddress: e[2],
        amount: ethers.utils.formatEther(e[3]),
        state: e[4]
      }
      this.qrInfo = 'Buyer Address: ' + order.buyerAddress + '\n';
      this.qrInfo += 'Order Id: ' + this.numberId;
      this.state = e[4];
      this.amount = e[3];
      OrderInfoComponent.AMOUNT = e[3];
      this.order = order;
    }
  });
  return order;
  }
  ////////////////////////////////////////
  //    OPERATIONS ON THE ORDER       ///
  //////////////////////////////////////
  async deleteOrder(orderId: any){
    MetamaskConnectionService.deleteOrder(orderId);
  }
  async shipOrder(orderId: any){
    //await this.metamaskConnectionService.getContract();
    var elem = document.getElementById('loader');
    if(elem) elem.hidden = false;
    const result = await this.metamaskConnectionService.shipOrder(orderId);
    if(elem && result) elem.hidden = true;
    if(!result) console.log("error");
  }
  async refundBuyer(orderId: any){
    var elem = document.getElementById('loader');
    if(elem) elem.hidden = false;
    const result = await this.metamaskConnectionService.refundBuyer(orderId, OrderInfoComponent.AMOUNT);
    if(elem && result) elem.hidden = true;
    if(!result) console.log("error");
  }
  async askRefund(orderId: any){
    var elem = document.getElementById('loader');
    if(elem) elem.hidden = false;
    const result = await this.metamaskConnectionService.askRefund(orderId);
    if(elem && result) elem.hidden = true;
    if(!result) console.log("error");
  }
  async createOrder(address: any){
    var elem = document.getElementById('loader');
    if(elem) elem.hidden = false;
    const result = await this.metamaskConnectionService.createOrder(address, this.amount);
    if(elem && result) elem.hidden = true;
    if(!result) console.log("error");
  }
  saveAsImage() {
  }
  //   let parentElement = null

  //   if (this.elementType === "canvas") {
  //     // fetches base 64 data from canvas
  //     parentElement = parent.qrcElement.nativeElement
  //       .querySelector("canvas")
  //       .toDataURL("image/png")
  //   } else if (this.elementType === "img" || this.elementType === "url") {
  //     // fetches base 64 data from image
  //     // parentElement contains the base64 encoded image src
  //     // you might use to store somewhere
  //     parentElement = parent.qrcElement.nativeElement.querySelector("img").src
  //   } else {
  //     alert("Set elementType to 'canvas', 'img' or 'url'.")
  //   }

  //   if (parentElement) {
  //     // converts base 64 encoded image to blobData
  //     let blobData = this.convertBase64ToBlob(parentElement)
  //     // saves as image
  //     const blob = new Blob([blobData], { type: "image/png" })
  //     const url = window.URL.createObjectURL(blob)
  //     const link = document.createElement("a")
  //     link.href = url
  //     // name of the file
  //     link.download = "Qrcode"
  //     link.click()
  //   }
  // }

  // private convertBase64ToBlob(Base64Image: string) {
  //   // split into two parts
  //   const parts = Base64Image.split(";base64,")
  //   // hold the content type
  //   const imageType = parts[0].split(":")[1]
  //   // decode base64 string
  //   const decodedData = window.atob(parts[1])
  //   // create unit8array of size same as row data length
  //   const uInt8Array = new Uint8Array(decodedData.length)
  //   // insert all character code into uint8array
  //   for (let i = 0; i < decodedData.length; ++i) {
  //     uInt8Array[i] = decodedData.charCodeAt(i)
  //   }
}