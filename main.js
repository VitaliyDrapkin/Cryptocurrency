const state = {
  cacheAllCoins: [],
  cachesSpecificCoin: new Map(),
  activeCoins: [],
  lastActiveCoins: [],
  activeCoinsSymbolGraph: [],
  modalIsOpen: false,
  graphInterval: "",

  // cost DOMAIN =""
  getAllCacheCoins() {
    return this.cacheAllCoins;
  },
  setSpecificCoin(coin, coinData) {
    this.cachesSpecificCoin.set(coin, coinData);
  },
  getSpecificCoin(coin) {
    return this.cachesSpecificCoin.get(coin);
  },
};

$(function () {
  //Start this function on page load
  pageLoadFunction();

  //events for buttons
  $("#btnSearch").click(() => searchOnClick());
  $("#btnHome").click(() => goToHome());
  $("#btnLiveReports").click(() => goToLiveReports());
  $("#btnAbout").click(() => goToAbout());
  $("#btnShowSelectedCoins").click(() => showSelectedCoins());
  $("#searchInput").keyup(() => searchByKeyEnter(event));

  //get coins from server save in cache and show them
  function pageLoadFunction() {
    //why
    document.body.classList.add("loaded");

    getCoinsFromServer()
      .then(saveCoinsInCache)
      .fail(failGetCoinsFromServer)
      .then(showAllCoins);
  }

  //get all coins from server
  function getCoinsFromServer() {
    const url = "https://api.coingecko.com/api/v3/coins/";
    let promise = $.get(url);
    return promise;
  }

  //save all coins in cache
  function saveCoinsInCache(coins) {
    state.cacheAllCoins = coins;
  }

  //get coins from the cache show in UI and hide loading spiner
  function showAllCoins() {
    let allCoins = state.getAllCacheCoins();
    showCoinsUI(allCoins);
    $(".loading-spinner-page").hide();
  }

  //Create and show all coins
  function showCoinsUI(allCoins) {
    //clear div on start
    $("#mainContent").empty();
    $("#searchInput").val("");
    for (let i = 0; i < allCoins.length; i++) {
      createDivCoinMain(allCoins[i], $("#mainContent"));
    }
  }

  //create div and all coin information
  function createDivCoinMain(coin, mainDiv) {
    let coinDivMain = $("<div>").addClass("coinMain");
    coinDivMain.attr("id", coin.id);
    coinDivMain.attr("data-id", coin.id);

    //add info and buttons
    addSymbol(coinDivMain, coin.symbol);
    addSwitchButton(coinDivMain, coin);
    addCoinName(coinDivMain, coin.name);
    addButtonMoreInfo(coinDivMain);
    //append in Content div

    coinDivMain.appendTo(mainDiv);
  }

  //Symbol
  function addSymbol(divMain, symbol) {
    let symbolDiv = $("<div>").addClass("coinSymbol").text(symbol);
    symbolDiv.appendTo(divMain);
  }

  //Switch
  function addSwitchButton(divMain, coin) {
    //create switch, span and label
    let coinSwitchButton = $("<div>").addClass("coinSwitch");
    let spanSwtch = $("<span>").addClass("slider");
    let switchLabel = $("<label>").addClass("switch");
    //input checkbox
    addInputCheckbox(switchLabel, coin);

    //append all
    spanSwtch.appendTo(switchLabel);
    switchLabel.appendTo(coinSwitchButton);
    coinSwitchButton.appendTo(divMain);
  }

  //Swtich input checkbox
  //create input add event and append in Switch label
  function addInputCheckbox(switchLabel, coin) {
    let inptSwtch = $("<input>").attr("type", "checkbox");
    addEventToSwitch(inptSwtch, coin);
    inptSwtch.appendTo(switchLabel);
  }

  //Switch Event
  //bind add active coin or remove active coin
  function addEventToSwitch(inptSwtch, coin) {
    let checkSelected = isCoinSelected(coin);
    if (checkSelected) {
      inptSwtch
        .attr("checked", true)
        .bind("click", () => removeActiveCoin(inptSwtch, coin));
    } else {
      inptSwtch.bind("click", () => addActiveCoin(inptSwtch, coin));
    }
  }

  //check if switch checkbox was selected
  function isCoinSelected(coin) {
    if (coin.checked == true) {
      return true;
    } else {
      //false or undefined
      return false;
    }
  }

  //Coin Name
  function addCoinName(divMain, name) {
    let coinName = $("<div>").addClass("coinName").text(name);
    coinName.appendTo(divMain);
  }

  //More info button
  function addButtonMoreInfo(divMain) {
    let newButton = $("<button>").addClass("moreInfo").text("More info");
    newButton.bind("click", () => {
      newButton.attr("disabled", true);
      showMoreInfoOnclick(divMain);
    });
    newButton.appendTo(divMain);
  }

  //function for on click button showMoreInfo
  function showMoreInfoOnclick(divMain) {
    //get id
    let coinId = divMain.attr("data-id");

    //show more info UI
    addProgressBarr(divMain);
    showMoreInfoUi(coinId);
  }

  //add progress bar
  function addProgressBarr(divCoinMain) {
    let progressBar = $("<div>").addClass("loading-spinner-coin");
    progressBar.appendTo(divCoinMain);
  }
  //remove progress bar
  function removeProgressBar(divCoinMain) {
    divCoinMain.find(".loading-spinner-coin").remove();
  }

  function showMoreInfoUi(coinId) {
    //check if coin in cache
    let specificCoinCache = isSpecificCoinCache(coinId);

    if (specificCoinCache) {
      showCoinInfoUI(coinId);
    } else {
      //get coin from server save in cache and show UI
      getSpecificCoinFromServer(coinId)
        .then(saveSpecifCoinInCache)
        .fail(failGetSpecificCoinFromServer)
        .then(showCoinInfoUI);
    }
  }

  function isSpecificCoinCache(coinId) {
    let iscoinInCashe = state.cachesSpecificCoin.has(coinId);
    if (iscoinInCashe) {
      return isCacheTimeOk(coinId);
    }
    return false;
  }

  function isCacheTimeOk(coinId) {
    //get chache time
    let coin = state.cachesSpecificCoin.get(coinId);
    let cacheTime = coin.cacheTime - new Date(Date.now());
    if (cacheTime < 10000) {
      return true;
    }
    return false;
  }

  function showCoinInfoUI(coinId) {
    //get info crom cache
    // let divCoinMain = $("#" + coinId);
    let divCoinMain = $("div[data-id=" + coinId + "]");
    let coinInfo = getSpecificCoinFromCache(coinId);

    createMoreInfoDiv(divCoinMain, coinInfo);
    changeEventShowToHide(divCoinMain);
  }

  function getSpecificCoinFromCache(coinId) {
    let coin = state.cachesSpecificCoin.get(coinId);
    return coin.coinInfo;
  }

  function createMoreInfoDiv(divCoinMain, coinInfo) {
    //create more info div
    let moreInfoDiv = $("<div>").addClass("moreInfoDiv").hide();

    addImageCoin(moreInfoDiv, coinInfo.image.small);
    addPrice(moreInfoDiv, coinInfo.market_data.current_price.usd, "$");
    addPrice(moreInfoDiv, coinInfo.market_data.current_price.eur, "&#8364 ");
    addPrice(moreInfoDiv, coinInfo.market_data.current_price.ils, "&#8362 ");

    moreInfoDiv.appendTo(divCoinMain);
    moreInfoDiv.slideDown();
    removeProgressBar(divCoinMain);
  }

  function addImageCoin(moreInfoDiv, imgSrc) {
    let imageCoin = $("<img>")
      .attr("src", imgSrc)
      .css("background-color", "white");
    imageCoin.appendTo(moreInfoDiv);
  }

  function addPrice(moreInfoDiv, price, currency) {
    if (price != undefined) {
      let coinCurrency = $("<div>")
        .html(price + currency)
        .addClass("moreInfoCoinPrice");
      coinCurrency.appendTo(moreInfoDiv);
    }
  }

  function changeEventShowToHide(divCoinMain) {
    //get button in div coin

    let btn = divCoinMain.find("button");
    //remove button event click and bind new event
    btn.unbind("click");
    btn.attr("disabled", false);
    btn.bind("click", () => {
      hideMoreInfo(divCoinMain);
    });
    btn.text("Hide");
  }

  function getSpecificCoinFromServer(id) {
    const url = "https://api.coingecko.com/api/v3/coins/";
    let promise = $.get(url + id);
    return promise;
  }

  //save coin in cache in state
  function saveSpecifCoinInCache(coinInfo) {
    let coinFullInfo = {
      coinInfo: coinInfo,
      //add cache time
      cacheTime: +new Date(Date.now()),
    };
    state.cachesSpecificCoin.set(coinInfo.id, coinFullInfo);
    //return id to show more info in UI
    return coinInfo.id;
  }

  //hide more info
  function hideMoreInfo(divCoinMain) {
    //remove more info div
    divCoinMain.find(".moreInfoDiv").slideUp();
    let btn = divCoinMain.find(".moreInfo");
    //remove event click from button and bind new event
    btn.unbind("click");
    btn.attr("disabled", false);
    btn.bind("click", () => {
      showMoreInfoOnclick(divCoinMain);
    });
    btn.text("More info");
  }

  //Event searchOnClick
  function searchOnClick() {
    let inputValue = $("#searchInput").val().trim();
    $("#searchInput").val("");
    //if search field empty show all
    if (inputValue == "") {
      showAllCoins();
      return;
    }

    //no empty
    let searchCoin = findCoinInCache(inputValue);
    if (searchCoin == undefined) {
      //special alert
      swal({
        title: "No coins found",
        confirmButtonText: "Ok",
        confirmButtonColor: "#FF4500",
      });
      return;
    }

    //Coin found
    //make array from one coin for showCoinsUI function
    //show in UI
    let searchResultArray = [searchCoin];
    showCoinsUI(searchResultArray);
  }

  function findCoinInCache(searchValue) {
    let searchResult = state.cacheAllCoins.find((coin) => {
      return coin.symbol === searchValue;
    });
    return searchResult;
  }

  //Go to home button
  //show search, add right class and show all coins
  function goToHome() {
    clearInterval(state.graphInterval);
    $("#formSearch").show();
    $("#mainContent").removeClass().addClass("allCoinsInfo").empty();
    showAllCoins();
  }

  //Go to live reports button
  function goToLiveReports() {
    clearInterval(state.graphInterval);
    $("#formSearch").hide();
    $("#mainContent").removeClass().addClass("liveReportsPage").empty();
    if (!isEnoughCoinsForGraf()) {
      swal({
        title: "No active coins to show",
        confirmButtonText: "Ok",
        confirmButtonColor: "#FF4500",
      });
      goToHome();
      return;
    }
    showGraph();
  }

  //Go to about button
  function goToAbout() {
    clearInterval(state.graphInterval);
    $("#formSearch").hide();
    $("#mainContent").removeClass().addClass("aboutPage").empty();
    $("#mainContent").html(
      "My name is Vitaly Drapkin. I am 28 years old and I am from Petah Tikva. <br> " +
        "This is my cryptocurrency project. <br>"
    );
    $("<img>")
      .attr("src", "images/me.jpg")
      .css("width", "150px")
      .css("padding-top", "15px")
      .appendTo("#mainContent");
  }

  function showSelectedCoins() {
    let activeCoins = state.cacheAllCoins.filter(isCoinActive);

    if (activeCoins.length == 0) {
      swal({
        title: "No selected coins",
        confirmButtonText: "Ok",
        confirmButtonColor: "#FF4500",
      });
      //show all coins
      showAllCoins();
      return;
    }
    //show only active coins
    showCoinsUI(activeCoins);
  }

  //function for filter is coin checkbox is checked
  function isCoinActive(coin) {
    return coin.checked;
  }

  //add coin when switch button clicked
  function addActiveCoin(inptSwtch, coin) {
    inptSwtch
      .unbind("click")
      .bind("click", () => removeActiveCoin(inptSwtch, coin));
    coin.checked = true;

    //save in state active coins
    state.activeCoins.push(coin);
    let activeListFull = checkIfTheActiveListFull();

    if (activeListFull) {
      $("#btnSaveActiveCoins").attr("disabled", true);
    }

    //if active coins more then 5 open modal window
    if (activeListFull && !state.modalIsOpen) {
      state.modalIsOpen = true;
      openModalWindow();
    }
  }

  //open Modal
  function openModalWindow() {
    showModalWindowUI();
    showActiveCoinsInModalWindow();
    bindEventsModal();
  }

  function showModalWindowUI() {
    $("#myModal").css("display", "block");
  }

  //show active coins in Modal
  function showActiveCoinsInModalWindow() {
    $("#activeModalCoins").empty();
    for (item of state.activeCoins) {
      createDivCoinMain(item, $("#activeModalCoins"));
    }
  }

  //bind close and save buttton
  function bindEventsModal() {
    bindCloseButtonClick();
    bindSaveButtonClick();
  }

  function bindCloseButtonClick() {
    //save clicked coins in state
    saveActiveCoinsIdInState();

    //bind close button
    $("#btnCloseModal").bind("click", () => closeModalWindow());
  }

  //close modal window and reset active coins
  function closeModalWindow() {
    $("#myModal").css("display", "none");
    $("#activeModalCoins").empty();
    state.modalIsOpen = false;
    resetStatusActiveCoins();
    showAllCoins();
    //unbind close button avoid dubble binding
    $("#btnCloseModal").unbind("click");
  }

  function saveActiveCoinsIdInState() {
    //clear last save
    state.lastActiveCoins = [];
    //save last active coins in state
    for (item of state.activeCoins) {
      state.lastActiveCoins.push(item);
    }
  }

  //if modal not saved reset all active coins
  function resetStatusActiveCoins() {
    //get first 5 active coins
    let activeCoins = state.lastActiveCoins.splice(0, 5);
    //get last coin (will be not active)
    let notActiveCoin = state.lastActiveCoins[0];
    changeStateActiveCoins(activeCoins, notActiveCoin);
  }

  //change and reset active status of coins
  function changeStateActiveCoins(activeCoins, notActiveCoin) {
    //reset active coins
    state.activeCoins = activeCoins;
    //clear last active coins
    state.lastActiveCoins = [];

    //find coins in cache
    for (item of activeCoins) {
      let index = findIndexCoinInCache(item);
      //return the status of active coins
      state.cacheAllCoins[index].checked = true;
    }

    index = findIndexCoinInCache(notActiveCoin);
    //return the status of not active coin
    state.cacheAllCoins[index].checked = false;
    //special alert
    swal({
      title: state.cacheAllCoins[index].symbol + " coin not selected",
      confirmButtonText: "Ok",
      confirmButtonColor: "#FF4500",
    });
  }

  function findIndexCoinInCache(item) {
    let index = state.cacheAllCoins.findIndex((coin) => {
      return coin.id === item.id;
    });
    return index;
  }

  //when you click save just close modal and show all coins
  function bindSaveButtonClick() {
    $("#btnSaveActiveCoins").bind("click", () => {
      state.modalIsOpen = false;
      $("#myModal").css("display", "none");
      $("#activeModalCoins").empty();
      showAllCoins();
      //unbind close button avoid dubble binding
      $("#btnCloseModal").unbind("click");
    });
  }

  function checkIfTheActiveListFull() {
    if (state.activeCoins.length > 5) {
      return true;
    }
    false;
  }

  //uncheck switch remove coin from active
  function removeActiveCoin(inptSwtch, coin) {
    let coinId = coin.id;

    //bind new function
    inptSwtch
      .unbind("click")
      .bind("click", () => addActiveCoin(inptSwtch, coin));
    coin.checked = false;

    //remove coin from active coins
    let coinIndex = findActiveCoinIndex(coinId);
    state.activeCoins.splice(coinIndex, 1);

    //if active list is not full enebled save button
    if (!checkIfTheActiveListFull()) {
      $("#btnSaveActiveCoins").attr("disabled", false);
    }
  }

  function findActiveCoinIndex(coinId) {
    let index = state.activeCoins.findIndex((coin) => {
      return coin.id === coinId;
    });
    return index;
  }
  //Graph
  //if no active coins in state return false
  function isEnoughCoinsForGraf() {
    if (state.activeCoins.length === 0) {
      return false;
    }
    return true;
  }

  function searchByKeyEnter(event) {
    if (event.keyCode === 13) {
      searchOnClick();
    }
  }

  function failGetCoinsFromServer(error) {
    console.log(JSON.stringify(error));
    //special alert
    swal({
      title: "The server is not responding. try later",
      confirmButtonText: "Ok",
      confirmButtonColor: "#FF4500",
    });
  }
  function failGetSpecificCoinFromServer(error) {
    console.log(JSON.stringify(error));
    //special alert
    swal({
      title: "The server is not responding. try later",
      confirmButtonText: "Ok",
      confirmButtonColor: "#FF4500",
    });
  }
});
