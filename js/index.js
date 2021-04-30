let host = 'localhost';
let port = 9001;
let topic = '#';
let useTLS = false;
let cleansession = true;
let reconnectionTimeout = 3000;
let tempData = new Array();
let umidData = new Array();
let mqtt;

function MQTTconnect() {
    if (typeof path == "undefined") {
        path = '/';
    }
    mqtt = new Paho.MQTT.Client(host, port, path, "mqtt_panel" + parseInt(Math.random() * 100, 10));
    let options = {
        timeout: 3,
        useSSL: useTLS,
        cleanSession: cleansession,
        onSuccess: onConnect,
        onFailure: function (message) {
            $('#status').html("Conexão falhou: " + message.errorMessage + "Tentando conexão...")
                .attr('class', 'alert alert-danger');
            setTimeout(MQTTconnect, reconnectTimeout);
        }
    };

    mqtt.onConnectionLost = onConnectionLost;
    mqtt.onMessageArrived = onMessageArrived;
    console.log("Host: " + host + ", Port: " + port + ", Path: " + path + " TLS: " + useTLS);
    mqtt.connect(options);
};

function onConnect() {
    $('#status').html('Connected to ' + host + ':' + port + path)
        .attr('class', 'alert alert-success');
    mqtt.subscribe(topic, { qos: 0 });
    $('#topic').html(topic);
};

function onConnectionLost(response) {
    setTimeout(MQTTconnect, reconnectTimeout);
    $('#status').html("Conexão perdida. Reconectando...")
        .attr('class', 'alert alert-warning');
};

function onMessageArrived(message) {
    let topic = message.destinationName;
    let payload = message.payloadString;
    console.log("Topic: " + topic + ", Message payload: " + payload);
    $('#message').html(topic + ', ' + payload);
    let topics = topic.split('/');
    let area = topics[1];

    switch (area) {
        case 'temperatura':
            $('#temperaturaLabel1').text(payload + ' °C');

            break;
        case 'umidade':
            $('#umidadeLabel2').text(payload + ' %');

            break;
        case 'temperaturaChart':
            $('#temperatura').text(payload + ' °C');
            $('#temperatura').addClass('badge-default');

            tempData.push({
                "timestamp": Date().slice(16, 21),
                "temperatura": parseInt(payload)
            });
            if (tempData.length >= 10) {
                tempData.shift()
            }
            drawChart(tempData);

            break;
        case 'umidadeChart':
            $('#umidade').text(payload + ' %');
            $('#umidade').addClass('badge-default');

            umidData.push({
                "timestamp": Date().slice(16, 21),
                "umidade": parseInt(payload)
            });
            if (umidData.length >= 10) {
                umidData.shift()
            }
            drawChart(umidData);

            break;
        default:
            console.log('Error: Data do not match the MQTT topic.');
            break;
    }
};

function drawChart(data) {
    let ctx = document.getElementById("tempChart").getContext("2d");
    let cty = document.getElementById("umidChart").getContext("2d");

    let umidity = []
    let temperatures = []
    let timestamps = []

    data.map((entry) => {
        temperatures.push(entry.temperatura);
        timestamps.push(entry.timestamp);
        umidity.push(entry.umidade);
    });

    let chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timestamps,
            datasets: [{
                backgroundColor: 'rgb(93, 173, 226)',
                borderColor: 'rgb(41, 128, 185)',
                data: temperatures
            }]
        },
        options: {
            legend: {
                display: false
            }
        }
    });

    let chart = new Chart(cty, {
        type: 'line',
        data: {
            labels: timestamps,
            datasets: [{
                backgroundColor: 'rgb(245, 176, 65)',
                borderColor: 'rgb(235, 152, 78)',
                data: umidity
            }]
        },
        options: {
            legend: {
                display: false
            }
        }
    });
}

$(document).ready(function () {
    drawChart(tempData);
    drawChart(umidData);
    MQTTconnect();
});