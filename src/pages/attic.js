import React, { Component } from 'react'
import './attic.css'

var lightBulbicon = [ "https://image.flaticon.com/icons/svg/1527/1527680.svg", "https://image.flaticon.com/icons/svg/1527/1527681.svg"];
var tempIcon =["https://image.flaticon.com/icons/svg/1113/1113742.svg"];
var humIcon=["https://image.flaticon.com/icons/svg/1779/1779883.svg"];

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
console.log("Requesting connection to " + broker);


/////////////////////////////////////////////////////////////////////////////

export default class Attic extends Component{
    constructor(props){
        super(props);
        this.state={
            light1: {value: false, topicIndex: 0, text: "Light 1"},
            light2: {value: false, topicIndex: 1, text: "Light 2"},
            light3: {value: false, topicIndex: 2, text: "Light 3"},
            temp:   {value: '--,-',  topicIndex: 3, text: "Temperature"},
            hum:    {value: '--,-',  topicIndex: 3, text: "humidity"},
            rgb:    {value: {"red": 0, "green": 0, "blue": 0}, topicIndex: 4, text: "rgb"}
        }
    }

    switchChanged = (switchName) => {
        if(!this.state.hasOwnProperty(switchName)) return false;

        let switchVal = this.state[switchName].value;
        let index = this.state[switchName].topicIndex;

        client.publish(topicsPub[index], (switchVal ? 'off': 'on'));
        
        let content = this.state[switchName];
        content.value = !content.value;

        this.setState({[switchName]: content});
    }

    handleConnection = () =>{
        topicsSub.forEach(topic=>{
            client.subscribe(topic);
            console.log("subscribed to: " + topic)
        })
    }

    handleMessage = (receivedTopic, message) =>{
        //console.log("topic: "+ receivedTopic.toString() + " received: "+ message.toString());
        const topicHandler={
            'attic/light1/status':(message)=>{
                let state = (message == 'on') ? true : false;
                let content = this.state['light1'];
                content.value = state;

                this.setState({light1: content});
            },
            'attic/light2/status':(message)=>{
                let state = (message == 'on')? true : false;
                let content = this.state['light2'];
                content.value = state;

                this.setState({light2: content});
            },
            'attic/light3/status':(message)=>{
                let state = (message == 'on')? true : false;
                let content = this.state['light3'];
                content.value = state;

                this.setState({light3: content});
            },
            'attic/sensors':(message)=>{
                let values = JSON.parse(message);

                let humContent = this.state.hum;
                let tempContent =this.state.temp;

                humContent.value = parseFloat(values.Humidity);
                tempContent.value = parseFloat(values.Temperature);

                this.setState({
                    hum:humContent,
                    temp: tempContent
                })
            }
        }

        const handler = topicHandler[receivedTopic];
        if(handler){
            handler(message);
            console.log(this.state);
        }
    }

    componentDidMount(){
        client.on('connect', ()=>{this.handleConnection()});
        client.on('message', (receivedTopic, message)=>{this.handleMessage(receivedTopic, message)});
    }

    createSwitch = (switchName) =>{
        return(
            <div className = "device">
                <label className="device-label">
                    <img 
                        src={this.state[switchName].value?lightBulbicon[1]:lightBulbicon[0]} 
                        className = "device-icon" 
                        id="light1-icon" 
                    />
                    <strong className = "device-text">{this.state[switchName].text}</strong>
                </label>
                
                <label className="switch" >
                    <input 
                        type="checkbox" 
                        id="switch1" 
                        checked={this.state[switchName].value}
                        onClick={() => {this.switchChanged(switchName)}}/>
                    <span className="slider round"></span>
                </label>
            </div> 
        )
    }

    createDevices = () =>{
        return(
            <div className = "devices-container">
                    
                {this.createSwitch('light1')}
                {this.createSwitch('light2')}
                {this.createSwitch('light3')}

                <div className = "device">
                    <label className="device-label">
                        <img src={tempIcon} className = "device-icon" id="temp-icon" />
                        <strong className = "device-text">Temperature </strong>
                    </label>
                    <label className="temp-label" id="temp-value" >
                        {this.state.temp.value.toString() + "°C"}
                    </label>
                </div>
                
                
                <div className = "device">
                    <label className="device-label">
                        <img src={humIcon} className = "device-icon" id="hum-icon" />
                        <strong className = "device-text">Humidity </strong>
                    </label>
                    <label className="hum-label" id="hum-value" >
                        {this.state.hum.value.toString() + "%"}
                    </label>
                </div>
                
            </div>
        )
    }

    render(){
        return(
            <div className = "main-container">       
                {this.createDevices()}
            </div>
        );
    }
}