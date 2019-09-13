import React from 'react'
import './attic.css'

var lightBulbicon = [ "https://image.flaticon.com/icons/svg/1527/1527680.svg", "https://image.flaticon.com/icons/svg/1527/1527681.svg"];
var tempIcon =["https://image.flaticon.com/icons/svg/1113/1113742.svg"];
var humIcon=["https://image.flaticon.com/icons/svg/1779/1779883.svg"];

var atticState = [false, false, false, 0.00, 0.00];
var topicsSub = ['attic/light1/status', 'attic/light2/status', 'attic/light3/status', 'attic/sensors'];
var topicsPub = ['attic/light1', 'attic/light2', 'attic/light3'];

//////////////////////////////////////////////////////////////////////////////

var mqtt = require('mqtt');
var broker = 'mqtt://homeassist.local';
var options = {
    port:1884,
    clientId: 'nodecontroller_' + Math.random().toString(16).substr(2, 8),
    keepalive: 60,
    reconnectPeriod: 500,
    protocolId: 'MQTT',
    protocolVersion: 4,
    clean: true,
    encoding: 'utf8'
}

var client= mqtt.connect(broker, options);

console.log("mqtt connecting...");

client.on('connect', function ()
{   
    for(var i in topicsSub){
        client.subscribe(topicsSub[i]);
        console.log("subscribed to: " + topicsSub[i])
    }
    
});

client.on('message', function (receivedTopic, message)
{  
    //console.log("topic: "+ receivedTopic.toString() + " received: "+ message.toString());
    var err = false;
    var switches = [ document.getElementById("switch1"), document.getElementById("switch2"), document.getElementById("switch3")];
    var sensorLabels = [document.getElementById("temp-value"), document.getElementById("hum-value")];
    var icons = [ document.getElementById("light1-icon"), document.getElementById("light2-icon"), document.getElementById("light3-icon"), ]
    
    var statusIndex = topicsSub.indexOf(receivedTopic.toString())
    
    if(statusIndex >= 0 && statusIndex <=2){
        atticState[statusIndex] = (message == 'on')? true : false;
        switches[statusIndex].checked = atticState[statusIndex];
        icons[statusIndex].src = lightBulbicon[(atticState[statusIndex] ? 1 : 0)];
    }
    else if(statusIndex > 2){
        var sensors = JSON.parse(message)

        atticState[statusIndex] = sensors.Temperature;
        atticState[statusIndex+1] = sensors.Humidity;
        
        console.log(sensorLabels);
        sensorLabels[0].innerHTML = atticState[statusIndex].toString() + "°";
        sensorLabels[1].innerHTML = atticState[statusIndex+1].toString() + "%";

    }
    else{
        err = true;
        console.log("receved: " + message.toString() + " from: " + receivedTopic.toString() + " but hot handled...");
    }
    if(!err){
        console.log(atticState)
    }
    
});

//////////////////////////////////////////////////////////////////////////////

function switchChanged(switchNum){
    var switches = [ document.getElementById("switch1"), document.getElementById("switch2"), document.getElementById("switch3")];
    var icons = [ document.getElementById("light1-icon"), document.getElementById("light2-icon"), document.getElementById("light3-icon"), ]
    var index = switchNum-1;

    atticState[index] = !atticState[index];
    switches[index].checked = atticState[index]

    client.publish(topicsPub[index], (atticState[index] ? 'on': 'off'));
    icons[index].src = lightBulbicon[(atticState[index] ? 1 : 0)];
    
}

export default function Attic(){
    
    return(
        <div className = "main-container">
            
            <div className = "devices-container">
                
                <div className = "device">
                    <label className="device-label">
                        <img src={lightBulbicon[0]} className = "device-icon" id="light1-icon" />
                        <strong className = "device-text">Light 1 </strong>
                    </label>
                    
                    <label className="switch" >
                        <input type="checkbox" id="switch1" onClick={() => {switchChanged(1)}}/>
                        <span className="slider round"></span>
                    </label>
                </div> 

                <div className = "device">
                    <label className="device-label">
                        <img src={lightBulbicon[0]} className = "device-icon" id="light2-icon" />
                        <strong className = "device-text">Light 2 </strong>
                    </label>
                    <label className="switch" >
                        <input type="checkbox" id="switch2" onClick={() => {switchChanged(2)}}/>
                        <span className="slider round"></span>
                    </label>
                </div>

                <div className = "device">
                    <label className="device-label">
                        <img src={lightBulbicon[0]} className = "device-icon" id="light3-icon" />
                        <strong className = "device-text">Light 3 </strong>
                    </label>
                    <label className="switch" >
                        <input type="checkbox" id="switch3" onClick={() => {switchChanged(3)}}/>
                        <span className="slider round"></span>
                    </label>
                </div>

                <div className = "device">
                    <label className="device-label">
                        <img src={tempIcon} className = "device-icon" id="temp-icon" />
                        <strong className = "device-text">Temperature </strong>
                    </label>
                    <label className="temp-label" id="temp-value" >
                        --.-°
                    </label>
                </div>
                
                
                <div className = "device">
                    <label className="device-label">
                        <img src={humIcon} className = "device-icon" id="hum-icon" />
                        <strong className = "device-text">Humidity </strong>
                    </label>
                    <label className="hum-label" id="hum-value" >
                    --.-%
                    </label>
                </div>
                


            </div>

        </div>

    );
}