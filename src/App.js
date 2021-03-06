import React, { Component } from "react";

import AccountsTable from "./AccountsTable/AccountsTable.js";
import AddressInspector from "./AddressInspector/AddressInspector.js";

import axios from "axios";

import { useWeb3Context } from 'web3-react/hooks'

import Tokens from "./Compound.js";

import "./App.css";

import sampleJson from "./samplejson.json";

/*
 * Parse response data from server into an array of account objects. Can point to local json or server response
 */
function ParseAccountDataResponse(json, app) {
  var newAccounts = [];

  json.account_values.forEach(accountData => {
  	
    var account = {
      address: accountData.address,

      // how much the borrower has borrowed in ETH
      totalEthBorrow: accountData.total_borrow_value_in_eth.value,

      // how much the borrower has supplied in ETH
      totalEthSupply: accountData.total_supply_value_in_eth.value,

      // when this borrower was last updated (ETH block)
      blockUpdated: accountData.block_updated
    };

    newAccounts.push(account);
  });

  app.setState({
    accounts: newAccounts
  });
}

class App extends Component {
  constructor() {
    super();

    this.state = {
      accounts: [],

      // the address we're currently inspecting
      inspected_address: "",
      // the state of that address (risky, safe, unsafe) TODO this should be wrapped in a single address object
      inspected_address_state : "",
      
      // used when inspecting an address to hold how much the account has borrowed or supplied 
      borrow_balances: {},
      supply_balances: {},
      // which balances are currently being requested from server
      pending_balances: {},

      // the asset that the user has toggled to repay for the borrow
      asset_repay: "",
      // the asset that the user has toggled to collect from borrower      
      asset_collect: "",

      // holds the submitted liquidation transation hash
      repaySubmittedTxHash : "",
      // the discount for liquidating borrows (gets fetched later)
      liquidationDiscount : -1,

      // whether the user can choose assets on the address inspect. Blocked by default unless that account has a negative account liquidity
      liquidateBlocked : true
    };
  }

  componentDidMount() {
  	// if we don't have any accounts then fetch them
    if (this.state.accounts.length == 0) {
      this.refreshAccountList();
    }
  }

  render() {
  	// if we're inspecting an address
    if (this.state.inspected_address.length > 0) {    	
      return (
        <AddressInspector app={this} />
      );
    } else {
   	  // else we're not inspecting an address, check if there's any accounts. if not then show loading gif
      if (this.state.accounts.length == 0) {
        return (
          <div>
            <img src="./loading.gif" className="Loading" />
          </div>
        );
      } else {
      	// show the accounts list
        return (
          <AccountsTable accounts={this.state.accounts} app={this} />          
        );
      }
    }
  }

  refreshAccountList() {
  	// TESTING
    // ParseAccountDataResponse(sampleJson, this);

    var URL = "https://api.compound.finance/api/risk/v1/get_account_values";

    // STAGING TODO detect and using appropriate server automatically
    // var URL = "https://api.stage.compound.finance/api/risk/v1/get_account_values";

    axios({
      method: "post",
      url: URL,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
        // ,'compound-api-key' : 'xxx' TODO implement this when CORS response headers are fixed
      },
      // TODO put input fields on main page for user to set
      data: {
        page_size: 100,
        page_number: 1,
        min_borrow_value_in_eth: {
          value: "50000000000000000"
        },
        max_collateral_ratio: {
          value: "5"
        }
      }
    }).then(response => {
        console.log(response);

        ParseAccountDataResponse(response.data, this);
      })
      .catch(error => {
        console.error(error);
      });
  }
}

export default App;
