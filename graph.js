function showGraph() {
  creatGraphDiv();
  addGraphConstructor();
  rerenderGraphInterval();
}

//save symbols in state for other functions
function saveActiveCoinsSymbolsInState() {
  state.activeCoinsSymbolGraph = [];
  for (item of state.activeCoins) {
    state.activeCoinsSymbolGraph.push(item.symbol);
  }
}

//create div for graph
function creatGraphDiv() {
  let div = $("<div>")
    .attr("id", "chartContainer")
    .css("width", "100%")
    .css("height", "300px");
  div.prependTo("#mainContent");
}

function addGraphConstructor() {
  let textTitle = createTextTitleFromActiveCoins();
  let dataValue = getDataValueGromActiveCoins();

  //graph constructor
  let options = {
    title: {
      text: textTitle,
    },
    axisY: {
      title: "Coin Value $",
      titleFontColor: "orangered",
      lineColor: "orangered",
      labelFontColor: "orangered",
      tickColor: "orangered",
      margin: 10,
      minimum: 0,
      prefix: "$",
    },
    axisX: {
      valueFormatString: "mm:ss",
    },
    legend: {
      cursor: "pointer",
      itemclick: toggleDataSeries,
    },
    data: dataValue,
  };
  $("#chartContainer").CanvasJSChart(options);

  //function to hide coin in graph
  function toggleDataSeries(e) {
    if (typeof e.dataSeries.visible === "undefined" || e.dataSeries.visible) {
      e.dataSeries.visible = false;
    } else {
      e.dataSeries.visible = true;
    }
    e.chart.render();
  }
}

function createTextTitleFromActiveCoins() {
  //get symbols string
  let text = getSymbolsTitleStr();
  text = text.toUpperCase();

  //add to USD
  text = text + " to USD";
  return text;
}

function getSymbolsTitleStr() {
  let text = "";
  for (item of state.activeCoins) {
    text = text + item.symbol + ",";
  }
  //cut last ","
  text = text.slice(0, text.length - 1);
  return text;
}

function getDataValueGromActiveCoins() {
  let data = [];
  for (item of state.activeCoins) {
    let coinDataObj = {};
    coinDataObj.name = item.symbol.toUpperCase();
    coinDataObj.type = "spline";
    coinDataObj.dataPoints = [];
    coinDataObj.showInLegend = true;
    coinDataObj.cursor = "pointer";
    data.push(coinDataObj);
  }
  return data;
}

//rerender graph every 2 seconds
function rerenderGraphInterval() {
  //rerender on start
  rerenderGraph();
  //every 2 second
  state.graphInterval = setInterval(rerenderGraph, 2000);
}

function rerenderGraph() {
  getCoinsInfoValueFromServer()
    .then(rerenderGraphUI)
    .fail(failGetCoinsInfoValueFromServer);
}

function rerenderGraphUI(coinsData) {
  if (coinsData.Response == "Error") {
    clearInterval(state.graphInterval);
    swal({
      title: "There is no data on server for selected coins",
      confirmButtonText: "Ok",
      confirmButtonColor: "#FF4500",
    });
    return;
  }
  var chart = $("#chartContainer").CanvasJSChart();
  let dataIndex = 0;
  let text = " ";
  for (item in coinsData) {
    text = text + item + coinsData[item].USD;
    let name = coinsData[item].USD;
    var length = chart.options.data[dataIndex].dataPoints.length;
    chart.options.data[dataIndex].dataPoints.push({
      x: new Date(Date.now()),
      y: name,
    });
    dataIndex++;
  }

  chart.render();
}

function getCoinsInfoValueFromServer() {
  let value = getSymbolsTitleStr();
  const url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${value}&tsyms=USD`;
  let promise = $.get(url);
  return promise;
}

function failGetCoinsInfoValueFromServer(error) {
  console.log(JSON.stringify(error));
  //special alert
  swal({
    title: "The server is not responding. try later",
    confirmButtonText: "Ok",
    confirmButtonColor: "#FF4500",
  });
}
