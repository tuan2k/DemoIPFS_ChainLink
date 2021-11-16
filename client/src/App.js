import React, { Component } from "react";

import SimpleStorageContract from "./contracts/SimpleStorage.json";
import getWeb3 from "./getWeb3";

import "./App.css";

const ipfsClient = require("ipfs-http-client");

const ipfs = ipfsClient({
  host: "ipfs.infura.io",
  port: "5001",
  protocol: "https",
});

class App extends Component {
  state = {
    file: null,
    storageValue: 0,
    web3: null,
    accounts: null,
    contract: null,
    ipfsHash: null,
    buffer: "",
    links: "",
  };

  
  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const instance = new web3.eth.Contract(
        SimpleStorageContract.abi,
        "0xe3Af384e3715828DEC5A5581A9c29855362e8909"
      );
      console.log(instance)
      this.setState({ web3, accounts, contract: instance }, this.runExample);
      this.setState({ file: null, links: "", buffer: "", ipfsHash: null });
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };
  

  runExample = async () => {
    // const { accounts, contract } = this.state;

    // await contract.methods.set(1100000).send({ from: accounts[0], gas: 1000000 });

    // const response = await contract.methods.get().call();

    // this.setState({ storageValue: response });
  };

  captureFile = (event) => {
    event.preventDefault();
    console.log("event.target.files are here : ", event.target.files);
    this.setState({ file: event.target.files });
    this.setState({ links: "", buffer: "", ipfsHash: null });
  };

  encode = function(input) {
    var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;

    while (i < input.length) {
        chr1 = input[i++];
        chr2 = i < input.length ? input[i++] : Number.NaN; // Not sure if the index 
        chr3 = i < input.length ? input[i++] : Number.NaN; // checks are needed here

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }
        output += keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                  keyStr.charAt(enc3) + keyStr.charAt(enc4);
    }
    return output;
  }

  showChainLink = async () => {
    const {accounts, contract, web3 } = this.state;
    await contract.methods.requestVolumeData().send({ from: accounts[0], gas: 1000000});
    this.printChainLink();
   
  }

  printChainLink = async () => {
    const {accounts, contract, web3 } = this.state;
    const volume = await contract.methods.getvolume().call();
    console.log(volume)
  }

  // get string
  showStringChainLink = async () => {
    const {accounts, contract, web3 } = this.state;
    await contract.methods.requestVolumeString().send({ from: accounts[0], gas: 1000000});  
    const volume = await contract.methods.getvolumeString().call();
   console.log(web3.utils.hexToAscii(volume))   
  }

  showImage = async () => {
  // get hash value 
  const {accounts, contract } = this.state;
  const response = await contract.methods.getfile(2).call();
  
  // get image in ipfs
  const chunks = []
  for await (const chunk of ipfs.cat(response)) {
  chunks.push(chunk)
  }
  var temp = []
  for (var k=0;k< chunks.length; k++) {
    for(var i=0;i<chunks[k].length;i++){
      temp.push(chunks[k][i]);
    }
  }
  var bytes = new Uint8Array(temp);
  var image = document.getElementById('IdOfImage'); 
  image.src = "data:image/png;base64," + this.encode(bytes); 
  }

addJsonData = async () => {

  const doc = JSON.stringify({
    foo: "bar",
    tic: "tok"
  });
  
  const cid = await ipfs.add(doc);

  console.log("IPFS cid:", cid.path);

  const response = await fetch("https://gateway.ipfs.io/ipfs/QmVnGSHRapxxXtCFEqKu9nPF8MqdDGSNgo4aUKwv7EL2Bh");

  if(!response.ok)
  throw new Error(response.statusText);

  const json = await response.json();

  console.log(json);
}
 
  onSubmit = async (event) => {
    event.preventDefault();
    const { accounts, contract } = this.state;
    console.log(ipfs)
    console.log(contract)
    console.log("Submitting file to ipfs... files are:", this.state.file);
    const file = this.state.file;

    console.log("file got from this.state.file", file);
    const output = await ipfs.add(file);
    const hash = output.cid.toString();
    const pin = await ipfs.pin.add(hash); 
    const allpin = await ipfs.pin.ls(hash);
    console.log(allpin)
    console.log(
      "Ipfs add call output link",
      "https://gateway.ipfs.io/ipfs/" + hash
    );
    this.setState({ ipfsHash: hash });
  
    console.log("hash value being sent to addfile method : ", hash);
    console.log("ipfsHash state value : ", this.state.ipfsHash);
    const add_result = await contract.methods
      .addfile(hash,2)
      .send({ from: accounts[0] , gas: 1000000});
    console.log("add result: ", add_result);
    const filelink = await contract.methods.getfile(2).call();
   
    console.log("get result: ", filelink);
    this.setState({
      links: "https://gateway.ipfs.io/ipfs/" + filelink,
    });
    console.log(
      "here is your link: ",
      "https://gateway.ipfs.io/ipfs/" + filelink
    );
  };

  

  render() {
    return (
      <div className="App has-background-dark ">
        <nav className="level">
          <p className="level-item has-text-centered">
            <h1 className="title is-1 has-text-primary">
              Ethereum Based File Sharing
            </h1>
          </p>
        </nav>
        <h2 className="subtitle is-2 has-text-white">Upload files Below: </h2>

        <form onSubmit={this.onSubmit}>
          <div className="field">
            <div className="file is-centered is-boxed is-success">
              <label className="file-label">
                <input
                  className="file-input"
                  type="file"
                  name="resume"
                  onChange={this.captureFile}
                />
                <span className="file-cta">
                  <span className="file-icon">
                    <i className="fas fa-upload" />
                  </span>
                  <span className="file-label">Upload Files…</span>
                </span>
              </label>
            </div>
          </div>
          <br />
          <div className="buttons is-centered">
            <button className="button is-link">Submit</button>
          </div>
        </form>
        <br /> <br /> <br />
        <div>
          <img id="IdOfImage" src=""/> <br />
          <button onClick={this.showImage}>Get Image!</button>
        </div>
        <br /> <br /> <br />
        <div>
          <button onClick={this.addJsonData}>Add JsonData!</button>
        </div>
        <br /> <br /> <br />
        <div>
          <button onClick={this.showChainLink}>show chainlink Number!</button>
        </div> 
        <br /> <br /> <br />
        <div>
          <button onClick={this.showStringChainLink}>show chainlink String!</button>
        </div>
        <section className="section">
          <div className="container">
            <h3 className="subtitle is-3 has-text-primary">Links are here:</h3>
            <div>
              {this.state.links.length ? (
                <ul key={this.state.links}>
                  <a
                    className="has-text-white"
                    href={this.state.links}
                    key={this.state.links}
                  >
                    {this.state.links}
                  </a>
                </ul>
              ) : (
                <h3 className="subtitle is-3 has-text-white">
                  {" "}
                  no files uploaded
                </h3>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }
}


export default App;
