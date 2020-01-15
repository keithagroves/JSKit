// #import "SKHTTPResponder.js"
/* global JSClass, SKHTTPResponder, JSLog */
'use strict';

(function(){

var logger = JSLog("server", "websocket");

JSClass('SKHTTPWebsocketResponder', SKHTTPResponder, {

    _socket: null,
    protocols: null,

    websocket: function(){
        logger.info("calling websocket responder");
        this._socket = this.acceptWebsocketUpgrade(this.protocols);
        if (this._socket !== null){
            logger.info("got a socket");
            this._socket.delegate = this;
            this.websocketEstablished(this._socket);
        }else{
            logger.error("socket is null!");
        }
    },

    websocketEstablished: function(socket){
    },

    socketDidReceiveMessage: function(socket, chunks){
    },

    socketDidClose: function(socket){
    }

});

})();