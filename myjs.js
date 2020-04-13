let dayschosen = 0;

$(document).ready(function () {

    const URL = "data.json";

    $.ajax({
        url: URL,
        success: handleSuccess
    });

    function handleSuccess(data) {



        //add cities options in list
        let cities = getCities(data);
        let citiesNoDups = removeDuplicatesFromArray(cities);
        insertCities(citiesNoDups);

        //add room types in select
        insertRoomTypes(data[0]["roomtypes"]);

        //filters set
        insertFilters(removeDuplicatesFromArray(getFilters(data)));


        //handling dates
        let checkindate;
        let checkoutdate;
        $('#checkinbtn').daterangepicker({
            singleDatePicker: true,
            showDropdowns: true,
            minYear: 1901,
            maxYear: parseInt(moment().format('YYYY'), 10)
        });

        $('#checkinbtn').on('apply.daterangepicker', (e, picker) => {
            checkindate = picker.startDate.format('MM-DD-YYYY');
            $('#currentcheckin').html(checkindate);
            $('#checkoutbtn').daterangepicker({
                singleDatePicker: true,
                showDropdowns: true,
                startDate: checkindate,
                maxYear: parseInt(moment().format('YYYY'), 10)
            });

        });

        $('#checkoutbtn').on('apply.daterangepicker', (e, picker) => {
            checkoutdate = picker.startDate.format('MM-DD-YYYY');
            $('#currentcheckout').html(checkoutdate);
            dayschosen = (new Date(checkoutdate) - new Date(checkindate)) / (1000 * 60 * 60 * 24);
            displayRooms(data[1]["entries"]);
        });

        //add dynamic slider value
        const slider = document.querySelector("#myRange");
        const sliderval = document.getElementById("slideval");
        slider.addEventListener('input', function () {
            sliderval.innerText = "$" + this.value;
            displayRooms(filterAll(data));

        });
        sliderval.innerText = "$" + slider.value;


        //all Rooms Display.
        displayRooms(data[1]["entries"]);

        //search bar implementation
        document.querySelector("#searchbtn").addEventListener('click', function () {
            displayRooms(filterAll(data));
        });

        //cities select fill
        document.querySelector("#HotelLocation").addEventListener('change', function () {
            displayRooms(filterAll(data));
        });

        //property type handler
        document.querySelector("#PropertyType").addEventListener("change", function () {
            displayRooms(filterAll(data));
        });

        //guest rating handler
        document.querySelector("#GuestRating").addEventListener("change", function () {
            displayRooms(filterAll(data));
        });

        //filters handling
        document.querySelector("#MoreFilters").addEventListener("change", function () {
            displayRooms(filterAll(data));
        });

        //sorters
        document.querySelector("#sorter").addEventListener("change", function () {
            displayRooms(sortByFilters(data, this.value));
        }

        )
    };

});


function filterAll(data) {
    let filtered = [];
    filtered = getHotelsForCity(data, document.querySelector("#searchinp").value);
    filtered = getHotelsForCitySelect(filtered, document.querySelector("#HotelLocation").value);
    filtered = getHotelsForPropertyType(filtered, document.querySelector("#PropertyType").value);
    filtered = getHotelsForFilters(filtered, document.querySelector("#MoreFilters").value);
    filtered = getHotelsForPrice(filtered, document.querySelector("#myRange").value);
    filtered = guestRatingHandler(filtered);
    document.querySelector("#sorter").value = "All";
    return filtered;

}

function removeDuplicatesFromArray(array) {
    let noDups = [];
    $.each(array, function (i, el) {
        if ($.inArray(el, noDups) === -1) noDups.push(el);
    });
    return noDups;
}

function getCities(data) {
    let citiesList = [];
    $.each(data[1]["entries"], function () {
        citiesList.push(this.city);
    });
    return citiesList;
}

function insertCities(array) {
    $.each(array, function () {
        document.getElementById('cities').innerHTML +=
            `<option value="${this}">${this}</option>`;
        document.getElementById('HotelLocation').innerHTML +=
            `<option value="${this}">${this}</option>`;
    });
}

function insertFilters(array) {
    $.each(array, function () {
        document.getElementById('MoreFilters').innerHTML += `<option value="${this}">${this}</option>`;
        document.getElementById('sorter').innerHTML += `<option value="${this}">${this}</option>`;
    });
}

function insertRoomTypes(array) {
    $.each(array, function () {
        document.getElementById('RoomType').innerHTML += `<option value="${this.name}">&#xf0c0 ${this.name}</option>`;
    });
}
function displayRooms(array) {

    const display = document.getElementById('roomdisplayarea');
    display.innerHTML = "";
    $('#mapiframe').attr('src', "");

    if (array.length > 0) {
        let mapurl = array[0]["mapurl"];
        $('#mapiframe').attr('src', mapurl);
    }

    $.each(array, function (i, element) {
        let stars = "";
        for (let i = 0; i < element["rating"]; i++) {
            stars += `<i class="fas fa-star" style="color:orange;"></i>`;
        }
        let accoms = "";
        $.each(element["filters"], function (j, jelement) {
            accoms += `<div class="text-center pt-2" style="margin:7px; font-size:140%; color:blue">${jelement["name"]}</div>`
        });
        display.innerHTML += `<div class="row hotelcont m-2 shadow p-0">
        <div class="col-3 p-1 text-center">
            <img style="max-width: 100%;" src="${element["thumbnail"]}" height="300px" alt="">
        </div>
        <div class="col-4 hotelinfo pt-3 pl-4 p-0 sideborderedleft">
            <h2 class="mb-2 p-0">${element["hotelName"]}</h2>
            <div class="mt-0 p-0">${stars} Hotel</div>
            <div class="mt-4 mb-4 p-0">Hotel Address</div>
            <div class="mb-3 p-0"> <span id="mark">${element["rating"]}</span> ${guestRatingText(element["rating"])} (1700 reviews)</div>
            <div class=" p-0">${element["ratings"]["text"]} location ${element["ratings"]["no"]}/10</div>
        </div>
        <div class="col-2 sidebordered mt-1 mb-1">
        ${accoms}
        </div>
        <div class="col-3 text-center mt-5" style="font-size: 150%">
            <div>Hotel Website</div>
            <div style="font-size: 180%; color:green;">${element["price"]} $</div>
            <div>${dayschosen} nights for ${element["price"] * dayschosen} $</div>
            <button class="btn btn-primary mt-5 viewdeal">View Deal
            <i class="fas fa-chevron-right" style="position:absolute; right: 10%; top:25%;"></i></button>
        </div>
    </div>`
    });
}

function getHotelsForCity(data, city) {
    let citiesList = [];
    $.each(data[1]["entries"], function (i, element) {
        if (city === "All" || city === "") {
            citiesList.push(element);
        }
        if (element["city"] === city) {
            citiesList.push(element);
        }
    });
    return citiesList;
}

function getHotelsForCitySelect(data, city) {
    let citiesList = [];
    $.each(data, function (i, element) {
        if (city === "All" || city === "") {
            citiesList.push(element);
        }
        if (element["city"] === city) {
            citiesList.push(element);
        }
    });
    return citiesList;
}

function getHotelsForPrice(data, price) {
    let citiesList = [];
    $.each(data, function (i, element) {
        if (element["price"] <= price) {
            citiesList.push(element);
        }
    });
    return citiesList;
}

function getHotelsForPropertyType(data, propertytype) {
    let citiesList = [];
    $.each(data, function (i, element) {
        if (propertytype === "0") {
            citiesList.push(element);
        }
        if (element["rating"] == propertytype) {
            citiesList.push(element);
        }
    });
    return citiesList;
}

function getHotelsForFilters(data, filter) {
    let filtered = [];
    $.each(data, function (i, element) {
        if (filter === "All") {
            filtered.push(element);
        }
        $.each(element["filters"], function (j, filtelement) {

            if (filtelement["name"] === filter) {
                filtered.push(element);
            }
        });
    });
    return filtered;
}

function guestRatingHandler(data) {
    grvalue = document.querySelector("#GuestRating").value;
    let min;
    let max;

    if (grvalue === "All") {
        min = 0;
        max = 10;
    } else if (grvalue == 1) {
        min = 0;
        max = 2;
    } else if (grvalue == 2) {
        min = 2;
        max = 6;
    } else if (grvalue == 3) {
        min = 6;
        max = 7;
    } else if (grvalue == 4) {
        min = 7;
        max = 8.5;
    } else if (grvalue == 5) {
        min = 8.5;
        max = 10;
    }
    return guestRatingFilter(data, min, max);
}

function guestRatingFilter(data, min, max) {
    let hotels = [];

    $.each(data, function (i, element) {

        if (element["rating"] >= min && element["rating"] <= max) {
            hotels.push(element);
        }

    });
    return hotels;
}

function guestRatingText(rating) {
    if (rating >= 0 && rating < 2) {
        return "Okay";
    } else if (rating >= 2 && rating < 6) {
        return "Fair";
    } else if (rating >= 6 && rating < 7) {
        return "Good";
    } else if (rating >= 7 && rating < 8.5) {
        return "Very Good";
    } else if (rating >= 8.5 && rating <= 10) {
        return "Excelent";
    }
}

function getFilters(data) {
    let filters = [];
    $.each(data[1]["entries"], function (i, element) {

        $.each(element["filters"], function (j, filterelement) {
            filters.push(filterelement["name"]);
        });
    });
    return filters;
}

function sortByFilters(data, value) {
    let filtered = [];
    let cont = 0;
    $.each(data[1]["entries"], function (i, element) {
        cont = 0;
        $.each(element["filters"], function (j, jelement) {
            if (jelement["name"] === value) {
                cont = 1;
            }
        });
        if (cont === 1) {
            filtered.unshift(element);
        } else {
            filtered.push(element);
        }
    });
    return filtered;
}