const start = () => {
  let state = {
    flights: [
      {
        flightCode: 1,
        altitude: 2,
        distanceToDME: 3,
      },
      {
        flightCode: 1,
        altitude: 2,
        distanceToDME: 3,
        destination: "qwe",
      },
    ],
    selectedFlightCodes: [],
    sortDirection: "asc",
  };
  const exampleFlight = {
    "24df9516": [
      "42455B",
      55.454, // координаты
      37.833, // координаты
      145, // угол
      1550, // высота в футах
      126, // скорость kts
      "2420",
      "F-UUWW2",
      "A320",
      "VQ-BRG",
      1594133118,
      "ROV", // вылет
      "DME", // назначение
      "S72124",
      0,
      -768,
      "SBI2124", //номер рейса
      0,
      "SBI",
    ],
  };

  const tbody = document.getElementById("tbody");
  const sortingCell = document.getElementById("distanceToDMECell");

  const render = () => {
    // clear table

    const tableRows = tbody.querySelectorAll("tr");

    tableRows.forEach(row => {
      tbody.removeChild(row);
    });

    // /clear table

    // fill table

    sortFlightsByDistance(state.flights);

    for (let idx in state.flights) {
      const newRow = tbody.insertRow(-1);

      const rowCols = {
        flightCode: {},
        longtitude: {},
        lattitude: {},
        speed: {},
        angle: {},
        altitude: {},
        departure: {},
        destination: {},
        distanceToDME: {},
      };

      const flight = state.flights[idx];

      newRow.addEventListener("click", () => {
        if (state.selectedFlightCodes.includes(flight.flightCode)) {
          update({selectedFlightCodes: [...state.selectedFlightCodes].filter(flightCode => flightCode !== flight.flightCode)})
        } else {
          update({ selectedFlightCodes: [...state.selectedFlightCodes, flight.flightCode] });
        }
      
        localStorage.setItem("selectedFlightCodes", JSON.stringify(state.selectedFlightCodes));
      });

      newRow.classList.toggle(
        "selected",
        state.selectedFlightCodes.includes(flight.flightCode)
      );

      for (let key in rowCols) {
        const newCell = newRow.insertCell(-1);
        rowCols[key] = newCell;
      }

      for (let propName in flight) {
        const cellContent = document.createTextNode(flight[propName]);
        rowCols[propName].appendChild(cellContent);
      }
    }

    // /fill table
  };

  const update = (change) => {
    state = { ...state, ...change };
    render();
  };

  const ktsToKmh = (kts) => {
    return Math.round(kts * 1.852);
  };

  const feetsToMeters = (feets) => {
    return Math.round(feets / 3.281);
  };

  const calculateDistanceToDME = (lon, lat) => {
    const DMElon = (55.410307 * Math.PI) / 180;
    const DMElat = (37.902451 * Math.PI) / 180;

    const lonRad = (lon * Math.PI) / 180;
    const latRad = (lat * Math.PI) / 180;

    const R = 6371;

    const cosDistRad =
      Math.sin(DMElon) * Math.sin(lonRad) +
      Math.cos(DMElon) * Math.cos(lonRad) * Math.cos(DMElat - latRad);

    const disRad = Math.acos(cosDistRad);

    const result = Math.round(disRad * R * 1000);

    return result;
  };

  const parseOneFlightDataToObject = (dataArray) => {
    const result = {};
    dataArray.forEach((value, idx) => {
      switch (idx) {
        case 1: {
          result.longtitude = value;
        }
        case 2: {
          result.lattitude = value;
        }
        case 3: {
          result.angle = value;
        }
        case 4: {
          result.altitude = feetsToMeters(value);
        }
        case 5: {
          result.speed = ktsToKmh(value);
        }
        case 11: {
          result.departure = value;
        }
        case 12: {
          result.destination = value;
        }
        case 16: {
          result.flightCode = value;
        }
      }
    });

    if (result.longtitude && result.lattitude) {
      result.distanceToDME = calculateDistanceToDME(
        result.longtitude,
        result.lattitude
      );
    }

    return result;
  };

  const parseAllFlights = (data) => {
    const result = [];
    for (let key in data) {
      if (typeof data[key] === "object") {
        const flightDataObject = parseOneFlightDataToObject(data[key]);
        result.push(flightDataObject);
      }
    }
    return result;
  };

  const sortFlightsByDistance = (flights) => {
    switch (state.sortDirection) {
      case "desc": {
        flights.sort((a, b) => b.distanceToDME - a.distanceToDME);
        break;
      }
      case "asc": {
        flights.sort((a, b) => a.distanceToDME - b.distanceToDME);
        break;
      }
    }
  };

  const switchSortDirection = () => {
    if (state.sortDirection === "asc") {
      update({ sortDirection: "desc" });
    } else if (state.sortDirection === "desc") {
      update({ sortDirection: "asc" });
    }
  };

  sortingCell.addEventListener("click", () => {
    switchSortDirection();
  });

  const updateData = async () => {
    const res = await fetch(
      "https://data-live.flightradar24.com/zones/fcgi/feed.js?bounds=56.84,55.27,33.48,41.48"
    );
    let result = await res.json();

    result = parseAllFlights(result);

    update({ flights: result });
    return result;
  };

  updateData();

  const updateInterval = setInterval(() => {
    updateData();
  }, 3000);

  // clearInterval(updateInterval);

  // load from localstorage

  if (localStorage.length) {
    update({ selectedFlightCodes: JSON.parse(localStorage.getItem("selectedFlightCodes")) });
  }
  
  // /load from localstorage
};
document.addEventListener("DOMContentLoaded", start);
